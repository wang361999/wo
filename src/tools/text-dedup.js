import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'text', label: '一列内容', type: 'textarea', rows: 9, placeholder: '一行一个，或用分隔符分开…' },
    { id: 'split', label: '拆分方式', type: 'chips', options: [
      { value: 'line', label: '按行' }, { value: 'comma', label: '逗号' },
      { value: 'space', label: '空白' }, { value: 'semi', label: '分号' },
    ], default: 'line' },
    { id: 'mode', label: '处理方式', type: 'chips', options: [
      { value: 'unique', label: '去重' }, { value: 'freq', label: '频次统计' },
      { value: 'sort', label: '排序' }, { value: 'reverse', label: '倒序' },
    ], default: 'unique' },
    { id: 'ignoreCase', label: '忽略大小写', type: 'checkbox', default: false },
    { id: 'trim', label: '去掉首尾空白', type: 'checkbox', default: true },
  ],
  titleIn: '原始列表', titleOut: '处理结果', primary: '复制结果',
  sample: { text: '苹果\n香蕉\n苹果\n橘子\n香蕉\n葡萄', split: 'line', mode: 'unique' },
  compute(v) {
    const raw = v.text || '';
    const sep = { line: /\r?\n/, comma: /[,，]/, space: /\s+/, semi: /[;；]/ }[v.split];
    let items = raw.split(sep);
    if (v.trim) items = items.map((x) => x.trim());
    items = items.filter((x) => x !== '');
    const key = (x) => (v.ignoreCase ? x.toLowerCase() : x);
    if (v.mode === 'freq') {
      const m = new Map();
      items.forEach((x) => m.set(key(x), (m.get(key(x)) || 0) + 1));
      const rows = [...m.entries()].sort((a, b) => b[1] - a[1]);
      const text = rows.map(([k, n]) => `${k}\t${n}`).join('\n');
      return { text, copy: text, stats: [{ label: '总条数', value: items.length }, { label: '不同值', value: rows.length }] };
    }
    let out = items;
    if (v.mode === 'unique') {
      const seen = new Set();
      out = items.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; });
    } else if (v.mode === 'sort') out = [...items].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    else out = [...items].reverse();
    const text = out.join('\n');
    return { text, copy: text, stats: [{ label: '输入', value: items.length }, { label: '输出', value: out.length }] };
  },
});
