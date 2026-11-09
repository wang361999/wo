/* 同源接口的离线回归测试：用内存版 Redis + 假上游，把 4 个 Vercel Function 真跑一遍。
   不需要网络、不需要凭据、不需要装依赖：node scripts/api-selftest.mjs
   重点验证防刷（同源 / 去重 / 限流）、GET 只读、输入校验、上游失败时的 stale 兜底、同步码往返。 */
'use strict';

process.env.KV_REST_API_URL = 'https://fake-upstash.example';
process.env.KV_REST_API_TOKEN = 'test-token';

const KV = new Map();      // key -> { value, expireAt }
const ZSET = new Map();    // key -> Map<member, score>
const PF = new Map();      // key -> Set<member>
const HASH = new Map();    // key -> Map<field, value>（友链记录用 Hash 存）
function hash(k) { if (!HASH.has(k)) HASH.set(k, new Map()); return HASH.get(k); }

function ttl(k) {
  const e = KV.get(k);
  if (e && e.expireAt && e.expireAt < Date.now()) { KV.delete(k); return undefined; }
  return e;
}
function zs(k) { if (!ZSET.has(k)) ZSET.set(k, new Map()); return ZSET.get(k); }
function pf(k) { if (!PF.has(k)) PF.set(k, new Set()); return PF.get(k); }

function redisCmd(cmd) {
  const [op, key, ...a] = cmd;
  const k = String(key);
  switch (String(op).toUpperCase()) {
    case 'INCR': {
      const e = ttl(k); const n = (Number(e?.value) || 0) + 1;
      KV.set(k, { value: String(n), expireAt: e?.expireAt || 0 }); return n;
    }
    case 'EXPIRE': {
      const e = ttl(k); if (e) e.expireAt = Date.now() + Number(a[0]) * 1000; return 1;
    }
    case 'GET': return ttl(k)?.value ?? null;
    case 'SET': {
      const nx = a.includes('NX'), exIdx = a.indexOf('EX');
      if (nx && ttl(k) !== undefined) return null;
      const value = String(a[0]);
      KV.set(k, { value, expireAt: exIdx >= 0 ? Date.now() + Number(a[exIdx + 1]) * 1000 : 0 });
      return 'OK';
    }
    case 'HSET': { hash(k).set(String(a[0]), String(a[1])); return 1; }
    case 'HGETALL': { const out = []; for (const [f, v] of hash(k)) out.push(f, v); return out; }
    case 'HDEL': { let n = 0; for (const f of a) if (hash(k).delete(String(f))) n++; return n; }
    case 'DEL': { KV.delete(k); HASH.delete(k); ZSET.delete(k); PF.delete(k); return 1; }
    case 'PFADD': { pf(k).add(String(a[0])); return 1; }
    case 'PFCOUNT': return pf(k).size;
    case 'ZADD': { zs(k).set(String(a[1]), Number(a[0])); return 1; }
    case 'ZINCRBY': { const m = zs(k); m.set(String(a[1]), (Number(m.get(String(a[1]))) || 0) + Number(a[0])); return Number(m.get(String(a[1]))); }
    case 'ZCARD': return zs(k).size;
    case 'ZCOUNT': {
      const lo = Number(a[0]), hi = a[1] === '+inf' ? Infinity : Number(a[1]);
      return [...zs(k).values()].filter((s) => s >= lo && s <= hi).length;
    }
    case 'ZREVRANGE': {
      const withScores = String(a[2] || '').toUpperCase() === 'WITHSCORES';
      const rows = [...zs(k).entries()].sort((x, y) => y[1] - x[1]).slice(Number(a[0]), Number(a[1]) + 1);
      return withScores ? rows.flatMap(([m, s]) => [m, String(s)]) : rows.map(([m]) => m);
    }
    case 'ZRANGE': {
      const rows = [...zs(k).entries()].sort((x, y) => x[1] - y[1]);
      const end = Number(a[1]) < 0 ? rows.length + Number(a[1]) + 1 : Number(a[1]) + 1;
      return rows.slice(Number(a[0]), end).map(([m]) => m);
    }
    case 'ZREMRANGEBYSCORE': {
      const max = a[1] === '+inf' ? Infinity : Number(a[1]);
      let n = 0; for (const [m, s] of zs(k)) if (s <= max) { zs(k).delete(m); n++; } return n;
    }
    case 'ZREMRANGEBYRANK': {
      const rows = [...zs(k).entries()].sort((x, y) => x[1] - y[1]);
      const keep = 90; for (let i = 0; i < Math.max(0, rows.length - keep); i++) zs(k).delete(rows[i][0]);
      return Math.max(0, rows.length - keep);
    }
    default: throw new Error('mock redis: 未实现的命令 ' + op);
  }
}

