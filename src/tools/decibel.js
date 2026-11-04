/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>分贝测试</h2><span class="hint">麦克风实时声压级（相对值）</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="db-start">开始测量</button><button type="button" class="t-btn" id="db-stop">停止</button><label class="t-label">校准偏移 <input class="t-input" id="db-cal" type="number" value="0" style="width:90px"> dB</label></div>
    <div class="t-row" style="align-items:center;justify-content:center;margin:18px 0"><canvas id="db-ring" width="220" height="220"></canvas><canvas id="db-wave" width="420" height="220" style="max-width:100%;background:#161412;border-radius:8px"></canvas></div>
    <div class="t-stat-row" id="db-stat"></div>
    <div class="t-hint" id="db-level">—</div>
    <p class="t-hint">浏览器拿到的是归一化电平，换算出的 dB 是估算值，不同设备麦克风增益差很多。用「校准偏移」对照一个已知声源修一下才准。不能代替专业声级计。</p>
  </section></div>`;
  const ring = root.querySelector('#db-ring'), rg = ring.getContext('2d'), wave = root.querySelector('#db-wave'), wg = wave.getContext('2d'), stat = root.querySelector('#db-stat'), level = root.querySelector('#db-level'), cal = root.querySelector('#db-cal');
  let stream = null, ctxA = null, an = null, raf = null, hist = [], peak = -100, sum = 0, n = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } if (ctxA) { ctxA.close(); ctxA = null; } };
  const loop = () => {
    const a = new Float32Array(an.fftSize); an.getFloatTimeDomainData(a);
    let s = 0; for (const x of a) s += x * x;
    const rms = Math.sqrt(s / a.length), db = 20 * Math.log10(Math.max(1e-5, rms)) + 94 + Number(cal.value || 0);
    const dbc = L.clamp(db, 0, 120); peak = Math.max(peak, dbc); sum += dbc; n++; hist.push(dbc); if (hist.length > 200) hist.shift();
    rg.clearRect(0, 0, 220, 220); const p = Math.min(1, dbc / 120);
    rg.lineWidth = 16; rg.strokeStyle = '#e7e0d4'; rg.beginPath(); rg.arc(110, 110, 86, 0, Math.PI * 2); rg.stroke();
    rg.strokeStyle = dbc > 85 ? '#a35d5d' : dbc > 65 ? '#c98a4b' : '#7d9a76'; rg.beginPath(); rg.arc(110, 110, 86, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); rg.stroke();
    rg.fillStyle = '#2f2b26'; rg.textAlign = 'center'; rg.font = 'bold 38px sans-serif'; rg.fillText(L.round(dbc, 0) + '', 110, 118); rg.font = '13px sans-serif'; rg.fillText('dB', 110, 142);
    wg.fillStyle = '#161412'; wg.fillRect(0, 0, 420, 220); wg.strokeStyle = '#7d9a76'; wg.lineWidth = 2; wg.beginPath();
    hist.forEach((d, i) => { const x = i / 200 * 420, y = 220 - d / 120 * 220; i ? wg.lineTo(x, y) : wg.moveTo(x, y); }); wg.stroke();
    stat.innerHTML = `<div class="t-stat"><b>${L.round(dbc, 1)}</b><span>当前 dB</span></div><div class="t-stat"><b>${L.round(peak, 1)}</b><span>峰值 dB</span></div><div class="t-stat"><b>${L.round(sum / Math.max(1, n), 1)}</b><span>平均 dB</span></div>`;
    level.textContent = dbc < 30 ? '很安静（图书馆量级）' : dbc < 50 ? '安静室内' : dbc < 65 ? '正常交谈' : dbc < 85 ? '嘈杂街道 / 吸尘器' : '很吵，注意听力保护';
    raf = requestAnimationFrame(loop);
  };
  const start = async () => { stop(); if (!navigator.mediaDevices?.getUserMedia) { level.textContent = '这个环境不支持麦克风接口'; return; } try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); ctxA = new AC(); an = ctxA.createAnalyser(); an.fftSize = 2048; ctxA.createMediaStreamSource(stream).connect(an); hist = []; peak = -100; sum = 0; n = 0; raf = requestAnimationFrame(loop); } catch (e) { level.textContent = '打不开麦克风：' + (e.message || e.name); } };
  root.querySelector('#db-start').onclick = start;
  root.querySelector('#db-stop').onclick = () => { stop(); level.textContent = '已停止'; };
  K.setAction('开始 / 停止测量', () => { if (raf) root.querySelector('#db-stop').click(); else start(); });
});
