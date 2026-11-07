/* 真实站点统计：匿名、无 Cookie、不采集任何工具输入内容。
   浏览器只跟本站同源的 /api/stats 通信，数据库地址与凭据全在服务端。

   本轮修正：
   - GET 不再带 no-store，让服务端 s-maxage 的 CDN 缓存真正生效，省下大量数据库命令配额；
     POST 仍禁用缓存。
   - 「使用次数」改成用户真的跟工具交互过才上报（由 tool.js 派发 op:tool-used），
     不再是打开页面就算一次，热度榜的口径才对得上「使用」两个字。
   - 连续读失败时拉长重试间隔，别在统计服务不可用时每 30 秒空转。
   - 额外维护「最近用过 / 我的收藏」两份本地清单，供 sync.js 做跨设备同步。
*/
(function () {
  'use strict';

  var MAP = window.__TOOLS_MAP__ || {};
  var NA = '—';
  var API = '/api/stats';
  var sid = '';
  var rootEl = document.getElementById('tool-root');
  var toolId = rootEl ? (rootEl.getAttribute('data-tool') || '') : '';
  var failures = 0, retryAfter = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n.toLocaleString('zh-CN') : NA;
  }
  function each(sel, fn) {
    var a = document.querySelectorAll(sel);
    for (var i = 0; i < a.length; i++) fn(a[i]);
  }
  function setStat(k, v) { each('[data-stat="' + k + '"]', function (el) { el.textContent = v; }); }
  function setHint(txt) { each('[data-stats-hint]', function (el) { el.textContent = txt; }); }

  function markUnavailable() {
    document.documentElement.setAttribute('data-stats', 'off');
    each('[data-stat]', function (el) { el.textContent = NA; });
    setHint('统计服务暂时连不上，数字暂不显示');
    each('[data-rank]', function (el) {
      el.innerHTML = '<p class="rank-empty">榜单暂时读不到，稍后会自动重试。</p>';
    });
  }

  function api(method, body) {
    var opt = { method: method };
    if (method === 'GET') {
      // 故意不设 no-store：让 /api/stats 的 s-maxage 在 CDN 上合并读请求
      opt.cache = 'default';
    } else {
      opt.cache = 'no-store';
      opt.headers = { 'Content-Type': 'application/json' };
      opt.body = JSON.stringify(body || {});
    }
    return fetch(API, opt).then(function (r) {
      if (!r.ok) throw new Error('api ' + r.status);
      return r.json();
    });
  }

  function sidGet() {
    var k = 'op.sid', v = '';
    try { v = localStorage.getItem(k) || ''; } catch (e) {}
    if (!v) {
      v = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }

  function seen(key) {
    try { return !!sessionStorage.getItem(key); } catch (e) { return false; }
  }
  function mark(key) {
    try { sessionStorage.setItem(key, '1'); } catch (e) {}
  }

  function emit(kind, tid) {
    var key = 'op.e.' + kind + '.' + (tid || '');
    if (seen(key)) return;
    api('POST', { op: 'event', kind: kind, sid: sid, tool_id: tid || '' }).then(function (r) {
      if (r && r.ok) {
        mark(key);
        setTimeout(refresh, 600);
      }
    }).catch(function () {});
  }

  function ping() {
    if (document.hidden) return;
    api('POST', { op: 'ping', sid: sid }).catch(function () {});
  }

  function applyStats(s) {
    if (!s || typeof s !== 'object') { markUnavailable(); return; }
    setStat('online', num(s.online));
    setStat('visits', num(s.visits));
    setStat('visitors', num(s.visitors));
    setStat('uses', num(s.uses));
    setStat('tool_users', num(s.tool_users));
    setHint('数据实时更新 · 每次访问与每次实际使用各计一次');
  }

  function renderRank(rows) {
    var list = Array.isArray(rows) ? rows.filter(function (r) { return r && MAP[r.tool]; }) : [];
    var top = list.slice(0, 10);

    each('[data-rank]', function (box) {
      if (!top.length) {
        box.innerHTML = '<p class="rank-empty">还没有使用记录。有人真正用过工具后，这里会按真实次数自动排榜。</p>';
        return;
      }
      var max = Number(top[0].uses) || 1;
      box.innerHTML = top.map(function (r, i) {
        var m = MAP[r.tool];
        var pct = Math.max(5, Math.round((Number(r.uses) / max) * 100));
        return '<a class="rank-row" href="/tools/' + encodeURIComponent(r.tool) + '/">' +
          '<span class="rank-n">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="rank-ic" style="background:' + esc(m.s) + '">' + esc(m.e) + '</span>' +
          '<span class="rank-name">' + esc(m.n) + '</span>' +
          '<span class="rank-count">' + num(r.uses) + ' 次</span>' +
          '<span class="rank-bar"><i style="width:' + pct + '%;background:' + esc(m.c) + '"></i></span>' +
        '</a>';
      }).join('');
    });

    if (toolId) {
      var mine = null;
      for (var i = 0; i < list.length; i++) if (list[i].tool === toolId) { mine = list[i]; break; }
      each('[data-tool-uses]', function (el) { el.textContent = mine ? num(mine.uses) : '0'; });
      // 榜单只回前 300 名，本工具不在榜里时保持 0，不编造数字
    }
  }

  function refresh() {
    if (document.hidden || Date.now() < retryAfter) return;
    api('GET').then(function (r) {
      if (!r || !r.stats) { markUnavailable(); return; }
      failures = 0; retryAfter = 0;
      applyStats(r.stats);
      renderRank(r.rank);
      document.documentElement.setAttribute('data-stats', 'on');
    }).catch(function () {
      failures++;
      markUnavailable();
      if (failures >= 3) retryAfter = Date.now() + 120000;   // 连续失败后退避 2 分钟
    });
  }

  /* ---------- 最近用过 / 我的收藏（纯本地，跨设备同步由 sync.js 负责） ---------- */
  function readList(k) {
    var a = [];
    try { a = JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) {}
    if (!Array.isArray(a)) a = [];
    return a.filter(function (x) { return typeof x === 'string' && MAP[x]; });
  }
  function writeList(k, a) {
    try { localStorage.setItem(k, JSON.stringify(a)); } catch (e) {}
  }
  function changed() {
    window.dispatchEvent(new CustomEvent('op:lists-changed'));
  }
  function remember(id) {
    if (!id || !MAP[id]) return;
    var before = readList('op.recent');
    if (before[0] === id) return;
    writeList('op.recent', [id].concat(before.filter(function (x) { return x !== id; })).slice(0, 8));
    renderRecent();
    changed();
  }
  function isFav(id) { return readList('op.fav').indexOf(id) >= 0; }
  function toggleFav(id) {
    if (!id || !MAP[id]) return false;
    var a = readList('op.fav');
    var on = a.indexOf(id) < 0;
    writeList('op.fav', on ? [id].concat(a).slice(0, 40) : a.filter(function (x) { return x !== id; }));
    renderFav();
    changed();
    each('[data-fav-btn]', function (el) {
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.textContent = on ? '★ 已收藏' : '☆ 收藏';
    });
    return on;
  }
  function chip(id) {
    var m = MAP[id];
    if (!m) return '';
    return '<a class="recent-chip" href="/tools/' + encodeURIComponent(id) + '/">' +
      '<span style="background:' + esc(m.s) + '">' + esc(m.e) + '</span>' + esc(m.n) + '</a>';
  }
  function renderRecent() {
    var box = document.querySelector('[data-recent]');
    if (!box) return;
    var a = readList('op.recent');
    box.innerHTML = a.length ? a.map(chip).join('') : '<span class="recent-empty">最近用过的工具会出现在这里</span>';
  }
  function renderFav() {
    var box = document.querySelector('[data-fav]');
    if (!box) return;
    var a = readList('op.fav');
    box.innerHTML = a.length ? a.map(chip).join('') : '<span class="recent-empty">在工具页点「收藏」，常用工具会固定在这里</span>';
  }

  // 给 sync.js 用的小接口
  window.__OP_STATS__ = {
    remember: remember, renderRecent: renderRecent, renderFav: renderFav,
    toggleFav: toggleFav, isFav: isFav,
    getLists: function () { return { recent: readList('op.recent'), favorites: readList('op.fav') }; },
    setLists: function (o) {
      if (!o) return;
      if (Array.isArray(o.recent)) writeList('op.recent', o.recent.filter(function (x) { return MAP[x]; }).slice(0, 8));
      if (Array.isArray(o.favorites)) writeList('op.fav', o.favorites.filter(function (x) { return MAP[x]; }).slice(0, 40));
      renderRecent(); renderFav();
    },
  };

  function start() {
    renderRecent();
    renderFav();
    each('[data-fav-btn]', function (el) {
      var on = toolId && isFav(toolId);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.textContent = on ? '★ 已收藏' : '☆ 收藏';
    });

    sid = sidGet();
    emit('visit');
    // 打开页面不再算使用；等 tool.js 检测到用户真的操作了工具再上报
    window.addEventListener('op:tool-used', function (e) {
      var id = (e && e.detail && e.detail.id) || toolId;
      if (id) emit('use', id);
    });
    ping();
    refresh();
    setInterval(ping, 30000);
    setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { ping(); refresh(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
