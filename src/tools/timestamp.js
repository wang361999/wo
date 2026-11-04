import { formTool } from '/kit.js';
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export default formTool({
  fields: [
    { id: 'mode', label: '方向', type: 'chips', options: [
      { value: 'toDate', label: '时间戳 → 日期' }, { value: 'toTs', label: '日期 → 时间戳' },
    ], default: 'toDate' },
    { id: 'unit', label: '单位', type: 'chips', options: [
      { value: 'auto', label: '自动判断' }, { value: 's', label: '秒' }, { value: 'ms', label: '毫秒' },
    ], default: 'auto' },
    { id: 'text', label: '输入', type: 'text', placeholder: '1700000000 或 2026-11-04 21:00:00' },
  ],
  titleIn: '输入', titleOut: '结果', primary: '复制结果',
  sample: { mode: 'toDate', unit: 'auto', text: '1700000000' },
  actions: [{ label: '用当前时间', run(v, ctx) {
    const el = ctx.$('#f-text', ctx.root);
    el.value = v.mode === 'toDate' ? String(Math.floor(Date.now() / 1000)) : fmt(new Date());
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } }],
  compute(v) {
    const s = String(v.text || '').trim();
    if (!s) return { text: '', copy: '' };
    if (v.mode === 'toDate') {
      const n = Number(s);
      if (!Number.isFinite(n)) return { error: '请输入纯数字时间戳。' };
      const ms = v.unit === 's' ? n * 1000 : v.unit === 'ms' ? n : (n < 1e11 ? n * 1000 : n);
      const d = new Date(ms);
      if (isNaN(d.getTime())) return { error: '这个时间戳超出范围了。' };
      const local = fmt(d), utc = d.toISOString().replace('T', ' ').slice(0, 19);
      const text = `本地时间：${local}\nUTC 时间：${utc}\n毫秒戳：${d.getTime()}\n秒戳：${Math.floor(d.getTime() / 1000)}\n星期：${'日一二三四五六'[d.getDay()]}`;
      return { text, copy: text, stats: [{ label: '年份', value: d.getFullYear() }, { label: '毫秒戳', value: d.getTime() }] };
    }
    const d = new Date(s.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return { error: '日期格式认不出来，试试 2026-11-04 21:00:00。' };
    const text = `秒：${Math.floor(d.getTime() / 1000)}\n毫秒：${d.getTime()}\nISO：${d.toISOString()}`;
    return { text, copy: text };
  },
});
