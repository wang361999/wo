/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "现有贷款与提前还款",
  "titleOut": "省息对比",
  "fields": [
    {
      "id": "rest",
      "label": "当前剩余本金",
      "type": "number",
      "default": 800000,
      "unit": "元"
    },
    {
      "id": "rate",
      "label": "年利率",
      "type": "number",
      "default": 3.1,
      "unit": "%"
    },
    {
      "id": "months",
      "label": "剩余期数",
      "type": "number",
      "default": 240,
      "unit": "月"
    },
    {
      "id": "pay",
      "label": "当前月供",
      "type": "number",
      "default": 4300,
      "unit": "元（可留 0 自动算）"
    },
    {
      "id": "prepay",
      "label": "计划提前还款",
      "type": "number",
      "default": 200000,
      "unit": "元"
    },
    {
      "id": "way",
      "label": "方式",
      "type": "select",
      "options": [
        "缩短年限（月供不变）",
        "减少月供（年限不变）"
      ]
    }
  ],
  "primary": "复制对比结果",
  "hintOut": "按等额本息、无违约金测算。实际以银行重新签的还款计划为准；部分银行对提前还款有次数或金额门槛。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = v.rest, n = Math.max(1, Math.round(v.months)), r = v.rate / 1200;
    const M = v.pay > 0 ? v.pay : L.pmt(P, v.rate, n);
    const A = Math.min(v.prepay, P);
    const oldTotal = M * n;
    let newPay = M, newN = n, newTotal = A + M * n, save = 0, detail = '';
    if (v.way.startsWith('缩短')) {
      if (r === 0) newN = Math.max(1, Math.ceil((P - A) / M));
      else { const x = 1 - (P - A) * r / M; newN = x <= 0 ? 1 : Math.ceil(-Math.log(x) / Math.log(1 + r)); }
      newN = Math.min(n, newN);
      newTotal = A + M * newN;
      save = oldTotal - newTotal;
      detail = `月供仍是 ${F(M)} 元，期数从 ${n} 期缩短到 ${newN} 期（少还 ${n - newN} 期，约 ${F((n - newN) / 12, 1)} 年）。`;
    } else {
      newPay = L.pmt(P - A, v.rate, n);
      newTotal = A + newPay * n;
      save = oldTotal - newTotal;
      detail = `期数仍是 ${n} 期，月供从 ${F(M)} 元降到 ${F(newPay)} 元（每月少还 ${F(M - newPay)} 元）。`;
    }
    const text = [
      `原方案：剩余 ${n} 期 × ${F(M)} 元 = ${F(oldTotal)} 元`,
      `提前还款：${F(A)} 元（${L.esc(v.way)}）`,
      detail,
      `新方案总支出：${F(newTotal)} 元（含本次提前还款）`,
      `预计省息：${F(save)} 元`,
    ].join('\n');
    const E2 = L.esc;
    return { text, copy: text,
      stats: [{ label: '预计省息', value: F(save) + ' 元' }, { label: '新月供', value: F(newPay) + ' 元' }, { label: '新期数', value: newN + ' 期' }],
      preview: `<p class="t-hint">${L.esc(detail)} 省息是「少付的利息」的近似值，未计最后一期尾差与违约金。</p>` };
  }
});
