/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "家庭账本",
  "titleOut": "现金流体检",
  "wide": true,
  "fields": [
    {
      "id": "rows",
      "label": "每行：项目,金额,类型,月现金流",
      "type": "textarea",
      "rows": 8,
      "default": "自住房,2000000,资产,0\n出租房,1200000,资产,3500\n指数基金,300000,资产,0\n房贷,900000,负债,-4300\n车贷,80000,负债,-2000\n银行存款,200000,资产,300"
    },
    {
      "id": "expense",
      "label": "每月生活支出",
      "type": "number",
      "default": 8000,
      "unit": "元"
    }
  ],
  "primary": "复制体检结果",
  "hintOut": "借用「现金流象限」口径：能往口袋里放钱的算资产，往外掏钱的算负债。自住房不产生租金就归在「不生息资产」里单列。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const items = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', amt: Number(p[1]) || 0, type: p[2] || '资产', cf: Number(p[3]) || 0 }; });
    if (!items.length) return { error: '至少填一行：项目,金额,类型,月现金流' };
    const assets = items.filter((x) => x.type.includes('资产')), debts = items.filter((x) => x.type.includes('负债'));
    const A = assets.reduce((a, x) => a + x.amt, 0), D = debts.reduce((a, x) => a + Math.abs(x.amt), 0);
    const passive = items.reduce((a, x) => a + (x.cf > 0 ? x.cf : 0), 0), outflow = items.reduce((a, x) => a + (x.cf < 0 ? -x.cf : 0), 0);
    const netCF = passive - outflow, cover = (outflow + v.expense) > 0 ? passive / (outflow + v.expense) * 100 : 0;
    const idle = assets.filter((x) => x.cf <= 0).reduce((a, x) => a + x.amt, 0);
    const text = [`总资产 ${F(A)} 元，总负债 ${F(D)} 元，净资产 ${F(A - D)} 元`, `负债率：${F(D / Math.max(1, A) * 100, 1)}%`, `每月被动收入 ${F(passive)} 元，每月刚性流出 ${F(outflow + v.expense)} 元`, `月净现金流：${F(netCF)} 元`, `被动收入覆盖率：${F(cover, 1)}%${cover >= 100 ? '（已覆盖，财务自由口径达成）' : ''}`, `不生息资产（自住/闲置）${F(idle)} 元，占总资产 ${F(idle / Math.max(1, A) * 100, 1)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '净资产', value: F(A - D) + ' 元' }, { label: '月净现金流', value: F(netCF) + ' 元' }, { label: '覆盖率', value: F(cover, 1) + '%' }],
      preview: `<p class="t-hint">${L.esc('分类：')}${assets.map((x) => L.esc(x.name) + (x.cf > 0 ? '（生息）' : '（不生息）')).join('、')}</p>` };
  }
});
