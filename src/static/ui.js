/* 全站轻量交互：移动端底部导航、分享、回顶。所有页面都会加载。 */
(function () {
  'use strict';

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'ui-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('show'); }, 10);
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, 1800);
  }

  function scrollToId(id, fallback) {
    var el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    window.location.href = fallback;
  }

  var tabs = document.querySelectorAll('.tabbar .tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      var k = this.getAttribute('data-tab');
      if (k === 'home') {
        if (window.location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
        else window.location.href = '/';
      } else if (k === 'cats') {
        scrollToId('categories', '/#categories');
      } else if (k === 'rank') {
        scrollToId('rank', '/#rank');
      } else if (k === 'search') {
        var q = document.getElementById('q');
        if (q) { q.scrollIntoView({ behavior: 'smooth', block: 'center' }); q.focus({ preventScroll: true }); }
        else window.location.href = '/#q';
      }
    });
  }

  var path = window.location.pathname;
  var active = path === '/' ? 'home' : (path.indexOf('/cat/') === 0 ? 'cats' : 'home');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].classList.toggle('on', tabs[j].getAttribute('data-tab') === active);
  }

  document.querySelectorAll('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var payload = { title: document.title, url: window.location.href };
      if (navigator.share) {
        navigator.share(payload).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(payload.url).then(function () { toast('链接已复制'); }).catch(function () { toast('复制失败'); });
      } else { toast('长按地址栏可复制链接'); }
    });
  });

  document.querySelectorAll('[data-scrolltop]').forEach(function (btn) {
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });
})();
