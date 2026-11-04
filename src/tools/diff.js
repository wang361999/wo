/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "两份文本",
  "titleOut": "逐行差异",
  "wide": false,
  "fields": [
    {
      "id": "a",
      "label": "原文 A",
      "type": "textarea",
      "rows": 8,
      "default": "第一行\n第二行\n第三行"
    },
    {
      "id": "b",
      "label": "改后 B",
      "type": "textarea",
      "rows": 8,
      "default": "第一行\n第二行改了\n第三行\n第四行"
    }
  ],
  "primary": "复制 diff",
  "hintOut": "LCS 逐行对比；绿色是新增，红色是删除，也可切逐词模式。",
  "compute": (v) => {
    const d = L.diffLines(String(v.a || ''), String(v.b || ''));
    const add = d.filter((x) => x.startsWith('+')).length, del = d.filter((x) => x.startsWith('-')).length;
    const html = `<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.8;max-height:400px;overflow:auto">${d.map((l) => {
      const c = l[0] === '+' ? '#e6f2e6;color:#2f6b3a' : l[0] === '-' ? '#fae9e6;color:#a03b30' : 'transparent';
      return `<div style="background:${c};padding:0 7px;white-space:pre-wrap">${L.esc(l)}</div>`;
    }).join('')}</div>`;
    return { html, copy: d.join('\n'), stats: [{ label: '新增', value: add }, { label: '删除', value: del }, { label: '未变', value: d.length - add - del }] };
  }
});
