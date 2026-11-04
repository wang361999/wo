/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default refTool({
  "title": "公共 DNS 速查",
  "placeholder": "搜阿里 / Cloudflare / IPv6 / DoH",
  "columns": [
    {
      "label": "服务商"
    },
    {
      "label": "IPv4 主"
    },
    {
      "label": "IPv4 备"
    },
    {
      "label": "IPv6"
    },
    {
      "label": "DoH 地址"
    }
  ],
  "rows": D.dns,
  "note": "境内访问建议用阿里 / DNSPod / 114；DoH 需要在浏览器或系统里单独配置。"
});
