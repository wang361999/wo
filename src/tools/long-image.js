/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "多张图",
  "titleOut": "长图",
  "accept": "image/*",
  "multiple": true,
  "primary": "拼接下载",
  "auto": false,
  "dropTitle": "拖多张图进来，按文件名顺序拼",
  "fields": [
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "竖向",
        "横向"
      ]
    },
    {
      "id": "gap",
      "label": "间距",
      "unit": "px",
      "type": "number",
      "default": 0
    },
    {
      "id": "bg",
      "label": "背景色",
      "type": "color",
      "default": "#ffffff"
    },
    {
      "id": "align",
      "label": "对齐",
      "type": "select",
      "options": [
        "拉伸同宽/同高",
        "居中不拉伸"
      ]
    },
    {
      "id": "width",
      "label": "统一宽度（0 = 用第一张）",
      "type": "number",
      "default": 0
    }
  ],
  "note": "按文件名自然排序拼接；竖向会自动统一宽度（可设置），横向统一高度。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const imgs = []; for (const f of list) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片都解不开' };
    const vert = v.dir === '竖向', gap = Number(v.gap) || 0, w0 = Number(v.width) || imgs[0].naturalWidth, h0 = Number(v.width) ? 0 : imgs[0].naturalHeight;
    const dims = imgs.map((im) => vert ? { w: w0, h: Math.round(im.naturalHeight * w0 / im.naturalWidth) } : { w: Math.round(im.naturalWidth * h0 / im.naturalHeight), h: h0 || im.naturalHeight });
    const total = vert ? dims.reduce((s, d) => s + d.h, 0) + gap * (imgs.length - 1) : dims.reduce((s, d) => s + d.w, 0) + gap * (imgs.length - 1);
    const W = vert ? Math.max(...dims.map((d) => d.w)) : total, H = vert ? total : Math.max(...dims.map((d) => d.h));
    const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, W, H);
    let off = 0;
    imgs.forEach((im, i) => {
      const d = dims[i];
      if (v.align === '居中不拉伸') { const s = Math.min(d.w / im.naturalWidth, d.h / im.naturalHeight); const dw = im.naturalWidth * s, dh = im.naturalHeight * s; g.drawImage(im, vert ? (W - dw) / 2 : off + (d.w - dw) / 2, vert ? off + (d.h - dh) / 2 : (H - dh) / 2, dw, dh); }
      else g.drawImage(im, vert ? 0 : off, vert ? off : 0, d.w, d.h);
      off += (vert ? d.h : d.w) + gap;
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `${imgs.length} 张图 → ${W}×${H} 长图。`, files: [{ name: '长图拼接.png', data: png, mime: 'image/png', label: '下载长图' }],
      stats: [{ label: '图片', value: imgs.length }, { label: '尺寸', value: `${W}×${H}` }] };
  }
});
