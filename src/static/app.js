/* 首页交互：搜索 + 两级筛选 + 计数联动。DOM 契约保持 #grid .card / data-d / data-c / data-search。 */
(function () {
  'use strict';
  var q = document.getElementById('q');
  var grid = document.getElementById('grid');
  if (!q || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var clearBtn = document.getElementById('qClear');
  var empty = document.getElementById('emptyState');
  var resultCount = document.getElementById('resultCount');
  var devCap = document.getElementById('devCap');
  var activeDev = 'all', activeCat = 'all';

  function inDev(d, dev) { return d === 'all' || dev === d || dev === 'both'; }

  function matches(c, kw) {
    if (!inDev(activeDev, c.dataset.d)) return false;
    if (activeCat !== 'all' && c.dataset.c !== activeCat) return false;
    if (kw && (c.dataset.search || '').indexOf(kw) < 0) return false;
    return true;
  }

  function apply() {
    var kw = q.value.trim().toLowerCase();
    var n = 0;
    for (var i = 0; i < cards.length; i++) {
      var ok = matches(cards[i], kw);
      cards[i].hidden = !ok;
      if (ok) n++;
    }
    if (resultCount) resultCount.textContent = '显示 ' + n + ' 个工具';
    if (empty) empty.classList.toggle('hidden', n > 0);
    if (clearBtn) clearBtn.classList.toggle('hidden', !q.value);

    var devNodes = document.querySelectorAll('[data-dev-n]');
    for (var a = 0; a < devNodes.length; a++) {
      var d = devNodes[a].getAttribute('data-dev-n');
      var c1 = 0;
      for (var j = 0; j < cards.length; j++) if (inDev(d, cards[j].dataset.d)) c1++;
      devNodes[a].textContent = c1;
    }
    var catNodes = document.querySelectorAll('[data-cat-n]');
    for (var b = 0; b < catNodes.length; b++) {
      var c = catNodes[b].getAttribute('data-cat-n');
      var c2 = 0;
      for (var k = 0; k < cards.length; k++) {
        if (!inDev(activeDev, cards[k].dataset.d)) continue;
        if (c !== 'all' && cards[k].dataset.c !== c) continue;
        c2++;
      }
      catNodes[b].textContent = c2;
    }
  }

  q.addEventListener('input', apply);
  if (clearBtn) clearBtn.addEventListener('click', function () {
    q.value = ''; apply(); q.focus();
  });

  document.querySelectorAll('.dev-seg [data-dev]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeDev = btn.getAttribute('data-dev');
      document.querySelectorAll('.dev-seg [data-dev]').forEach(function (x) { x.classList.toggle('on', x === btn); });
      if (devCap) {
        devCap.textContent = activeDev === 'all'
          ? '标「两端」的工具在电脑和手机上都能用。'
          : activeDev === 'pc'
            ? '电脑端：尺寸大、要精细调、批量处理。标「两端」的也能用。'
            : '手机端：粘进来、点一下，做好直接发出去。标「两端」的也能用。';
      }
      apply();
    });
  });

  document.querySelectorAll('.cat-chip[data-cat]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeCat = btn.getAttribute('data-cat');
      document.querySelectorAll('.cat-chip[data-cat]').forEach(function (x) { x.classList.toggle('on', x === btn); });
      apply();
    });
  });

  document.querySelectorAll('[data-reset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      q.value = ''; activeDev = 'all'; activeCat = 'all';
      document.querySelectorAll('.dev-seg [data-dev]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-dev') === 'all'); });
      document.querySelectorAll('.cat-chip[data-cat]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-cat') === 'all'); });
      apply();
      q.focus();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault(); q.focus();
  });

  apply();
})();
