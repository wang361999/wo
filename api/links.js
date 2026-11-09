/* 友情链接自动审核（同源接口，数据落在 Vercel 连接的免费 Upstash Redis）
 *
 *   GET  /api/links                    已通过的友链列表（可 CDN 缓存）
 *   GET  /api/links?view=audit         最近审核日志，便于观察自动上下架
 *   GET  /api/links?job=verify         复核一轮：由每日 Cron 或本站页面惰性触发
 *   POST /api/links {name,url,desc}    提交申请，立刻检测对方首页，通过即上线
 *
 * 规则：对方网站「首页」的 HTML 里必须有一条可见的、指向 www.gitd.cn 的 <a> 链接。
 * 通过 = 自动上线；之后每天复核，连续 3 次查不到回链 = 自动从本站删除。
 * 只抓首页（忽略提交里的路径），避免用专门做好的内页冒充；不查 JS 渲染后的 DOM，
 * 也不接受注释 / script / 隐藏元素里的链接。
 *
 * 安全：SSRF 防护（域名白名单校验 + 逐步跟随重定向再校验）、同源写校验、
 * 双限流、单域名幂等、临时故障不计数、审核日志、可选的 CRON_SECRET。
 */
'use strict';

import {
  PREFIX as P, redisClient, json, clientIp, isSameSite, isIp,
  rateLimit, cacheGet, cacheSet, logError,
} from '../server/store.mjs';

/* ---------- 常量 ---------- */
const SELF_HOST = 'gitd.cn';
const SELF_URL = 'https://www.gitd.cn/';
const KEY = P + 'links:items';        // Hash: field = host, value = 记录 JSON
const LOCK = P + 'links:lock';        // 复核互斥锁，防并发重复跑
const HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const BAD_WORDS = /(博彩|赌博|色情|成人影片|办证|代开发票|代孕|枪支|毒品|私服|刷单|诈骗|套现|洗钱|盗版|外挂)/i;
const HIDDEN_RE = /\bhidden\b|aria-hidden\s*=\s*["']?true|display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|font-size\s*:\s*0(?:px|em|rem)?\b|width\s*:\s*0(?:px)?\b|height\s*:\s*0(?:px)?\b/i;
const MAX_LINKS = 60;                 // 友链位上限，防止无限灌水
const FAIL_LIMIT = 3;                 // 连续 3 次查不到回链才下架（避免对方临时改版误删）
const COOLDOWN = 20 * 3600 * 1000;    // 每条记录 20 小时内不重复检测
const PENDING_TTL = 30 * 86400 * 1000; // 30 天还没加回链的申请自动清理
const BATCH = 12;                     // 一轮最多并发复核 12 条；超过的由页面惰性触发分批补齐
const MAX_HTML = 512 * 1024;          // 对方首页最多读 512KB
const FETCH_TIMEOUT = 6000;   // 一轮 4 条并发，最坏仍留有余量给 Redis 写入

class CheckError extends Error {
  constructor(message, temporary = false) {
    super(message);
    this.temporary = temporary;   // true = 网络抖动 / 5xx，不能算「对方删了链接」
  }
}

/* ---------- 输入校验 ---------- */
function cleanText(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function hostProblem(host) {
  const h = String(host || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!HOST_RE.test(h)) return '域名格式不对，请填公开网站的域名';
  if (isIp(h) || /^\d+$/.test(h) || h.includes(':')) return '不能用 IP 地址申请友链';
  if (/(^|\.)(localhost|local|internal|localdomain|test|invalid|example|home\.arpa|onion)$/.test(h)) {
    return '这个域名不是公开网站';
  }
  if (/^(127\.|10\.|169\.254\.|192\.168\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|172\.(1[6-9]|2\d|3[01])\.|192\.0\.0\.|198\.1[89]\.)/.test(h)) {
    return '内网地址不能用于友链';
  }
  if (h === SELF_HOST || h === 'www.' + SELF_HOST || h.endsWith('.' + SELF_HOST)) {
    return '本站不能和自己结为友链';
  }
  return '';
}

function portProblem(u) {
  const p = u.port;
  if (!p) return '';
  const ok = (u.protocol === 'http:' && p === '80') || (u.protocol === 'https:' && p === '443');
  return ok ? '' : '不支持带自定义端口的地址';
}

function normalizeUrl(raw) {
  let s = String(raw == null ? '' : raw).trim();
  if (!s) return { error: '请填写首页地址' };
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { return { error: '网址格式不对，请填 https:// 开头的首页地址' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: '只支持 http / https' };
  if (u.username || u.password) return { error: '网址里不能带账号密码' };
  const badPort = portProblem(u);
  if (badPort) return { error: badPort };
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  const bad = hostProblem(host);
  if (bad) return { error: bad };
  // 只认首页：路径 / 查询 / 锚点一律丢掉，避免提交一个专门写好回链的内页
  u.pathname = '/'; u.search = ''; u.hash = '';
  return { host, url: u.toString(), id: host };
}

function sameHost(a, b) {
  const norm = (x) => String(x || '').toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  return norm(a) === norm(b);
}

/* ---------- 抓取对方首页 ---------- */
async function readLimited(r, max) {
  if (!r.body || typeof r.body.getReader !== 'function') {
    return String(await r.text()).slice(0, max);
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder('utf-8');
  let text = '', bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value ? value.length : 0;
      text += dec.decode(value, { stream: true });
      if (bytes >= max) break;
    }
    text += dec.decode();
  } finally {
    try { await reader.cancel(); } catch (e) { /* 已读完，忽略 */ }
  }
  return text.slice(0, max);
}

/* 不交给 fetch 自动跟跳转：每跳都重新校验协议 / 域名 / 内网，挡住「301 到 169.254.169.254」。 */
async function fetchHome(entryUrl, submitHost) {
  let current = entryUrl;
  for (let hop = 0; hop <= 3; hop++) {
    let r;
    try {
      r = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        headers: {
          'User-Agent': 'gitd-linkcheck/1.0 (+' + SELF_URL + ')',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.6',
        },
      });
    } catch (e) {
      throw new CheckError('连不上对方首页（超时或网络错误），本次不计入失效', true);
    }

    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) {
      try { await r.body?.cancel?.(); } catch (e) { /* 忽略 */ }
      let next;
      try { next = new URL(loc, current); } catch (e) { throw new CheckError('首页跳转地址无效'); }
      if (next.protocol !== 'http:' && next.protocol !== 'https:') throw new CheckError('首页跳转到了非网页协议');
      const nh = next.hostname.toLowerCase().replace(/\.$/, '');
      const bad = hostProblem(nh) || portProblem(next);
      if (bad) throw new CheckError('首页跳转到了不允许的地址：' + bad);
      if (!sameHost(nh, submitHost)) throw new CheckError('首页跳转到了别的站点，请填最终首页地址');
      current = next.toString();
      continue;
    }

    if (!r.ok) {
      const temporary = r.status === 429 || r.status >= 500;
      throw new CheckError('对方首页打不开（HTTP ' + r.status + '）', temporary);
    }
    const ct = r.headers.get('content-type') || '';
    if (ct && !/text\/html|application\/xhtml\+xml/i.test(ct)) {
      throw new CheckError('对方首页返回的不是 HTML 页面');
    }
    const html = await readLimited(r, MAX_HTML);
    return { html, finalUrl: current };
  }
  throw new CheckError('首页跳转次数过多');
}

