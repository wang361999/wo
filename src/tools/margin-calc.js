/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "任填两个",
  "titleOut": "四向互算",
  "fields": [
    {
      "id": "cost",
      "label": "成本（0 表示不填）",
      "type": "number",
      "default": 60,
      "unit": "元"
    },
    {
      "id": "price",
      "label": "售价（0 表示不填）",
      "type": "number",
      "default": 100,
      "unit": "元"
    },
    {
      "id": "margin",
      "label": "毛利率（0 表示不填）",
      "type": "number",
      "default": 0,
      "unit": "%"
    },
    {
      "id": "markup",
      "label": "加价率（0 表示不填）",
      "type": "number",
      "default": 0,
      "unit": "%"
    },
    {
      "id": "fee",
      "label": "平台扣点",
      "type": "number",
      "default": 0,
      "unit": "%"
    }
  ],
  "primary": "复制结果",
  "hintOut": "毛利率 = 毛利 ÷ 售价；加价率 = 毛利 ÷ 成本。两者容易混：成本 60 卖 100，毛利率 40%，加价率却是 66.7%。任填两个，其余自动推。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let c = v.cost, p = v.price, m = v.margin / 100, k = v.markup / 100;
    if (c > 0 && p > 0) { m = (p - c) / p; k = (p - c) / c; }
    else if (c > 0 && m > 0) { p = c / (1 - m); k = m / (1 - m); }
    else if (c > 0 && k > 0) { p = c * (1 + k); m = (p - c) / p; }
    else if (p > 0 && m > 0) { c = p * (1 - m); k = (p - c) / c; }
    else if (p > 0 && k > 0) { c = p / (1 + k); m = (p - c) / p; }
    else return { error: '至少填「成本 + 售价」或「任一项 + 毛利率/加价率」中的两个' };
    if (!isFinite(p) || !isFinite(c)) return { error: '填的数值推不出结果（毛利率不能 ≥100%）' };
    const gross = p - c, after = p * (1 - v.fee / 100) - c;
    const text = [`成本 ${F(c)} 元，售价 ${F(p)} 元`, `毛利 ${F(gross)} 元`, `毛利率 ${F(m * 100)}%，加价率 ${F(k * 100)}%`, v.fee > 0 ? `扣 ${v.fee}% 平台点后实收 ${F(p * (1 - v.fee / 100))} 元，实际毛利 ${F(after)} 元（${F(after / p * 100)}%）` : '未计平台扣点', `保本售价（含扣点）：${F(c / (1 - v.fee / 100))} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '毛利率', value: F(m * 100) + '%' }, { label: '加价率', value: F(k * 100) + '%' }, { label: '实际毛利', value: F(after) + ' 元' }] };
  }
});
