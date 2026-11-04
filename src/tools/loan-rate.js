/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "还款计划",
  "titleOut": "反推利率",
  "fields": [
    {
      "id": "got",
      "label": "实际到手",
      "type": "number",
      "default": 10000,
      "unit": "元"
    },
    {
      "id": "per",
      "label": "每期还款",
      "type": "number",
      "default": 900,
      "unit": "元"
    },
    {
      "id": "n",
      "label": "期数",
      "type": "number",
      "default": 12,
      "unit": "期"
    },
    {
      "id": "perMonths",
      "label": "每期间隔",
      "type": "select",
      "options": [
        "1 个月",
        "7 天",
        "1 年"
      ]
    }
  ],
  "primary": "复制利率结果",
  "hintOut": "只要知道「到手多少、每期还多少、还几期」，就能反推真实利率。 auto 贷款、分期、民间借贷都适用。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const n = Math.max(1, Math.round(v.n));
    const flows = [v.got, ...Array.from({ length: n }, () => -v.per)];
    const r = L.irr(flows, 0.02);
    const perYear = v.perMonths.startsWith('7') ? 365 / 7 : v.perMonths.startsWith('1 年') ? 1 : 12;
    const apr = (Math.pow(1 + r, perYear) - 1) * 100;
    const text = [`到手 ${F(v.got)} 元，${n} 期 × ${F(v.per)} 元，共还 ${F(v.per * n)} 元`, `每期利率：${F(r * 100)}%`, `折算年化（APR）：${F(apr)}%`, `总利息：${F(v.per * n - v.got)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '每期利率', value: F(r * 100) + '%' }, { label: '年化 APR', value: F(apr) + '%' }, { label: '总利息', value: F(v.per * n - v.got) + ' 元' }],
      preview: `<p class="t-hint">年化 = (1+每期利率)^每年期数 − 1。若期数小于 2 或利率不收敛，结果可能异常。</p>` };
  }
});
