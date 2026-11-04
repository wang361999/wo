/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "1–9 张图",
  "titleOut": "拼图",
  "accept": "image/*",
  "multiple": true,
  "primary": "拼图下载",
  "auto": false,
  "dropTitle": "拖 1–9 张图进来",
  "fields": [
    {
      "id": "layout",
      "label": "模板",
      "type": "select",
      "options": [
        "2×2 网格",
        "1 大 + 2 小",
        "1 大 + 4 小",
        "3×3 九宫",
        "横向三连",
        "竖向三连",
        "1 左 + 2 右"
      ]
    },
    {
      "id": "ratio",
      "label": "画布比例",
      "type": "select",
      "options": [
        "1:1",
        "4:3",
        "3:4",
        "16:9"
      ]
    },
    {
      "id": "gap",
      "label": "间距",
      "type": "number",
      "default": 10
    },
    {
      "id": "radius",
      "label": "圆角",
      "type": "number",
      "default": 8
    },
    {
      "id": "bg",
      "label": "背景色",
      "type": "color",
      "default": "#f2eee5"
    }
  ],
  "note": "按模板切格子，图片居中裁切填满；可调间距、圆角与画布比例，导出 PNG。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const imgs = []; for (const f of files.slice(0, 9)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const R = { '1:1': 1, '4:3': 4 / 3, '3:4': 0.75, '16:9': 16 / 9 }[v.ratio] || 1;
    const W = 1200, H = Math.round(W / R), gap = Number(v.gap) || 0, rad = Number(v.radius) || 0;
    const layouts = {
      '2×2 网格': [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]],
      '1 大 + 2 小': [[0, 0, .62, 1], [.62, 0, .38, .5], [.62, .5, .38, .5]],
      '1 大 + 4 小': [[0, 0, .6, 1], [.6, 0, .4, .25], [.6, .25, .4, .25], [.6, .5, .4, .25], [.6, .75, .4, .25]],
      '3×3 九宫': Array.from({ length: 9 }, (_, i) => [(i % 3) / 3, Math.floor(i / 3) / 3, 1 / 3, 1 / 3]),
      '横向三连': [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
      '竖向三连': [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
      '1 左 + 2 右': [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]],
    };
    const cells = layouts[v.layout] || layouts['2×2 网格'];
    const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = v.bg || '#f2eee5'; g.fillRect(0, 0, W, H);
    cells.forEach((c, i) => {
      const im = imgs[i % imgs.length]; const x = c[0] * W + gap / 2, y = c[1] * H + gap / 2, w = c[2] * W - gap, h = c[3] * H - gap;
      g.save(); g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, rad) : g.rect(x, y, w, h); g.clip();
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      g.drawImage(im, x + (w - im.naturalWidth * s) / 2, y + (h - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      g.restore();
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `${imgs.length} 张图按「${v.layout}」拼成 ${W}×${H}。`, files: [{ name: '拼图.png', data: png, mime: 'image/png', label: '下载拼图' }],
      stats: [{ label: '格子', value: cells.length }, { label: '图片', value: imgs.length }] };
  }
});
