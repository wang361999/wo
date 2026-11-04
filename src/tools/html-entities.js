import { formTool } from '/kit.js';
const NAMED = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', ' ': '&nbsp;' };
const REV = Object.fromEntries(Object.entries(NAMED).map(([k, v]) => [v, k]));
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: ['编码', '解码'], default: '编码' },
    { id: 'style', label: '写法', type: 'chips', options: [
      { value: 'named', label: '命名实体' }, { value: 'dec', label: '十进制' }, { value: 'hex', label: '十六进制' },
    ], default: 'named' },
    { id: 'all', label: '所有非 ASCII 字符都转义', type: 'checkbox', default: false },
    { id: 'text', label: '内容', type: 'textarea', rows: 7, placeholder: '<div class="a">A & B</div>' },
  ],
  titleIn: '文本 / HTML', titleOut: '结果', primary: '复制结果',
  sample: { mode: '编码', style: 'named', text: '<div class="box">一页工具 & Tools</div>' },
  compute(v) {
    const s = String(v.text || '');
    if (!s) return { text: '', copy: '' };
    if (v.mode === '解码') {
      const out = s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos|nbsp|#39);/gi, (m, hex, dec, name) => {
        if (hex) return String.fromCodePoint(parseInt(hex, 16));
        if (dec) return String.fromCodePoint(Number(dec));
        return REV['&' + name + ';'] ?? ({ apos: "'", '#39': "'" }[name.toLowerCase()] ?? m);
      });
      return { text: out, copy: out };
    }
    const conv = (ch) => {
      if (v.style === 'named' && NAMED[ch]) return NAMED[ch];
      const cp = ch.codePointAt(0);
      return v.style === 'dec' ? `&#${cp};` : `&#x${cp.toString(16)};`;
    };
    let out = '';
    for (const ch of s) {
      const need = /[&<>"']/.test(ch) || (v.all && ch.charCodeAt(0) > 127);
      out += need ? conv(ch) : ch;
    }
    return { text: out, copy: out, stats: [{ label: '原始长度', value: s.length }, { label: '转义后', value: out.length }] };
  },
});
