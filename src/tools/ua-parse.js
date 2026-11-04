/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "User-Agent",
  "titleOut": "拆解结果",
  "fields": [
    {
      "id": "ua",
      "label": "UA 字符串",
      "type": "textarea",
      "rows": 4,
      "default": ""
    }
  ],
  "primary": "复制结果",
  "sample": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  },
  "hintOut": "留空则自动读取当前浏览器的 UA；Bot 识别覆盖常见爬虫关键字。",
  "compute": (v) => {
    const ua = String(v.ua || navigator.userAgent);
    const bots = ['bot', 'spider', 'crawl', 'slurp', 'curl', 'wget', 'python-requests', 'facebookexternalhit', 'headlesschrome'];
    const isBot = bots.some((b) => ua.toLowerCase().includes(b));
    const browsers = [['Edg/', 'Edge'], ['OPR/', 'Opera'], ['Firefox/', 'Firefox'], ['Chrome/', 'Chrome'], ['Version/.*Safari', 'Safari'], ['MSIE ', 'IE'], ['Trident/', 'IE 11']];
    const browser = browsers.find(([p]) => new RegExp(p).test(ua))?.[1] || '未知';
    const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows NT/.test(ua) ? 'Windows' : /iPhone|iPad|iPod/.test(ua) ? 'iOS ' + (ua.match(/OS (\d+[._]\d+)/) || [])[1]?.replace('_', '.') : /Android/.test(ua) ? 'Android ' + (ua.match(/Android ([\d.]+)/) || [])[1] : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '未知';
    const device = /iPad/.test(ua) ? '平板' : /iPhone|iPod|Android.*Mobile|Mobile/.test(ua) ? '手机' : '桌面';
    const engine = /AppleWebKit/.test(ua) ? 'WebKit/Blink' : /Gecko\//.test(ua) ? 'Gecko' : /Trident/.test(ua) ? 'Trident' : '未知';
    const ver = (ua.match(new RegExp(browser === 'Chrome' ? 'Chrome/([\\d.]+)' : browser === 'Firefox' ? 'Firefox/([\\d.]+)' : browser === 'Safari' ? 'Version/([\\d.]+)' : 'Edg/([\\d.]+)')) || [])[1] || '—';
    const rows = [['浏览器', browser + ' ' + ver], ['内核', engine], ['操作系统', os || '未知'], ['设备类型', device], ['是否 Bot', isBot ? '是（' + bots.find((b) => ua.toLowerCase().includes(b)) + '）' : '否'], ['原始 UA', ua]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td style="word-break:break-all">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '浏览器', value: browser }, { label: '设备', value: device }, { label: 'Bot', value: isBot ? '是' : '否' }] };
  }
});
