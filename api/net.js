/* 同源网络查询接口：把原先在浏览器里直连第三方 API 的「IP 地址查询 / 域名查 IP」
   挪到服务端。好处：不受浏览器 CORS 限制、可按 IP 缓存结果省配额、输入被严格校验不会变成 SSRF，
   而且页面不再向外站泄露访客 IP。上游只用公开免费接口，不需要密钥。

   GET /api/net?mode=self              查当前访客的公网 IP 与归属地（Vercel 自带的 GeoIP 头优先）
   GET /api/net?mode=ip&q=1.1.1.1      查指定 IPv4 / IPv6 的归属地，缓存 24 小时
   GET /api/net?mode=host&q=example.com 真实 DNS 解析（A / AAAA / CNAME），缓存 10 分钟
*/
'use strict';

import {
  PREFIX as P, redisClient, json, clientIp, isIp, rateLimit,
  cacheGet, cacheSet, rememberGood, readGood, upstream, logError,
} from '../server/store.mjs';

const HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const CDN_HINT = /(cloudflare|cloudfront|akamai|fastly|cdn|aliyun|alicdn|qcloud|tencent|edgeone|incapsula|imperva|sucuri|stackpath|bunny|cdn77|chinacache|wangsu|lxdns|dnsv1|kxcdn|keycdn|azureedge|googleusercontent)/i;

function dec(v) {
  if (!v) return '';
  try { return decodeURIComponent(String(v).replace(/\+/g, ' ')); } catch (e) { return String(v); }
}

function normalize(j, ip) {
  return {
    ip,
    version: ip.includes(':') ? 'IPv6' : 'IPv4',
    country: j?.country || '',
    country_code: j?.country_code || '',
    region: j?.region || '',
    city: j?.city || '',
    isp: j?.connection?.isp || j?.connection?.org || j?.connection?.domain || '',
    asn: j?.connection?.asn ? 'AS' + j.connection.asn : '',
    timezone: j?.timezone?.id || '',
    latitude: typeof j?.latitude === 'number' ? j.latitude : null,
    longitude: typeof j?.longitude === 'number' ? j.longitude : null,
  };
}

async function lookupIp(ip, redis) {
  const key = 'net:ip:' + ip;
  const hit = await cacheGet(redis, key);
  if (hit) return { ...hit, cached: true };
  const r = await upstream('https://ipwho.is/' + encodeURIComponent(ip), {
    headers: { Accept: 'application/json' },
  });
  const j = await r.json();
  if (j && j.success === false) throw new Error(j.message || '查询被拒绝');
  const out = { ...normalize(j, ip), source: 'ipwho.is' };
  await cacheSet(redis, key, out, 86400);
  await rememberGood(redis, 'net:last:ip:' + ip, out);
  return { ...out, cached: false };
}

async function doh(host, type) {
  const r = await upstream(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
    { headers: { Accept: 'application/dns-json' } },
  );
  const j = await r.json();
  return (Array.isArray(j.Answer) ? j.Answer : []).map((a) => ({
    host, type, value: String(a.data || ''), ttl: Number(a.TTL) || 0,
  }));
}

async function lookupHost(host, redis) {
  const key = 'net:host:' + host.toLowerCase();
  const hit = await cacheGet(redis, key);
  if (hit) return { ...hit, cached: true };

  const results = await Promise.allSettled([doh(host, 'A'), doh(host, 'AAAA'), doh(host, 'CNAME')]);
  const answers = [];
  results.forEach((r) => { if (r.status === 'fulfilled') answers.push(...r.value); });
  if (!results.some((r) => r.status === 'fulfilled')) throw new Error('DNS 上游暂时不可用');

  // 同一个 CNAME 可能被 A / AAAA 查询带回，去重
  const seen = new Set();
  const list = answers.filter((a) => {
    const k = a.type + '|' + a.value;
    if (!a.value || seen.has(k)) return false;
    seen.add(k); return true;
  });
  const cnames = list.filter((a) => a.type === 'CNAME').map((a) => a.value);
  const cdn = cnames.find((c) => CDN_HINT.test(c)) || '';
  const out = {
    host, answers: list, cdn,
    ips: [...new Set(list.filter((a) => a.type === 'A' || a.type === 'AAAA').map((a) => a.value))],
    source: 'Cloudflare DoH',
  };
  await cacheSet(redis, key, out, 600);
  await rememberGood(redis, 'net:last:host:' + host.toLowerCase(), out);
  return { ...out, cached: false };
}

async function selfInfo(request, redis) {
  const ip = clientIp(request);
  if (!ip) throw new Error('拿不到公网 IP');
  const h = request.headers;
  // Vercel 免费注入的地理头，不需要额外请求，也没有第三方配额
  const geo = {
    // x-vercel-ip-country 是两位国家代码，不要覆盖 ipwho.is 给的国家全称
    country_code: dec(h.get('x-vercel-ip-country')),
    region: dec(h.get('x-vercel-ip-country-region')),
    city: dec(h.get('x-vercel-ip-city')),
    timezone: dec(h.get('x-vercel-ip-timezone')),
  };
  let detail = null;
  try { detail = await lookupIp(ip, redis); } catch (e) { /* 地理头够用，第三方失败不算整体失败 */ }
  const merged = { ...normalize({}, ip), ...(detail || {}), ...Object.fromEntries(Object.entries(geo).filter(([, v]) => v)) };
  return {
    ...merged,
    source: detail ? detail.source : 'vercel-edge-geo',
    cached: !!(detail && detail.cached),
    note: detail ? '' : '第三方归属地服务暂不可用，国家 / 城市 / 时区来自 CDN 边缘节点',
  };
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405, 'no-store');
    }
    const redis = redisClient();
    if (!redis) return json({ error: 'network tools unavailable' }, 503);

    let u;
    try { u = new URL(request.url); } catch (e) { return json({ error: 'bad url' }, 400); }
    const mode = u.searchParams.get('mode') || 'self';
    const q = (u.searchParams.get('q') || '').trim();
    const ip = clientIp(request) || 'unknown';

    try {
      if (!(await rateLimit(redis, 'net:' + ip, 60))) return json({ error: '查询太频繁，稍后再试' }, 429);

      let data;
      if (mode === 'self') {
        data = await selfInfo(request, redis);
      } else if (mode === 'ip') {
        if (!isIp(q)) return json({ error: 'IP 格式不对' }, 400);
        data = await lookupIp(q, redis);
      } else if (mode === 'host') {
        if (!HOST_RE.test(q)) return json({ error: '域名格式不对' }, 400);
        data = await lookupHost(q, redis);
      } else {
        return json({ error: 'bad mode' }, 400);
      }
      return json({ ok: true, mode, ...data, updated: new Date().toISOString() }, 200,
        'public, s-maxage=30, stale-while-revalidate=120');
    } catch (e) {
      logError('net ' + mode, e);
      // 上游挂了时用上一次成功的结果，并明确标 stale，绝不伪装成实时
      const lastKey = mode === 'ip' ? 'net:last:ip:' + q : mode === 'host' ? 'net:last:host:' + q.toLowerCase() : '';
      if (lastKey) {
        try {
          const old = await readGood(redis, lastKey);
          if (old) return json({ ok: true, stale: true, mode, ...old, note: '实时查询暂不可用，这是上一次的结果' }, 200);
        } catch (e2) { logError('net fallback', e2); }
      }
      return json({ error: '查询失败', detail: e.message || 'upstream error' }, 502);
    }
  },
};
