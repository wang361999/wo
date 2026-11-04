/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>屏幕录制</h2><span class="hint">getDisplayMedia + MediaRecorder · 本地不上传</span></div>
    <div class="t-row"><label class="t-check"><input type="checkbox" id="sr-audio" checked>录系统声音</label><label class="t-check"><input type="checkbox" id="sr-mic">同时录麦克风</label><select class="t-select" id="sr-q"><option value="2500000">标准 2.5Mbps</option><option value="5000000">高清 5Mbps</option><option value="1200000">省空间 1.2Mbps</option></select><button type="button" class="t-btn primary" id="sr-start">● 开始录制</button><button type="button" class="t-btn" id="sr-stop">■ 停止</button></div>
    <div class="t-out" id="sr-time" style="font-size:30px;text-align:center;font-weight:700;margin:14px 0">00:00</div>
    <video id="sr-view" controls style="width:100%;max-height:340px;background:#161412;border-radius:8px;display:none"></video>
    <div class="t-stat-row" id="sr-stat" style="margin-top:12px"></div>
    <p class="t-hint">用浏览器原生的「共享屏幕」 picker 选窗口/标签页/整屏，录完直接下载 WebM。浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。 Safari 与部分手机浏览器不支持。</p>
  </section></div>`;
  const view = root.querySelector('#sr-view'), time = root.querySelector('#sr-time'), stat = root.querySelector('#sr-stat'), q = root.querySelector('#sr-q'), audio = root.querySelector('#sr-audio'), mic = root.querySelector('#sr-mic');
  let rec = null, chunks = [], stream = null, t0 = 0, tick = null, url = null;
  const stop = () => { if (rec && rec.state !== 'inactive') rec.stop(); clearInterval(tick); tick = null; };
  const start = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) { stat.innerHTML = '<p class="t-hint">这个浏览器不支持屏幕共享或 MediaRecorder（建议桌面版 Chrome / Edge）</p>'; return; }
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: audio.checked });
      if (mic.checked) { try { const m = await navigator.mediaDevices.getUserMedia({ audio: true }); m.getAudioTracks().forEach((t) => stream.addTrack(t)); } catch (e) {} }
      const tracks = stream.getVideoTracks(); if (tracks[0]) tracks[0].onended = stop;
      chunks = []; const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Number(q.value) });
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => { const b = new Blob(chunks, { type: 'video/webm' }); if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); view.src = url; view.style.display = ''; stat.innerHTML = `<div class="t-stat"><b>${L.humanSize(b.size)}</b><span>文件大小</span></div><div class="t-stat"><b>${L.round((Date.now() - t0) / 1000, 1)}s</b><span>录制时长</span></div>`; const a = document.createElement('a'); a.href = url; a.download = 'screen-record.webm'; a.textContent = '⬇ 下载录屏 WebM'; a.className = 't-btn primary'; a.style.marginTop = '10px'; stat.appendChild(a); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } };
      rec.start(1000); t0 = Date.now();
      tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); time.textContent = `${L.pad(Math.floor(s / 60))}:${L.pad(s % 60)}`; }, 500);
      stat.innerHTML = '<p class="t-hint">录制中… 切到要录的窗口，回来点「停止」</p>';
    } catch (e) { stat.innerHTML = `<p class="t-hint">没开始录制：${L.esc(e.name || '')} ${L.esc(e.message || '')}（多半是取消了共享选择）</p>`; }
  };
  root.querySelector('#sr-start').onclick = start;
  root.querySelector('#sr-stop').onclick = stop;
  K.setAction('开始 / 停止录制', () => { if (rec && rec.state === 'recording') stop(); else start(); });
});
