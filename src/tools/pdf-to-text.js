/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "文字",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "提取文字",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "range",
      "label": "页码范围（留空全部）",
      "type": "text",
      "default": ""
    },
    {
      "id": "fmt",
      "label": "输出",
      "type": "select",
      "options": [
        "TXT",
        "Markdown（启发式标题）"
      ]
    },
    {
      "id": "pageMark",
      "label": "标注页码",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 取的是 PDF 里的文字层；纯扫描件（图片）没有文字层，请先用 OCR 工具识别。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const pdf = await pdfOpen(await f.arrayBuffer());
    let pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const t = String(v.range || '').trim();
    if (t) { pages = []; for (const seg of t.split(/[,，]/)) { const m = seg.match(/^(\d+)(?:-(\d+))?$/); if (m) { for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) pages.push(i); } } }
    pages = pages.filter((n) => n >= 1 && n <= pdf.numPages).slice(0, 200);
    const chunks = [];
    for (const n of pages) {
      const tc = await (await pdf.getPage(n)).getTextContent();
      const lines = []; let lastY = null, cur = '';
      for (const it of tc.items) { const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 4) { lines.push(cur.trim()); cur = ''; } cur += it.str; lastY = y; }
      if (cur.trim()) lines.push(cur.trim());
      const body = lines.map((l) => {
        if (v.fmt.startsWith('Markdown') && /^(第[一二三四五六七八九十\d]+[章节部分篇]|[一二三四五六七八九十]+、|\d+[\.、]\s*\S{2,30})$/.test(l) && l.length < 40) return `\n## ${l}\n`;
        return l;
      }).join('\n');
      chunks.push(v.pageMark ? `【第 ${n} 页】\n${body}` : body);
    }
    const text = chunks.join('\n\n');
    const ext = v.fmt.startsWith('Markdown') ? 'md' : 'txt';
    return { text: text.slice(0, 20000) + (text.length > 20000 ? '\n…（预览截断，下载文件是全文）' : ''), copy: text,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '.' + ext, data: L.utf8(text), mime: 'text/plain', label: '下载全文' }],
      stats: [{ label: '总页', value: pdf.numPages }, { label: '提取', value: pages.length }, { label: '字符', value: text.length }] };
  }
});
