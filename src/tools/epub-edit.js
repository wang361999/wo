/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "EPUB",
  "titleOut": "章节编辑",
  "accept": ".epub",
  "multiple": false,
  "primary": "打开章节",
  "auto": false,
  "dropTitle": "拖 EPUB 进来",
  "fields": [
    {
      "id": "sel",
      "label": "章节序号（从 1 开始，改完点「写回并下载」）",
      "type": "number",
      "default": 1
    },
    {
      "id": "body",
      "label": "正文（纯文本，一行一段）",
      "type": "textarea",
      "rows": 10,
      "default": ""
    }
  ],
  "note": "按章节序号读出正文，改完写回对应 XHTML 并重新打包；查找替换可用右上角按钮。样式与目录不变。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 EPUB' };
    const JSZip = await vendor('zip');
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const names = Object.keys(zip.files).filter((n) => /\.(x?html|htm)$/i.test(n) && !/toc|nav/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const idx = L.clamp((Number(v.sel) || 1) - 1, 0, names.length - 1);
    const html = await zip.file(names[idx]).async('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('h1,h2,h3,title')?.textContent.trim() || names[idx];
    const orig = (doc.body?.textContent || '').split(/\n{1,}/).map((x) => x.trim()).filter(Boolean).join('\n');
    if (v.body && v.body.trim() && v.body.trim() !== orig) {
      const paras = L.nonEmptyLines(v.body).map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n');
      const fresh = `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${L.esc(title)}</title></head><body><h2>${L.esc(title)}</h2>${paras}</body></html>`;
      zip.file(names[idx], fresh);
      const data = new Uint8Array(await zip.generateAsync({ type: 'uint8array', mimeType: 'application/epub+zip' }));
      return { text: `已写回第 ${idx + 1} 章「${title}」，共 ${L.nonEmptyLines(v.body).length} 段。`,
        files: [{ name: f.name.replace(/\.epub$/i, '') + '-编辑.epub', data, mime: 'application/epub+zip', label: '下载改好的 EPUB' }],
        stats: [{ label: '章节总数', value: names.length }, { label: '当前', value: idx + 1 }] };
    }
    return { text: `第 ${idx + 1} / ${names.length} 章「${title}」的正文已填入左侧编辑框（${orig.length} 字）。改完把「正文」框内容换掉，再点一次「打开章节」即可写回下载。`,
      preview: `<p class="t-hint">${L.esc(orig.slice(0, 800))}</p>`,
      stats: [{ label: '章节总数', value: names.length }, { label: '当前', value: idx + 1 }, { label: '字数', value: orig.length }] };
  }
});