/* ---------- 回链检测 ---------- */
function stripNoise(html) {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template\s*>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg\s*>/gi, ' ');
}

function decodeEntities(s) {
  return String(s).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'").replace(/&#38;/g, '&').trim();
}

function isSelfHref(href, base) {
  const s = String(href || '').trim();
  if (!s || /^(javascript|data|mailto|tel|#):?/i.test(s)) return false;
  let u;
  try { u = new URL(s, base); } catch (e) { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  return u.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '') === SELF_HOST;
}

function findBacklink(html, baseUrl) {
  const clean = stripNoise(html);
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let m, sawHidden = false, sawEmpty = false;
  while ((m = re.exec(clean))) {
    const attrs = m[1] || '', inner = m[2] || '';
    const h = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    if (!h) continue;
    const href = decodeEntities(h[1] ?? h[2] ?? h[3] ?? '');
    if (!isSelfHref(href, baseUrl)) continue;
    // 链接存在但样式藏起来了，不算有效回链
    if (HIDDEN_RE.test(attrs + ' ' + inner)) { sawHidden = true; continue; }
    const text = inner.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|&ensp;|&emsp;/gi, ' ').trim();
    const hasImg = /<img\b/i.test(inner) || /\balt\s*=/i.test(inner);
    if (!text && !hasImg && !/\btitle\s*=/i.test(attrs)) { sawEmpty = true; continue; }
    return { ok: true, href, nofollow: /\brel\s*=\s*["'][^"']*nofollow/i.test(attrs) };
  }
  let reason = '对方首页没有找到指向 www.gitd.cn 的链接';
  if (sawHidden) reason = '找到了本站链接，但它是隐藏的，请把链接正常显示出来';
  else if (sawEmpty) reason = '找到了本站链接，但它是空的，请加上站名或图片';
  return { ok: false, reason };
}

async function inspect(url, host) {
  try {
    const { html, finalUrl } = await fetchHome(url, host);
    const hit = findBacklink(html, finalUrl);
    return hit.ok
      ? { ok: true, reason: '', href: hit.href, nofollow: hit.nofollow }
      : { ok: false, temporary: false, reason: hit.reason };
  } catch (e) {
    return {
      ok: false,
      temporary: e instanceof CheckError ? e.temporary : true,
      reason: (e && e.message) || '检测失败',
    };
  }
}

/* ---------- Redis 读写 ---------- */
async function allItems(redis) {
  const flat = await redis.run('HGETALL', KEY);
  const out = [];
  const push = (v) => { try { const o = JSON.parse(v); if (o && o.id) out.push(o); } catch (e) { /* 脏数据跳过 */ } };
  if (Array.isArray(flat)) {
    for (let i = 0; i + 1 < flat.length; i += 2) push(flat[i + 1]);
  } else if (flat && typeof flat === 'object') {
    for (const v of Object.values(flat)) push(v);
  }
  return out;
}
const saveItem = (redis, item) => redis.run('HSET', KEY, item.id, JSON.stringify(item));
const delItem = (redis, id) => redis.run('HDEL', KEY, id);

async function audit(redis, type, item, reason) {
  try {
    const list = (await cacheGet(redis, 'links:log')) || [];
    list.unshift({ t: Date.now(), type, host: item.id, name: item.name, reason: reason || '' });
    await cacheSet(redis, 'links:log', list.slice(0, 40), 60 * 86400);
  } catch (e) { logError('links audit', e); }
}

function publicView(x) {
  return { name: x.name, url: x.url, desc: x.desc || '', since: x.approvedAt || x.created || 0 };
}

/* ---------- 状态机 ---------- */
/* 返回 'approved' | 'pending' | 'warned' | 'removed' | 'skipped' */
async function applyResult(redis, rec, res, now) {
  rec.checked = now;
  rec.lastReason = res.reason || '';

  if (res.ok) {
    const wasPending = rec.status !== 'approved';
    rec.status = 'approved';
    rec.fails = 0;
    rec.approvedAt = rec.approvedAt || now;
    await saveItem(redis, rec);
    if (wasPending) await audit(redis, 'approved', rec, '首页检测到回链，自动上线');
    return 'approved';
  }
  if (res.temporary) {
    // 网络抖动不算对方撤链：保持原状态、不累加失败，20 小时后（下一轮）再查
    await saveItem(redis, rec);
    return 'skipped';
  }
  if (rec.status === 'approved') {
    rec.fails = (rec.fails || 0) + 1;
    if (rec.fails >= FAIL_LIMIT) {
      await delItem(redis, rec.id);
      await audit(redis, 'removed', rec, '连续 ' + FAIL_LIMIT + ' 次未检测到回链：' + res.reason);
      return 'removed';
    }
    await saveItem(redis, rec);
    await audit(redis, 'warn', rec, '第 ' + rec.fails + ' 次未检测到回链：' + res.reason);
    return 'warned';
  }
  rec.status = 'pending';
  await saveItem(redis, rec);
  return 'pending';
}

/* ---------- 复核（Cron / 惰性触发共用） ---------- */
function verifyAllowed(request) {
  const secret = process.env.CRON_SECRET;
  const bearer = request.headers.get('authorization') || '';
  if (secret && bearer === 'Bearer ' + secret) return true;
  // Vercel Cron 固定带这两个头；没配 CRON_SECRET 时用它识别定时任务
  const ua = request.headers.get('user-agent') || '';
  if (ua.includes('vercel-cron/1.0') && request.headers.get('x-vercel-cron-schedule')) return true;
  // 本站页面发起的惰性复核兜底（Referer / Origin 必须是本站）
  return isSameSite(request);
}

async function verify(redis, request) {
  if (!verifyAllowed(request)) return json({ error: 'unauthorized' }, 401, 'no-store');
  const gate = await redis.run('SET', LOCK, '1', 'NX', 'EX', 120);
  if (!(gate === 'OK' || gate === 1 || gate === true)) {
    return json({ ok: true, skipped: '另有复核正在运行' }, 200, 'no-store');
  }
  try {
    const now = Date.now();
    const all = await allItems(redis);
    // 长期没加回链的申请自动清理，别让待审队列越堆越多
    for (const r of all) {
      if (r.status === 'pending' && now - (r.created || 0) > PENDING_TTL) {
        await delItem(redis, r.id);
        await audit(redis, 'expired', r, '30 天未添加回链，申请自动清理');
      }
    }
    const due = all
      .filter((r) => !(r.status === 'pending' && now - (r.created || 0) > PENDING_TTL))
      .filter((r) => now - (r.checked || 0) >= COOLDOWN)
      .sort((a, b) => (a.checked || 0) - (b.checked || 0))
      .slice(0, BATCH);

    const checked = await Promise.allSettled(due.map(async (r) => {
      const res = await inspect(r.url, r.id);
      return applyResult(redis, r, res, now);
    }));
    const tally = { approved: 0, pending: 0, warned: 0, removed: 0, skipped: 0 };
    for (const c of checked) if (c.status === 'fulfilled' && tally[c.value] !== undefined) tally[c.value]++;
    return json({ ok: true, processed: due.length, ...tally, at: new Date().toISOString() }, 200, 'no-store');
  } finally {
    await redis.run('DEL', LOCK);
  }
}

/* ---------- 提交申请 ---------- */
async function submit(redis, request, ip) {
  if (!isSameSite(request)) return json({ error: 'bad origin' }, 403);
  if (!(await rateLimit(redis, 'linkp:' + ip, 8, 3600))) return json({ error: '提交太频繁，一小时后再试' }, 429);
  if (!(await rateLimit(redis, 'linkp:all', 40, 86400))) return json({ error: '今天的申请名额已满，明天再来' }, 429);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad body' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'bad body' }, 400);

  const name = cleanText(body.name, 24);
  const desc = cleanText(body.desc, 60);
  if (name.length < 2) return json({ error: '请填 2 个字以上的站点名称' }, 400);
  if (BAD_WORDS.test(name + ' ' + desc)) return json({ error: '站点名称或简介含有不适宜的内容' }, 400);
  const n = normalizeUrl(body.url);
  if (n.error) return json({ error: n.error }, 400);

  const all = await allItems(redis);
  const old = all.find((x) => x.id === n.id);
  if (!old && all.length >= MAX_LINKS) return json({ error: '友链位已满，暂时不接受新申请' }, 429);

  const now = Date.now();
  const rec = old || { id: n.id, created: now, fails: 0, status: 'pending', checked: 0 };
  rec.name = name; rec.desc = desc; rec.url = n.url;

  /* 已上线的站，20 小时内重复提交只回当前状态，不拿本站当免费的网页探测接口。
     待审的站则每次提交都重查 —— 加好回链后再提交一次就能立刻上线。 */
  if (old && old.status === 'approved' && now - (old.checked || 0) < COOLDOWN) {
    return json({ ok: true, status: 'approved', link: publicView(old),
      note: '这个站点已经通过审核，每天会自动复查回链。' }, 200, 'no-store');
  }

  const res = await inspect(rec.url, rec.id);
  const state = await applyResult(redis, rec, res, now);
  const data = {
    ok: true,
    status: state === 'removed' ? 'removed' : rec.status,
    reason: res.reason || '',
    link: state !== 'removed' && rec.status === 'approved' ? publicView(rec) : null,
  };
  if (rec.status === 'pending') {
    data.note = '请先在对方网站首页放上本站链接，然后再次提交即可自动通过；系统每天也会自动复查，无需重复申请。';
  } else if (state === 'approved') {
    data.note = '首页已检测到本站链接，友链自动上线。';
  }
  return json(data, 200, 'no-store');
}

/* ---------- 入口 ---------- */
export default {
  async fetch(request) {
    const method = request.method;
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { Allow: 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' },
      });
    }
    if (method !== 'GET' && method !== 'POST') return json({ error: 'method not allowed' }, 405);

    const redis = redisClient();
    if (!redis) { logError('links', 'Redis 未配置'); return json({ error: 'links unavailable' }, 503); }

    const ip = clientIp(request) || 'unknown';
    let u;
    try { u = new URL(request.url); } catch (e) { return json({ error: 'bad url' }, 400); }

    try {
      if (method === 'POST') return await submit(redis, request, ip);
      if (u.searchParams.get('job') === 'verify') return await verify(redis, request);

      if (!(await rateLimit(redis, 'linkr:' + ip, 120))) return json({ error: 'too many requests' }, 429);
      if (u.searchParams.get('view') === 'audit') {
        return json({ ok: true, log: (await cacheGet(redis, 'links:log')) || [] }, 200, 'no-store');
      }
      const list = (await allItems(redis))
        .filter((x) => x.status === 'approved')
        .sort((a, b) => (a.approvedAt || 0) - (b.approvedAt || 0))
        .map(publicView);
      return json({ ok: true, links: list }, 200, 'public, s-maxage=60, stale-while-revalidate=300');
    } catch (e) {
      logError('links ' + method, e);
      return json({ error: 'links unavailable' }, 502);
    }
  },
};
