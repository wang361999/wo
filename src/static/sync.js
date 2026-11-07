/* 「最近用过 / 我的收藏」的跨设备同步。只把工具编号存进本站免费 Redis，
   用一串同步码当凭据：在 A 设备生成码，在 B 设备输入同一串码即可取回。
   不存任何工具输入内容，不用账号、不用 Cookie，也不跟匿名统计的 sid 关联。 */
(function () {
  'use strict';

  var S = window.__OP_STATS__;
  var API = '/api/sync';
  var KEY = 'op.sync.code';
  var panel = document.querySelector('[data-sync-panel]');
  var input = document.querySelector('[data-sync-code]');
  var msg = document.querySelector('[data-sync-msg]');
  var current = document.querySelector('[data-sync-current]');

  function code() {
    try { return (localStorage.getItem(KEY) || '').toUpperCase(); } catch (e) { return ''; }
  }
  function setCode(v) {
    try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {}
    showCode();
  }
  function showCode() {
    if (current) current.textContent = code() ? '当前同步码：' + code() : '还没有同步码';
    if (input && !input.value && code()) input.value = code();
  }
  function say(t) { if (msg) msg.textContent = t; }

  function call(method, body, q) {
    var opt = { method: method, cache: 'no-store' };
    if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body); }
    return fetch(API + (q || ''), opt).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function payload() {
    var lists = S ? S.getLists() : { recent: [], favorites: [] };
    return { op: 'save', code: code(), recent: lists.recent, favorites: lists.favorites };
  }
  function push(silent) {
    if (!code()) { if (!silent) say('先生成一个同步码'); return Promise.resolve(); }
    return call('POST', payload()).then(function () {
      if (!silent) say('已上传到云端，另一台设备输入同一串同步码即可取回。');
    }).catch(function (e) { say('上传失败：' + e.message); });
  }
  function pull(silent) {
    var c = code();
    if (!c) { if (!silent) say('先填同步码'); return Promise.resolve(); }
    return call('GET', null, '?code=' + encodeURIComponent(c)).then(function (j) {
      if (S) S.setLists({ recent: j.recent, favorites: j.favorites });
      if (!silent) say('已从云端取回 ' + ((j.favorites || []).length + (j.recent || []).length) + ' 条记录。');
    }).catch(function (e) { if (!silent) say('拉取失败：' + e.message); });
  }

  /* 本地清单变化后延迟上传，避免每次点击都打接口 */
  var timer = null;
  window.addEventListener('op:lists-changed', function () {
    if (!code()) return;
    clearTimeout(timer);
    timer = setTimeout(function () { push(true); }, 1500);
  });

  /* 工具页收藏按钮 */
  var favBtn = document.querySelector('[data-fav-btn]');
  if (favBtn && S) {
    favBtn.addEventListener('click', function () {
      var id = (document.getElementById('tool-root') || {}).dataset.tool;
      if (!id) return;
      var on = S.toggleFav(id);
      var el = document.createElement('span');
      el.className = 'ui-toast';
      el.textContent = on ? '已加入收藏' : '已取消收藏';
      document.body.appendChild(el);
      setTimeout(function () { el.classList.add('show'); }, 10);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1900);
    });
  }

  /* 首页同步面板 */
  document.querySelectorAll('[data-sync-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!panel) return;
      panel.hidden = !panel.hidden;
      if (!panel.hidden) { showCode(); input && input.focus(); }
    });
  });
  document.querySelectorAll('[data-sync-close]').forEach(function (b) {
    b.addEventListener('click', function () { if (panel) panel.hidden = true; });
  });
  document.querySelectorAll('[data-sync-connect]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = String((input && input.value) || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{6,12}$/.test(v)) { say('同步码是 6–12 位大写字母或数字'); return; }
      setCode(v); say('正在连接…');
      pull(false);
    });
  });
  document.querySelectorAll('[data-sync-new]').forEach(function (b) {
    b.addEventListener('click', function () {
      say('正在生成…');
      call('POST', { op: 'create' }).then(function (j) {
        setCode(j.code);
        if (input) input.value = j.code;
        say('新同步码已生成，请抄下来：' + j.code);
        return push(true);
      }).catch(function (e) { say('生成失败：' + e.message); });
    });
  });
  document.querySelectorAll('[data-sync-push]').forEach(function (b) {
    b.addEventListener('click', function () { push(false); });
  });
  document.querySelectorAll('[data-sync-pull]').forEach(function (b) {
    b.addEventListener('click', function () { pull(false); });
  });

  showCode();
  // 已有同步码且本机什么都没存过（典型的新设备场景）：静默取回一次
  if (S && code()) {
    var l = S.getLists();
    if (!l.recent.length && !l.favorites.length) pull(true);
  }
})();
