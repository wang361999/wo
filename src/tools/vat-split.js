import { formTool } from '/kit.js';
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtn = (n) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default formTool({
  fields: [
    { id: 'mode', label: '已知', type: 'chips', options: [
      { value: 'gross', label: '含税价' }, { value: 'net', label: '不含税价' },
    ], default: 'gross' },
    { id: 'amount', label: '金额', type: 'number', default: 113, unit: '元' },
    { id: 'rate', label: '税率', type: 'chips', options: [
      { value: '13', label: '13%' }, { value: '9', label: '9%' }, { value: '6', label: '6%' },
      { value: '5', label: '5%' }, { value: '3', label: '3%' }, { value: '1', label: '1%' }, { value: '0', label: '0%' },
    ], default: '13' },
  ],
  titleIn: '价税信息', titleOut: '分离结果', primary: '复制结果',
  sample: { mode: 'gross', amount: 113, rate: '13' },
  compute(v) {
    const a = Number(v.amount), r = Number(v.rate) / 100;
    if (!Number.isFinite(a) || a < 0) return { error: '请填有效金额。' };
    let gross, net, tax;
    if (v.mode === 'gross') { gross = r2(a); net = r2(a / (1 + r)); tax = r2(gross - net); }
    else { net = r2(a); tax = r2(a * r); gross = r2(net + tax); }
    const text = [
      `含税价（价税合计）：${fmtn(gross)} 元`,
      `不含税价：${fmtn(net)} 元`,
      `税额：${fmtn(tax)} 元`, '',
      `税率：${v.rate}%`,
      `验算：${fmtn(net)} + ${fmtn(tax)} = ${fmtn(r2(net + tax))} 元`,
      '※ 结果闭合到分；含税价反推时先算不含税价，再用差额求税额，避免乘除误差。',
    ].join('\n');
    return { text, copy: text, stats: [
      { label: '含税价', value: fmtn(gross) }, { label: '不含税', value: fmtn(net) }, { label: '税额', value: fmtn(tax) },
    ] };
  },
});
