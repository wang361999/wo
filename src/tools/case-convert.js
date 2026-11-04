import { formTool, esc } from '/kit.js';
function words(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9\u4e00-\u9fa5]+/)
    .filter(Boolean);
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
export default formTool({
  fields: [{ id: 'text', label: '词组或变量名', type: 'text', placeholder: 'my tool name / MyToolName / my_tool_name' }],
  titleIn: '输入', titleOut: '六种写法', primary: '复制全部',
  sample: { text: 'user profile settings' },
  compute(v) {
    const w = words(v.text);
    if (!w.length) return { text: '', copy: '' };
    const low = w.map((x) => x.toLowerCase());
    const all = {
      camelCase: low[0] + low.slice(1).map(cap).join(''),
      snake_case: low.join('_'),
      'kebab-case': low.join('-'),
      PascalCase: low.map(cap).join(''),
      CONSTANT_CASE: low.join('_').toUpperCase(),
      'Title Case': low.map(cap).join(' '),
    };
    const text = Object.entries(all).map(([k, val]) => `${k.padEnd(16)} ${val}`).join('\n');
    const html = Object.entries(all).map(([k, val]) =>
      `<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--line-2);align-items:baseline">
        <span style="font-size:11px;color:var(--ink-3);width:112px;flex:0 0 auto">${esc(k)}</span>
        <code style="font-size:13.5px;word-break:break-all">${esc(val)}</code></div>`).join('');
    return { html, copy: text };
  },
});
