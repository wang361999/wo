/* 服务端共享层：Upstash Redis REST 客户端 + 响应 / 同源 / 限流 / 缓存工具。
   只被 api/*.js 以相对路径引用，不在 api/ 目录里，因此不会被 Vercel 当成路由暴露。
   连接串与令牌只存在于服务端环境变量里，永远不下发到浏览器。 */
'use strict';

export const PREFIX = 'op:';

export function envAny(...names) {
  for (const n of names) if (process.env[n]) return process.env[n];
  return '';
}

/* Vercel Marketplace 的 Upstash 集成注入 KV_REST_API_URL / KV_REST_API_TOKEN。
   也兼容自定义前缀的 https *_URL + 同前缀 *_TOKEN；rediss:// 的 KV_URL / REDIS_URL
   是 TCP 连接串，REST 客户端用不了，靠 ^https:// 条件排除。 */
export function redisClient() {
  let base = envAny('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL');
  let token = envAny('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN');
  if (!base || !token) {
    const keys = Object.keys(process.env);
    const u = keys.find((k) => /URL$/i.test(k) && /^https:\/\//.test(process.env[k] || '') && /REDIS|UPSTASH|KV|STORAGE/i.test(k));
    if (u) {
      const prefix = u.replace(/URL$/i, '');
      const t = keys.find((k) => /TOKEN$/i.test(k) && k.startsWith(prefix));
      if (t) { base = base || process.env[u]; token = token || process.env[t]; }
    }
  }
  base = String(base || '').replace(/\/+$/, '');
  if (!base || !token) return null;

  async function pipeline(commands) {
    const r = await fetch(base + '/pipeline', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('redis ' + r.status);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error('redis bad response');
    for (const item of j) if (item && item.error) throw new Error(String(item.error));
    return j.map((x) => (x && x.result !== undefined ? x.result : null));
  }

  return {
    pipeline,
    run: async (...cmd) => (await pipeline([cmd]))[0],
  };
}

export function json(data, code = 200, cache = 'no-store') {
  return new Response(JSON.stringify(data), {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/* Vercel 会从这些头里给出访客 IP 与地理信息；只用于限流与「查本机 IP」，不落库、不关联身份。 */
export function clientIp(request) {
  const raw = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  const first = raw.split(',')[0].trim();
  return isIp(first) ? first : '';
}

export function isIp(s) {
  if (typeof s !== 'string' || s.length > 45) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    return s.split('.').every((p) => Number(p) <= 255 && String(Number(p)) === String(parseInt(p, 10)));
  }
  return /^[0-9a-f:]{2,45}$/i.test(s) && s.includes(':');
}

/* 写操作要求请求来自本站页面：挡住第三方站点挂表单 / 脚本盲刷。
   伪造 Origin 的脚本仍要靠下面的限流 + 服务端去重来挡。 */
export function isSameSite(request) {
  let origin = request.headers.get('origin') || '';
  if (!origin) {
    const ref = request.headers.get('referer') || '';
    try { origin = ref ? new URL(ref).origin : ''; } catch (e) { origin = ''; }
  }
  if (!origin) return false;
  let host;
  try { host = new URL(origin).host; } catch (e) { return false; }
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return true;
  let self;
  try { self = new URL(request.url).host; } catch (e) { self = ''; }
  return host === self || host === 'www.gitd.cn' || host === 'gitd.cn';
}

/* 固定窗口限流：窗口编号写进 key，就不会被持续的 EXPIRE 刷成滑动窗口。 */
export async function rateLimit(redis, tag, limit, windowSec = 60) {
  if (!redis) return true;
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = PREFIX + 'rl:' + tag + ':' + bucket;
  const out = await redis.pipeline([['INCR', key], ['EXPIRE', key, windowSec * 2]]);
  return (Number(out[0]) || 0) <= limit;
}

/* 服务端去重：同一个 sid 的 visit 一天只计一次，use 七天只计一次。
   SET NX 返回 'OK' 才真正累加计数，客户端重放 / 伪造 sid 都刷不动历史值。 */
export async function firstTime(redis, key, ttlSec) {
  if (!redis) return true;
  const r = await redis.run('SET', PREFIX + key, '1', 'NX', 'EX', ttlSec);
  return r === 'OK' || r === 1 || r === true;
}

export async function cacheGet(redis, key) {
  if (!redis) return null;
  const v = await redis.run('GET', PREFIX + key);
  if (v == null) return null;
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { return null; }
}

export async function cacheSet(redis, key, value, ttlSec) {
  if (!redis) return;
  await redis.run('SET', PREFIX + key, JSON.stringify(value), 'EX', ttlSec);
}

/* 上游数据可能偶发超时或限流，缓存一份永不过期的 last-good，失败时明确标 stale，
   绝不把旧数据当实时数据骗用户。 */
export async function rememberGood(redis, key, value) {
  if (!redis) return;
  await redis.run('SET', PREFIX + key, JSON.stringify(value));
}
export async function readGood(redis, key) {
  return cacheGet(redis, key);
}

export async function upstream(url, opts = {}, timeoutMs = 7000) {
  const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) throw new Error('upstream ' + r.status);
  return r;
}

export function logError(tag, e) {
  console.error('[api] ' + tag + ':', e && e.message ? e.message : String(e));
}
