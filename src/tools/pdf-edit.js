/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "页面编辑",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "重排并下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "order",
      "label": "新页序（如 3,1,2,5-7；留空按原序）",
      "type": "text",
      "default": ""
    },
    {
      "id": "del",
      "label": "要删除的页（如 2,4）",
      "type": "text",
      "default": ""
    },
    {
      "id": "rot",
      "label": "全部页面旋转",
      "type": "select",
      "options": [
        "不旋转",
        "顺时针 90°",
        "180°",
        "逆时针 90°"
      ]
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 缩略图按页码列出，填新顺序 / 删除页 / 旋转后重新保存，文字层保留。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument, degrees } = await vendor('pdf');
    const src = await PDFDocument.load(await f.arrayBuffer());
    const n = src.getPageCount();
    const parseList = (s) => { const out = []; for (const seg of String(s || '').split(/[,，]/)) { const m = seg.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (m) { for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) if (i >= 1 && i <= n) out.push(i - 1); } } return out; };
    const del = new Set(parseList(v.del));
    let order = parseList(v.order);
    if (!order.length) order = Array.from({ length: n }, (_, i) => i);
    order = order.filter((x) => !del.has(x));
    if (!order.length) return { error: '删完没有页面了' };
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, order);
    const rot = { '顺时针 90°': 90, '180°': 180, '逆时针 90°': 270 }[v.rot] || 0;
    pages.forEach((p) => { if (rot) p.setRotation(degrees((p.getRotation().angle + rot) % 360)); out.addPage(p); });
    const bytes = await out.save();
    return { text: `原 ${n} 页 → 新 ${order.length} 页\n新顺序（原页码）：${order.map((x) => x + 1).join(', ')}${del.size ? `\n删除：${[...del].map((x) => x + 1).join(', ')}` : ''}`,
      copy: order.map((x) => x + 1).join(', '),
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-编辑.pdf', data: bytes, mime: 'application/pdf', label: '下载编辑后的 PDF' }],
      stats: [{ label: '原页', value: n }, { label: '新页', value: order.length }, { label: '删除', value: del.size }] };
  }
});
