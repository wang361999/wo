import { formTool } from '/kit.js';
const SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit: '0123456789', symbol: '!@#$%^&*()-_=+[]{};:,.?/' };
const CONFUSE = /[0O1lI|`]/g;
const rand = (n) => { const a = new Uint32Array(n); crypto.getRandomValues(a); return a; };
export default formTool({
  fields: [
    { id: 'len', label: '长度', type: 'number', default: 16, step: 1 },
    { id: 'count', label: '生成几条', type: 'number', default: 5, step: 1 },
    { id: 'lower', label: '小写字母', type: 'checkbox', default: true },
    { id: 'upper', label: '大写字母', type: 'checkbox', default: true },
    { id: 'digit', label: '数字', type: 'checkbox', default: true },
    { id: 'symbol', label: '符号', type: 'checkbox', default: false },
    { id: 'exclude', label: '排除易混淆字符（0 O 1 l I）', type: 'checkbox', default: true },
  ],
  titleIn: '选项', titleOut: '随机密码', primary: '复制全部',
  sample: { len: 16, count: 5 },
  actions: [{ label: '重新生成', run(v, ctx) { ctx.root.dispatchEvent(new Event('regenerate')); } }],
  compute(v) {
    let pool = '';
    ['lower', 'upper', 'digit', 'symbol'].forEach((k) => { if (v[k]) pool += SETS[k]; });
    if (v.exclude) pool = pool.replace(CONFUSE, '');
    if (!pool) return { error: '至少勾一种字符。' };
    const len = Math.min(128, Math.max(4, Number(v.len) || 16));
    const count = Math.min(50, Math.max(1, Number(v.count) || 5));
    const list = Array.from({ length: count }, () => {
      const a = rand(len); let s = '';
      for (let i = 0; i < len; i++) s += pool[a[i] % pool.length];
      return s;
    });
    const text = list.join('\n');
    const strength = len >= 16 && pool.length >= 60 ? '强' : len >= 12 ? '中' : '偏弱';
    return { text, copy: text, stats: [
      { label: '长度', value: len }, { label: '字符池', value: pool.length }, { label: '强度', value: strength },
    ] };
  },
});
