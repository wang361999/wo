// 首页搜索：输入即筛选工具卡片和生字索引，回车打开第一个结果
(function () {
  const input = document.getElementById('site-search');
  if (!input) return;
  const cards = Array.from(document.querySelectorAll('.card[data-search]'));
  const hanzis = Array.from(document.querySelectorAll('#hz-index a[data-search]'));
  const sections = Array.from(document.querySelectorAll('#tools .section'));

  function visibleResults() {
    return [...cards, ...hanzis].filter((el) => el.style.display !== 'none');
  }

  function apply() {
    const q = input.value.trim().toLowerCase();
    cards.forEach((el) => {
      el.style.display = !q || el.dataset.search.toLowerCase().includes(q) ? '' : 'none';
    });
    hanzis.forEach((el) => {
      el.style.display = !q || el.dataset.search.toLowerCase().includes(q) ? '' : 'none';
    });
    sections.forEach((sec) => {
      const cs = Array.from(sec.querySelectorAll('.card'));
      const soon = sec.querySelector('.stage-soon');
      if (q && soon) { sec.style.display = 'none'; return; }
      sec.style.display = (!q || cs.some((c) => c.style.display !== 'none')) ? '' : 'none';
    });
    const hzSection = document.getElementById('hanzi');
    if (hzSection) hzSection.style.display = (!q || hanzis.some((a) => a.style.display !== 'none')) ? '' : 'none';
  }

  input.addEventListener('input', apply);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = visibleResults()[0];
      if (first) window.location.href = first.getAttribute('href');
    }
  });
})();
