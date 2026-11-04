/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "透明底",
  "accept": "image/*",
  "multiple": true,
  "primary": "去背景下载",
  "auto": false,
  "dropTitle": "拖纯色背景的图片进来",
  "fields": [
    {
      "id": "tol",
      "label": "容差",
      "type": "range",
      "min": 15,
      "max": 140,
      "step": 5,
      "default": 55
    },
    {
      "id": "mode",
      "label": "取样方式",
      "type": "select",
      "options": [
        "四角自动取背景色",
        "指定背景色"
      ]
    },
    {
      "id": "color",
      "label": "指定背景色",
      "type": "color",
      "default": "#ffffff"
    },
    {
      "id": "feather",
      "label": "边缘柔化",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "颜色容差抠图（魔棒），不是 AI 分割模型：适合 Logo、纯色底商品图；人物发丝、复杂背景请配合专业工具。导出透明 PNG。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const specified = L.hex2rgb(v.color) || [255, 255, 255], tol = Number(v.tol) || 55, outs = [];
    for (const f of files) {
      const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data, W = cv.width, H = cv.height;
      let bg = specified;
      if (v.mode === '四角自动取背景色') { const s = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const p = (y * W + x) * 4; return [px[p], px[p + 1], px[p + 2]]; }); bg = s[0].map((_, i) => Math.round(s.reduce((a, c) => a + c[i], 0) / s.length)); }
      for (let i = 0; i < px.length; i += 4) {
        const diff = Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
        if (diff < tol * 3) px[i + 3] = 0;
        else if (v.feather && diff < tol * 4.5) px[i + 3] = Math.round(255 * (diff - tol * 3) / (tol * 1.5));
      }
      g.putImageData(d, 0, 0);
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '-透明.png', data: await L.canvasU8(cv, 'image/png'), mime: 'image/png' });
    }
    return { preview: `<div style="background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 50%/16px 16px;padding:8px"><img src="${URL.createObjectURL(new Blob([outs[0].data], { type: 'image/png' }))}" style="max-height:240px"></div>`,
      text: `${outs.length} 张已按容差 ${tol} 去背景，导出透明 PNG。`,
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '透明图.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '图片', value: outs.length }] };
  }
});
