/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "借款与报价",
  "titleOut": "真实成本",
  "fields": [
    {
      "id": "amount",
      "label": "借款金额",
      "type": "number",
      "default": 20000,
      "unit": "元"
    },
    {
      "id": "quote",
      "label": "对方怎么报的价",
      "type": "select",
      "options": [
        "月利率 %",
        "日利率 ‰",
        "名义年利率 %",
        "每期手续费 %"
      ]
    },
    {
      "id": "q",
      "label": "报价数值",
      "type": "number",
      "default": 0.6,
      "unit": "按上面单位"
    },
    {
      "id": "months",
      "label": "期数",
      "type": "number",
      "default": 12,
      "unit": "月"
    },
    {
      "id": "fee",
      "label": "一次性手续费",
      "type": "number",
      "default": 0,
      "unit": "元"
    },
    {
      "id": "repay",
      "label": "还款方式",
      "type": "select",
      "options": [
        "等额本息",
        "等额本金",
        "先息后本"
      ]
    }
  ],
  "primary": "复制真实年利率",
  "hintOut": "用现金流 IRR 反推真实年利率（APR）。「日息万五」「月费 0.6%」听着少，年化往往 13% 以上。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = v.amount, n = Math.max(1, Math.round(v.months));
    let monthlyRate = 0, per = 0;
    if (v.quote === '月利率 %') monthlyRate = v.q / 100;
    else if (v.quote === '日利率 ‰') monthlyRate = v.q / 1000 * 30;
    else if (v.quote === '名义年利率 %') monthlyRate = v.q / 1200;
    else monthlyRate = v.q / 100;
    let flows;
    if (v.repay === '先息后本') { per = P * monthlyRate; flows = [P - v.fee, ...Array.from({ length: n - 1 }, () => -per), -per - P]; }
    else if (v.repay === '等额本金') { flows = [P - v.fee]; let rest = P; for (let i = 1; i <= n; i++) { const pay = P / n + rest * monthlyRate; rest -= P / n; flows.push(-pay); } }
    else { per = L.pmt(P, monthlyRate * 1200, n); flows = [P - v.fee, ...Array.from({ length: n }, () => -per)]; }
    const m = L.irr(flows, 0.01);
    const apr = (Math.pow(1 + m, 12) - 1) * 100;
    const totalPay = flows.slice(1).reduce((a, b) => a - b, 0) + v.fee;
    const text = [`到手金额：${F(P - v.fee)} 元（已扣一次性手续费 ${F(v.fee)} 元）`, `每期约还：${F(per || P / n + P * monthlyRate)} 元`, `累计还款：${F(totalPay)} 元`, `名义报价：${v.q} ${L.esc(v.quote)}，折算名义年化 ${F(monthlyRate * 1200)}%`, `真实年利率（IRR/APR）：${F(apr)}%`, `利息与费用合计：${F(totalPay - P)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '真实年利率', value: F(apr) + '%' }, { label: '名义年化', value: F(monthlyRate * 1200) + '%' }, { label: '多付', value: F(totalPay - P) + ' 元' }],
      preview: `<p class="t-hint">真实年利率按每期现金流折现反推，包含手续费与「本金逐月减少但利息按全额收」的效应。口径为 APR，不是含复利的 APY。</p>` };
  }
});
