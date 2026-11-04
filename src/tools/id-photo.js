/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "正面照",
  "titleOut": "证件照",
  "accept": "image/*",
  "multiple": false,
  "primary": "生成证件照",
  "auto": false,
  "dropTitle": "拖一张正面照进来",
  "fields": [
    {
      "id": "size",
      "label": "规格",
      "type": "select",
      "options": [
        "一寸 295×413",
        "二寸 413×579",
        "小一寸 260×378",
        "大一寸 390×567",
        "签证 354×472"
      ]
    },
    {
      "id": "bg",
      "label": "底色",
      "type": "select",
      "options": [
        "白底 #ffffff",
        "蓝底 #438edb",
        "红底 #d84b4b"
      ]
    },
    {
      "id": "tol",
      "label": "抠图容差（原底色与角落取色的差）",
      "type": "range",
      "min": 20,
      "max": 130,
      "step": 5,
      "default": 60
    },
    {
      "id": "pack",
      "label": "输出排版（A4 多张，方便打印）",
      "type": "checkbox",
      "default": false
    }
  ],
  "note": "简化魔棒抠图：按四角取背景色、按容差把相近像素透明化，再换底色、按规格裁切。适合纯色背景的正面照；复杂背景/发丝请用专业抠图工具。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选照片' };
    const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data;
    const W = cv.width, H = cv.height;
    const samples = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const p = (y * W + x) * 4; return [px[p], px[p + 1], px[p + 2]]; });
    const bg0 = samples[0].map((_, i) => Math.round(samples.reduce((s, c) => s + c[i], 0) / samples.length));
    const tol = Number(v.tol) || 60;
    for (let i = 0; i < px.length; i += 4) { const diff = Math.abs(px[i] - bg0[0]) + Math.abs(px[i + 1] - bg0[1]) + Math.abs(px[i + 2] - bg0[2]); if (diff < tol * 3) px[i + 3] = 0; }
    g.putImageData(d, 0, 0);
    const [tw, th] = (v.size.match(/(\d+)×(\d+)/) || []).slice(1).map(Number);
    const W2 = tw || 295, H2 = th || 413;
    const color = v.bg.includes('蓝') ? '#438edb' : v.bg.includes('红') ? '#d84b4b' : '#ffffff';
    const out = L.canvasOf(W2, H2), og = out.getContext('2d'); og.fillStyle = color; og.fillRect(0, 0, W2, H2);
    const s = Math.min(W2 / W, H2 / H); og.drawImage(cv, (W2 - W * s) / 2, (H2 - H * s) / 2, W * s, H * s);
    const png = await L.canvasU8(out, 'image/png');
    let sheet = null;
    if (v.pack) { const A4 = L.canvasOf(1240, 1754), ag = A4.getContext('2d'); ag.fillStyle = '#fff'; ag.fillRect(0, 0, 1240, 1754); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) ag.drawImage(out, 60 + c * 400, 60 + r * 420, W2 * 0.9, H2 * 0.9); sheet = await L.canvasU8(A4, 'image/png'); }
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="height:220px;border:1px solid var(--line)">`,
      text: `${v.size} · ${v.bg.split(' ')[0]}，抠图容差 ${tol}。${sheet ? '另附 A4 排版（12 张）。' : ''}`,
      files: [{ name: '证件照.png', data: png, mime: 'image/png', label: '下载单张' }].concat(sheet ? [{ name: 'A4 排版.png', data: sheet, mime: 'image/png', label: '下载 A4 排版' }] : []),
      stats: [{ label: '尺寸', value: `${W2}×${H2}` }] };
  }
});
