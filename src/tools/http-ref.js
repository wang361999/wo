/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "HTTP 状态码 / MIME 速查",
  "placeholder": "搜 404 / 502 / json / png / 缓存",
  "columns": [
    {
      "label": "类别"
    },
    {
      "label": "代码/扩展名"
    },
    {
      "label": "英文/类型"
    },
    {
      "label": "中文释义"
    },
    {
      "label": "备注"
    }
  ],
  "rows": D.httpRef,
  "filters": [
    {
      "label": "类别",
      "values": [
        "全部",
        "状态码",
        "MIME"
      ],
      "col": 0
    }
  ],
  "note": "状态码按 1xx–5xx 分段；MIME 可用扩展名反查 Content-Type。"
});
