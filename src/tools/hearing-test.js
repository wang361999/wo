/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const FREQS = [125, 250, 500, 1000, 2000, 4000, 6000, 8000, 10000];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>听力测试（9 频段自检）</h2><span class="hint">本机播放纯音 · 仅供参考</span></div>
    <div class="t-row"><select class="t-select" id="ht-ear"><option value="both">双耳</option><option value="left">仅左耳</option><option value="right">仅右耳</option></select><button type="button" class="t-btn primary" id="ht-start">开始测试</button><span class="t-hint" id="ht-prog">戴好耳机，安静环境下做</span></div>
    <div class="t-out" id="ht-freq" style="font-size:32px;font-weight:700;text-align:center;margin:18px 0">准备</div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="ht-play">▶ 播放纯音</button><button type="button" class="t-btn" id="ht-yes">听到了</button><button type="button" class="t-btn" id="ht-no">没听到</button></div>
    <div class="t-refwrap" id="ht-chart" style="margin-top:14px"></div>
    <p class="t-hint">每个频率从较响逐步降到听不见，取最后一次「听到了」作为该频听阈。用耳机、关掉其它声音。这不是医学听力计，结果不能作为诊断依据，高频听不清请去医院耳鼻喉科。</p>
  </section></div>`;
  const prog = root.querySelector('#ht-prog'), freq = root.querySelector('#ht-freq'), chart = root.querySelector('#ht-chart'), ear = root.querySelector('#ht-ear');
  const AC = window.AudioContext || window.webkitAudioContext; let ctxA = null;
  let fi = 0, level = 0, results = [], playing = false;
  const LEVELS = [-10, -20, -30, -40, -50, -60, -70];
  const tone = (hz, db) => { try { if (!ctxA) ctxA = new AC(); const o = ctxA.createOscillator(), g = ctxA.createGain(), p = ctxA.createStereoPanner ? ctxA.createStereoPanner() : null; o.frequency.value = hz; o.type = 'sine'; g.gain.value = Math.pow(10, db / 20); const pan = ear.value === 'left' ? -1 : ear.value === 'right' ? 1 : 0; if (p) { p.pan.value = pan; o.connect(g); g.connect(p); p.connect(ctxA.destination); } else { o.connect(g); g.connect(ctxA.destination); } o.start(); o.stop(ctxA.currentTime + 0.9); } catch (e) {} };
  const show = () => { if (fi >= FREQS.length) { freq.textContent = '测试完成'; draw(); return; } freq.textContent = FREQS[fi] + ' Hz'; prog.textContent = `第 ${fi + 1} / ${FREQS.length} 个频率　·　当前音量 ${LEVELS[level]} dB（相对）`; };
  const draw = () => { chart.innerHTML = results.length ? `<table class="t-table"><thead><tr><th>频率</th><th>听阈（相对 dB）</th><th>示意</th></tr></thead><tbody>${results.map((r) => `<tr><td>${r.f} Hz</td><td>${r.db}</td><td><div style="background:#b4552d;height:10px;width:${L.clamp((-r.db) / 70 * 100, 3, 100)}%"></div></td></tr>`).join('')}</tbody></table>` : ''; };
  root.querySelector('#ht-play').onclick = () => { if (fi >= FREQS.length) return; tone(FREQS[fi], LEVELS[level]); };
  root.querySelector('#ht-yes').onclick = () => { if (fi >= FREQS.length) return; level++; if (level >= LEVELS.length) { results.push({ f: FREQS[fi], db: LEVELS[LEVELS.length - 1] }); fi++; level = 0; } show(); draw(); };
  root.querySelector('#ht-no').onclick = () => { if (fi >= FREQS.length) return; results.push({ f: FREQS[fi], db: level > 0 ? LEVELS[level - 1] : '连最响也没听到' }); fi++; level = 0; show(); draw(); };
  root.querySelector('#ht-start').onclick = () => { fi = 0; level = 0; results = []; chart.innerHTML = ''; show(); K.toast('点「播放纯音」，听到了就点听到了'); };
  K.setAction('播放纯音', () => root.querySelector('#ht-play').click());
  show();
});
