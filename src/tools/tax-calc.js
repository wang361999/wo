/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "收入与扣除",
  "titleOut": "个税测算",
  "fields": [
    {
      "id": "monthly",
      "label": "税前月薪",
      "type": "number",
      "default": 20000,
      "unit": "元"
    },
    {
      "id": "si",
      "label": "五险一金个人部分/月",
      "type": "number",
      "default": 3000,
      "unit": "元"
    },
    {
      "id": "special",
      "label": "专项附加扣除/月",
      "type": "number",
      "default": 2000,
      "unit": "元"
    },
    {
      "id": "bonus",
      "label": "年终奖",
      "type": "number",
      "default": 60000,
      "unit": "元"
    }
  ],
  "primary": "复制测算",
  "hintOut": "综合所得按年累计预扣法简化为「月薪×12」；年终奖给「单独计税」与「并入综合所得」两种口径对比。专项附加扣除为内置表，实际以 App 填报为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const r = L.incomeTax(v.monthly, 5000 + v.si, v.special, v.bonus);
    const merged = L.incomeTax(v.monthly + v.bonus / 12, 5000 + v.si, v.special, 0);
    const text = [`应纳税所得额（月）：${F(r.taxable)} 元`, `适用税率：${F(r.rate * 100, 0)}%，速算扣除数按内置级距`, `月薪个税（月）：${F(r.monthlyTax)} 元，全年 ${F(r.yearlyTax)} 元`, `年终奖单独计税：${F(r.bonusTax)} 元`, `年终奖并入综合所得：全年个税 ${F(merged.yearlyTax)} 元（比单独计税的合计 ${F(r.yearlyTax + r.bonusTax)} 元）`, `结论：${r.yearlyTax + r.bonusTax <= merged.yearlyTax ? '单独计税更省' : '并入综合所得更省'}，差额约 ${F(Math.abs(merged.yearlyTax - r.yearlyTax - r.bonusTax))} 元`, `年到手（不含年终奖）：${F((v.monthly - r.monthlyTax - v.si) * 12)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '月个税', value: F(r.monthlyTax) + ' 元' }, { label: '年终奖税', value: F(r.bonusTax) + ' 元' }, { label: '年到手', value: F((v.monthly - r.monthlyTax - v.si) * 12) + ' 元' }],
      preview: `<p class="t-hint">级距来自内置精简表（${L.esc(String(D.tax.length))} 档）。年终奖单独计税政策与专项附加扣除标准会调整，报税以税务机关口径为准。</p>` };
  }
});
