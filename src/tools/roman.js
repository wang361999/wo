import { formTool } from '/kit.js';
const TABLE = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRoman = (n) => { let out = ''; for (const [v, s] of TABLE) { while (n >= v) { out += s; n -= v; } } return out; };
const VAL = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const fromRoman = (s) => { let n = 0; for (let i = 0; i < s.length; i++) {
  const a = VAL[s[i]], b = VAL[s[i + 1]] || 0; if (!a) return NaN; n += a < b ? -a : a; } return n; };
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: [
      { value: 'to', label: '数字 → 罗马' }, { value: 'from', label: '罗马 → 数字' },
    ], default: 'to' },
    { id: 'text', label: '输入', type: 'text', placeholder: '2026 或 MMXXVI' },
  ],
  titleIn: '输入', titleOut: '结果', primary: '复制结果',
  sample: { mode: 'to', text: '2026' },
  compute(v) {
    const s = String(v.text || '').trim();
    if (!s) return { text: '', copy: '' };
    const lines = s.split(/[\s,，]+/).filter(Boolean);
    const out = lines.map((item) => {
      if (v.mode === 'to') {
        const n = Number(item);
        if (!Number.isInteger(n) || n < 1 || n > 3999) return `${item} → 只能转 1–3999 的整数`;
        return `${item} → ${toRoman(n)}`;
      }
      const up = item.toUpperCase();
      if (!/^[IVXLCDM]+$/.test(up)) return `${item} → 含非法字符`;
      const n = fromRoman(up);
      if (!Number.isFinite(n) || n < 1 || toRoman(n) !== up) return `${item} → 不是规范的罗马数字写法`;
      return `${item} → ${n}`;
    }).join('\n');
    return { text: out, copy: out, stats: [{ label: '条数', value: lines.length }] };
  },
});
