/* 站点统计的同源接口：GET 读概览 + 热度榜，POST 上报访问 / 使用 / 心跳。
   数据源只有 Vercel 连接的 Upstash Redis（免费层）；连接串与令牌只在服务端环境变量里。

   和初版相比修掉的几个问题：
   1. 写操作加了同源校验、IP 限流、服务端 sid 去重 —— 之前任何人 curl 一下就能把
      访问量 / 热度榜刷上去，所谓「真实数据」并不成立。
   2. GET 彻底只读（在线数改 ZCOUNT），惰性清理挪到心跳里并加 60 秒闸门；
      之前每次 GET 都跑 ZREMRANGEBYSCORE，写操作混在读里，还会被 CDN 缓存跳过导致在线数虚高。
   3. 不再回传环境变量名、不再硬编码云服务凭据、删掉永远连不上的 Postgres / 云服务兜底死代码。
   4. 失败时写日志并返回明确状态，前端据此显示「—」，不拿假数字兜底。 */
'use strict';

import {
  PREFIX as P, redisClient, json, clientIp, isSameSite,
  rateLimit, firstTime, logError,
} from '../server/store.mjs';

const ONLINE_WINDOW = 45000;   // 45 秒内有心跳算在线
const DAY = 86400;
const WEEK = 604800;

const SID_RE = /^[A-Za-z0-9._-]{6,64}$/;
const TOOL_RE = /^[a-z0-9-]{1,64}$/;

function rankFrom(flat) {
  const out = [];
  const list = Array.isArray(flat) ? flat : [];
  for (let i = 0; i + 1 < list.length; i += 2) {
    out.push({ tool: String(list[i]), uses: Number(list[i + 1]) || 0 });
  }
  return out;
}

async function read(redis) {
  const now = Date.now();
  // 全部是只读命令，可以放心交给 CDN 缓存
  const out = await redis.pipeline([
    ['ZCOUNT', P + 'presence', now - ONLINE_WINDOW, '+inf'],
    ['GET', P + 'visits'],
    ['PFCOUNT', P + 'visitors'],
    ['GET', P + 'uses'],
    ['PFCOUNT', P + 'toolusers'],
    ['ZREVRANGE', P + 'rank', 0, 299, 'WITHSCORES'],
  ]);
  return {
    stats: {
      online: Number(out[0]) || 0,
      visits: Number(out[1]) || 0,
      visitors: Number(out[2]) || 0,
      uses: Number(out[3]) || 0,
      tool_users: Number(out[4]) || 0,
    },
    rank: rankFrom(out[5]),
  };
}

async function write(redis, op, sid, kind, tool) {
  if (op === 'ping') {
    const cmds = [['ZADD', P + 'presence', Date.now(), sid]];
    // 惰性清理：60 秒最多一次，避免每个心跳都写一遍全表
    const gate = await redis.run('SET', P + 'gc', '1', 'NX', 'EX', 60);
    if (gate === 'OK' || gate === 1 || gate === true) {
      cmds.push(['ZREMRANGEBYSCORE', P + 'presence', '-inf', Date.now() - ONLINE_WINDOW]);
    }
    await redis.pipeline(cmds);
    return;
  }

  const day = new Date().toISOString().slice(0, 10);
  if (kind === 'use') {
    if (!(await firstTime(redis, `seen:u:${sid}:${tool}`, WEEK))) return;
    await redis.pipeline([
      ['INCR', P + 'uses'],
      ['PFADD', P + 'toolusers', sid],
      ['ZINCRBY', P + 'rank', 1, tool],
    ]);
  } else {
    if (!(await firstTime(redis, `seen:v:${sid}:${day}`, DAY + 3600))) return;
    await redis.pipeline([
      ['INCR', P + 'visits'],
      ['PFADD', P + 'visitors', sid],
    ]);
  }
}

export default {
  async fetch(request) {
    const method = request.method;
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { Allow: 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' },
      });
    }
    if (method !== 'GET' && method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, 'no-store');
    }

    const redis = redisClient();
    if (!redis) {
      logError('stats', 'Redis 未配置');
      return json({ error: 'stats unavailable' }, 503);
    }

    const ip = clientIp(request) || (method === 'POST' ? 'unknown' : 'read');
    try {
      if (method === 'GET') {
        if (!(await rateLimit(redis, 'r:' + ip, 120))) return json({ error: 'too many requests' }, 429);
        const data = await read(redis);
        // s-maxage 让 CDN 合并同一时段的读请求，省下大量 Redis 命令配额
        return json({ source: 'vercel-upstash', ...data }, 200,
          'public, s-maxage=10, stale-while-revalidate=30');
      }

      /* ---- 写：三道校验，缺一不可 ---- */
      if (!isSameSite(request)) return json({ error: 'bad origin' }, 403);
      if (!(await rateLimit(redis, 'w:' + ip, 40))) return json({ error: 'too many requests' }, 429);

      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad body' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'bad body' }, 400);

      const sid = String(body.sid || '');
      if (!SID_RE.test(sid)) return json({ error: 'bad sid' }, 400);
      const op = body.op === 'ping' ? 'ping' : body.op === 'event' ? 'event' : '';
      if (!op) return json({ error: 'bad op' }, 400);

      const kind = body.kind === 'use' ? 'use' : 'visit';
      const tool = String(body.tool_id || '');
      if (kind === 'use' && !TOOL_RE.test(tool)) return json({ error: 'bad tool' }, 400);
      // ping 时 kind / tool_id 一律忽略，防止请求体夹带额外写入
      if (op === 'ping') {
        await write(redis, 'ping', sid, '', '');
        return json({ ok: true }, 200);
      }

      await write(redis, op, sid, kind, tool);
      return json({ ok: true }, 200);
    } catch (e) {
      logError('stats ' + method, e);
      return json({ error: 'stats unavailable' }, 502);
    }
  },
};
