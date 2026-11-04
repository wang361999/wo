import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'mode', label: '算式', type: 'select', default: 'ratio', options: [
      { value: 'ratio', label: 'A 占 B 的百分之几' },
      { value: 'of', label: 'B 的 A% 是多少' },
      { value: 'change', label: '从 A 变到 B，涨跌幅' },
      { value: 'add', label: 'A 增加 B% 后是多少' },
      { value: 'sub', label: 'A 减少 B% 后是多少' },
      { value: 'reverse', label: 'A 是某数的 B%，求原数' },
    ] },
    { id: 'a', label: '数值 A', type: 'number', default: 25 },
    { id: 'b', label: '数值 B / 百分比', type: 'number', default: 200 },
  ],
  titleIn: '选算式并填数', titleOut: '结果', primary: '复制结果',
  sample: { mode: 'change', a: 80, b: 100 },
  compute(v) {
    const a = Number(v.a), b = Number(v.b);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { error: '请填数字。' };
    const pct = (x) => (x * 100).toFixed(2) + '%';
    const money = (x) => Number(x.toFixed(4)).toLocaleString('zh-CN');
    let title = '', val, lines = [];
    switch (v.mode) {
      case 'ratio': if (!b) return { error: 'B 不能为 0' }; title = '占比'; val = pct(a / b); lines.push(`${a} ÷ ${b} = ${(a / b).toFixed(6)}`); break;
      case 'of': title = '结果'; val = money(a * b / 100); lines.push(`${b} × ${a}% = ${val}`); break;
      case 'change': if (!a) return { error: 'A 不能为 0' }; title = '涨跌幅'; val = pct((b - a) / a); lines.push(`(${b} − ${a}) ÷ ${a} = ${val}`, b >= a ? '上升' : '下降'); break;
      case 'add': title = '增加后'; val = money(a * (1 + b / 100)); lines.push(`${a} × (1 + ${b}%) = ${val}`, `增加量：${money(a * b / 100)}`); break;
      case 'sub': title = '减少后'; val = money(a * (1 - b / 100)); lines.push(`${a} × (1 − ${b}%) = ${val}`, `减少量：${money(a * b / 100)}`); break;
      case 'reverse': if (!b) return { error: '百分比不能为 0' }; title = '原数'; val = money(a / (b / 100)); lines.push(`${a} ÷ ${b}% = ${val}`); break;
    }
    const text = `${title}：${val}\n` + lines.join('\n') + '\n\n※ 百分比是比例，百分点是两个百分比相减的差，别混用。';
    return { text, copy: text, stats: [{ label: title, value: val }] };
  },
});
