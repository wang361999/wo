/* 门面交互：卡片由服务端一次性输出且全部是链接，这里只做筛选、计数联动与布局切换。 */
(function () {
  const cards = Array.from(document.querySelectorAll('#grid .card'));
  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('emptyState');
  const q = document.getElementById('q');
  const qClear = document.getElementById('qClear');
  const label = document.getElementById('resultLabel');
  const devCap = document.getElementById('devCap');
  const caps = document.querySelectorAll('.dev-cap');

  let activeDev = 'all';
  let activeCat = 'all';
  let keyword = '';

  const inDev = (dev, d) => d === 'all' || dev === d || dev === 'both';
  const countDev = (d) => cards.filter((c) => inDev(c.dataset.d, d)).length;
  const countCat = (c, d) => cards.filter((x) => inDev(x.dataset.d, d) && (c === 'all' || x.dataset.c === c)).length;
  const nameOf = (btn) => {
    const clone = btn.cloneNode(true);
    clone.querySelectorAll('.n, .cat-emoji').forEach((x) => x.remove());
    return clone.textContent.trim();
  };
  const catName = (id) => {
    const b = document.querySelector(`.side-link[data-cat="${id}"]`) || document.querySelector(`.m-chip[data-cat="${id}"]`);
    return b ? nameOf(b) : '全部工具';
  };
  const devName = (id) => {
    const b = document.querySelector(`.dev-seg [data-dev="${id}"]`);
    return b ? nameOf(b) : '全部';
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function visibleCards() {
    const k = keyword.trim().toLowerCase();
    return cards.filter((c) => {
      if (!inDev(c.dataset.d, activeDev)) return false;
      if (activeCat !== 'all' && c.dataset.c !== activeCat) return false;
      if (k && !c.dataset.search.includes(k)) return false;
      return true;
    });
  }

  function apply() {
    // 分类落地页是纯静态页，也加载这份脚本以复用布局预览切换，但没有卡片网格
    if (!grid) return;
    const list = visibleCards();
    const show = new Set(list);
    cards.forEach((c) => c.classList.toggle('hidden', !show.has(c)));
    grid.classList.toggle('hidden', list.length === 0);
    emptyState.classList.toggle('hidden', list.length !== 0);

    // 所有同名控件同步 active（电脑侧栏 / 手机顶部各一份 DOM），只作用于导航按钮
    document.querySelectorAll('.dev-seg [data-dev]').forEach((b) => b.classList.toggle('on', b.dataset.dev === activeDev));
    document.querySelectorAll('.side-link[data-cat], .m-chip[data-cat]').forEach((b) => b.classList.toggle('on', b.dataset.cat === activeCat));
    document.querySelectorAll('[data-dev-n]').forEach((n) => { n.textContent = countDev(n.dataset.devN); });
    document.querySelectorAll('[data-cat-n]').forEach((n) => { n.textContent = countCat(n.dataset.catN, activeDev); });

    const cap = activeDev === 'all'
      ? '标「两端」的工具在哪一边都能用。'
      : (activeDev === 'pc'
        ? '在电脑前做的：尺寸大、要精细调、批量处理。标「两端」的也能用。'
        : '随手做的：粘进来、点一下，做好直接发出去。标「两端」的也能用。');
    caps.forEach((c) => { c.textContent = cap; });

    const bits = [];
    if (activeDev !== 'all') bits.push(devName(activeDev));
    bits.push(catName(activeCat));
    label.innerHTML = keyword.trim()
      ? `搜索「<b>${esc(keyword.trim())}</b>」· 找到 <b>${list.length}</b> 个`
      : `<b>${bits.join(' / ')}</b> · 共 <b>${list.length}</b> 个工具`;
    qClear.classList.toggle('hidden', !keyword);
  }

  function reset() {
    activeDev = 'all'; activeCat = 'all'; keyword = '';
    if (q) q.value = '';
    apply();
  }

  document.getElementById('main').addEventListener('click', (e) => {
    const dev = e.target.closest('.dev-seg [data-dev]');
    if (dev) { activeDev = dev.dataset.dev; apply(); return; }
    const cat = e.target.closest('.side-link[data-cat], .m-chip[data-cat]');
    if (cat) { activeCat = cat.dataset.cat; apply(); return; }
    if (e.target.closest('[data-reset]')) { reset(); return; }
  });

  q && q.addEventListener('input', () => { keyword = q.value; apply(); });
  qClear && qClear.addEventListener('click', () => { keyword = ''; q.value = ''; apply(); q.focus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && keyword) { keyword = ''; q.value = ''; apply(); }
  });

  /* ---- 布局预览切换（电脑 / 手机 / 自动），两端共用 ---- */
  const seg = document.getElementById('prevSeg');
  const KEY = 'toolbox-preview';
  function setPreview(p, save) {
    document.body.classList.remove('force-pc', 'force-mobile');
    if (p === 'pc') document.body.classList.add('force-pc');
    if (p === 'mobile') document.body.classList.add('force-mobile');
    seg && seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.prev === p));
    if (save) { try { localStorage.setItem(KEY, p); } catch (err) {} }
  }
  let saved = 'auto';
  try { saved = localStorage.getItem(KEY) || 'auto'; } catch (err) {}
  setPreview(saved, false);
  seg && seg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-prev]');
    if (b) setPreview(b.dataset.prev, true);
  });

  /* ---- 从工具页面包屑带 #cat-xxx 回来时定位分类 ---- */
  const m = location.hash.match(/^#cat-([\w-]+)$/);
  if (m) activeCat = m[1];
  apply();
})();