let writtenOnGet = [];
let upstreamFail = new Set();

/* 友链检测用的假对方首页：hostname -> { html, status, ct, location }
   测试里随时改内容，就能模拟「加上回链 / 撤掉回链 / 站点 503」 */
const linkPages = new Map();
function setPage(host, html, opt = {}) {
  linkPages.set(host, {
    html: html || '', status: opt.status || 200,
    ct: opt.ct || 'text/html; charset=utf-8', location: opt.location || '',
  });
}
function ageLinks() {
  const m = hash('op:links:items');
  for (const [f, v] of m) {
    const o = JSON.parse(v); o.checked = 0; m.set(f, JSON.stringify(o));
  }
}
function linkRec(host) {
  const v = hash('op:links:items').get(host);
  return v ? JSON.parse(v) : null;
}

function mockJson(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

globalThis.fetch = async (url, opt = {}) => {
  const u = String(url);
  if (u.includes('/pipeline')) {
    const cmds = JSON.parse(opt.body);
    if (opt.method === 'GET') { /* 不会走到 */ }
    return mockJson(cmds.map((c) => {
      try { return { result: redisCmd(c) }; } catch (e) { return { error: e.message }; }
    }));
  }
  if (u.startsWith('https://open.er-api.com')) {
    if (upstreamFail.has('er')) return mockJson({ result: 'error' }, 503);
    return mockJson({ result: 'success', time_last_update_unix: 1730995200,
      time_last_update_utc: 'Thu, 07 Nov 2024 16:00:01 +0000',
      rates: { USD: 1, CNY: 7.12, EUR: 0.92, JPY: 149.3, GBP: 0.77, HKD: 7.78, KRW: 1370 } });
  }
  if (u.startsWith('https://api.frankfurter.app')) {
    if (upstreamFail.has('fr')) return mockJson({}, 503);
    return mockJson({ date: '2024-11-07', rates: { CNY: 7.1, EUR: 0.92, JPY: 149 } });
  }
  if (u.startsWith('https://ipwho.is/')) {
    if (upstreamFail.has('ip')) return mockJson({ success: false }, 429);
    return mockJson({ success: true, country: 'United States', country_code: 'US', region: 'California',
      city: 'Mountain View', latitude: 37.4, longitude: -122.1, timezone: { id: 'America/Los_Angeles' },
      connection: { isp: 'Google LLC', asn: 15169 } });
  }
  if (u.startsWith('https://cloudflare-dns.com/dns-query')) {
    if (upstreamFail.has('dns')) return mockJson({ Status: 2 }, 503);
    const q = new URL(u).searchParams;
    const type = q.get('type');
    const data = type === 'A' ? [{ name: q.get('name'), type: 1, data: '93.184.216.34', TTL: 300 }]
      : type === 'AAAA' ? [] : [{ name: q.get('name'), type: 5, data: 'cdn.example.net', TTL: 600 }];
    return mockJson({ Status: 0, Answer: data });
  }
  // 友链检测：按 hostname 返回假首页
  let host = '';
  try { host = new URL(u).hostname; } catch (e) { /* 不是合法 URL */ }
  if (host && linkPages.has(host)) {
    const p = linkPages.get(host);
    if (p.status >= 300 && p.status < 400) {
      return new Response('', { status: p.status, headers: { Location: p.location } });
    }
    return new Response(p.html, { status: p.status, headers: { 'Content-Type': p.ct } });
  }
  throw new Error('mock fetch: 未拦截的 URL ' + u);
};

function req(path, init = {}) {
  return new Request('https://www.gitd.cn' + path, init);
}
function post(path, body, headers = {}) {
  return req(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
const SITE = { Origin: 'https://www.gitd.cn', 'x-forwarded-for': '203.0.113.9' };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ' → ' + JSON.stringify(extra) : '')); }
}
async function body(r) { try { return await r.json(); } catch (e) { return {}; } }

const stats = (await import('../api/stats.js')).default;
const net = (await import('../api/net.js')).default;
const fx = (await import('../api/fx.js')).default;
const sync = (await import('../api/sync.js')).default;
const links = (await import('../api/links.js')).default;
const linksVerify = (await import('../api/links-verify.js')).default;

