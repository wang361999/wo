/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>麦克风测试</h2><span class="hint">实时电平 + 录音回放，不上传</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="mc-start">开启麦克风</button><button type="button" class="t-btn" id="mc-stop">关闭</button><select class="t-select" id="mc-dev"><option value="">默认麦克风</option></select><label class="t-check"><input type="checkbox" id="mc-nr" checked>降噪</label><label class="t-check"><input type="checkbox" id="mc-ec" checked>回声消除</label></div>
    <div class="t-row" style="margin:12px 0"><button type="button" class="t-btn" id="mc-rec">● 录音 3 秒</button><audio id="mc-play" controls style="display:none;flex:1"></audio></div>
    <canvas id="mc-cv" width="600" height="140" style="width:100%;background:#161412;border-radius:8px;margin-top:6px"></canvas>
    <div class="t-stat-row" id="mc-stat" style="margin-top:12px"></div>
    <p class="t-hint" id="mc-msg">点「开启麦克风」后浏览器会要一次权限。波形与录音都只在本机内存里，关掉即消失。</p>
  </section></div>`;
  const cv = root.querySelector('#mc-cv'), g = cv.getContext('2d'), stat = root.querySelector('#mc-stat'), msg = root.querySelector('#mc-msg'), dev = root.querySelector('#mc-dev'), nr = root.querySelector('#mc-nr'), ec = root.querySelector('#mc-ec'), play = root.querySelector('#mc-play');
  let stream = null, ctxA = null, analyser = null, raf = null, peak = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } if (ctxA) { ctxA.close(); ctxA = null; } };
  const loop = () => {
    const n = analyser.fftSize, arr = new Uint8Array(n); analyser.getByteTimeDomainData(arr);
    g.fillStyle = '#161412'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#7d9a76'; g.lineWidth = 2; g.beginPath();
    let sum = 0;
    for (let i = 0; i < n; i++) { const x = i / n * cv.width, y = cv.height / 2 + (arr[i] - 128) / 128 * cv.height * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); sum += Math.pow((arr[i] - 128) / 128, 2); }
    g.stroke();
    const rms = Math.sqrt(sum / n); peak = Math.max(peak, rms);
    stat.innerHTML = `<div class="t-stat"><b>${L.round(rms * 100, 1)}</b><span>当前电平 %</span></div><div class="t-stat"><b>${L.round(peak * 100, 1)}</b><span>峰值 %</span></div><div class="t-stat"><b>${L.round(20 * Math.log10(Math.max(1e-4, rms)), 1)}</b><span>dBFS</span></div>`;
    raf = requestAnimationFrame(loop);
  };
  const start = async () => {
    stop(); if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = '这个环境不支持麦克风接口（需 HTTPS 或 localhost）'; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: dev.value ? { exact: dev.value } : undefined, noiseSuppression: nr.checked, echoCancellation: ec.checked }, video: false });
      ctxA = new AC(); analyser = ctxA.createAnalyser(); analyser.fftSize = 2048;
      ctxA.createMediaStreamSource(stream).connect(analyser);
      const list = await navigator.mediaDevices.enumerateDevices(), mics = list.filter((x) => x.kind === 'audioinput');
      dev.innerHTML = '<option value="">默认麦克风</option>' + mics.map((x, i) => `<option value="${L.esc(x.deviceId)}">${L.esc(x.label || '麦克风 ' + (i + 1))}</option>`).join('');
      msg.textContent = '对着麦克风说话，看波形跳不跳。录一段回放可以确认声音是否发闷/断续。';
      peak = 0; raf = requestAnimationFrame(loop);
    } catch (e) { msg.textContent = '打不开麦克风：' + (e.name || '') + ' ' + (e.message || ''); }
  };
  root.querySelector('#mc-start').onclick = start;
  root.querySelector('#mc-stop').onclick = () => { stop(); msg.textContent = '已关闭，麦克风已释放。'; };
  root.querySelector('#mc-rec').onclick = async () => {
    if (!stream) { K.toast('先开启麦克风'); return; }
    try { const chunks = [], rec = new MediaRecorder(stream); rec.ondataavailable = (e) => chunks.push(e.data); rec.onstop = () => { const b = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); play.src = URL.createObjectURL(b); play.style.display = ''; msg.textContent = '录音完成，点播放听一下（只存在本机内存里）。'; }; rec.start(); msg.textContent = '录音中… 3 秒'; setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 3000); }
    catch (e) { msg.textContent = '这个浏览器不支持 MediaRecorder：' + e.message; }
  };
  K.setAction('开启麦克风', start);
});
