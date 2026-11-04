/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "脚长与人群",
  "titleOut": "五国鞋码",
  "fields": [
    {
      "id": "cm",
      "label": "脚长",
      "unit": "cm",
      "type": "number",
      "default": 25
    },
    {
      "id": "who",
      "label": "人群",
      "type": "select",
      "options": [
        "成人",
        "儿童（比成人小 1.5 码）"
      ]
    }
  ],
  "primary": "复制结果",
  "sample": {
    "cm": 25,
    "who": "成人"
  },
  "hintOut": "对照表按常见欧码换算，不同品牌楦型会差半码；量脚长请靠墙站立，取最长脚趾到脚跟。",
  "compute": (v) => {
    const cm = Number(v.cm);
    if (!cm || cm < 10 || cm > 35) return { error: '脚长填 10–35 cm' };
    const shift = v.who.startsWith('儿童') ? 1.5 : 0;
    const near = L.D.shoe.reduce((a, b) => Math.abs(Number(b[0]) - cm) < Math.abs(Number(a[0]) - cm) ? b : a);
    const eu = Math.round(Number(near[1]) - shift);
    const rows = [['中国/欧码', String(eu)], ['美码 US', (Number(near[2]) - shift).toFixed(1)], ['英码 UK', (Number(near[3]) - shift).toFixed(1)], ['日码 JP', (Number(near[4]) - shift).toFixed(1)], ['脚长', cm + ' cm']];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '建议码', value: 'EU ' + eu }, { label: '脚长', value: cm + 'cm' }] };
  }
});
