/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "视频与目标",
  "titleOut": "压缩结果",
  "multiple": false,
  "accept": "video/*",
  "dropTitle": "拖入一个视频文件",
  "primary": "开始重录压缩",
  "auto": false,
  "fields": [
    {
      "id": "w",
      "label": "目标宽度（0=保持）",
      "type": "number",
      "default": 720,
      "unit": "px"
    },
    {
      "id": "fps",
      "label": "目标帧率",
      "type": "select",
      "options": [
        "30",
        "24",
        "15",
        "保持原样"
      ]
    },
    {
      "id": "br",
      "label": "码率",
      "type": "select",
      "options": [
        "800000 低",
        "1500000 中",
        "3000000 高"
      ]
    }
  ],
  "note": "浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。 做法是：把视频画到缩小后的 canvas，再用 captureStream + MediaRecorder 实时录一遍，因此能降分辨率/帧率/码率。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return { error: '这个浏览器不支持 canvas.captureStream / MediaRecorder，请用桌面版 Chrome' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.muted = true; vid.playsInline = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来（这个封装浏览器可能不支持）')); });
      const W = v.w > 0 ? Math.min(v.w, vid.videoWidth) : vid.videoWidth, H = Math.round(W * vid.videoHeight / vid.videoWidth);
      const cv = L.canvasOf(W, H), g = cv.getContext('2d');
      const fps = v.fps === '保持原样' ? 30 : Number(v.fps);
      const stream = cv.captureStream(fps);
      try { const a = vid.captureStream ? vid.captureStream() : null; if (a) a.getAudioTracks().forEach((t) => stream.addTrack(t)); } catch (e) {}
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Number(String(v.br).split(' ')[0]) });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      ctx.setBusy('重录中… 需要等视频播完，别切走标签页');
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' })); });
      rec.start(500); vid.currentTime = 0; await vid.play();
      const draw = () => { if (!vid.paused && !vid.ended) { g.drawImage(vid, 0, 0, W, H); requestAnimationFrame(draw); } };
      draw();
      await new Promise((res) => { vid.onended = res; });
      rec.stop(); const blob = await done; vid.pause(); URL.revokeObjectURL(url);
      const u8 = new Uint8Array(await blob.arrayBuffer());
      return { text: `重录完成：${W}×${H} / ${fps}fps，输出 ${L.humanSize(u8.length)}（原 ${L.humanSize(f.size)}）\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '分辨率', value: W + '×' + H }, { label: '输出', value: L.humanSize(u8.length) }, { label: '原文件', value: L.humanSize(f.size) }],
        files: [{ name: 'video-compressed.webm', data: u8, mime: 'video/webm', label: '下载 WebM' }] };
    } catch (e) { return { error: '压缩失败：' + e.message }; }
  }
});
