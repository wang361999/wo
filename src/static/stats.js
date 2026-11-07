/* 真实站点统计：匿名、无 Cookie、不采集任何工具输入内容。
   上报的只有事件类型(visit/use)、工具 id、一个本地随机会话 id 与时间戳；
   实时在线人数按 45 秒内有心跳的会话数计算，热度榜按工具使用次数排序。
   读不到服务时显示「—」和提示，绝不用假数字填充。 */
(function () {
  'use strict';

  var CFG = window.__CLOUD_CONFIG__ || {};
  var MAP = window.__TOOLS_MAP__ || {};
  var NA = '—';
  var client = null;
  var sid = '';
  var rootEl = document.getElementById('tool-root');
  var toolId = rootEl ? (rootEl.getAttribute('data-tool') || '') : '';

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

  function unwrap(r) {
    if (!r) throw new Error('empty response');
    if (r.success === false || r.error) throw new Error((r.error && r.error.message) || 'request failed');
    return r.data;
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
    if (!client) return;
    var key = 'op.e.' + kind + '.' + (tid || '');
    if (seen(key)) return;
    var row = { kind: kind, sid: sid };
    if (tid) row.tool_id = tid;
    try {
      Promise.resolve(client.database.from('events').insert(row)).then(function (r) {
        if (r && r.success !== false && !r.error) {
          mark(key);
          // 本次上报落库后再读一次，首屏就能显示包含这次访问的真实数字
          setTimeout(refresh, 700);
        }
      }).catch(function () {});
    } catch (e) {}
  }

  function ping() {
    if (!client || document.hidden) return;
    try {
      Promise.resolve(client.database.from('presence')
        .upsert({ sid: sid, last_seen: new Date().toISOString() })).catch(function () {});
    } catch (e) {}
  }

  function applyStats(s) {
    if (!s || typeof s !== 'object') { markUnavailable(); return; }
    setStat('online', num(s.online));
    setStat('visits', num(s.visits));
    setStat('visitors', num(s.visitors));
    setStat('uses', num(s.uses));
    setStat('tool_users', num(s.tool_users));
    setHint('数据实时更新 · 每次刷新与打开工具各计一次');
  }

  function renderRank(rows) {
    var list = Array.isArray(rows) ? rows.filter(function (r) { return r && MAP[r.tool]; }) : [];
    var top = list.slice(0, 10);

    each('[data-rank]', function (box) {
      if (!top.length) {
        box.innerHTML = '<p class="rank-empty">还没有使用记录。有人打开工具后，这里会按真实使用次数自动排榜。</p>';
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
      each('[data-tool-uses]', function (el) {
        el.textContent = mine ? num(mine.uses) : '0';
      });
    }
  }

  function refresh() {
    if (!client || document.hidden) return;
    var needAll = !!document.querySelector('[data-tool-uses]');
    Promise.all([
      Promise.resolve(client.database.rpc('site_stats')).then(unwrap),
      Promise.resolve(client.database.rpc('tool_rank', { n: needAll ? 300 : 10 })).then(unwrap)
    ]).then(function (res) {
      var s = res[0];
      applyStats(Array.isArray(s) ? s[0] : s);
      renderRank(res[1]);
      document.documentElement.setAttribute('data-stats', 'on');
    }).catch(function () {
      markUnavailable();
    });
  }

  function remember(id) {
    try {
      var a = JSON.parse(localStorage.getItem('op.recent') || '[]');
      if (!Array.isArray(a)) a = [];
      a = [id].concat(a.filter(function (x) { return x !== id; })).slice(0, 8);
      localStorage.setItem('op.recent', JSON.stringify(a));
    } catch (e) {}
  }

  function renderRecent() {
    var box = document.querySelector('[data-recent]');
    if (!box) return;
    var a = [];
    try { a = JSON.parse(localStorage.getItem('op.recent') || '[]'); } catch (e) {}
    if (!Array.isArray(a) || !a.length) {
      box.innerHTML = '<span class="recent-empty">最近用过的工具会出现在这里</span>';
      return;
    }
    box.innerHTML = a.map(function (id) {
      var m = MAP[id];
      if (!m) return '';
      return '<a class="recent-chip" href="/tools/' + encodeURIComponent(id) + '/">' +
        '<span style="background:' + esc(m.s) + '">' + esc(m.e) + '</span>' + esc(m.n) + '</a>';
    }).join('');
  }

  function start() {
    renderRecent();
    if (!CFG.endpoint || !CFG.publishableKey || !window.WorkBuddyCloud) { markUnavailable(); return; }
    try {
      client = window.WorkBuddyCloud.createWorkBuddyCloud({
        endpoint: CFG.endpoint,
        oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
        publishableKey: CFG.publishableKey
      });
    } catch (e) { markUnavailable(); return; }

    sid = sidGet();
    emit('visit');
    if (toolId) { emit('use', toolId); remember(toolId); }
    ping();
    refresh();
    setInterval(ping, 20000);
    setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { ping(); refresh(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
