/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "转换结果",
  "accept": "image/*",
  "multiple": true,
  "primary": "转换下载",
  "auto": false,
  "dropTitle": "拖图片进来",
  "fields": [
    {
      "id": "fmt",
      "label": "目标格式",
      "type": "select",
      "options": [
        "PNG",
        "JPEG",
        "WebP",
        "BMP",
        "SVG（内嵌位图）"
      ]
    },
    {
      "id": "bg",
      "label": "透明底填充色（转 JPEG/BMP 时用）",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "note": "浏览器能解码的格式（PNG/JPEG/WebP/GIF 首帧/BMP）可互转；HEIC / AVIF / TIFF 需要浏览器原生支持或专门的解码器，读不了会明确列出。EXIF 在重绘后会丢失，需要保留请用「照片信息」先另存。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d');
        if (['JPEG', 'BMP'].includes(v.fmt)) { g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(im, 0, 0);
        let data, mime, ext = v.fmt.toLowerCase();
        if (v.fmt === 'SVG（内嵌位图）') { const u = cv.toDataURL('image/png'); data = L.utf8(`<svg xmlns="http://www.w3.org/2000/svg" width="${cv.width}" height="${cv.height}"><image href="${u}" width="100%" height="100%"/></svg>`); mime = 'image/svg+xml'; ext = 'svg'; }
        else if (v.fmt === 'BMP') { data = await L.canvasU8(cv, 'image/bmp'); mime = 'image/bmp'; }
        else { mime = { PNG: 'image/png', JPEG: 'image/jpeg', WebP: 'image/webp' }[v.fmt]; data = await L.canvasU8(cv, mime, 0.92); }
        outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.' + ext, data, mime });
        logs.push(`${f.name} → ${ext.toUpperCase()}（${im.naturalWidth}×${im.naturalHeight}）`);
      } catch (e) { logs.push(`${f.name}：浏览器解不开 ${e.message}`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '格式转换.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '成功', value: outs.length }] };
  }
});
