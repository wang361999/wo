/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "PDF",
  "accept": "image/*",
  "multiple": true,
  "primary": "生成 PDF",
  "auto": false,
  "dropTitle": "拖多张图片进来",
  "fields": [
    {
      "id": "layout",
      "label": "每页放几张",
      "type": "select",
      "options": [
        "1 张",
        "2 张（上下）",
        "4 张（2×2）",
        "6 张（2×3）",
        "9 张（3×3）"
      ]
    },
    {
      "id": "paper",
      "label": "纸张",
      "type": "select",
      "options": [
        "A4",
        "A3",
        "Letter",
        "按图片原尺寸"
      ]
    },
    {
      "id": "margin",
      "label": "页边距",
      "unit": "pt",
      "type": "number",
      "default": 18
    },
    {
      "id": "quality",
      "label": "JPEG 质量",
      "type": "range",
      "min": 0.4,
      "max": 0.95,
      "step": 0.05,
      "default": 0.85
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 HEIC / AVIF 能否读取决于浏览器解码能力；读不了的会明确跳过。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const { PDFDocument } = await vendor('pdf');
    const SIZES = { 'A4': [595.28, 841.89], 'A3': [841.89, 1190.55], 'Letter': [612, 792] };
    const per = { '1 张': 1, '2 张（上下）': 2, '4 张（2×2）': 4, '6 张（2×3）': 6, '9 张（3×3）': 9 }[v.layout] || 1;
    const cols = per === 1 ? 1 : per <= 2 ? 1 : per <= 6 ? 2 : 3;
    const rows = Math.ceil(per / cols);
    const imgs = [];
    for (const f of files) {
      try { const im = await L.imageFromFile(f); imgs.push({ f, im }); } catch (e) { /* 明确跳过 */ }
    }
    if (!imgs.length) return { error: '浏览器解不开这些图片（HEIC/AVIF 常见于 iPhone，请先转成 JPG/PNG）' };
    const doc = await PDFDocument.create();
    const pageCount = Math.ceil(imgs.length / per);
    for (let p = 0; p < pageCount; p++) {
      const batch = imgs.slice(p * per, (p + 1) * per);
      let W, H;
      if (v.paper === '按图片原尺寸') { const first = batch[0].im; W = first.naturalWidth; H = first.naturalHeight * rows; }
      else [W, H] = SIZES[v.paper] || SIZES.A4;
      const page = doc.addPage([W, H]);
      const m = Number(v.margin) || 0;
      const cw = (W - m * 2) / cols, ch = (H - m * 2) / rows;
      for (let i = 0; i < batch.length; i++) {
        const { f, im } = batch[i];
        const cv = L.canvasOf(im.naturalWidth, im.naturalHeight);
        cv.getContext('2d').drawImage(im, 0, 0);
        let jpg;
        try { jpg = await doc.embedJpg(await (await L.canvasBlob(cv, 'image/jpeg', Number(v.quality) || 0.85)).arrayBuffer()); }
        catch (e) { jpg = await doc.embedPng(await (await L.canvasBlob(cv, 'image/png')).arrayBuffer()); }
        const scale = Math.min(cw / jpg.width, ch / jpg.height) * 0.96;
        const w = jpg.width * scale, h = jpg.height * scale;
        const cx = m + (i % cols) * cw + (cw - w) / 2, cy = H - m - (Math.floor(i / cols) + 1) * ch + (ch - h) / 2;
        page.drawImage(jpg, { x: cx, y: cy, width: w, height: h });
      }
    }
    const bytes = await doc.save();
    return { text: `${imgs.length} 张图片 → ${pageCount} 页 PDF${imgs.length < files.length ? `（${files.length - imgs.length} 张格式不支持已跳过）` : ''}。`,
      files: [{ name: '图片合集.pdf', data: bytes, mime: 'application/pdf', label: '下载 PDF' }],
      stats: [{ label: '图片', value: imgs.length }, { label: '页数', value: pageCount }, { label: '大小', value: L.humanSize(bytes.length) }] };
  }
});
