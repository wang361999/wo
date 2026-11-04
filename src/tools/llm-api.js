/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "大模型 API 速查",
  "placeholder": "搜 DeepSeek / Claude / Gemini / 通义 / 本地",
  "columns": [
    {
      "label": "厂商"
    },
    {
      "label": "代表模型"
    },
    {
      "label": "Base URL"
    },
    {
      "label": "环境变量"
    }
  ],
  "rows": D.llm,
  "note": "接口地址与模型名会随厂商更新，以官方文档为准；密钥只放在你自己的环境里。"
});
