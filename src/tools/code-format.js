/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "代码",
  "titleOut": "格式化结果",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "粘贴代码",
      "type": "textarea",
      "rows": 10,
      "default": "function foo(a,b){return{a:a,b:b}}"
    },
    {
      "id": "lang",
      "label": "语言",
      "type": "select",
      "options": [
        "自动识别",
        "JSON",
        "JavaScript",
        "HTML",
        "CSS",
        "SQL",
        "XML"
      ]
    },
    {
      "id": "indent",
      "label": "缩进空格数",
      "type": "number",
      "default": 2
    }
  ],
  "primary": "复制结果",
  "hintOut": "轻量格式化：JSON 严格走 JSON.stringify；JS/CSS 做括号与分号换行 + 缩进；HTML/XML 按标签层级排版；SQL 按关键字断行。不是 Prettier，复杂语法请配合专业格式化器。",
  "compute": (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    const ind = ' '.repeat(L.clamp(Number(v.indent) || 2, 1, 8));
    let lang = v.lang;
    if (lang === '自动识别') lang = /^[\[{]/.test(t) ? 'JSON' : /^\s*<(?!\?)/.test(t) ? (/<(html|div|body|head|p|span|section)/i.test(t) ? 'HTML' : 'XML') : /\b(SELECT|INSERT|UPDATE|CREATE|FROM|WHERE)\b/i.test(t) ? 'SQL' : /[{};]\s*$/.test(t) ? 'JavaScript' : 'CSS';
    try {
      if (lang === 'JSON') return { text: JSON.stringify(JSON.parse(t), null, Number(v.indent) || 2), stats: [{ label: '语言', value: lang }] };
      if (lang === 'JavaScript' || lang === 'CSS') {
        let out = '', level = 0;
        const spaced = t.replace(/\s+/g, ' ').replace(/([{};])/g, ' $1 ').replace(/,\s*/g, ', ').trim();
        for (const tok of spaced.split(/\s+/)) {
          if (tok === '}') level = Math.max(0, level - 1);
          if (tok === '{' || tok === ';') { out = out.replace(/\s+$/, ''); out += tok === '{' ? ' {\n' : ';\n'; if (tok === '{') level++; out += ind.repeat(level); }
          else out += tok + ' ';
          if (tok === '}') { out = out.replace(/\s+$/, ''); out += '\n' + ind.repeat(level); }
        }
        return { text: out.trim(), stats: [{ label: '语言', value: lang }] };
      }
      if (lang === 'HTML' || lang === 'XML') {
        let out = '', level = 0;
        for (const m of t.matchAll(/(<[^>]+>|[^<]+)/g)) {
          const s = m[0].trim(); if (!s) continue;
          if (/^<\//.test(s)) level = Math.max(0, level - 1);
          out += ind.repeat(level) + s + '\n';
          if (/^<[^/!?][^>]*[^/]?>$/.test(s) && !/^<(br|img|input|meta|link|hr)/i.test(s)) level++;
        }
        return { text: out.trim(), stats: [{ label: '语言', value: lang }] };
      }
      if (lang === 'SQL') {
        const out = t.replace(/\s+/g, ' ').replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|JOIN|LEFT JOIN|INNER JOIN|ON|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|DROP TABLE|UNION)\b/gi, '\n$1').replace(/,\s*/g, ',\n  ').trim();
        return { text: out, stats: [{ label: '语言', value: lang }] };
      }
    } catch (e) { return { error: '格式化失败：' + e.message }; }
    return { text: t };
  }
});
