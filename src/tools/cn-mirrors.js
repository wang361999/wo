/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "国内镜像源速查",
  "placeholder": "搜 pip / npm / Ubuntu / Docker / Maven…",
  "columns": [
    {
      "label": "工具"
    },
    {
      "label": "镜像方"
    },
    {
      "label": "地址"
    },
    {
      "label": "怎么配"
    }
  ],
  "rows": D.mirrors,
  "note": "地址可直接复制；配置命令写在第四列。镜像同步有延迟，遇到缺包可换回官方源。"
});
