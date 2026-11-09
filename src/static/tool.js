/* 工具页加载器：按 data-tool 动态加载对应模块，失败时给出明确提示而不是白屏。
   「使用次数」以用户真的跟工具交互过为准：第一次点按 / 输入 / 改动 / 按键才派发
   op:tool-used，由 stats.js 上报。打开页面本身只算访问，不再算一次使用。 */
(async () => {
  const root = document.getElementById('tool-root');
  const id = root && root.dataset.tool;
  if (!id) return;
  try {
    const mod = await import(`/t/${id}.js`);
    if (typeof mod.default !== 'function') throw new Error('模块没有导出 mount 函数');
    await mod.default(root);

    // formTool 自己处理 Ctrl/⌘+Enter（复制结果）；自定义工具没有统一结果对象，
    // 这里兜底成「点一下主按钮」，免得一半工具快捷键失灵。
    root.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'Enter') return;
      if (root.querySelector('[data-copy]')) return;
      const btn = root.querySelector('.t-btn.primary, [data-gaction], [data-run], .t-btn');
      if (btn) { e.preventDefault(); btn.click(); }
    });

    if (window.__OP_STATS__ && window.__OP_STATS__.remember) window.__OP_STATS__.remember(id);

    // formTool 的输入面板默认写「内容只在本机处理」，在线数据档要改成如实说明
    if (document.body.dataset.mode === 'api') {
      const hint = root.querySelector('.t-panel .t-head .hint');
      if (hint) hint.textContent = '查询经本站接口';
    }

    let counted = false;
    const markUsed = () => {
      if (counted) return;
      counted = true;
      window.dispatchEvent(new CustomEvent('op:tool-used', { detail: { id } }));
    };
    for (const ev of ['pointerdown', 'input', 'change', 'keydown']) {
      root.addEventListener(ev, markUsed, { once: true, capture: true });
    }
  } catch (e) {
    root.innerHTML = `<div class="t-panel wide"><h2 class="t-head">工具载入失败</h2>
      <p class="t-hint">${String(e.message || e)}</p>
      <p class="t-hint">这可能是缓存里的旧页面，刷新一下再试。</p></div>`;
  }
})();
