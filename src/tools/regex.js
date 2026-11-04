/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "正则与文本",
  "titleOut": "匹配结果",
  "wide": false,
  "fields": [
    {
      "id": "p",
      "label": "表达式（不含斜杠）",
      "type": "text",
      "default": "(\\w+)@(\\w+)\\.(\\w+)"
    },
    {
      "id": "flags",
      "label": "标志",
      "type": "select",
      "options": [
        "g",
        "gi",
        "gim",
        "gimsu",
        "i",
        ""
      ]
    },
    {
      "id": "txt",
      "label": "测试文本",
      "type": "textarea",
      "rows": 7,
      "default": "联系我：hello@example.com 或 admin@test.cn"
    },
    {
      "id": "rep",
      "label": "替换模板（可选）",
      "type": "text",
      "default": "$1 [at] $2"
    }
  ],
  "primary": "复制匹配",
  "hintOut": "实时高亮、分组捕获与替换预览；正则只在本机执行，不会把文本发出去。",
  "compute": (v) => {
    let re; try { re = new RegExp(v.p, v.flags.replace(/[^gimsuyd]/g, '')); } catch (e) { return { error: '正则写错了：' + e.message }; }
    const t = String(v.txt || '');
    const ms = []; let m, guard = 0;
    const g = re.flags.includes('g');
    while ((m = re.exec(t)) !== null && guard++ < 5000) { ms.push({ index: m.index, text: m[0], groups: m.slice(1), named: m.groups || {} }); if (!g) break; if (!m[0]) re.lastIndex++; }
    let hi = '', last = 0;
    for (const x of ms.slice(0, 200)) { hi += L.esc(t.slice(last, x.index)) + `<mark style="background:#f6e2b8;padding:0 2px;border-radius:3px">${L.esc(x.text)}</mark>`; last = x.index + x.text.length; }
    hi += L.esc(t.slice(last));
    const rep = v.rep ? t.replace(new RegExp(v.p, re.flags.includes('g') ? re.flags : re.flags + 'g'), v.rep) : '';
    const table = ms.length ? `<table class="t-table" style="margin-top:12px"><thead><tr><th>#</th><th>位置</th><th>匹配</th><th>分组</th></tr></thead><tbody>${ms.slice(0, 60).map((x, i) => `<tr><td class="num">${i + 1}</td><td class="num">${x.index}</td><td>${L.esc(x.text)}</td><td>${L.esc(x.groups.join(' | '))}</td></tr>`).join('')}</tbody></table>` : '';
    return { html: `<div style="line-height:1.9;white-space:pre-wrap;word-break:break-all">${hi}</div>${rep ? `<p class="t-label" style="margin-top:14px">替换预览</p><div class="t-out" style="white-space:pre-wrap">${L.esc(rep)}</div>` : ''}${table}`,
      copy: ms.map((x, i) => `${i + 1}\t${x.index}\t${x.text}\t${x.groups.join(' | ')}`).join('\n'),
      stats: [{ label: '匹配', value: ms.length }, { label: '分组', value: ms[0]?.groups.length || 0 }] };
  }
});
