/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "公共 NTP 时间源",
  "placeholder": "搜阿里 / 腾讯 / 国家授时中心 / NTS",
  "columns": [
    {
      "label": "提供方"
    },
    {
      "label": "主地址"
    },
    {
      "label": "备用地址"
    },
    {
      "label": "说明"
    }
  ],
  "rows": D.ntp,
  "note": "服务器对时建议配 3 个以上不同来源；Google 用 leap-smear，跨厂混用前先确认口径。"
});
