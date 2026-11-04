/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "文件 / 压缩包",
  "titleOut": "命中",
  "multiple": true,
  "primary": "搜索",
  "auto": false,
  "dropTitle": "拖文本文件、ZIP 或 PDF 进来",
  "fields": [
    {
      "id": "q",
      "label": "关键词",
      "type": "text",
      "default": "工具"
    },
    {
      "id": "mode",
      "label": "匹配方式",
      "type": "select",
      "options": [
        "包含",
        "区分大小写",
        "全词",
        "正则"
      ]
    },
    {
      "id": "ctx",
      "label": "上下文行数",
      "type": "number",
      "default": 1
    }
  ],
  "note": "在 TXT / 代码 / CSV / 字幕里逐行找；ZIP 会解包后逐个文本找；PDF 用本地 pdf.js 提取文字后找。Word/Excel 请先另存为文本或 xlsx。",
  "process": async (files, v, ctx) => {
    const q = String(v.q || ''); if (!q) return { error: '先填关键词' };
    const test = (line) => {
      try {
        if (v.mode === '正则') return new RegExp(q, 'i').test(line);
        if (v.mode === '全词') return new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(line);
        return v.mode === '区分大小写' ? line.includes(q) : line.toLowerCase().includes(q.toLowerCase());
      } catch (e) { return false; }
    };
    const hits = []; let scanned = 0;
    for (const f of files) {
      const name = f.name.toLowerCase();
      let texts = [];
      if (name.endsWith('.zip')) {
        const JSZip = await vendor('zip'); const zip = await JSZip.loadAsync(await f.arrayBuffer());
        for (const e of Object.values(zip.files).filter((x) => !x.dir && /\.(txt|md|csv|json|js|ts|html|css|xml|srt|log|py|java|go|rb)$/i.test(x.name))) texts.push([`${f.name}!${e.name}`, await e.async('string')]);
      } else if (name.endsWith('.pdf')) {
        const pdfjs = await vendor('pdfjs'); const pdf = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        for (let p = 1; p <= Math.min(pdf.numPages, 80); p++) { const page = await pdf.getPage(p); const tc = await page.getTextContent(); texts.push([`${f.name} 第${p}页`, tc.items.map((i) => i.str).join(' ')]); }
      } else if (/\.(txt|md|csv|json|jsonl|js|ts|jsx|tsx|html|css|xml|srt|vtt|log|py|java|go|rb|sql|yml|yaml|ini|conf|sh|bat)$/i.test(name)) {
        texts.push([f.name, await L.readFile(f, 'text')]);
      } else continue;
      for (const [label, t] of texts) {
        scanned++;
        const ls = L.lines(t);
        ls.forEach((l, i) => { if (test(l)) { const c = Number(v.ctx) || 0; hits.push({ file: label, line: i + 1, before: ls.slice(Math.max(0, i - c), i), text: l, after: ls.slice(i + 1, i + 1 + c) }); } });
      }
    }
    const html = hits.slice(0, 150).map((h) => `<div style="padding:8px 0;border-bottom:1px solid var(--line-2)"><div style="font-size:11px;color:var(--ink-3)">${L.esc(h.file)} : ${h.line}</div>
      ${h.before.map((x) => `<div style="color:var(--ink-3);font-size:12px">${L.esc(x)}</div>`).join('')}
      <div style="font-size:13px"><mark style="background:#f6e2b8">${L.esc(h.text)}</mark></div>
      ${h.after.map((x) => `<div style="color:var(--ink-3);font-size:12px">${L.esc(x)}</div>`).join('')}</div>`).join('');
    return { html: html || '<p class="t-hint">没有命中。</p>', copy: hits.map((h) => `${h.file}:${h.line}\t${h.text}`).join('\n'),
      files: [{ name: '搜索结果.csv', data: L.utf8('\ufeff' + L.toCSV([['文件', '行号', '内容'], ...hits.map((h) => [h.file, h.line, h.text])])), mime: 'text/csv', label: '导出 CSV' }],
      stats: [{ label: '扫描文档', value: scanned }, { label: '命中', value: hits.length }] };
  }
});
