/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "海外物价标尺",
  "placeholder": "搜 东京 / 巴黎 / 曼谷 / 纽约",
  "columns": [
    {
      "label": "城市"
    },
    {
      "label": "汉堡 ¥"
    },
    {
      "label": "咖啡 ¥"
    },
    {
      "label": "地铁 ¥"
    },
    {
      "label": "出租车 ¥"
    }
  ],
  "rows": D.travelPrice,
  "note": "四个锚点按常见游客消费折成人民币，用来快速判断「这地方贵不贵」；不是实时价格。"
});
