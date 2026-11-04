/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "文本与方向",
  "titleOut": "转换结果",
  "wide": true,
  "fields": [
    {
      "id": "text",
      "label": "文本",
      "type": "textarea",
      "rows": 6,
      "default": "简体中文转繁体，工具箱里有好多实用的小工具。"
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "简体 → 繁体",
        "繁体 → 简体"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "用内置简繁单字对照表逐字转换，覆盖常见字。它是「一对一字表」，做不了「一简对多繁」（如 发→發/髮、里→裡/裏）的按词判断，也不区分台湾/香港字形标准。出版、正式文书请人工校对。",
  "compute": (v) => {
    const out = L.zhConv(v.text, v.dir.startsWith('简') ? 's2t' : 't2s');
    const chars = Array.from(String(v.text)), changed = chars.filter((c, i) => c !== Array.from(out)[i]).length;
    const text = [`${L.esc(v.dir)}`, '', out, '', `共 ${chars.length} 字，转换了 ${changed} 字`].join('\n');
    return { text, copy: out, stats: [{ label: '总字数', value: chars.length + ' 字' }, { label: '已转换', value: changed + ' 字' }],
      preview: `<p class="t-hint">逐字对照（前 40 字）</p><table class="t-table"><thead><tr><th>原</th><th>转</th></tr></thead><tbody>${chars.slice(0, 40).map((c, i) => `<tr><td>${L.esc(c)}</td><td>${L.esc(Array.from(out)[i] || '')}</td></tr>`).join('')}</tbody></table>` };
  }
});
