import { formTool, esc } from '/kit.js';
const encode = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};
const decode = (s) => {
  const bin = atob(s.trim().replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: ['编码', '解码'], default: '编码' },
    { id: 'text', label: '内容', type: 'textarea', rows: 8, placeholder: '输入中文、文字，或一段 Base64…' },
  ],
  titleIn: '文本', titleOut: '结果', primary: '复制结果',
  sample: { mode: '编码', text: '一页工具 · 文件不上传' },
  compute(v) {
    if (!v.text.trim()) return { text: '', copy: '' };
    if (v.mode === '编码') {
      const r = encode(v.text);
      return { text: r, copy: r, stats: [{ label: '原始字符', value: v.text.length }, { label: '编码长度', value: r.length }] };
    }
    try {
      const r = decode(v.text);
      return { text: r, copy: r, stats: [{ label: '解码字符', value: r.length }] };
    } catch (e) { return { error: '这段内容不是合法的 Base64，检查有没有多余字符。' }; }
  },
});
