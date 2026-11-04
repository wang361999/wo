/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "HTTP 头速查",
  "placeholder": "搜 CORS / 缓存 / CSP / Cookie / 代理",
  "columns": [
    {
      "label": "头字段"
    },
    {
      "label": "方向"
    },
    {
      "label": "中文释义"
    },
    {
      "label": "归类"
    }
  ],
  "rows": D.httpHeaders,
  "filters": [
    {
      "label": "归类",
      "values": [
        "全部",
        "请求",
        "响应",
        "通用",
        "CORS",
        "安全",
        "缓存",
        "代理"
      ],
      "col": 3
    }
  ],
  "note": "点任意一行复制该行；请求头由客户端发，响应头由服务端返回，通用头两边都能用。"
});
