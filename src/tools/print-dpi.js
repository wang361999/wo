/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "像素与纸张",
  "titleOut": "印刷尺寸",
  "fields": [
    {
      "id": "px",
      "label": "像素（宽或高）",
      "type": "number",
      "default": 2480
    },
    {
      "id": "dpi",
      "label": "输出 DPI",
      "type": "number",
      "default": 300,
      "unit": "点/英寸"
    },
    {
      "id": "paper",
      "label": "纸张",
      "type": "select",
      "options": [
        "A4 210×297mm",
        "A3 297×420mm",
        "A5 148×210mm",
        "名片 90×54mm",
        "6 寸照片 152×102mm"
      ]
    },
    {
      "id": "bleed",
      "label": "出血",
      "type": "number",
      "default": 3,
      "unit": "mm"
    }
  ],
  "primary": "复制结果",
  "hintOut": "毫米 = 像素 ÷ DPI × 25.4。300 DPI 是印刷常用精度，喷绘/大画幅可降到 72–150 DPI。pt 与 pica 是排版单位（1pt = 1/72 英寸）。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const mm = v.px / Math.max(1, v.dpi) * 25.4;
    const P = { 'A4 210×297mm': [210, 297], 'A3 297×420mm': [297, 420], 'A5 148×210mm': [148, 210], '名片 90×54mm': [90, 54], '6 寸照片 152×102mm': [152, 102] }[v.paper];
    const full = P.map((x) => Math.round((x + v.bleed * 2) / 25.4 * v.dpi));
    const text = [`${F(v.px, 0)} px @ ${F(v.dpi, 0)} DPI = ${F(mm)} mm`, `反过来：1 mm = ${F(v.dpi / 25.4, 2)} px`, `${L.esc(v.paper)} 整页像素：${Math.round(P[0] / 25.4 * v.dpi)} × ${Math.round(P[1] / 25.4 * v.dpi)} px`, `含 ${v.bleed}mm 出血：${full[0]} × ${full[1]} px（成品尺寸 ${P[0]}×${P[1]}mm + 四周各 ${v.bleed}mm）`, `${F(mm)} mm = ${F(mm * 2.83465, 2)} pt = ${F(mm / 4.2333, 3)} pica`, '提示：屏幕上看着清晰不等于能印，关键是像素总量 ÷ 实际印出来的尺寸'].join('\n');
    return { text, copy: text, stats: [{ label: '对应毫米', value: F(mm) + ' mm' }, { label: '整页宽', value: Math.round(P[0] / 25.4 * v.dpi) + ' px' }, { label: 'pt', value: F(mm * 2.83465) }] };
  }
});
