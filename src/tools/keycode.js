/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>按任意键</h2><span class="hint">焦点在本页即可</span></div>
    <div class="t-preview" id="show" style="min-height:150px;flex-direction:column;gap:6px"><div style="font-size:34px;font-weight:700" id="key">⌨</div><div class="t-hint" id="detail">按一下键盘</div></div>
    <div class="t-out" id="code" style="margin-top:12px"></div>
    <p class="t-hint">常用键码表：</p>
    <div class="t-refwrap" id="tbl"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const common = [['Enter', 'Enter', 13], ['Space', ' ', 32], ['Backspace', 'Backspace', 8], ['Tab', 'Tab', 9], ['Escape', 'Escape', 27], ['Shift', 'ShiftLeft', 16], ['Ctrl', 'ControlLeft', 17], ['Alt', 'AltLeft', 18], ['↑', 'ArrowUp', 38], ['↓', 'ArrowDown', 40], ['←', 'ArrowLeft', 37], ['→', 'ArrowRight', 39], ['A', 'KeyA', 65], ['0', 'Digit0', 48], ['F1', 'F1', 112], ['CapsLock', 'CapsLock', 20]];
  $('#tbl').innerHTML = `<table class="t-table"><thead><tr><th>按键</th><th>event.code</th><th>keyCode（旧）</th></tr></thead><tbody>${common.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td class="num">${r[2]}</td></tr>`).join('')}</tbody></table>`;
  const handler = (e) => {
    $('#key').textContent = e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key : e.key);
    const bits = [`event.key = ${JSON.stringify(e.key)}`, `event.code = ${e.code}`, `event.keyCode = ${e.keyCode}`, `location = ${e.location}`, `ctrl = ${e.ctrlKey} · shift = ${e.shiftKey} · alt = ${e.altKey} · meta = ${e.metaKey}`, `repeat = ${e.repeat}`];
    $('#detail').textContent = `${e.code} / keyCode ${e.keyCode}`;
    $('#code').textContent = bits.join('\n');
  };
  window.addEventListener('keydown', handler);
  root._cleanup = () => window.removeEventListener('keydown', handler);
});
