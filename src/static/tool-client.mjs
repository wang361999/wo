// 通用工具页客户端：加载对应工具的 render.mjs，绑定「换一批 / 打印 / 选项变更」
// 约定每个 /tools/<slug>/render.mjs 导出：controls() / readOpts(root) / render(seed, opts)
const root = document.getElementById('tool-root');
if (root && document.body.dataset.tool) {
  const slug = document.body.dataset.tool;
  try {
    const mod = await import(`/tools/${slug}/render.mjs`);
    const slot = document.getElementById('result-slot');
    const controls = root.querySelector('.tool-controls');

    if (controls && typeof mod.controls === 'function') {
      controls.innerHTML = mod.controls();
    }

    const rerender = () => {
      const opts = typeof mod.readOpts === 'function' ? mod.readOpts(root) : {};
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      slot.innerHTML = mod.render(seed, opts);
    };

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'refresh') rerender();
      if (action === 'print') window.print();
    });
    root.addEventListener('change', (e) => {
      if (e.target.matches('select[data-opt], input[data-opt]')) rerender();
    });
  } catch (err) {
    console.error('工具脚本加载失败：', err);
  }
}
