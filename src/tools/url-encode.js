import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: ['编码', '解码'], default: '编码' },
    { id: 'level', label: '口径', type: 'chips', options: [
      { value: 'component', label: 'encodeURIComponent（参数值）' },
      { value: 'full', label: 'encodeURI（整条网址）' },
      { value: 'form', label: '表单（空格转 +）' },
    ], default: 'component' },
    { id: 'text', label: '网址或参数', type: 'textarea', rows: 6, placeholder: 'https://example.com/s?q=中文 搜索&a=1' },
  ],
  titleIn: 'URL', titleOut: '编码结果', primary: '复制编码结果',
  sample: { mode: '编码', level: 'component', text: 'https://example.com/s?q=中文 搜索&a=1' },
  compute(v) {
    if (!v.text.trim()) return { text: '', copy: '' };
    const dec = (s) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return ''; } };
    if (v.mode === '解码') {
      const r = dec(v.text);
      return r ? { text: r, copy: r } : { error: '解码失败，这段内容里可能有非法的 % 转义。' };
    }
    let r;
    if (v.level === 'component') r = encodeURIComponent(v.text);
    else if (v.level === 'full') r = encodeURI(v.text);
    else r = encodeURIComponent(v.text).replace(/%20/g, '+');
    return { text: r, copy: r, stats: [{ label: '原始长度', value: v.text.length }, { label: '编码后', value: r.length }] };
  },
});
