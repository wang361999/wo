/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "SVG 代码",
  "titleOut": "预览与输出",
  "wide": false,
  "fields": [
    {
      "id": "code",
      "label": "SVG",
      "type": "textarea",
      "rows": 9,
      "default": "<svg viewBox=\"0 0 200 120\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"10\" y=\"10\" width=\"180\" height=\"100\" rx=\"12\" fill=\"#f2eee5\" stroke=\"#b4552d\" stroke-width=\"3\"/><circle cx=\"100\" cy=\"60\" r=\"28\" fill=\"#b4552d\"/><text x=\"100\" y=\"66\" text-anchor=\"middle\" fill=\"#fff\" font-size=\"14\">SVG</text></svg>"
    },
    {
      "id": "mode",
      "label": "操作",
      "type": "select",
      "options": [
        "预览",
        "压缩（SVGO 轻量版）",
        "转 Data URI",
        "转 Base64"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "代码↔预览实时同步；压缩会去掉注释、多余空白与 metadata，不会改图形；也可把 SVG 转成 data URI 直接塞进 CSS/HTML。",
  "compute": (v) => {
    const code = String(v.code || '').trim();
    if (!code) return { text: '' };
    if (v.mode === '压缩（SVGO 轻量版）') {
      const mini = code.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[^>]*\?>/gi, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/\s*=\s*/g, '=').trim();
      return { text: mini, preview: mini, stats: [{ label: '原', value: code.length }, { label: '压缩后', value: mini.length }, { label: '省', value: (100 - mini.length / code.length * 100).toFixed(1) + '%' }] };
    }
    if (v.mode === '转 Data URI') { const s = `data:image/svg+xml,${encodeURIComponent(code)}`; return { text: s, preview: `<img src="${L.esc(s)}" style="max-height:220px">`, stats: [{ label: '长度', value: s.length }] }; }
    if (v.mode === '转 Base64') { const s = L.b64(code); return { text: s, preview: `<img src="data:image/svg+xml;base64,${s}" style="max-height:220px">`, stats: [{ label: '长度', value: s.length }] }; }
    return { preview: code, text: code, copy: code, stats: [{ label: '长度', value: code.length }] };
  }
});