console.log('\n[stats] 防刷与只读');
{
  let r = await stats.fetch(post('/api/stats', { op: 'event', kind: 'visit', sid: 'sid-aaaaaa' }));
  ok('无 Origin 的写请求被拒 403', r.status === 403);

  const first = { op: 'event', kind: 'visit', sid: 'sid-aaaaaa' };
  r = await stats.fetch(post('/api/stats', first, SITE)); ok('正常 visit 200', r.status === 200);
  r = await stats.fetch(post('/api/stats', first, SITE)); ok('重复 visit 仍 200（幂等）', r.status === 200);
  r = await stats.fetch(req('/api/stats'));
  const j = await body(r);
  ok('重复上报被服务端去重，visits = 1', j.stats?.visits === 1, j.stats);
  ok('GET 返回真实数据源标记', j.source === 'vercel-upstash', j.source);
  ok('GET 不回传环境变量名', j.envKeys === undefined, Object.keys(j));

  r = await stats.fetch(post('/api/stats', { op: 'event', kind: 'use', sid: 'sid-aaaaaa', tool_id: 'qrcode' }, SITE));
  ok('use 上报 200', r.status === 200);
  r = await stats.fetch(post('/api/stats', { op: 'event', kind: 'use', sid: 'sid-aaaaaa', tool_id: 'qrcode' }, SITE));
  ok('重复 use 200', r.status === 200);
  r = await stats.fetch(req('/api/stats')); const j2 = await body(r);
  ok('uses = 1（按 sid+工具去重）', j2.stats?.uses === 1, j2.stats);
  ok('热度榜含 qrcode', j2.rank?.[0]?.tool === 'qrcode', j2.rank);

  r = await stats.fetch(post('/api/stats', { op: 'event', kind: 'use', sid: 'sid-bbbbbb', tool_id: '<script>' }, SITE));
  ok('非法 tool id 400', r.status === 400);
  r = await stats.fetch(post('/api/stats', { op: 'event', kind: 'visit', sid: 'x' }, SITE));
  ok('非法 sid 400', r.status === 400);
  r = await stats.fetch(req('/api/stats', { method: 'DELETE' }));
  ok('不支持的方法 405', r.status === 405);
  r = await stats.fetch(req('/api/stats', { method: 'OPTIONS' }));
  ok('OPTIONS 预检 204', r.status === 204);

  writtenOnGet = [];
  const seenWrites = [];
  const origPipeline = globalThis.fetch;
  globalThis.fetch = async (url, opt) => {
    if (String(url).includes('/pipeline')) {
      const cmds = JSON.parse(opt.body);
      // 限流的 INCR/EXPIRE 属于计数器，不算改写统计数据
      for (const c of cmds) {
        if (/^(SET|INCR|ZADD|ZREM|PFADD|EXPIRE|DEL)$/i.test(c[0]) && !String(c[1]).includes(':rl:')) {
          seenWrites.push(c[0] + ':' + c[1]);
        }
      }
    }
    return origPipeline(url, opt);
  };
  await stats.fetch(req('/api/stats'));
  globalThis.fetch = origPipeline;
  ok('GET 不改写任何统计数据（限流计数器除外）', seenWrites.length === 0, seenWrites);
}

console.log('\n[net] 输入校验与真实解析');
{
  let r = await net.fetch(req('/api/net?mode=ip&q=not-an-ip'));
  ok('非法 IP 400', r.status === 400);
  r = await net.fetch(req('/api/net?mode=host&q=http://evil.test/x'));
  ok('非法域名 / SSRF 输入 400', r.status === 400);
  r = await net.fetch(req('/api/net?mode=host&q=example.com'));
  const j = await body(r);
  ok('域名解析 200', r.status === 200, j);
  ok('返回 A 记录', j.answers?.some((a) => a.type === 'A'), j.answers);
  ok('识别 CDN CNAME', typeof j.cdn === 'string', j.cdn);
  r = await net.fetch(req('/api/net?mode=self', { headers: SITE }));
  const s = await body(r);
  ok('查本机 IP 返回出口地址', s.ip === '203.0.113.9', s);
  ok('本机查询带上 CDN 国家码', s.country_code !== undefined, s);
  r = await net.fetch(req('/api/net?mode=ip&q=8.8.8.8'));
  const ipj = await body(r);
  ok('指定 IP 查询返回运营商', !!ipj.isp, ipj);
}

