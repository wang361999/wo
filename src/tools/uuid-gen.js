import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'count', label: '生成数量', type: 'number', default: 5, step: 1, hint: '1 – 500' },
    { id: 'fmt', label: '格式', type: 'chips', options: [
      { value: 'lower', label: '小写' }, { value: 'upper', label: '大写' },
      { value: 'bare', label: '无连字符' }, { value: 'brace', label: '花括号' },
    ], default: 'lower' },
  ],
  titleIn: '选项', titleOut: 'UUID v4', primary: '复制全部',
  sample: { count: 5, fmt: 'lower' },
  actions: [
    { label: '重新生成', run(v, ctx) { ctx.root.dispatchEvent(new Event('regenerate')); } },
    { label: '下载 .txt', run(v, ctx) { ctx.download('uuid.txt', ctx.$('[data-out]', ctx.root).textContent); } },
  ],
  compute(v) {
    const n = Math.min(500, Math.max(1, Number(v.count) || 1));
    const one = () => (crypto.randomUUID ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      }));
    const list = Array.from({ length: n }, () => {
      let s = one();
      if (v.fmt === 'upper') s = s.toUpperCase();
      if (v.fmt === 'bare') s = s.replace(/-/g, '');
      if (v.fmt === 'brace') s = '{' + s + '}';
      return s;
    });
    const text = list.join('\n');
    return { text, copy: text, stats: [{ label: '条数', value: n }, { label: '版本', value: 'v4' }] };
  },
});
