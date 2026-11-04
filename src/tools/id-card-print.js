/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "身份证正反面",
  "titleOut": "A4 排版",
  "multiple": true,
  "accept": "image/*",
  "dropTitle": "拖入身份证正面 / 反面照片（或粘贴）",
  "primary": "生成排版",
  "auto": false,
  "fields": [
    {
      "id": "scale",
      "label": "缩放",
      "type": "range",
      "min": 50,
      "max": 120,
      "default": 100,
      "unit": "%"
    }
  ],
  "note": "按身份证实物 85.6 × 54 mm 比例，正反面上下排在 A4 中央，带裁切虚线。图片只在本机处理，不上传。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先放入 1–2 张照片' };
    const W = 1240, H = 1754, cw = 856 * v.scale / 100, ch = 540 * v.scale / 100;
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#bbb'; g.setLineDash([8, 6]); g.lineWidth = 1;
    const places = [{ x: (W - cw) / 2, y: H / 2 - ch - 40 }, { x: (W - cw) / 2, y: H / 2 + 40 }];
    for (let i = 0; i < Math.min(2, files.length); i++) {
      try {
        const im = await L.imageFromFile(files[i]);
        g.setLineDash([]); g.fillStyle = '#f7f4ef'; g.fillRect(places[i].x - 6, places[i].y - 6, cw + 12, ch + 12);
        const r = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
        const dw = im.naturalWidth * r, dh = im.naturalHeight * r;
        g.drawImage(im, places[i].x + (cw - dw) / 2, places[i].y + (ch - dh) / 2, dw, dh);
        g.strokeStyle = '#c4bcb0'; g.lineWidth = 2; g.strokeRect(places[i].x, places[i].y, cw, ch);
        g.setLineDash([8, 6]);
      } catch (e) { return { error: '第 ' + (i + 1) + ' 张图读不出来：' + e.message }; }
    }
    g.setLineDash([]); g.fillStyle = '#888'; g.font = '20px sans-serif'; g.textAlign = 'center';
    g.fillText('沿虚线裁切 · 正反面可背对背塑封', W / 2, H - 60);
    const u8 = await L.canvasU8(cv, 'image/png');
    const url = URL.createObjectURL(new Blob([u8], { type: 'image/png' }));
    return { text: `已按身份证比例把 ${Math.min(2, files.length)} 张图排到 A4（${W}×${H}px，约 300DPI）。下载 PNG 后按 100% 比例打印，或直接在浏览器里打印。`,
      preview: `<img src="${url}" style="max-height:420px;border:1px solid #ddd">`,
      stats: [{ label: '文件数', value: Math.min(2, files.length) + ' 张' }, { label: '画布', value: W + '×' + H }],
      files: [{ name: '身份证-A4排版.png', data: u8, mime: 'image/png', label: '下载 PNG' }] };
  }
});
