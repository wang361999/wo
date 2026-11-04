/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "条码内容",
  "titleOut": "条形码",
  "wide": false,
  "fields": [
    {
      "id": "text",
      "label": "内容",
      "type": "text",
      "default": "6901234567892"
    },
    {
      "id": "format",
      "label": "码制",
      "type": "select",
      "options": [
        "CODE128",
        "EAN13",
        "EAN8",
        "UPC",
        "ITF14",
        "CODE39",
        "MSI",
        "pharmacode"
      ]
    },
    {
      "id": "w",
      "label": "条宽",
      "type": "number",
      "default": 2
    },
    {
      "id": "h",
      "label": "高度",
      "type": "number",
      "default": 90
    },
    {
      "id": "color",
      "label": "条色",
      "type": "color",
      "default": "#2f2b26"
    },
    {
      "id": "bg",
      "label": "底色",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "JsBarcode 本地打包；EAN13 / UPC 需要正确位数的数字，校验位会自动算。",
  "compute": async (v) => {
    const t = String(v.text || '').trim(); if (!t) return { error: '内容不能为空' };
    let svg; try { svg = await barcodeSvg(t, { format: v.format, color: v.color, bg: v.bg, w: L.clamp(Number(v.w) || 2, 1, 6), h: L.clamp(Number(v.h) || 90, 30, 200) }); }
    catch (e) { return { error: '生成失败：' + e.message + '（检查码制要求的数据位数）' }; }
    const png = await svgToPng(svg);
    return { preview: svg, copy: svg, text: `${v.format} · ${t}`, stats: [{ label: '码制', value: v.format }, { label: '字符', value: t.length }],
      actions: [{ label: '下载 PNG', run: (vv, c) => c.download('条形码.png', png, 'image/png') }] };
  }
});
