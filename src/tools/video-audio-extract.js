/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "视频",
  "titleOut": "提取结果",
  "multiple": false,
  "accept": "video/*",
  "dropTitle": "拖入一个视频文件",
  "primary": "实时录制音轨",
  "auto": false,
  "fields": [
    {
      "id": "start",
      "label": "从",
      "type": "number",
      "default": 0,
      "unit": "秒"
    },
    {
      "id": "end",
      "label": "到（0=末尾）",
      "type": "number",
      "default": 0,
      "unit": "秒"
    }
  ],
  "note": "浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。 用 MediaElementSource 把视频声音接到 MediaStreamDestination 再录成 WebM(Opus) 音频；不是直接拆容器、也不是 MP3。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    if (!window.MediaRecorder) return { error: '浏览器不支持 MediaRecorder' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.playsInline = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来')); });
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const dest = ac.createMediaStreamDestination();
      ac.createMediaElementSource(vid).connect(dest);
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(dest.stream, { mimeType: mime });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      ctx.setBusy('录制音轨中… 需要等视频播完');
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: 'audio/webm' })); });
      if (v.start > 0) vid.currentTime = v.start;
      const stopAt = v.end > 0 ? v.end : vid.duration;
      rec.start(500); await vid.play();
      await new Promise((res) => { const chk = setInterval(() => { if (vid.currentTime >= stopAt || vid.ended) { clearInterval(chk); res(); } }, 200); });
      vid.pause(); rec.stop(); const blob = await done; ac.close(); URL.revokeObjectURL(url);
      const u8 = new Uint8Array(await blob.arrayBuffer());
      return { text: `音轨已录成 WebM(Opus)：${L.humanSize(u8.length)}，区间 ${L.round(v.start, 1)}s → ${L.round(stopAt, 1)}s\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '区间', value: L.round(stopAt - v.start, 1) + ' 秒' }, { label: '输出', value: L.humanSize(u8.length) }],
        files: [{ name: 'video-audio.webm', data: u8, mime: 'audio/webm', label: '下载音频 WebM' }] };
    } catch (e) { return { error: '提取失败：' + e.message }; }
  }
});
