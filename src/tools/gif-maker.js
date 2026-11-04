/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "多张图",
  "titleOut": "GIF",
  "accept": "image/*,.gif",
  "multiple": true,
  "primary": "生成 GIF",
  "auto": false,
  "dropTitle": "拖多张图（或 1 个 GIF 拆帧）进来",
  "fields": [
    {
      "id": "delay",
      "label": "每帧间隔",
      "unit": "ms",
      "type": "number",
      "default": 200
    },
    {
      "id": "size",
      "label": "最大宽度（0 = 用第一张）",
      "type": "number",
      "default": 480
    },
    {
      "id": "quality",
      "label": "质量（越小越好但越慢）",
      "type": "range",
      "min": 5,
      "max": 20,
      "step": 1,
      "default": 10
    },
    {
      "id": "mode",
      "label": "模式",
      "type": "select",
      "options": [
        "多图合 GIF",
        "GIF 拆帧"
      ]
    }
  ],
  "note": "gif.js 本地打包，worker 也在 /vendor/；GIF 拆帧只取首帧与元信息（完整逐帧解码需要额外解码器）。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const GIF = await vendor('gif');
    if (v.mode === 'GIF 拆帧') { const f = files[0]; return { text: `${f.name}（${L.humanSize(f.size)}）\n提示：浏览器只能直接显示 GIF 首帧，完整逐帧拆分请用本地 ffmpeg：ffmpeg -i in.gif frame%03d.png`, preview: `<img src="${URL.createObjectURL(f)}" style="max-height:260px">` }; }
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const imgs = []; for (const f of list.slice(0, 60)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const W = Number(v.size) || imgs[0].naturalWidth, H = Math.round(W * imgs[0].naturalHeight / imgs[0].naturalWidth);
    const gif = new GIF({ workers: 2, quality: Number(v.quality) || 10, workerScript: '/vendor/gif.worker.js', width: W, height: H, repeat: 0 });
    for (const im of imgs) { const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); const s = Math.min(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); gif.addFrame(cv, { delay: Number(v.delay) || 200, copy: true }); }
    const blob = await new Promise((res, rej) => { gif.on('finished', res); gif.on('abort', () => rej(new Error('生成中断'))); gif.render(); });
    const data = new Uint8Array(await blob.arrayBuffer());
    return { preview: `<img src="${URL.createObjectURL(blob)}" style="max-height:260px">`, text: `${imgs.length} 帧 → ${W}×${H}，间隔 ${v.delay} ms，${L.humanSize(data.length)}。`,
      files: [{ name: '动画.gif', data, mime: 'image/gif', label: '下载 GIF' }], stats: [{ label: '帧', value: imgs.length }, { label: '大小', value: L.humanSize(data.length) }] };
  }
});
