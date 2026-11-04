import { formTool } from '/kit.js';
const f = (n) => (Math.round(n * 100) / 100).toLocaleString('zh-CN');
export default formTool({
  fields: [
    { id: 'value', label: '温度', type: 'number', default: 25, step: '0.1' },
    { id: 'from', label: '输入单位', type: 'chips', options: [
      { value: 'c', label: '摄氏 ℃' }, { value: 'f', label: '华氏 ℉' }, { value: 'k', label: '开尔文 K' },
    ], default: 'c' },
  ],
  titleIn: '输入', titleOut: '三种温标', primary: '复制结果',
  sample: { value: 100, from: 'c' },
  compute(v) {
    const n = Number(v.value);
    if (!Number.isFinite(n)) return { error: '请填数字。' };
    let c = n;
    if (v.from === 'f') c = (n - 32) * 5 / 9;
    if (v.from === 'k') c = n - 273.15;
    const fah = c * 9 / 5 + 32, kel = c + 273.15;
    const refs = [['水结冰', 0], ['人体体温', 36.5], ['室温', 25], ['水沸腾', 100], ['烤箱', 200]];
    const text = [
      `摄氏：${f(c)} ℃`, `华氏：${f(fah)} ℉`, `开尔文：${f(kel)} K`, '',
      '常见对照：', ...refs.map(([k, x]) => `  ${k}　${x} ℃ = ${f(x * 9 / 5 + 32)} ℉`),
    ].join('\n');
    return { text, copy: text, stats: [
      { label: '摄氏', value: f(c) + '℃' }, { label: '华氏', value: f(fah) + '℉' }, { label: '开尔文', value: f(kel) + 'K' },
    ] };
  },
});
