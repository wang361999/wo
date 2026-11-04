/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "本金与开销",
  "titleOut": "能撑多久",
  "fields": [
    {
      "id": "asset",
      "label": "本金",
      "type": "number",
      "default": 1000000,
      "unit": "元"
    },
    {
      "id": "spend",
      "label": "年消费",
      "type": "number",
      "default": 80000,
      "unit": "元"
    },
    {
      "id": "rate",
      "label": "年化收益",
      "type": "number",
      "default": 3,
      "unit": "%"
    },
    {
      "id": "infl",
      "label": "通胀",
      "type": "number",
      "default": 2.5,
      "unit": "%"
    }
  ],
  "primary": "复制结论",
  "hintOut": "逐年扣掉随通胀上涨的消费，看本金哪年归零。下方热力表是不同本金 × 不同年消费的支撑年数。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const years = (a, s) => { let x = a, y = 0; for (; y < 100; y++) { x = x * (1 + v.rate / 100) - s * Math.pow(1 + v.infl / 100, y); if (x <= 0) return y; } return '100+'; };
    const hit = years(v.asset, v.spend);
    const assets = [30, 50, 80, 100, 150, 200, 300, 500].map((x) => x * 10000);
    const spends = [4, 6, 8, 10, 12, 15, 20, 30, 50].map((x) => x * 10000);
    const tbl = `<table class="t-table"><thead><tr><th>本金＼年消费</th>${spends.map((s) => `<th>${F(s / 10000, 0)}万</th>`).join('')}</tr></thead><tbody>${assets.map((a) => `<tr><td>${F(a / 10000, 0)}万</td>${spends.map((s) => { const y = years(a, s); const bg = typeof y === 'number' ? (y >= 30 ? '#cfe3cf' : y >= 15 ? '#f0e2bd' : '#f2c9bd') : '#cfe3cf'; return `<td style="background:${bg};text-align:center">${y}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    const text = [`本金 ${F(v.asset)} 元，年消费 ${F(v.spend)} 元`, `收益 ${v.rate}% − 通胀 ${v.infl}%`, typeof hit === 'number' ? `大约能撑 ${hit} 年` : '按这组参数可支撑 100 年以上', `点热力表里的格子可回填对应本金与年消费`].join('\n');
    return { text, copy: text, stats: [{ label: '可支撑', value: (typeof hit === 'number' ? hit : '100+') + ' 年' }, { label: '实际收益率', value: F(v.rate - v.infl) + '%' }], preview: '<p class="t-hint">支撑年数速查（行=本金，列=年消费）</p>' + tbl };
  }
});
