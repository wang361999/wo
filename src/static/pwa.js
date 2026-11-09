/* 离线与安装：只注册 Service Worker，并在页脚放一个克制的一行入口。
   不做弹窗、不做引导蒙层；浏览器不支持自动安装时给出菜单路径说明。 */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });

  var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  if (standalone || navigator.standalone === true) return;

  var deferred = null, btn = null, note = null;
  function mount() {
    var foot = document.querySelector('.foot-in');
    if (!foot || document.querySelector('.pwa-install')) return;
    if (localStorage.getItem('pwa-hide') === '1') return;

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pwa-install';
    btn.textContent = '装到桌面 · 离线可用';
    btn.setAttribute('aria-label', '把本站安装到桌面，之后可离线使用');

    note = document.createElement('span');
    note.className = 'pwa-note';
    note.hidden = true;

    var top = foot.querySelector('.foot-top');
    foot.insertBefore(btn, top || null);
    foot.insertBefore(note, top || null);

    btn.addEventListener('click', async function () {
      if (deferred) {
        deferred.prompt();
        var choice = await deferred.userChoice;
        deferred = null;
        if (choice && choice.outcome === 'accepted') { btn.hidden = true; note.hidden = true; }
        else note.textContent = '已取消，随时可以从这里再装。', note.hidden = false;
        return;
      }
      note.textContent = '在浏览器菜单里选「添加到主屏幕 / 安装应用」即可离线使用。';
      note.hidden = false;
    });

    // 关掉说明：只收起，不再反复出现
    note.addEventListener('click', function () { note.hidden = true; });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (btn) btn.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    if (btn) btn.hidden = true;
    localStorage.setItem('pwa-hide', '1');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
