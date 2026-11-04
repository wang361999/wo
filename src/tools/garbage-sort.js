/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "垃圾分类查询（上海口径）",
  "placeholder": "搜 电池 / 外卖盒 / 奶茶 / 旧衣服 / 大骨头",
  "columns": [
    {
      "label": "物品"
    },
    {
      "label": "分类"
    },
    {
      "label": "投放提示"
    }
  ],
  "rows": D.garbage,
  "filters": [
    {
      "label": "分类",
      "values": [
        "全部",
        "可回收物",
        "湿垃圾",
        "干垃圾",
        "有害垃圾"
      ],
      "col": 1
    }
  ],
  "note": "内置 80 余条常见物品。各地口径有差异，以当地公示为准；没搜到时按「干垃圾」兜底更稳妥。"
});
