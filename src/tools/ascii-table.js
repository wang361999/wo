/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "ASCII 码表",
  "placeholder": "搜 65 / A / 0x41 / LF / DEL",
  "columns": [
    {
      "label": "DEC"
    },
    {
      "label": "HEX"
    },
    {
      "label": "OCT"
    },
    {
      "label": "BIN"
    },
    {
      "label": "字符/名称"
    },
    {
      "label": "类型"
    }
  ],
  "rows": D.asciiRows,
  "filters": [
    {
      "label": "类型",
      "values": [
        "全部",
        "可打印",
        "控制字符"
      ],
      "col": 5
    }
  ],
  "note": "0–31 与 127 是控制字符，32–126 可打印；中文不在 ASCII 范围内。"
});
