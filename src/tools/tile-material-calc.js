/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "铺贴参数",
  "titleOut": "瓷砖用量",
  "fields": [
    {
      "id": "where",
      "label": "铺在哪",
      "type": "select",
      "options": [
        "地砖（按地面面积）",
        "墙砖（按周长×高）"
      ]
    },
    {
      "id": "len",
      "label": "房间长",
      "type": "number",
      "default": 5,
      "unit": "米（墙砖按长）"
    },
    {
      "id": "wid",
      "label": "房间宽",
      "type": "number",
      "default": 4,
      "unit": "米（墙砖按宽）"
    },
    {
      "id": "height",
      "label": "墙砖铺贴高度",
      "type": "number",
      "default": 2.4,
      "unit": "米"
    },
    {
      "id": "size",
      "label": "砖规格",
      "type": "select",
      "options": [
        "300×300mm",
        "600×600mm",
        "800×800mm",
        "300×600mm",
        "600×1200mm"
      ]
    },
    {
      "id": "hole",
      "label": "门窗扣减面积",
      "type": "number",
      "default": 2,
      "unit": "㎡"
    },
    {
      "id": "loss",
      "label": "损耗率",
      "type": "number",
      "default": 8,
      "unit": "%"
    }
  ],
  "primary": "复制结果",
  "hintOut": "地砖按长×宽，墙砖按周长×高，都扣掉门窗；异形切割多的把损耗调到 10%。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const gross = v.where.startsWith('地砖') ? v.len * v.wid : (v.len + v.wid) * 2 * v.height;
    const area = Math.max(0, gross - v.hole);
    const [a, b] = v.size.split('×').map((x) => Number(String(x).replace('mm', '')) / 1000);
    const one = a * b, net = Math.ceil(area / Math.max(0.0001, one)), buy = Math.ceil(net * (1 + v.loss / 100));
    const text = [`${L.esc(v.where)}：毛面积 ${F(gross)} ㎡，扣门窗 ${F(v.hole)} ㎡ → 净面积 ${F(area)} ㎡`, `砖规格 ${L.esc(v.size)}（${F(one, 4)} ㎡/片）`, `净需 ${net} 片`, `含 ${v.loss}% 损耗：建议采购 ${buy} 片`, `约 ${F(buy * one)} ㎡（含损耗）`, '提示：大砖上墙要加背胶与瓷砖胶，损耗和人工都更高'].join('\n');
    return { text, copy: text, stats: [{ label: '净面积', value: F(area) + ' ㎡' }, { label: '净需', value: net + ' 片' }, { label: '建议采购', value: buy + ' 片' }] };
  }
});
