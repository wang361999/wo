/* 页脚友情链接：渲染已通过自动审核的友链、提交申请、复制回链代码。
   只跟同源 /api/links 通信；列表读不到就如实提示，绝不用写死的假链接填充。
   提交后顺手发一次（30 分钟节流）复核触发，作为每日定时任务之外的兜底。 */
(function () {
  'use strict';

  var listEl = document.querySelector('[data-links-list]');
  if (!listEl) return;

  var openBtn = document.querySelector('[data-links-open]');
  var panel = document.querySelector('[data-links-panel]');
  var form = document.querySelector('[data-links-form]');
  var msgEl = document.querySelector('[data-links-msg]');
  var copyBtn = document.querySelector('[data-links-copy]');
  var codeEl = document.querySelector('[data-links-code]');

  function note(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'friend-msg' + (kind ? ' is-' + kind : '');
  }

  function placeholder(text) {
    listEl.textContent = '';
    var s = document.createElement('span');
    s.className = 'friend-loading';
    s.textContent = text;
    listEl.appendChild(s);
  }

  function safeUrl(raw) {
    try {
      var u = new URL(String(raw || ''), location.href);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : '';
    } catch (e) { return ''; }
  }

  function makeItem(x) {
    var href = safeUrl(x && x.url);
    if (!href || !x || !x.name) return null;
    var a = document.createElement('a');
    a.className = 'friend-item';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';                 // 友链保持 dofollow，只做 opener 隔离
    var b = document.createElement('b');
    b.textContent = String(x.name).slice(0, 24);
    a.appendChild(b);
    if (x.desc) {
      var s = document.createElement('small');
      s.textContent = String(x.desc).slice(0, 60);
      a.title = s.textContent;
      a.appendChild(s);
    }
    return a;
  }

  function render(links) {
    if (!Array.isArray(links) || !links.length) {
      placeholder('暂时还没有友链，欢迎成为第一个。');
      return;
    }
    listEl.textContent = '';
    var frag = document.createDocumentFragment();
    links.forEach(function (x) {
      var item = makeItem(x);
      if (item) frag.appendChild(item);
    });
    if (!frag.childNodes.length) { placeholder('暂时还没有友链，欢迎成为第一个。'); return; }
    listEl.appendChild(frag);
  }

  /* 审核刚通过时立刻显示，不必等列表接口的 60 秒 CDN 缓存过期 */
  function prepend(link) {
    var item = makeItem(link);
    if (!item) return;
    var old = listEl.querySelector('.friend-loading');
    if (old) listEl.textContent = '';
    for (var i = 0; i < listEl.children.length; i++) {
      if (listEl.children[i].getAttribute('href') === item.getAttribute('href')) return;
    }
    listEl.insertBefore(item, listEl.firstChild);
  }

  fetch('/api/links')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.ok) { placeholder('友链暂时读不到，稍后再试。'); return; }
      render(j.links);
    })
    .catch(function () { placeholder('友链暂时读不到，稍后再试。'); });

  if (openBtn && panel) {
    openBtn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      openBtn.setAttribute('aria-expanded', String(open));
      openBtn.textContent = open ? '收起' : '申请友链';
      if (open && form) {
        var first = form.querySelector('input');
        if (first) first.focus();
      }
    });
  }

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', function () {
      var text = codeEl.textContent || '';
      var done = function () {
        copyBtn.textContent = '已复制';
        setTimeout(function () { copyBtn.textContent = '复制'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { note('复制失败，请手动选中代码复制。', 'err'); });
      } else {
        note('请手动选中代码复制。', 'err');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var payload = {
        name: String(fd.get('name') || '').trim(),
        url: String(fd.get('url') || '').trim(),
        desc: String(fd.get('desc') || '').trim(),
      };
      if (payload.name.length < 2) { note('请填 2 个字以上的站点名称。', 'err'); return; }
      if (!payload.url) { note('请填首页地址。', 'err'); return; }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = '正在检测对方首页…';
      note('正在抓取对方首页并核对回链，通常需要几秒。');

      fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
        })
        .then(function (out) {
          var j = out.j || {};
          if (!out.ok) { note(j.error || '提交失败，请稍后再试。', 'err'); return; }
          if (j.status === 'approved') {
            note('✓ ' + (j.note || '首页已检测到回链，友链自动上线。'), 'ok');
            if (j.link) prepend(j.link);
          } else if (j.status === 'removed') {
            note('这个站点此前因回链失效已被移除，请重新加好链接再提交。', 'err');
          } else {
            note('× ' + (j.reason || '未检测到回链') + (j.note ? ' ' + j.note : ''), 'err');
          }
        })
        .catch(function () { note('网络异常，提交没有完成，请稍后再试。', 'err'); })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = '提交并检测';
        });
    });
  }

  /* 惰性复核：定时任务之外的兜底。有 2 分钟互斥锁 + 每条 20 小时冷却，
     多开几个页面也不会重复抓对方网站。 */
  try {
    var key = 'op.links.verify';
    var last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last > 30 * 60 * 1000) {
      localStorage.setItem(key, String(Date.now()));
      fetch('/api/links?job=verify', { keepalive: true }).catch(function () {});
    }
  } catch (e) { /* 隐私模式下 localStorage 不可用，忽略即可 */ }
})();
