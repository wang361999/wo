/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "蒲福风级对照",
  "placeholder": "搜 台风 / 8 级 / 微风 / 风速",
  "columns": [
    {
      "label": "风级"
    },
    {
      "label": "名称"
    },
    {
      "label": "风速 m/s"
    },
    {
      "label": "陆上现象"
    },
    {
      "label": "浪高 m"
    }
  ],
  "rows": D.wind,
  "note": "0–12 级为蒲福风级，13–17 级是台风补充分级。输入风速可在「风力换算」里自动判级。"
});
