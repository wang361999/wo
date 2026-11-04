/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "水印结果",
  "accept": "image/*",
  "multiple": true,
  "primary": "加水印下载",
  "auto": false,
  "dropTitle": "拖图片进来",
  "fields": [
    {
      "id": "text",
      "label": "水印文字",
      "type": "text",
      "default": "© 我的作品"
    },
    {
      "id": "style",
      "label": "样式",
      "type": "select",
      "options": [
        "斜向铺满",
        "右下角单个",
        "居中单个"
      ]
    },
    {
      "id": "size",
      "label": "字号",
      "type": "number",
      "default": 28
    },
    {
      "id": "opacity",
      "label": "透明度",
      "type": "range",
      "min": 0.1,
      "max": 0.9,
      "step": 0.05,
      "default": 0.35
    },
    {
      "id": "color",
      "label": "颜色",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "note": "canvas 叠加文字水印，批量打包下载。需要图片水印（Logo）可把 Logo 图也一起拖进来，会自动取第二张平铺。",
  "process": async (files, v, ctx) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return { error: '先选图片' };
    const logo = imgs.length > 1 ? await L.imageFromFile(imgs[imgs.length - 1]) : null;
    const targets = logo ? imgs.slice(0, -1) : imgs;
    const outs = [];
    for (const f of targets) {
      const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d');
      g.drawImage(im, 0, 0);
      g.save(); g.globalAlpha = Number(v.opacity) || 0.35; g.fillStyle = v.color || '#fff'; g.font = `bold ${Number(v.size) || 28}px sans-serif`; g.textAlign = 'center';
      if (v.style === '斜向铺满') { g.translate(cv.width / 2, cv.height / 2); g.rotate(-Math.PI / 6); const step = (Number(v.size) || 28) * 5; for (let y = -cv.height; y < cv.height; y += step) for (let x = -cv.width; x < cv.width; x += step * 3) g.fillText(v.text || '', x, y); }
      else if (v.style === '右下角单个') g.fillText(v.text || '', cv.width - 130, cv.height - 24);
      else g.fillText(v.text || '', cv.width / 2, cv.height / 2);
      g.restore();
      if (logo) { g.globalAlpha = Math.max(0.2, (Number(v.opacity) || 0.35) * 0.8); const s = Math.min(120, cv.width / 6); for (let y = 20; y < cv.height; y += s * 2) for (let x = 20; x < cv.width; x += s * 2) g.drawImage(logo, x, y, s, s * logo.naturalHeight / logo.naturalWidth); g.globalAlpha = 1; }
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '-水印.png', data: await L.canvasU8(cv, 'image/png'), mime: 'image/png' });
    }
    return { preview: `<img src="${URL.createObjectURL(new Blob([outs[0].data], { type: 'image/png' }))}" style="max-height:280px">`,
      text: `已给 ${outs.length} 张图加水印${logo ? '，并平铺了 Logo' : ''}。`,
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '水印结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '图片', value: outs.length }] };
  }
});
