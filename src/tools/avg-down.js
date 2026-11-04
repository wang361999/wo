/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "持仓与补仓",
  "titleOut": "摊薄测算",
  "fields": [
    {
      "id": "shares",
      "label": "已持股数",
      "type": "number",
      "default": 1000,
      "unit": "股"
    },
    {
      "id": "cost",
      "label": "成本价",
      "type": "number",
      "default": 20,
      "unit": "元"
    },
    {
      "id": "now",
      "label": "当前价",
      "type": "number",
      "default": 14,
      "unit": "元"
    },
    {
      "id": "addPrice",
      "label": "补仓价",
      "type": "number",
      "default": 12,
      "unit": "元"
    },
    {
      "id": "addShares",
      "label": "补仓股数",
      "type": "number",
      "default": 1000,
      "unit": "股"
    },
    {
      "id": "target",
      "label": "想摊到的目标价",
      "type": "number",
      "default": 16,
      "unit": "元（用于反推）"
    }
  ],
  "primary": "复制测算",
  "hintOut": "补仓摊薄成本，但不改变浮亏的事实。反推只是数学结果，不构成任何投资建议。",
  "compute": (v) => {
    const F = (n, d = 3) => L.fmt(L.round(n, d), d);
    const oldCost = v.shares * v.cost, addCost = v.addShares * v.addPrice;
    const total = v.shares + v.addShares, avg = total > 0 ? (oldCost + addCost) / total : 0;
    const before = v.cost, float = (v.now - avg) * total, rise = avg > 0 ? (avg / v.now - 1) * 100 : 0;
    const need = v.addPrice < v.target && v.target < v.cost ? Math.ceil((v.shares * (v.cost - v.target)) / (v.target - v.addPrice)) : null;
    const text = [`补仓前：${F(v.shares, 0)} 股 @ ${F(v.cost)}，成本 ${F(oldCost)} 元`, `补仓：${F(v.addShares, 0)} 股 @ ${F(v.addPrice)}，投入 ${F(addCost)} 元`, `补仓后：${F(total, 0)} 股，摊薄均价 ${F(avg)} 元（原 ${F(before)} 元）`, `按现价 ${F(v.now)} 元，浮动盈亏 ${F(float)} 元`, `从现价回到均价还需涨 ${F(rise, 2)}%`, need === null ? `目标价 ${F(v.target)} 需在 ${F(v.addPrice)}~${F(v.cost)} 之间才能反推` : `想摊到 ${F(v.target)} 元，需再补约 ${F(need, 0)} 股（约 ${F(need * v.addPrice)} 元）`].join('\n');
    return { text, copy: text, stats: [{ label: '摊薄均价', value: F(avg) + ' 元' }, { label: '回本涨幅', value: F(rise, 2) + '%' }, { label: '浮动盈亏', value: F(float) + ' 元' }],
      preview: `<p class="t-hint">摊薄会把浮亏从 ${F((v.now - v.cost) * v.shares)} 元摊到 ${F(float)} 元，只是分母变大，不是亏损变少。</p>` };
  }
});
