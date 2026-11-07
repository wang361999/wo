/* 站点统计的同源接口：GET 读概览 + 热度榜，POST 上报访问 / 使用 / 心跳。
   浏览器只跟本站 /api/stats 通信，数据库地址与凭据全留在服务端。

   数据源按环境变量自动选择（都是真实计数，不做假数字）：
   1. Vercel Marketplace 的 Upstash Redis（免费层）：KV_REST_API_URL + KV_REST_API_TOKEN，
      或 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN。纯 REST、零依赖、原子计数，最适合本场景。
   2. Vercel Marketplace 的 Neon Postgres（免费层）：DATABASE_URL / POSTGRES_URL。
   3. WorkBuddy 云服务的 events / presence 表（站点已建好，作为没配数据库时的兜底）。

   Vercel 的 Storage/Marketplace 集成会把连接串作为环境变量自动注入项目，
   因此创建数据库后不需要改代码、也不需要手动填 vercel.json。 */

'use strict';

const P = 'op:';
const ONLINE_WINDOW = 45000; // 45 秒内有心跳算在线
const CLOUD_ENDPOINT = process.env.WB_CLOUD_ENDPOINT || 'https://gitd-tools.app.workbuddy.host';
const CLOUD_KEY = process.env.WB_PUBLISHABLE_KEY || 'wbpk_w22bLA8jyiU3DUuPAWT7u3_R1feI6yebetzEaOYBarriGrzwnvMKwK5';

function envAny(...names) {
  for (const n of names) if (process.env[n]) return process.env[n];
  return '';
}

/* ---------- 数据源 1：Vercel Marketplace / Upstash Redis ---------- */
function redisDriver() {
  let base = envAny('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL');
  let token = envAny('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN');
  if (!base || !token) {
    // Marketplace 集成允许自定义前缀：按「https 的 *_URL」+「同前缀 *_TOKEN」自动配对，
    // REDIS_URL / KV_URL 是 rediss:// 协议，会被 https 条件排除，不会误配。
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
    });
    if (!r.ok) throw new Error('redis ' + r.status);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error('redis bad response');
    for (const item of j) if (item && item.error) throw new Error(String(item.error));
    return j.map((x) => x && x.result);
  }

  return {
    name: 'vercel-upstash',
    async read() {
      const now = Date.now();
      const out = await pipeline([
        ['ZREMRANGEBYSCORE', P + 'presence', '-inf', now - ONLINE_WINDOW],
        ['GET', P + 'visits'],
        ['PFCOUNT', P + 'visitors'],
        ['GET', P + 'uses'],
        ['PFCOUNT', P + 'toolusers'],
        ['ZCARD', P + 'presence'],
        ['ZREVRANGE', P + 'rank', 0, 299, 'WITHSCORES'],
      ]);
      const flat = Array.isArray(out[6]) ? out[6] : [];
      const rank = [];
      for (let i = 0; i + 1 < flat.length; i += 2) {
        rank.push({ tool: String(flat[i]), uses: Number(flat[i + 1]) || 0, users: 0 });
      }
      return {
        stats: {
          online: Number(out[5]) || 0,
          visits: Number(out[1]) || 0,
          visitors: Number(out[2]) || 0,
          uses: Number(out[3]) || 0,
          tool_users: Number(out[4]) || 0,
        },
        rank: rank,
      };
    },
    async write(op, sid, kind, tool) {
      if (op === 'ping') {
        await pipeline([['ZADD', P + 'presence', Date.now(), sid]]);
      } else if (kind === 'use') {
        await pipeline([
          ['INCR', P + 'uses'],
          ['PFADD', P + 'toolusers', sid],
          ['ZINCRBY', P + 'rank', 1, tool],
        ]);
      } else {
        await pipeline([
          ['INCR', P + 'visits'],
          ['PFADD', P + 'visitors', sid],
        ]);
      }
    },
  };
}

/* ---------- 数据源 2：Vercel Marketplace / Neon Postgres ----------
   连接串由集成注入。用 postgres 的 HTTP 不适合事务，这里用动态 import 保持构建零依赖：
   仅当 package.json 里装了 postgres 客户端（Vercel 构建时自动 npm install）才会启用。 */
