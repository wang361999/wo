/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "中签号与配号",
  "titleOut": "中签结果",
  "fields": [
    {
      "id": "win",
      "label": "公布的中签号（逗号/换行分隔）",
      "type": "textarea",
      "rows": 5,
      "default": "1234567, 2345678, 3456789"
    },
    {
      "id": "start",
      "label": "你的配号起始",
      "type": "text",
      "default": "1234560"
    },
    {
      "id": "count",
      "label": "你的配号数量",
      "type": "number",
      "default": 20,
      "unit": "个"
    },
    {
      "id": "shares",
      "label": "每签股数",
      "type": "number",
      "default": 500,
      "unit": "股"
    },
    {
      "id": "price",
      "label": "发行价",
      "type": "number",
      "default": 15,
      "unit": "元"
    }
  ],
  "primary": "复制中签结果",
  "hintOut": "逐个配号与中签号按「末 N 位」比对（N 取最短中签号长度）。中签号末几位相同即算中签，不用手动数。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const wins = String(v.win || '').split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
    if (!wins.length) return { error: '先粘公布的中签号' };
    const len = Math.min(...wins.map((x) => x.length));
    const tail = (x) => String(x).slice(-len);
    const winSet = new Set(wins.map(tail));
    const s = BigInt(String(v.start).trim() || '0'), n = Math.max(0, Math.min(100000, Math.round(v.count)));
    const hit = [];
    for (let i = 0; i < n; i++) { const num = (s + BigInt(i)).toString(); if (winSet.has(tail(num))) hit.push(num); }
    const text = [`中签号 ${wins.length} 个，按末 ${len} 位比对`, `你的配号：${s.toString()} ~ ${(s + BigInt(Math.max(0, n - 1))).toString()}（共 ${n} 个）`, hit.length ? `中签 ${hit.length} 签：${hit.join('、')}` : '未中签', `中签股数：${F(hit.length * v.shares, 0)} 股`, `需缴款：${F(hit.length * v.shares * v.price)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '中签', value: hit.length + ' 签' }, { label: '股数', value: F(hit.length * v.shares, 0) + ' 股' }, { label: '缴款', value: F(hit.length * v.shares * v.price) + ' 元' }],
      preview: `<p class="t-hint">配号是连续整数序列；可转债每签 10 张（1000 元），把「每签股数」改成 10、发行价改成 100 即可复用。</p>` };
  }
});
