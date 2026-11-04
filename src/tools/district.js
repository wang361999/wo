/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "行政区代码速查",
  "placeholder": "搜 广东 / 11 / 浙江 / 香港",
  "columns": [
    {
      "label": "省级代码"
    },
    {
      "label": "省 / 特别行政区"
    }
  ],
  "rows": D.phoneRegionRows,
  "note": "身份证前两位、行政区划代码前两位都用这张表；完整省市区级联需要更完整的区划库。"
});