console.log('\n[fx] 实时牌价与 stale 兜底');
{
  let r = await fx.fetch(req('/api/fx'));
  let j = await body(r);
  ok('首次取数 200', r.status === 200, j);
  ok('rates 含人民币', j.rates?.CNY === 7.12, j.rates);
  ok('标记非 stale', j.stale === false, j);
  ok('写了每日快照', (j.series || []).length >= 1, j.series);

  // 清掉 6 小时缓存，强制回源，同时让两个上游都失败
  for (const k of [...KV.keys()]) if (k.endsWith('fx:latest')) KV.delete(k);
  upstreamFail = new Set(['er', 'fr']);
  r = await fx.fetch(req('/api/fx'));
  j = await body(r);
  ok('上游全挂时仍返回 last-good', r.status === 200 && j.rates?.CNY === 7.12, j);
  ok('明确标记 stale，不冒充实时', j.stale === true, j);
  upstreamFail = new Set();
}

console.log('\n[sync] 同步码往返');
{
  let r = await sync.fetch(post('/api/sync', { op: 'create' }, SITE));
  let j = await body(r);
  ok('生成同步码 200', r.status === 200 && /^[A-Z0-9]{8}$/.test(j.code || ''), j);
  const code = j.code;
  r = await sync.fetch(post('/api/sync', { op: 'save', code, recent: ['qrcode', 'base64'], favorites: ['qrcode', '<b>x</b>'] }, SITE));
  j = await body(r);
  ok('非法工具 id 被过滤', r.status === 200 && j.favorites?.length === 1, j);
  r = await sync.fetch(req('/api/sync?code=' + code));
  j = await body(r);
  ok('按码读回数据', r.status === 200 && j.recent?.length === 2, j);
  r = await sync.fetch(req('/api/sync?code=BAD'));
  ok('非法同步码 400', r.status === 400);
  r = await sync.fetch(post('/api/sync', { op: 'save', code: 'ABC123', recent: [] }));
  ok('无 Origin 的同步写被拒 403', r.status === 403);
}

