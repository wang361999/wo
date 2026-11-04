/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "带宽与文件",
  "titleOut": "换算结果",
  "fields": [
    {
      "id": "mbps",
      "label": "带宽",
      "unit": "Mbps",
      "type": "number",
      "default": 100
    },
    {
      "id": "size",
      "label": "文件大小",
      "unit": "GB",
      "type": "number",
      "default": 2.5
    },
    {
      "id": "ratio",
      "label": "实际能达到的比例",
      "unit": "%",
      "type": "number",
      "default": 80
    }
  ],
  "primary": "复制结果",
  "hintOut": "运营商说的是兆比特（Mb），下载软件常显示兆字节（MB），差 8 倍；这里按你填的达成比例算真实速度。",
  "compute": (v) => {
    const m = Number(v.mbps), g = Number(v.size), r = Number(v.ratio) / 100;
    if (!m || g <= 0) return { error: '带宽与文件大小都要填正数' };
    const mb = m / 8 * r, sec = g * 1024 / mb;
    const human = sec < 60 ? `${Math.ceil(sec)} 秒` : sec < 3600 ? `${Math.round(sec / 60)} 分钟` : `${(sec / 3600).toFixed(1)} 小时`;
    const levels = [10, 30, 50, 100, 200, 500, 1000].map((x) => [x + ' Mbps', (x / 8).toFixed(1) + ' MB/s', (g * 1024 / (x / 8 * r) / 60).toFixed(1) + ' 分钟']);
    return { html: `<table class="t-table"><thead><tr><th>带宽档</th><th>理论速度</th><th>下完 ${g} GB</th></tr></thead><tbody>${levels.map((r2) => `<tr><td>${r2[0]}</td><td class="num">${r2[1]}</td><td class="num">${r2[2]}</td></tr>`).join('')}</tbody></table>`,
      text: '', copy: levels.map((x) => x.join('\t')).join('\n'), stats: [{ label: '实际速度', value: mb.toFixed(1) + ' MB/s' }, { label: '耗时', value: human }, { label: '1 GB', value: (1024 / mb).toFixed(0) + ' 秒' }] };
  }
});
