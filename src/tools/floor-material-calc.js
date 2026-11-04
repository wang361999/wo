/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "房间与地板",
  "titleOut": "用量估算",
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
      "id": "pl",
      "label": "单块地板长",
      "type": "number",
      "default": 1.2,
      "unit": "米"
    },
    {
      "id": "pw",
      "label": "单块地板宽",
      "type": "number",
      "default": 0.15,
      "unit": "米"
    },
    {
      "id": "loss",
      "label": "损耗率",
      "type": "number",
      "default": 8,
      "unit": "%"
    },
    {
      "id": "perBox",
      "label": "每包片数",
      "type": "number",
      "default": 10,
      "unit": "片"
    }
  ],
  "primary": "复制结果",
  "hintOut": "按面积除以单块面积估块数，再加损耗。人字拼/斜铺损耗要提到 10–15%，异形房间另算。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const area = v.len * v.wid, one = v.pl * v.pw;
    const net = Math.ceil(area / Math.max(0.0001, one)), buy = Math.ceil(net * (1 + v.loss / 100)), boxes = Math.ceil(buy / Math.max(1, v.perBox));
    const text = [`房间面积：${F(area)} ㎡（${F(v.len)} × ${F(v.wid)} m）`, `单块面积：${F(one, 4)} ㎡`, `净需 ${net} 片`, `含 ${v.loss}% 损耗：建议采购 ${buy} 片`, `按每包 ${v.perBox} 片：约 ${boxes} 包`, `含损耗铺装面积：${F(buy * one)} ㎡`].join('\n');
    return { text, copy: text, stats: [{ label: '净需', value: net + ' 片' }, { label: '建议采购', value: buy + ' 片' }, { label: '包数', value: boxes + ' 包' }] };
  }
});