console.log('\n[links] 友情链接自动审核 / 撤链自动下架');
{
  process.env.CRON_SECRET = 'test-cron-secret';
  const CRON = { Authorization: 'Bearer test-cron-secret', 'x-vercel-cron-schedule': '0 2 * * *' };
  let seq = 0;
  const LPOST = (b) => post('/api/links', b, { ...SITE, 'x-forwarded-for': '198.51.100.' + (++seq) });
  const BACK = '<a href="https://www.gitd.cn/" target="_blank" title="一页工具">一页工具</a>';
  const OK_PAGE = '<!doctype html><html><head><title>x</title></head><body><p>友链</p>' + BACK + '</body></html>';
  const NO_PAGE = '<!doctype html><html><body><a href="https://other.example/">别的站</a></body></html>';

  let r = await links.fetch(post('/api/links', { name: '某站', url: 'https://friend.example.com/' }));
  ok('无 Origin 的申请被拒 403', r.status === 403);

  const bad = [
    ['http://127.0.0.1/', '内网回环地址'],
    ['http://169.254.169.254/latest/meta-data/', '云元数据地址'],
    ['https://192.168.1.1/', '私有网段'],
    ['https://www.gitd.cn/', '本站自己'],
    ['https://friend.example.com:8080/', '自定义端口'],
    ['ftp://friend.example.com/', '非 http 协议'],
    ['javascript:alert(1)', '脚本协议'],
  ];
  for (const [url, label] of bad) {
    r = await links.fetch(LPOST({ name: '测试站点', url }));
    ok('拒绝' + label, r.status === 400, { url, status: r.status });
  }

  setPage('friend.example.com', OK_PAGE);
  r = await links.fetch(LPOST({ name: '朋友的工具箱', url: 'https://friend.example.com/deep/page?x=1', desc: '一个工具站' }));
  let j = await body(r);
  ok('首页检测到回链 → 自动通过', r.status === 200 && j.status === 'approved', j);
  ok('只认首页，提交里的内页路径被丢掉', j.link?.url === 'https://friend.example.com/', j.link);
  r = await links.fetch(req('/api/links'));
  j = await body(r);
  ok('已上线友链出现在列表', j.links?.length === 1 && j.links[0].name === '朋友的工具箱', j.links);

  setPage('hidden.example.com', '<body><a href="https://www.gitd.cn/" style="display:none">一页工具</a></body>');
  r = await links.fetch(LPOST({ name: '藏链接站', url: 'https://hidden.example.com/' }));
  j = await body(r);
  ok('隐藏的回链不算数', j.status === 'pending' && /隐藏/.test(j.reason || ''), j);

  setPage('comment.example.com', '<body><!-- <a href="https://www.gitd.cn/">一页工具</a> --></body>');
  r = await links.fetch(LPOST({ name: '注释链接站', url: 'https://comment.example.com/' }));
  j = await body(r);
  ok('注释里的回链不算数', j.status === 'pending' && /没有找到/.test(j.reason || ''), j);

  setPage('script.example.com', `<body><script>const t = '<a href="https://www.gitd.cn/">一页工具</a>';</script></body>`);
  r = await links.fetch(LPOST({ name: '脚本链接站', url: 'https://script.example.com/' }));
  j = await body(r);
  ok('script 里的回链不算数', j.status === 'pending' && /没有找到/.test(j.reason || ''), j);

  setPage('jump.example.com', '', { status: 301, location: 'https://evil.example.net/' });
  r = await links.fetch(LPOST({ name: '跳转站', url: 'https://jump.example.com/' }));
  j = await body(r);
  ok('首页跳到别的站点被拒', j.status === 'pending' && /别的站点/.test(j.reason || ''), j);

  setPage('waiting.example.com', NO_PAGE);
  r = await links.fetch(LPOST({ name: '待加链接站', url: 'https://waiting.example.com/' }));
  j = await body(r);
  ok('没有回链 → 待审且不展示', j.status === 'pending' && !j.link, j);
  setPage('waiting.example.com', OK_PAGE);
  r = await links.fetch(LPOST({ name: '待加链接站', url: 'https://waiting.example.com/' }));
  j = await body(r);
  ok('加好回链后再提交 → 立刻自动上线', j.status === 'approved', j);

  // 已上线的站 20 小时内重复提交应直接复用结果，不把本站当免费网页探测器
  let grabs = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = function (url, opt) {
    if (String(url).startsWith('https://friend.example.com/')) grabs++;
    return origFetch(url, opt);
  };
  r = await links.fetch(LPOST({ name: '朋友的工具箱', url: 'https://friend.example.com/' }));
  globalThis.fetch = origFetch;
  j = await body(r);
  ok('20 小时内重复提交不重复抓对方首页', grabs === 0 && j.status === 'approved', { grabs, j });

  // 对方撤链：连续 3 轮每日复核后，本站自动删除这条友链
  setPage('friend.example.com', NO_PAGE);
  for (let i = 1; i <= 3; i++) {
    ageLinks();
    r = await links.fetch(req('/api/links?job=verify', { headers: CRON }));
    const v = await body(r);
    ok('第 ' + i + ' 轮定时复核执行', r.status === 200 && v.ok === true, v);
  }
  ok('连续 3 次查不到回链 → 自动删除', linkRec('friend.example.com') === null, linkRec('friend.example.com'));

  // 清掉待审记录，让下一轮复核集中到唯一已上线的站点
  for (const h of ['hidden.example.com', 'comment.example.com', 'script.example.com', 'jump.example.com']) {
    hash('op:links:items').delete(h);
  }
  setPage('waiting.example.com', '', { status: 503 });
  ageLinks();
  r = await links.fetch(req('/api/links?job=verify', { headers: CRON }));
  ok('对方 5xx 时复核仍正常返回', r.status === 200);
  ok('临时故障不累加失效次数', (linkRec('waiting.example.com')?.fails || 0) === 0, linkRec('waiting.example.com'));

  r = await links.fetch(req('/api/links?job=verify'));
  ok('无凭据的复核请求 401', r.status === 401, r.status);
  r = await links.fetch(req('/api/links?job=verify', { headers: { Authorization: 'Bearer wrong' } }));
  ok('错误的 CRON_SECRET 401', r.status === 401);
  r = await linksVerify.fetch(req('/api/links-verify', { headers: CRON }));
  const vj = await body(r);
  ok('Cron 薄入口转发到复核逻辑', r.status === 200 && vj.ok === true, vj);
  r = await links.fetch(req('/api/links?view=audit'));
  j = await body(r);
  ok('审核日志记录了自动删除', (j.log || []).some((x) => x.type === 'removed'), (j.log || []).map((x) => x.type));
  r = await links.fetch(req('/api/links?job=verify', { headers: { ...SITE } }));
  ok('本站页面能触发惰性复核兜底', r.status === 200, r.status);

  r = await links.fetch(LPOST({ name: '某某博彩网', url: 'https://ok.example.com/' }));
  ok('敏感词被拒 400', r.status === 400);
  r = await links.fetch(LPOST({ name: 'X', url: 'https://ok.example.com/' }));
  ok('站名过短被拒 400', r.status === 400);
  delete process.env.CRON_SECRET;
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败\n`);
process.exit(fail ? 1 : 0);
