/* 跨设备同步：把「最近用过」和「收藏」用一串同步码存进免费 Redis，换设备输同一串码就能取回。
   只存工具 id，不存任何工具输入内容，也不关联账号 / Cookie / 匿名统计 sid。
   同步码是唯一凭据，不做找回；数据 90 天不更新就自动过期。

   POST { op:'create' }                              生成一串新码
   POST { op:'save', code, favorites, recent }      保存
   GET  /api/sync?code=ABC123                      读取
*/
'use strict';

import {
  PREFIX as P, redisClient, json, clientIp, isSameSite,
  rateLimit, logError,
} from '../server/store.mjs';

const CODE_RE = /^[A-Z0-9]{6,12}$/;
const ID_RE = /^[a-z0-9-]{1,64}$/;
const TTL = 90 * 86400;

function cleanIds(v, max) {
  if (!Array.isArray(v)) return [];
  const seen = new Set();
  const out = [];
  for (const x of v) {
    const id = String(x || '');
    if (!ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id); out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

function newCode() {
  // 去掉 0/O/1/I 这类容易抄错的字符
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export default {
  async fetch(request) {
    const redis = redisClient();
    if (!redis) return json({ error: 'sync unavailable' }, 503);
    const ip = clientIp(request) || 'unknown';

    try {
      if (!(await rateLimit(redis, 'sync:' + ip, 30))) return json({ error: '操作太频繁，稍后再试' }, 429);

      if (request.method === 'GET') {
        let u;
        try { u = new URL(request.url); } catch (e) { return json({ error: 'bad url' }, 400); }
        const code = String(u.searchParams.get('code') || '').trim().toUpperCase();
        if (!CODE_RE.test(code)) return json({ error: '同步码格式不对' }, 400);
        const raw = await redis.run('GET', P + 'sync:' + code);
        if (raw == null) return json({ error: '没有找到这个同步码' }, 404);
        let data;
        try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return json({ error: '数据损坏' }, 502); }
        return json({ ok: true, code, favorites: data.favorites || [], recent: data.recent || [], updated: data.updated || '' }, 200);
      }

      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, 'no-store');
      if (!isSameSite(request)) return json({ error: 'bad origin' }, 403);

      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad body' }, 400); }
      if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);

      if (body.op === 'create') {
        for (let i = 0; i < 5; i++) {
          const code = newCode();
          const r = await redis.run('SET', P + 'sync:' + code,
            JSON.stringify({ favorites: [], recent: [], updated: new Date().toISOString() }),
            'NX', 'EX', TTL);
          if (r === 'OK' || r === 1 || r === true) return json({ ok: true, code }, 200);
        }
        return json({ error: '生成失败，请重试' }, 502);
      }

      if (body.op !== 'save') return json({ error: 'bad op' }, 400);
      const code = String(body.code || '').trim().toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: '同步码格式不对' }, 400);
      const payload = {
        favorites: cleanIds(body.favorites, 40),
        recent: cleanIds(body.recent, 20),
        updated: new Date().toISOString(),
      };
      if (JSON.stringify(payload).length > 4096) return json({ error: '数据太大' }, 413);
      await redis.run('SET', P + 'sync:' + code, JSON.stringify(payload), 'EX', TTL);
      return json({ ok: true, code, ...payload }, 200);
    } catch (e) {
      logError('sync', e);
      return json({ error: 'sync unavailable' }, 502);
    }
  },
};
