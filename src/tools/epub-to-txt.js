/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "EPUB",
  "titleOut": "纯文本",
  "accept": ".epub",
  "multiple": true,
  "primary": "提取文本",
  "auto": false,
  "dropTitle": "拖 EPUB 进来（可多本）",
  "fields": [
    {
      "id": "chap",
      "label": "保留章节标题",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "bom",
      "label": "加 UTF-8 BOM（方便 Windows 记事本）",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "按 spine / 文件名顺序读取 XHTML，保留章节分段；不会动原文件。",
  "process": async (files, v, ctx) => {
    const JSZip = await vendor('zip'); const outs = [], previews = [];
    for (const f of files) {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const names = Object.keys(zip.files).filter((n) => /\.(x?html|htm)$/i.test(n) && !/toc|nav/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      let out = `# ${f.name.replace(/\.epub$/i, '')}\n\n`;
      for (const n of names.slice(0, 400)) {
        const html = await zip.file(n).async('string');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('h1,h2,h3,title')?.textContent.trim();
        const text = (doc.body?.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        if (!text || text.length < 3) continue;
        out += (v.chap && title ? `\n\n${title}\n\n` : '\n') + text + '\n';
      }
      outs.push({ name: f.name.replace(/\.epub$/i, '') + '.txt', data: L.utf8((v.bom ? '\ufeff' : '') + out), mime: 'text/plain' });
      previews.push(`${f.name}：${names.length} 个文档，${out.length} 字`);
    }
    return { text: previews.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0]?.data || '').slice(0, 1000),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部文本.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '本数', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  }
});
