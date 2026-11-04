/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "正则语法速查",
  "placeholder": "搜 前瞻 / 分组 / 量词 / 手机号 / Unicode",
  "columns": [
    {
      "label": "写法"
    },
    {
      "label": "含义"
    },
    {
      "label": "说明 / 常用模式"
    }
  ],
  "rows": D.regexRef,
  "note": "JS 与 PCRE 差异：JS 的 \\w 默认不含中文，需要 u 标志配合 \\p{L}；后顾断言需较新浏览器。"
});
