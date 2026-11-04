import { formTool, esc } from '/kit.js';
function highlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return esc(json).replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m, str, colon, kw, num) => {
      if (str) return colon ? `<span style="color:#8a5a3a">${str}</span>${colon}` : `<span style="color:#3d7a4e">${str}</span>`;
      if (kw) return `<span style="color:#4a6b8a">${m}</span>`;
      if (num) return `<span style="color:#b4552d">${m}</span>`;
      return m;
    });
}
export default formTool({
  fields: [
    { id: 'text', label: 'JSON 文本', type: 'textarea', rows: 11, placeholder: '{ "name": "一页工具", "local": true }' },
    { id: 'mode', label: '操作', type: 'chips', options: [
      { value: 'pretty', label: '格式化' }, { value: 'minify', label: '压缩' }, { value: 'check', label: '仅校验' },
    ], default: 'pretty' },
    { id: 'indent', label: '缩进空格', type: 'number', default: 2, step: 1 },
    { id: 'path', label: '取值路径（可选）', type: 'text', placeholder: '$.data.list[0].name 或 data.list.0.name' },
  ],
  titleIn: 'JSON', titleOut: '结果', primary: '复制结果',
  sample: { text: '{"name":"一页工具","local":true,"tools":["切图","Base64","字帖"],"count":286}', mode: 'pretty', indent: 2, path: '$.tools.0' },
  compute(v) {
    const s = String(v.text || '').trim();
    if (!s) return { text: '', copy: '' };
    let obj;
    try { obj = JSON.parse(s); }
    catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const size = new Blob([s]).size;
    const type = Array.isArray(obj) ? '数组' : obj === null ? 'null' : typeof obj === 'object' ? '对象' : typeof obj;
    const stats = [{ label: '类型', value: type }, { label: '大小', value: size + ' B' }];
    if (obj && typeof obj === 'object') stats.push({ label: '顶层键', value: Object.keys(obj).length });
    let picked = obj;
    if (v.path && v.path.trim()) {
      const parts = v.path.trim().replace(/^\$/, '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
      for (const p of parts) { if (picked == null) break; picked = picked[p]; }
      if (picked === undefined) return { error: `路径 ${v.path} 没有取到值。`, stats };
    }
    const target = picked === undefined ? obj : picked;
    if (v.mode === 'check') {
      const text = `✓ 合法的 JSON\n类型：${type}\n顶层键数：${obj && typeof obj === 'object' ? Object.keys(obj).length : '—'}`;
      return { text, copy: text, stats };
    }
    const text = v.mode === 'minify' ? JSON.stringify(target) : JSON.stringify(target, null, Math.max(0, Math.min(8, Number(v.indent) || 2)));
    return { html: v.mode === 'pretty' ? `<pre style="margin:0;white-space:pre-wrap;word-break:break-word">${highlight(target)}</pre>` : undefined,
      text, copy: text, stats };
  },
});
