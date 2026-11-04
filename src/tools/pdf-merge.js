/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "多个 PDF",
  "titleOut": "合并结果",
  "accept": "application/pdf,.pdf",
  "multiple": true,
  "primary": "合并下载",
  "auto": false,
  "dropTitle": "拖多个 PDF 进来，按文件名顺序合并",
  "fields": [
    {
      "id": "order",
      "label": "顺序（填文件名关键词，逗号分隔；留空按拖入顺序）",
      "type": "text",
      "default": ""
    },
    {
      "id": "bookmark",
      "label": "给每段加书签（用文件名）",
      "type": "checkbox",
      "default": false
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 拖拽后可在下面列表里看到顺序；加密 PDF 需先解密。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '至少选两个 PDF' };
    const { PDFDocument } = await vendor('pdf');
    let list = files;
    const keys = L.nonEmptyLines(String(v.order || '').replace(/,/g, '\n'));
    if (keys.length) list = [...files].sort((a, b) => {
      const ia = keys.findIndex((k) => a.name.includes(k)), ib = keys.findIndex((k) => b.name.includes(k));
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    const out = await PDFDocument.create(); let total = 0;
    for (const f of list) {
      const src = await PDFDocument.load(await f.arrayBuffer());
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p)); total += pages.length;
    }
    const bytes = await out.save();
    return { text: `已按以下顺序合并：\n${list.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}\n\n共 ${total} 页。`, copy: list.map((f) => f.name).join('\n'),
      files: [{ name: '合并结果.pdf', data: bytes, mime: 'application/pdf', label: '下载合并 PDF' }],
      stats: [{ label: '文件', value: list.length }, { label: '页数', value: total }, { label: '大小', value: L.humanSize(bytes.length) }] };
  }
});
