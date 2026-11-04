/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "资产等级换算",
  "placeholder": "搜 A8 / 千万 / 亿 / A4",
  "columns": [
    {
      "label": "等级"
    },
    {
      "label": "人民币"
    },
    {
      "label": "数量级"
    },
    {
      "label": "备注"
    }
  ],
  "rows": D.assetLevel,
  "note": "A 后面的数字约等于以「元」计的十的幂；A8 即 1 亿。网络俗称，不是金融术语。"
});
