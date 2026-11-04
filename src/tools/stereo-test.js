/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>耳机左右声道测试</h2><span class="hint">本机播放 · 判断左右接反 / 相位反接</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="st-l">◀ 只放左声道</button><button type="button" class="t-btn primary" id="st-r">只放右声道 ▶</button><button type="button" class="t-btn" id="st-both">双声道</button><button type="button" class="t-btn" id="st-scan">声像扫描 L→R</button><button type="button" class="t-btn" id="st-phase">相位反接检测</button></div>
    <div class="t-out" id="st-msg" style="font-size:18px;text-align:center;margin:18px 0">先戴好耳机，逐个点上面的按钮</div>
    <div class="t-refwrap" id="st-blind" style="margin-top:10px"></div>
    <p class="t-hint">盲测：点「随机播一边」，再选你听到的是左还是右，连做几次看有没有把左右接反。相位反接检测靠两段反相信号对消的现象判断，普通耳机不一定听得出来。</p>
  </section></div>`;
  const msg = root.querySelector('#st-msg'), blind = root.querySelector('#st-blind');
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  const play = (pan, dur = 1.1, invert = false) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(), p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; o.type = 'sine'; o.frequency.value = 440; g.gain.value = 0.18; if (p) { p.pan.value = pan; o.connect(g); g.connect(p); p.connect(ctxA.destination); } else { o.connect(g); g.connect(ctxA.destination); } o.start(); o.stop(ctxA.currentTime + dur); } catch (e) {} };
  const noise = (pan, dur = 1.2, inv = false) => { try { if (!ctxA) ctxA = new AC(); const n = Math.floor(ctxA.sampleRate * dur), buf = ctxA.createBuffer(2, n, ctxA.sampleRate); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (inv && c === 1 ? -1 : 1) * 0.25; } const src = ctxA.createBufferSource(); src.buffer = buf; const p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; if (p) { p.pan.value = pan; src.connect(p); p.connect(ctxA.destination); } else src.connect(ctxA.destination); src.start(); } catch (e) {} };
  let current = null, score = 0, total = 0;
  root.querySelector('#st-l').onclick = () => { play(-1); msg.textContent = '现在只有左声道该响。如果右耳响，左右接反了。'; };
  root.querySelector('#st-r').onclick = () => { play(1); msg.textContent = '现在只有右声道该响。'; };
  root.querySelector('#st-both').onclick = () => { play(0); msg.textContent = '两边都该响，且声音在正中间。'; };
  root.querySelector('#st-scan').onclick = () => { let k = 0; const t = setInterval(() => { play(-1 + k * 0.25, 0.22); k++; if (k > 8) clearInterval(t); }, 230); msg.textContent = '声像从左到右扫一遍，听有没有断点或偏一边。'; };
  root.querySelector('#st-phase').onclick = () => { noise(0, 1.5, true); msg.textContent = '反相信号：若感觉声音「散开、定位发虚、低音变少」，可能是相位反接。'; };
  const newBlind = () => { current = Math.random() < 0.5 ? -1 : 1; blind.innerHTML = `<div class="t-row" style="justify-content:center"><button type="button" class="t-btn primary" id="st-play">随机播一边</button><button type="button" class="t-btn" data-stans="-1">我听到左</button><button type="button" class="t-btn" data-stans="1">我听到右</button></div><div class="t-hint" id="st-score" style="text-align:center;margin-top:8px">盲测 ${total} 次，猜对 ${score} 次</div>`; blind.querySelector('#st-play').onclick = () => play(current); blind.querySelectorAll('[data-stans]').forEach((b) => { b.onclick = () => { total++; if (Number(b.dataset.stans) === current) score++; newBlind(); }; }); };
  K.setAction('只放左声道', () => root.querySelector('#st-l').click());
  newBlind();
});
