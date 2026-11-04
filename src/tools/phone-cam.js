/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>摄像头串流（本机预览）</h2><span class="hint">纯静态页没有信令服务器</span></div>
    <div class="t-hint" style="padding:12px;background:#f6efe3;border-radius:8px;margin-bottom:12px"><b>先把边界说清楚：</b>真正的「手机↔手机 / 手机↔PC」P2P 画面直传需要 WebRTC 交换 SDP 要约，中间得有信令服务器转发，或者两台设备在同一浏览器里登录同一个账号。这个站是纯静态页、没有后端，做不到自动串流，也不假装能做到。这里给的是能在本机真实跑起来的部分：摄像头自检、分辨率/帧率、全屏当监视画面，以及一个二维码方便第二台设备各自打开自查。</div>
    <div class="t-row"><button type="button" class="t-btn primary" id="pc-start">开启本机摄像头</button><button type="button" class="t-btn" id="pc-stop">关闭</button><button type="button" class="t-btn" id="pc-full">全屏画面</button><button type="button" class="t-btn" id="pc-qr">生成本页二维码</button></div>
    <div style="position:relative;background:#161412;border-radius:8px;margin-top:14px;overflow:hidden"><video id="pc-v" autoplay playsinline muted style="width:100%;max-height:380px;display:block"></video></div>
    <div class="t-stat-row" id="pc-stat" style="margin-top:12px"></div>
    <div id="pc-qrwrap" style="text-align:center;margin-top:14px"></div>
    <p class="t-hint">想做真串流：自建一个 WebSocket 信令服务（哪怕几十行），或直接用系统自带的「相机共享 / 屏幕镜像」。本页不联网、不上传画面。</p>
  </section></div>`;
  const v = root.querySelector('#pc-v'), stat = root.querySelector('#pc-stat'), qrwrap = root.querySelector('#pc-qrwrap');
  let stream = null, raf = null, t0 = 0, frames = 0;
  const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } cancelAnimationFrame(raf); raf = null; stat.innerHTML = ''; };
  const loop = () => { frames++; const now = performance.now(); if (!t0) t0 = now; if (now - t0 >= 1000) { stat.innerHTML = `<div class="t-stat"><b>${v.videoWidth}×${v.videoHeight}</b><span>分辨率</span></div><div class="t-stat"><b>${L.round(frames / ((now - t0) / 1000), 1)}</b><span>fps</span></div>`; frames = 0; t0 = now; } raf = requestAnimationFrame(loop); };
  const start = async () => { stop(); if (!navigator.mediaDevices?.getUserMedia) { stat.innerHTML = '<p class="t-hint">这个环境不支持摄像头接口（需 HTTPS）</p>'; return; } try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); v.srcObject = stream; await v.play(); t0 = 0; frames = 0; raf = requestAnimationFrame(loop); } catch (e) { stat.innerHTML = `<p class="t-hint">打不开摄像头：${L.esc(e.message || e.name)}</p>`; } };
  root.querySelector('#pc-start').onclick = start;
  root.querySelector('#pc-stop').onclick = () => { stop(); stat.innerHTML = '<p class="t-hint">已关闭，摄像头已释放</p>'; };
  root.querySelector('#pc-full').onclick = () => { if (v.parentElement.requestFullscreen) v.parentElement.requestFullscreen(); };
  root.querySelector('#pc-qr').onclick = async () => { try { const { canvas } = await qrCanvas(location.href, { scale: 6 }); qrwrap.innerHTML = '<p class="t-hint">用另一台设备扫这个码，会打开同一页各自做本机自检：</p>'; qrwrap.appendChild(canvas); canvas.style.border = '8px solid #fff'; canvas.style.borderRadius = '6px'; } catch (e) { qrwrap.innerHTML = `<p class="t-hint">二维码生成失败：${L.esc(e.message)}</p>`; } };
  K.setAction('开启本机摄像头', start);
});