async function pgDriver() {
  const url = envAny('DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL');
  if (!url) return null;
  let pg;
  try {
    pg = await import('postgres');
  } catch (e) {
    return null; // 没装客户端就跳过，交给下一条数据源
  }
  const sql = (pg.default || pg)(url, { max: 1, idle_timeout: 5 });

  await sql`
    CREATE TABLE IF NOT EXISTS op_events (
      kind text NOT NULL, tool_id text, sid text NOT NULL, ts timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`CREATE TABLE IF NOT EXISTS op_presence (sid text PRIMARY KEY, last_seen timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS op_events_kind_idx ON op_events(kind, tool_id)`;

  return {
    name: 'vercel-neon',
    async read() {
      const [s] = await sql`
        SELECT
          (SELECT count(*) FROM op_presence WHERE last_seen > now() - interval '45 seconds')::int AS online,
          (SELECT count(*) FROM op_events WHERE kind='visit')::int AS visits,
          (SELECT count(DISTINCT sid) FROM op_events WHERE kind='visit')::int AS visitors,
          (SELECT count(*) FROM op_events WHERE kind='use')::int AS uses,
          (SELECT count(DISTINCT sid) FROM op_events WHERE kind='use')::int AS tool_users`;
      const rank = await sql`
        SELECT tool_id AS tool, count(*)::int AS uses, count(DISTINCT sid)::int AS users
        FROM op_events WHERE kind='use' AND tool_id IS NOT NULL
        GROUP BY tool_id ORDER BY count(*) DESC, tool_id LIMIT 300`;
      return { stats: s, rank: rank };
    },
    async write(op, sid, kind, tool) {
      if (op === 'ping') {
        await sql`INSERT INTO op_presence(sid, last_seen) VALUES (${sid}, now())
                  ON CONFLICT (sid) DO UPDATE SET last_seen = now()`;
      } else if (kind === 'use') {
        await sql`INSERT INTO op_events(kind, tool_id, sid) VALUES ('use', ${tool}, ${sid})`;
      } else {
        await sql`INSERT INTO op_events(kind, sid) VALUES ('visit', ${sid})`;
      }
    },
  };
}

/* ---------- 数据源 3：WorkBuddy 云服务（兜底，已建表） ---------- */
function cloudDriver() {
  const base = CLOUD_ENDPOINT + '/.cloud/database/rest/';
  async function upstream(path, method, body, prefer) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Wb-Webapp-Access-Key': CLOUD_KEY,
    };
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(base + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) throw new Error('upstream ' + r.status);
    try { return text ? JSON.parse(text) : null; } catch (e) { return null; }
  }
  return {
    name: 'workbuddy-cloud',
    async read() {
      const [s, rank] = await Promise.all([
        upstream('rpc/site_stats', 'POST', {}),
        upstream('rpc/tool_rank', 'POST', { n: 300 }),
      ]);
      return { stats: Array.isArray(s) ? s[0] : s, rank: Array.isArray(rank) ? rank : [] };
    },
    async write(op, sid, kind, tool) {
      if (op === 'ping') {
        await upstream('presence', 'POST', { sid: sid, last_seen: new Date().toISOString() },
          'resolution=merge-duplicates,return=minimal');
      } else if (kind === 'use') {
        await upstream('events', 'POST', { kind: 'use', sid: sid, tool_id: tool }, 'return=minimal');
      } else {
        await upstream('events', 'POST', { kind: 'visit', sid: sid }, 'return=minimal');
      }
    },
  };
}

/* 优先用 Vercel 的免费数据库；没配就用已经跑通的云服务。 */
async function pickDriver() {
  const redis = redisDriver();
  if (redis) return redis;
  const pg = await pgDriver();
  if (pg) return pg;
  return cloudDriver();
}

function json(data, code, cache) {
  return new Response(JSON.stringify(data), {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache || 'no-store',
    },
  });
}

const SID_RE = /^[A-Za-z0-9._-]{6,64}$/;
const TOOL_RE = /^[a-z0-9-]{1,64}$/;

export default {
  async fetch(request) {
    try {
      const driver = await pickDriver();

      if (request.method === 'GET') {
        const data = await driver.read();
        if (!data || !data.stats) throw new Error('empty stats');
        // envKeys 只回传变量「名字」，不含任何值，方便线上排错
        const envKeys = Object.keys(process.env)
          .filter((k) => /REDIS|UPSTASH|KV|STORAGE|DATABASE|POSTGRES/i.test(k)).sort();
        return json({ source: driver.name, envKeys: envKeys, stats: data.stats, rank: data.rank }, 200,
          'no-cache, s-maxage=10, stale-while-revalidate=30');
      }
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad body' }, 400); }
      if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);

      const sid = String(body.sid || '');
      if (!SID_RE.test(sid)) return json({ error: 'bad sid' }, 400);
      const op = body.op === 'ping' ? 'ping' : body.op === 'event' ? 'event' : '';
      if (!op) return json({ error: 'bad op' }, 400);

      const kind = body.kind === 'use' ? 'use' : 'visit';
      const tool = String(body.tool_id || '');
      if (kind === 'use' && !TOOL_RE.test(tool)) return json({ error: 'bad tool' }, 400);

      await driver.write(op, sid, kind, tool);
      return json({ ok: true }, 200);
    } catch (e) {
      return json({ error: 'stats unavailable' }, 502);
    }
  },
};
