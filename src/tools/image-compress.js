/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "压缩结果",
  "accept": "image/*",
  "multiple": true,
  "primary": "压缩下载",
  "auto": false,
  "dropTitle": "拖多张图片进来",
  "fields": [
    {
      "id": "fmt",
      "label": "输出格式",
      "type": "select",
      "options": [
        "保持原格式",
        "JPEG",
        "WebP",
        "PNG"
      ]
    },
    {
      "id": "q",
      "label": "质量",
      "type": "range",
      "min": 0.3,
      "max": 0.95,
      "step": 0.05,
      "default": 0.8
    },
    {
      "id": "maxw",
      "label": "最大宽度（0 = 不缩放）",
      "type": "number",
      "default": 0
    }
  ],
  "note": "canvas 重新编码，批量打包 ZIP；透明底转 JPEG 时会填白。WebP / AVIF 支持取决于浏览器。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const im = await L.imageFromFile(f);
        let w = im.naturalWidth, h = im.naturalHeight;
        if (Number(v.maxw) > 0 && w > Number(v.maxw)) { h = Math.round(h * Number(v.maxw) / w); w = Number(v.maxw); }
        const cv = L.canvasOf(w, h), g = cv.getContext('2d');
        let type = v.fmt;
        if (type === '保持原格式') type = f.type.includes('png') ? 'PNG' : f.type.includes('webp') ? 'WebP' : 'JPEG';
        if (type === 'JPEG') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
        g.drawImage(im, 0, 0, w, h);
        const mime = { JPEG: 'image/jpeg', WebP: 'image/webp', PNG: 'image/png' }[type];
        const ext = { JPEG: 'jpg', WebP: 'webp', PNG: 'png' }[type];
        const data = await L.canvasU8(cv, mime, Number(v.q) || 0.8);
        outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.' + ext, data, mime });
        logs.push(`${f.name}：${L.humanSize(f.size)} → ${L.humanSize(data.length)}（${(100 - data.length / f.size * 100).toFixed(0)}%）`);
      } catch (e) { logs.push(`${f.name}：失败 ${e.message}`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '压缩结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '成功', value: outs.length }] };
  }
});
