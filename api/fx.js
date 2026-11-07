/* 同源实时汇率接口。原先「汇率换算 / 货币价值排行」用的是 2024 年写死的 10 个汇率，
   还标着「离线参考值」，现在改成服务端取公开牌价 + Redis 缓存，并且每天存一次快照供走势图使用。
   上游用 open.er-api.com（免费、无需密钥、约 160 个币种），失败时退回 frankfurter.app（ECB 数据）。

   GET /api/fx  → { ok, base:'USD', rates, names, series, updated, stale, source, count }
   rates 的含义：1 USD = rates[CODE] 个该币种；1 CODE = rates.CNY / rates[CODE] 人民币。
*/
'use strict';

import {
  PREFIX as P, redisClient, json, clientIp, rateLimit,
  cacheGet, cacheSet, readGood, rememberGood, upstream, logError,
} from '../server/store.mjs';

const NAMES = {
  CNY: '人民币', USD: '美元', EUR: '欧元', JPY: '日元', HKD: '港币', GBP: '英镑',
  KRW: '韩元', THB: '泰铢', SGD: '新加坡元', AUD: '澳元', CAD: '加元', CHF: '瑞士法郎',
  TWD: '新台币', MOP: '澳门元', MYR: '马来西亚林吉特', IDR: '印尼盾', VND: '越南盾',
  PHP: '菲律宾比索', INR: '印度卢比', RUB: '俄罗斯卢布', BRL: '巴西雷亚尔',
  MXN: '墨西哥比索', NZD: '新西兰元', ZAR: '南非兰特', TRY: '土耳其里拉',
  AED: '阿联酋迪拉姆', SAR: '沙特里亚尔', SEK: '瑞典克朗', NOK: '挪威克朗',
  DKK: '丹麦克朗', PLN: '波兰兹罗提', ILS: '以色列新谢克尔', EGP: '埃及镑',
  KWD: '科威特第纳尔', BHD: '巴林第纳尔', OMR: '阿曼里亚尔', JOD: '约旦第纳尔',
  GIP: '直布罗陀镑', IRR: '伊朗里亚尔', PKR: '巴基斯坦卢比', BDT: '孟加拉塔卡',
  ARS: '阿根廷比索', CLP: '智利比索', COP: '哥伦比亚比索', NGN: '尼日利亚奈拉',
  CZK: '捷克克朗', HUF: '匈牙利福林', RON: '罗马尼亚列伊', UAH: '乌克兰格里夫纳',
  ISK: '冰岛克朗', LKR: '斯里兰卡卢比', NPR: '尼泊尔卢比', MMK: '缅甸缅元',
  KHR: '柬埔寨瑞尔', LAK: '老挝基普', MNT: '蒙古图格里克', KZT: '哈萨克斯坦坚戈',
};

function cleanRates(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (/^[A-Z]{3}$/.test(k) && typeof v === 'number' && isFinite(v) && v > 0) out[k] = v;
  }
  if (!out.USD) out.USD = 1;
  return out;
}

async function fromErApi() {
  const r = await upstream('https://open.er-api.com/v6/latest/USD');
  const j = await r.json();
  if (j.result !== 'success' || !j.rates) throw new Error('er-api bad payload');
  return {
    base: 'USD', rates: cleanRates(j.rates),
    updated: j.time_last_update_unix ? new Date(j.time_last_update_unix * 1000).toISOString() : new Date().toISOString(),
    published: j.time_last_update_utc || '',
    source: 'open.er-api.com',
  };
}

async function fromFrankfurter() {
  // ECB 不含 CNY 之外的部分币种，但作为上游全挂时的兜底足够
  const r = await upstream('https://api.frankfurter.app/latest?from=USD');
  const j = await r.json();
  if (!j.rates) throw new Error('frankfurter bad payload');
  return {
    base: 'USD', rates: cleanRates({ USD: 1, ...j.rates }),
    updated: j.date ? new Date(j.date + 'T16:00:00Z').toISOString() : new Date().toISOString(),
    published: j.date || '',
    source: 'frankfurter.app / ECB',
  };
}

async function fetchRates() {
  const attempts = await Promise.allSettled([fromErApi(), fromFrankfurter()]);
  for (const a of attempts) if (a.status === 'fulfilled') return a.value;
  throw new Error('两个汇率上游都不可用');
}

/* 每天存一次主要币种快照，最多保留 90 天，供「走势图」画真实折线。
   闸门用 SET NX，避免同一天被反复写。 */
async function snapshot(redis, rates) {
  const day = new Date().toISOString().slice(0, 10);
  const score = Number(day.replace(/-/g, ''));
  const gate = await redis.run('SET', P + 'fx:daily:' + day, '1', 'NX', 'EX', 90000);
  if (!(gate === 'OK' || gate === 1 || gate === true)) return;
  const point = { d: day };
  for (const c of ['CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW']) if (rates[c]) point[c] = rates[c];
  await redis.pipeline([
    ['ZADD', P + 'fx:series', score, JSON.stringify(point)],
    ['ZREMRANGEBYRANK', P + 'fx:series', 0, -91],
  ]);
}

async function readSeries(redis) {
  const rows = await redis.run('ZRANGE', P + 'fx:series', 0, -1);
  const list = Array.isArray(rows) ? rows : [];
  return list.map((x) => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, 'no-store');
    const redis = redisClient();
    if (!redis) return json({ error: 'exchange rates unavailable' }, 503);
    const ip = clientIp(request) || 'unknown';

    try {
      if (!(await rateLimit(redis, 'fx:' + ip, 30))) return json({ error: '查询太频繁，稍后再试' }, 429);

      let data = await cacheGet(redis, 'fx:latest');
      let stale = false;
      let fresh = false;
      if (!data) {
        try {
          data = await fetchRates();
          fresh = true;
          await cacheSet(redis, 'fx:latest', data, 21600);   // 6 小时
          await rememberGood(redis, 'fx:last', data);
          await snapshot(redis, data.rates);
        } catch (e) {
          logError('fx upstream', e);
          data = await readGood(redis, 'fx:last');
          if (!data) return json({ error: '汇率服务暂不可用' }, 502);
          stale = true;
        }
      }

      let series = [];
      try { series = await readSeries(redis); } catch (e) { logError('fx series', e); }

      return json({
        ok: true, base: data.base, rates: data.rates, names: NAMES,
        count: Object.keys(data.rates).length, series,
        updated: data.updated, published: data.published, source: data.source,
        stale, cached: !fresh,
      }, 200, 'public, s-maxage=300, stale-while-revalidate=600');
    } catch (e) {
      logError('fx', e);
      return json({ error: '汇率服务暂不可用' }, 502);
    }
  },
};
