/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "坡度",
  "titleOut": "各口径换算",
  "fields": [
    {
      "id": "v",
      "label": "数值",
      "type": "number",
      "default": 8
    },
    {
      "id": "u",
      "label": "单位",
      "type": "select",
      "options": [
        "百分比 %",
        "角度 °",
        "比例 1:n（填 n）",
        "千分比 ‰"
      ]
    },
    {
      "id": "rise",
      "label": "高差（可选，算斜长）",
      "type": "number",
      "default": 0,
      "unit": "米"
    }
  ],
  "primary": "复制结果",
  "hintOut": "坡度百分比 = tan(角度) × 100%；1:n 是「升高 1 需水平走 n」。高差与斜长按勾股定理算。附常见场景限值。",
  "compute": (v) => {
    const F = (n, d = 3) => L.fmt(L.round(n, d), d);
    let pct, deg;
    if (v.u.startsWith('角度')) { deg = v.v; pct = Math.tan(deg * Math.PI / 180) * 100; }
    else if (v.u.startsWith('比例')) { pct = 100 / Math.max(0.0001, v.v); deg = Math.atan(pct / 100) * 180 / Math.PI; }
    else if (v.u.startsWith('千分')) { pct = v.v / 10; deg = Math.atan(pct / 100) * 180 / Math.PI; }
    else { pct = v.v; deg = Math.atan(pct / 100) * 180 / Math.PI; }
    const n = pct > 0 ? 100 / pct : Infinity;
    const run = v.rise > 0 && pct > 0 ? v.rise / (pct / 100) : 0, slant = Math.sqrt(run * run + v.rise * v.rise);
    const text = [`坡度百分比：${F(pct)}%`, `角度：${F(deg)}°`, `比例：1 : ${isFinite(n) ? F(n) : '∞（水平）'}`, `千分比：${F(pct * 10)}‰`, v.rise > 0 && pct > 0 ? `高差 ${F(v.rise)} m → 水平距离 ${F(run)} m，斜长 ${F(slant)} m` : '', '', '场景限值：无障碍坡道 ≤ 8.3%(1:12)；地下车库坡道 ≤ 15%；高速公路最大纵坡一般 ≤ 3–5%；山区公路可达 9%'].join('\n').trim();
    return { text, copy: text, stats: [{ label: '百分比', value: F(pct) + '%' }, { label: '角度', value: F(deg) + '°' }, { label: '比例', value: '1:' + F(n) }] };
  }
});
