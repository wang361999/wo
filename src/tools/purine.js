/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "食物嘌呤查询",
  "placeholder": "搜 啤酒 / 香菇 / 鸡胸 / 浓肉汤 / 鸡蛋",
  "columns": [
    {
      "label": "食物"
    },
    {
      "label": "嘌呤 mg/100g"
    },
    {
      "label": "档位"
    },
    {
      "label": "建议"
    }
  ],
  "rows": D.purine,
  "filters": [
    {
      "label": "档位",
      "values": [
        "全部",
        "低",
        "中",
        "中高",
        "高",
        "极高"
      ],
      "col": 2
    }
  ],
  "note": "数值为常见参考区间，不同检测口径会浮动；痛风急性期请遵医嘱，酒精与含糖饮料对尿酸的影响不只看嘌呤。"
});
