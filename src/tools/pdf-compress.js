/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF（扫描件效果最明显）",
  "titleOut": "压缩结果",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "压缩下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "q",
      "label": "质量档",
      "type": "select",
      "options": [
        "高（JPEG 0.85）",
        "中（0.65）",
        "低（0.45）",
        "极低（0.3）"
      ]
    },
    {
      "id": "scale",
      "label": "渲染倍率",
      "type": "select",
      "options": [
        "1×",
        "1.5×",
        "2×"
      ]
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 做法是把每页重渲染成 JPEG 再组装成新 PDF，对扫描件/图片型 PDF 瘦身明显；对纯文字 PDF 会丢掉文字层，请按需选择。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const q = { '高（JPEG 0.85）': 0.85, '中（0.65）': 0.65, '低（0.45）': 0.45, '极低（0.3）': 0.3 }[v.q] || 0.65;
    const scale = Number(String(v.scale).replace('×', '')) || 1.5;
    const pdf = await pdfOpen(await f.arrayBuffer());
    const { PDFDocument } = await vendor('pdf');
    const doc = await PDFDocument.create();
    for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
      const { canvas, viewport } = await pdfRenderPage(pdf, i, scale);
      const buf = await (await L.canvasBlob(canvas, 'image/jpeg', q)).arrayBuffer();
      const jpg = await doc.embedJpg(buf);
      const page = doc.addPage([viewport.width / scale, viewport.height / scale]);
      page.drawImage(jpg, { x: 0, y: 0, width: viewport.width / scale, height: viewport.height / scale });
    }
    const bytes = await doc.save();
    const ratio = (100 - bytes.length / f.size * 100).toFixed(1);
    return { text: `${f.name}：${L.humanSize(f.size)} → ${L.humanSize(bytes.length)}（${Number(ratio) >= 0 ? '缩小' : '变大'} ${Math.abs(ratio)}%）\n共 ${Math.min(pdf.numPages, 100)} 页，质量 ${q}。\n\n注意：这是重渲染，文字层会变成图片；纯文字 PDF 建议用「PDF 页面编辑」重存来去冗余。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-压缩.pdf', data: bytes, mime: 'application/pdf', label: '下载压缩 PDF' }],
      stats: [{ label: '原', value: L.humanSize(f.size) }, { label: '新', value: L.humanSize(bytes.length) }, { label: '变化', value: ratio + '%' }] };
  }
});
