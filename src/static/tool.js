/* 工具页加载器：按 data-tool 动态加载对应模块，失败时给出明确提示而不是白屏。 */
(async () => {
  try {
    const p = localStorage.getItem('toolbox-preview');
    if (p === 'pc') document.body.classList.add('force-pc');
    else if (p === 'mobile') document.body.classList.add('force-mobile');
  } catch (e) {}

  const root = document.getElementById('tool-root');
  const id = root && root.dataset.tool;
  if (!id) return;
  try {
    const mod = await import(`/t/${id}.js`);
    if (typeof mod.default !== 'function') throw new Error('模块没有导出 mount 函数');
    await mod.default(root);
  } catch (e) {
    root.innerHTML = `<div class="t-panel wide"><h2 class="t-head">工具载入失败</h2>
      <p class="t-hint">${String(e.message || e)}</p>
      <p class="t-hint">这可能是缓存里的旧页面，刷新一下再试。</p></div>`;
  }
})();
