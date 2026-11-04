/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "墙面参数",
  "titleOut": "涂料用量",
  "fields": [
    {
      "id": "len",
      "label": "房间长",
      "type": "number",
      "default": 5,
      "unit": "米"
    },
    {
      "id": "wid",
      "label": "房间宽",
      "type": "number",
      "default": 4,
      "unit": "米"
    },
    {
      "id": "height",
      "label": "层高",
      "type": "number",
      "default": 2.7,
      "unit": "米"
    },
    {
      "id": "ceil",
      "label": "是否刷顶面",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "hole",
      "label": "门窗扣减",
      "type": "number",
      "default": 5,
      "unit": "㎡"
    },
    {
      "id": "coats",
      "label": "涂刷遍数",
      "type": "number",
      "default": 2,
      "unit": "遍"
    },
    {
      "id": "cover",
      "label": "每升可刷",
      "type": "number",
      "default": 10,
      "unit": "㎡/遍"
    },
    {
      "id": "bucket",
      "label": "每桶容量",
      "type": "number",
      "default": 5,
      "unit": "L"
    }
  ],
  "primary": "复制结果",
  "hintOut": "乳胶漆一般一底两面；覆盖率看桶身标注（常见 10–14 ㎡/L/遍），粗糙墙面会多吃料。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const wall = (v.len + v.wid) * 2 * v.height, top = v.ceil ? v.len * v.wid : 0;
    const area = Math.max(0, wall + top - v.hole), liters = area * v.coats / Math.max(0.1, v.cover), buckets = Math.ceil(liters / Math.max(0.1, v.bucket));
    const text = [`墙面 ${F(wall)} ㎡${v.ceil ? ` + 顶面 ${F(top)} ㎡` : ''} − 门窗 ${F(v.hole)} ㎡ = ${F(area)} ㎡`, `涂 ${v.coats} 遍，按 ${v.cover} ㎡/L/遍`, `需涂料约 ${F(liters)} L`, `按每桶 ${v.bucket} L：约 ${buckets} 桶`, '提示：深色漆、新墙未上底漆、滚涂损耗都会让实际用量上浮 10–20%'].join('\n');
    return { text, copy: text, stats: [{ label: '涂刷面积', value: F(area) + ' ㎡' }, { label: '需涂料', value: F(liters) + ' L' }, { label: '桶数', value: buckets + ' 桶' }] };
  }
});
