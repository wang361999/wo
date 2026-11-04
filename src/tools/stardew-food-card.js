/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "美食图",
  "titleOut": "像素信息卡",
  "accept": "image/*",
  "multiple": false,
  "primary": "生成卡片",
  "auto": false,
  "dropTitle": "拖一张美食照片进来",
  "fields": [
    {
      "id": "name",
      "label": "菜名",
      "type": "text",
      "default": "南瓜汤"
    },
    {
      "id": "cat",
      "label": "品类",
      "type": "select",
      "options": [
        "料理",
        "甜点",
        "饮品",
        "鱼类",
        "农作物",
        "采集品"
      ]
    },
    {
      "id": "desc",
      "label": "一句描述",
      "type": "text",
      "default": "暖乎乎的，适合下雨天。"
    },
    {
      "id": "energy",
      "label": "能量值",
      "type": "number",
      "default": 120
    },
    {
      "id": "price",
      "label": "售价",
      "type": "number",
      "default": 250
    }
  ],
  "note": "像素风信息卡：上传照片 + 菜名 / 品类 / 能量 / 售价，本地导出 PNG。像素字用系统等宽字体渲染，不是 Fusion Pixel 字体文件。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选一张图' };
    const im = await L.imageFromFile(f), W = 480, H = 320;
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    const colors = { '料理': '#c0782f', '甜点': '#c86a8a', '饮品': '#3f8a9b', '鱼类': '#4a7c9b', '农作物': '#6a9a4a', '采集品': '#8a6b4a' };
    const c = colors[v.cat] || '#b4552d';
    g.fillStyle = '#f4e8c8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d8c49a'; for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 16) if ((x / 16 + y / 16) % 2) g.fillRect(x, y, 16, 16);
    g.fillStyle = '#3a2f22'; g.fillRect(12, 12, W - 24, H - 24); g.fillStyle = c; g.fillRect(16, 16, W - 32, H - 32); g.fillStyle = '#f7efd6'; g.fillRect(20, 20, W - 40, H - 40);
    const s = Math.min(200 / im.naturalWidth, 200 / im.naturalHeight); g.drawImage(im, 32 + (200 - im.naturalWidth * s) / 2, 56 + (200 - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
    g.fillStyle = '#3a2f22'; g.font = 'bold 24px monospace'; g.fillText(v.name || '料理', 252, 78);
    g.font = '14px monospace'; g.fillText(`【${v.cat}】`, 252, 108);
    g.font = '13px monospace'; (v.desc || '').slice(0, 16).split('').forEach((ch, i) => g.fillText(ch, 252 + (i % 12) * 15, 142 + Math.floor(i / 12) * 20));
    g.fillStyle = c; g.fillRect(252, 196, 180, 34); g.fillStyle = '#fff'; g.font = 'bold 15px monospace'; g.fillText(`能量 +${v.energy || 0}`, 260, 218);
    g.fillStyle = '#3a2f22'; g.font = 'bold 15px monospace'; g.fillText(`售价 ${v.price || 0} g`, 252, 256);
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-width:100%">`,
      text: `已生成「${v.name}」的${v.cat}信息卡。`, files: [{ name: (v.name || '料理') + '.png', data: png, mime: 'image/png', label: '下载 PNG' }], stats: [{ label: '尺寸', value: '480×320' }] };
  }
});
