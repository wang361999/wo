/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "车价与贷款",
  "titleOut": "月供与明细",
  "fields": [
    {
      "id": "price",
      "label": "车价（裸车）",
      "type": "number",
      "default": 150000,
      "unit": "元"
    },
    {
      "id": "down",
      "label": "首付比例",
      "type": "number",
      "default": 30,
      "unit": "%"
    },
    {
      "id": "rate",
      "label": "年利率",
      "type": "number",
      "default": 4.5,
      "unit": "%"
    },
    {
      "id": "months",
      "label": "期数",
      "type": "number",
      "default": 36,
      "unit": "月"
    },
    {
      "id": "fee",
      "label": "手续费 / 服务费",
      "type": "number",
      "default": 0,
      "unit": "元"
    }
  ],
  "primary": "复制明细",
  "hintOut": "等额本息口径。厂家「零利率」常把利息转成手续费，把手续费填进去才能和全款比真实成本。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = Math.max(0, v.price * (1 - v.down / 100)), n = Math.max(1, Math.round(v.months));
    const s = L.loanSchedule(P, v.rate, n, 'equal');
    const all = v.price + v.fee + s.totalInterest;
    const tbl = `<table class="t-table"><thead><tr><th>期</th><th>月供</th><th>利息</th><th>本金</th><th>剩余</th></tr></thead><tbody>${s.rows.slice(0, 12).map((x) => `<tr><td>${x.i}</td><td>${F(x.pay)}</td><td>${F(x.interest)}</td><td>${F(x.principalPart)}</td><td>${F(x.rest)}</td></tr>`).join('')}</tbody></table>`;
    const text = [`首付：${F(v.price * v.down / 100)} 元，贷款：${F(P)} 元`, `月供：${F(s.monthly)} 元 × ${n} 期`, `总利息：${F(s.totalInterest)} 元`, `手续费：${F(v.fee)} 元`, `落地合计：${F(all)} 元`, `比全款多花：${F(s.totalInterest + v.fee)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '月供', value: F(s.monthly) + ' 元' }, { label: '总利息', value: F(s.totalInterest) + ' 元' }, { label: '落地合计', value: F(all) + ' 元' }], preview: '<p class="t-hint">前 12 期明细（元）</p>' + tbl };
  }
});
