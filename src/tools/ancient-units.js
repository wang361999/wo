/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "古代度量衡换算",
  "placeholder": "搜 唐 / 尺 / 斤 / 里 / 升 / 清",
  "columns": [
    {
      "label": "朝代"
    },
    {
      "label": "单位"
    },
    {
      "label": "折今制"
    },
    {
      "label": "今制单位"
    }
  ],
  "rows": D.ancient,
  "note": "历代度量衡并不统一，同一朝代不同时期也有变化；读史时按当朝口径折算，别直接套现代单位。"
});
