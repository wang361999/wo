import { formTool, esc } from '/kit.js';
const money = (n) => Number(n.toFixed(2)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default formTool({
  fields: [
    { id: 'principal', label: '初始本金', type: 'number', default: 100000, unit: '元' },
    { id: 'rate', label: '年化收益率', type: 'number', default: 5, unit: '%' },
    { id: 'years', label: '年数', type: 'number', default: 10, unit: '年' },
    { id: 'monthly', label: '每月定投', type: 'number', default: 1000, unit: '元' },
    { id: 'inflation', label: '通胀率（折算实际购买力）', type: 'number', default: 0, unit: '%' },
  ],
  titleIn: '参数', titleOut: '复利结果', primary: '复制结果',
  sample: { principal: 100000, rate: 5, years: 10, monthly: 1000, inflation: 2 },
  compute(v) {
    const p = Number(v.principal) || 0, r = (Number(v.rate) || 0) / 100, y = Math.min(60, Math.max(1, Math.round(Number(v.years) || 1)));
    const m = Number(v.monthly) || 0, inf = (Number(v.inflation) || 0) / 100;
    const rows = []; let bal = p;
    for (let yr = 1; yr <= y; yr++) {
      for (let i = 0; i < 12; i++) bal = bal * (1 + r / 12) + m;
      rows.push({ yr, bal, in: p + m * 12 * yr });
    }
    const final = rows[rows.length - 1].bal;
    const invested = p + m * 12 * y;
    const real = final / Math.pow(1 + inf, y);
    const lines = [
      `期末总额：${money(final)} 元`,
      `累计投入：${money(invested)} 元`,
      `收益：${money(final - invested)} 元（${((final / invested - 1) * 100).toFixed(2)}%）`,
    ];
    if (inf > 0) lines.push(`折通胀后实际购买力：${money(real)} 元（按 ${v.inflation}% / 年）`);
    const table = `<table class="t-table"><thead><tr><th>年</th><th>累计投入</th><th>期末金额</th></tr></thead><tbody>` +
      rows.filter((_, i) => i < 12 || i === rows.length - 1).map((x) =>
        `<tr><td class="num">${x.yr}</td><td>${money(x.in)}</td><td>${money(x.bal)}</td></tr>`).join('') + '</tbody></table>';
    return { text: lines.join('\n') + '\n\n' + rows.map((x) => `第${x.yr}年：${money(x.bal)}`).join('\n'),
      copy: lines.join('\n'),
      preview: table,
      stats: [
        { label: '期末总额', value: money(final) }, { label: '累计投入', value: money(invested) },
        { label: '收益率', value: ((final / invested - 1) * 100).toFixed(1) + '%' },
      ] };
  },
});
