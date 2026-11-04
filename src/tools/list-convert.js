import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'text', label: '一列内容', type: 'textarea', rows: 9, placeholder: '一行一个…' },
    { id: 'fmt', label: '输出格式', type: 'chips', options: [
      { value: 'comma', label: '逗号分隔' }, { value: 'sql', label: 'SQL IN' },
      { value: 'js', label: 'JS 数组' }, { value: 'json', label: 'JSON 数组' },
      { value: 'lines', label: '仍是一列' }, { value: 'quoted', label: '每行加引号' },
    ], default: 'comma' },
    { id: 'quote', label: '引号', type: 'chips', options: [
      { value: 'single', label: "单引号 '" }, { value: 'double', label: '双引号 " ' }, { value: 'none', label: '不加' },
    ], default: 'single' },
    { id: 'dedup', label: '去重', type: 'checkbox', default: false },
    { id: 'sort', label: '排序', type: 'checkbox', default: false },
  ],
  titleIn: '列表', titleOut: '转换结果', primary: '复制结果',
  sample: { text: '北京\n上海\n广州\n深圳\n北京', fmt: 'sql', quote: 'single', dedup: true, sort: false },
  compute(v) {
    let items = String(v.text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (v.dedup) items = [...new Set(items)];
    if (v.sort) items.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const q = v.quote === 'single' ? "'" : v.quote === 'double' ? '"' : '';
    const wrap = (x) => q + String(x).replace(new RegExp(q, 'g'), '\\' + q) + q;
    let out = '';
    switch (v.fmt) {
      case 'comma': out = items.map(wrap).join(', '); break;
      case 'sql': out = `IN (${items.map(wrap).join(', ')})`; break;
      case 'js': out = `[${items.map(wrap).join(', ')}]`; break;
      case 'json': out = JSON.stringify(items, null, 2); break;
      case 'quoted': out = items.map(wrap).join('\n'); break;
      default: out = items.join('\n');
    }
    return { text: out, copy: out, stats: [{ label: '条数', value: items.length }] };
  },
});
