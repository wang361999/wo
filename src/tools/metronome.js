/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>节拍器</h2><span class="hint">WebAudio 本机合成 · 不加载音频文件</span></div>
    <div class="t-row"><label class="t-label">BPM <input class="t-range" id="mt-bpm" type="range" min="30" max="240" value="120"></label><span id="mt-bpmv" style="font-size:22px;font-weight:700">120</span><select class="t-select" id="mt-beat"><option value="4">4/4</option><option value="3">3/4</option><option value="2">2/4</option><option value="6">6/8</option></select><select class="t-select" id="mt-sound"><option value="wood">木鱼</option><option value="beep">电子</option><option value="click">click</option></select></div>
    <div class="t-actions" style="margin:14px 0"><button type="button" class="t-btn primary" id="mt-start">开始</button><button type="button" class="t-btn" id="mt-stop">停止</button><button type="button" class="t-btn" id="mt-tap">Tap 测速</button></div>
    <div id="mt-dots" style="display:flex;gap:12px;justify-content:center;margin:18px 0"></div>
    <div class="t-hint" id="mt-info">120 BPM = 每拍 500 ms。点 Tap 跟着音乐敲几下可以反推 BPM。</div>
  </section></div>`;
  const bpm = root.querySelector('#mt-bpm'), bpmv = root.querySelector('#mt-bpmv'), beat = root.querySelector('#mt-beat'), sound = root.querySelector('#mt-sound'), dots = root.querySelector('#mt-dots'), info = root.querySelector('#mt-info');
  let timer = null, idx = 0, taps = [];
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  const ping = (strong) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(); o.connect(g); g.connect(ctxA.destination); const f = sound.value === 'wood' ? (strong ? 1000 : 760) : sound.value === 'beep' ? (strong ? 1200 : 900) : (strong ? 2000 : 1500); o.frequency.value = f; g.gain.setValueAtTime(strong ? 0.22 : 0.13, ctxA.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.09); o.start(); o.stop(ctxA.currentTime + 0.1); } catch (e) {} };
  const drawDots = () => { const n = Number(beat.value); dots.innerHTML = Array.from({ length: n }, (_, i) => `<div data-dot="${i}" style="width:34px;height:34px;border-radius:50%;background:${i === idx ? '#b4552d' : '#ddd6cc'};transition:background .1s"></div>`).join(''); };
  const tickFn = () => { ping(idx === 0); drawDots(); idx = (idx + 1) % Number(beat.value); };
  const start = () => { if (timer) return; idx = 0; tickFn(); timer = setInterval(tickFn, 60000 / Number(bpm.value)); };
  const stop = () => { clearInterval(timer); timer = null; drawDots(); };
  bpm.addEventListener('input', () => { bpmv.textContent = bpm.value; info.textContent = `${bpm.value} BPM = 每拍 ${L.round(60000 / Number(bpm.value), 0)} ms。点 Tap 跟着音乐敲几下可以反推 BPM。`; if (timer) { stop(); start(); } });
  beat.addEventListener('change', () => { idx = 0; drawDots(); });
  root.querySelector('#mt-start').onclick = start;
  root.querySelector('#mt-stop').onclick = stop;
  root.querySelector('#mt-tap').onclick = () => { const t = Date.now(); taps = taps.filter((x) => t - x < 3000); taps.push(t); if (taps.length >= 3) { const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1), v = L.clamp(Math.round(60000 / avg), 30, 240); bpm.value = v; bpm.dispatchEvent(new Event('input')); } };
  K.setAction('开始 / 停止', () => { if (timer) stop(); else start(); });
  drawDots();
});
