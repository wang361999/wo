/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>计时器</h2><span class="hint">本机运行 · 结束有提示音</span></div>
    <div class="t-chips"><button type="button" class="t-chip on" data-tm="down">倒计时</button><button type="button" class="t-chip" data-tm="up">秒表</button></div>
    <div id="tm-set" class="t-row" style="margin:14px 0"><input class="t-input" id="tm-h" type="number" value="0" min="0" style="width:80px"> 时 <input class="t-input" id="tm-m" type="number" value="5" min="0" style="width:80px"> 分 <input class="t-input" id="tm-s" type="number" value="0" min="0" style="width:80px"> 秒</div>
    <div class="t-out" id="tm-disp" style="font-size:46px;font-weight:700;text-align:center;letter-spacing:2px;font-variant-numeric:tabular-nums">00:05:00</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="tm-start">开始</button><button type="button" class="t-btn" id="tm-pause">暂停</button><button type="button" class="t-btn" id="tm-lap">计次</button><button type="button" class="t-btn" id="tm-reset">重置</button></div>
    <div class="t-refwrap" id="tm-laps" style="margin-top:12px"></div>
  </section></div>`;
  const disp = root.querySelector('#tm-disp'), laps = root.querySelector('#tm-laps'), setRow = root.querySelector('#tm-set');
  let mode = 'down', tick = null, end = 0, left = 0, elapsed = 0, running = false, lapArr = [], lastLap = 0;
  const beep = () => { try { const AC = window.AudioContext || window.webkitAudioContext, c = new AC(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9); o.start(); o.stop(c.currentTime + 0.9); setTimeout(() => c.close(), 1200); } catch (e) {} };
  const fmtMs = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, cs = Math.floor((ms % 1000) / 10); return `${L.pad(h)}:${L.pad(m)}:${L.pad(s)}.${L.pad(cs)}`; };
  const show = () => { disp.textContent = mode === 'down' ? fmtMs(left) : fmtMs(elapsed); };
  const totalMs = () => (Number(root.querySelector('#tm-h').value) || 0) * 3600000 + (Number(root.querySelector('#tm-m').value) || 0) * 60000 + (Number(root.querySelector('#tm-s').value) || 0) * 1000;
  const loop = () => { const now = Date.now(); if (mode === 'down') { left = Math.max(0, end - now); if (left <= 0) { stop(); beep(); K.toast('倒计时结束'); } } else elapsed += 100; show(); };
  const start = () => { if (running) return; running = true; if (mode === 'down') { if (left <= 0) left = totalMs(); end = Date.now() + left; } lastLap = elapsed; tick = setInterval(loop, mode === 'down' ? 100 : 100); };
  const stop = () => { running = false; clearInterval(tick); tick = null; };
  const reset = () => { stop(); left = totalMs(); elapsed = 0; lapArr = []; laps.innerHTML = ''; show(); };
  root.querySelector('#tm-start').onclick = start;
  root.querySelector('#tm-pause').onclick = () => { stop(); show(); };
  root.querySelector('#tm-reset').onclick = reset;
  root.querySelector('#tm-lap').onclick = () => { if (mode !== 'up') { K.toast('计次只在秒表模式下用'); return; } lapArr.unshift({ n: lapArr.length + 1, total: elapsed, split: elapsed - lastLap }); lastLap = elapsed; laps.innerHTML = `<table class="t-table"><thead><tr><th>#</th><th>分段</th><th>累计</th></tr></thead><tbody>${lapArr.map((x) => `<tr><td>${x.n}</td><td>${fmtMs(x.split)}</td><td>${fmtMs(x.total)}</td></tr>`).join('')}</tbody></table>`; };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-tm]'); if (!b) return; root.querySelectorAll('[data-tm]').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.tm; setRow.style.display = mode === 'down' ? '' : 'none'; reset(); });
  K.setAction('开始 / 暂停', () => { if (running) root.querySelector('#tm-pause').click(); else start(); });
  reset();
});
