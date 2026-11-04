/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>番茄钟</h2><span class="hint">专注 / 短休 / 长休</span></div>
    <div class="t-row"><label class="t-label">专注 <input class="t-input" id="pm-focus" type="number" value="25" min="1" style="width:80px"> 分</label><label class="t-label">短休 <input class="t-input" id="pm-short" type="number" value="5" min="1" style="width:80px"> 分</label><label class="t-label">长休 <input class="t-input" id="pm-long" type="number" value="15" min="1" style="width:80px"> 分</label><label class="t-label">几轮后长休 <input class="t-input" id="pm-rounds" type="number" value="4" min="1" style="width:80px"></label></div>
    <div class="t-chips" style="margin:14px 0"><button type="button" class="t-chip on" data-pmode="focus">🍅 专注</button><button type="button" class="t-chip" data-pmode="short">☕ 短休</button><button type="button" class="t-chip" data-pmode="long">🌙 长休</button></div>
    <div class="t-out" id="pm-disp" style="font-size:46px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums">25:00</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="pm-start">开始</button><button type="button" class="t-btn" id="pm-pause">暂停</button><button type="button" class="t-btn" id="pm-skip">跳过</button></div>
    <div class="t-hint" id="pm-stat" style="text-align:center;margin-top:12px">已完成 0 个番茄</div>
  </section></div>`;
  const disp = root.querySelector('#pm-disp'), stat = root.querySelector('#pm-stat');
  let mode = 'focus', left = 0, end = 0, tick = null, running = false, done = 0;
  const mins = () => Number(root.querySelector('#pm-' + (mode === 'focus' ? 'focus' : mode === 'short' ? 'short' : 'long')).value) || 25;
  const show = () => { const s = Math.max(0, Math.ceil(left / 1000)); disp.textContent = `${L.pad(Math.floor(s / 60))}:${L.pad(s % 60)}`; };
  const beep = () => { try { const AC = window.AudioContext || window.webkitAudioContext, c = new AC(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 660; g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1); o.start(); o.stop(c.currentTime + 1); setTimeout(() => c.close(), 1300); } catch (e) {} };
  const setMode = (m) => { mode = m; root.querySelectorAll('[data-pmode]').forEach((x) => x.classList.toggle('on', x.dataset.pmode === m)); stop(); left = mins() * 60000; show(); };
  const stop = () => { running = false; clearInterval(tick); tick = null; };
  const next = () => { beep(); if (mode === 'focus') { done++; const rounds = Number(root.querySelector('#pm-rounds').value) || 4; setMode(done % rounds === 0 ? 'long' : 'short'); } else setMode('focus'); stat.textContent = `已完成 ${done} 个番茄`; };
  const start = () => { if (running) return; running = true; end = Date.now() + left; tick = setInterval(() => { left = Math.max(0, end - Date.now()); show(); if (left <= 0) { stop(); next(); } }, 250); };
  root.querySelector('#pm-start').onclick = start;
  root.querySelector('#pm-pause').onclick = stop;
  root.querySelector('#pm-skip').onclick = () => { stop(); next(); };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-pmode]'); if (b) setMode(b.dataset.pmode); });
  ['focus', 'short', 'long'].forEach((m) => root.querySelector('#pm-' + (m === 'focus' ? 'focus' : m)).addEventListener('change', () => { if (mode === m && !running) { left = mins() * 60000; show(); } }));
  K.setAction('开始 / 暂停', () => { if (running) stop(); else start(); });
  setMode('focus');
});
