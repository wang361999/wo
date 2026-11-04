/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>摄像头测试</h2><span class="hint">只要视频权限，不开麦克风</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="ct-start">开启摄像头</button><button type="button" class="t-btn" id="ct-stop">关闭</button><select class="t-select" id="ct-dev"><option value="">默认摄像头</option></select><select class="t-select" id="ct-res"><option value="ideal">默认分辨率</option><option value="640x480">640×480</option><option value="1280x720">720p</option><option value="1920x1080">1080p</option></select><button type="button" class="t-btn" id="ct-full">全屏</button></div>
    <div style="position:relative;background:#161412;border-radius:8px;margin-top:14px;overflow:hidden"><video id="ct-v" autoplay playsinline muted style="width:100%;max-height:420px;display:block"></video><canvas id="ct-c" width="160" height="90" style="display:none"></canvas></div>
    <div class="t-stat-row" id="ct-stat" style="margin-top:12px"></div>
    <p class="t-hint" id="ct-msg">点「开启摄像头」后浏览器会要一次权限。画面不上传、不录制，关掉页面即释放。</p>
  </section></div>`;
  const v = root.querySelector('#ct-v'), c = root.querySelector('#ct-c'), stat = root.querySelector('#ct-stat'), msg = root.querySelector('#ct-msg'), dev = root.querySelector('#ct-dev'), res = root.querySelector('#ct-res');
  let stream = null, raf = null, frames = 0, t0 = 0;
  const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } cancelAnimationFrame(raf); raf = null; stat.innerHTML = ''; };
  const loop = () => { frames++; const now = performance.now(); if (!t0) t0 = now; const el = (now - t0) / 1000; if (el >= 1) { const fps = frames / el; let dark = null; try { const g = c.getContext('2d'); c.width = 80; c.height = 45; g.drawImage(v, 0, 0, 80, 45); const d = g.getImageData(0, 0, 80, 45).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3; dark = sum / (d.length / 4); } catch (e) {}
    stat.innerHTML = `<div class="t-stat"><b>${v.videoWidth}×${v.videoHeight}</b><span>实测分辨率</span></div><div class="t-stat"><b>${L.round(fps, 1)}</b><span>帧率 fps</span></div><div class="t-stat"><b>${dark === null ? '—' : L.round(dark, 0)}</b><span>平均亮度</span></div>`;
    if (dark !== null && dark < 8) msg.textContent = '画面几乎全黑：可能被遮挡、镜头盖没开，或驱动给的是黑帧。';
    frames = 0; t0 = now; } raf = requestAnimationFrame(loop); };
  const start = async () => {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = '这个浏览器/环境不支持摄像头接口（需 HTTPS 或 localhost）'; return; }
    try {
      const cons = { video: { deviceId: dev.value ? { exact: dev.value } : undefined }, audio: false };
      if (res.value !== 'ideal') { const [w, h] = res.value.split('x').map(Number); cons.video.width = { ideal: w }; cons.video.height = { ideal: h }; }
      stream = await navigator.mediaDevices.getUserMedia(cons);
      v.srcObject = stream; await v.play();
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((x) => x.kind === 'videoinput');
      dev.innerHTML = '<option value="">默认摄像头</option>' + cams.map((x, i) => `<option value="${L.esc(x.deviceId)}">${L.esc(x.label || '摄像头 ' + (i + 1))}</option>`).join('');
      msg.textContent = '画面已在本机显示。切设备/分辨率后点「开启摄像头」重新应用。';
      t0 = 0; frames = 0; raf = requestAnimationFrame(loop);
    } catch (e) { msg.textContent = '打不开摄像头：' + (e.name || '') + ' ' + (e.message || '') + '。检查权限、是否被别的程序占用。'; }
  };
  root.querySelector('#ct-start').onclick = start;
  root.querySelector('#ct-stop').onclick = () => { stop(); msg.textContent = '已关闭，摄像头已释放。'; };
  root.querySelector('#ct-full').onclick = () => { const box = v.parentElement; if (box.requestFullscreen) box.requestFullscreen(); };
  K.setAction('开启摄像头', start);
});
