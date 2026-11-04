/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>键盘测试</h2><span class="hint">按哪亮哪 · 找失灵键 / 测无冲</span></div>
    <div class="t-row"><select class="t-select" id="kb-layout"><option value="87">87 键</option><option value="104">104 键</option><option value="mac">Mac 布局</option></select><button type="button" class="t-btn" id="kb-reset">重置</button><span class="t-hint" id="kb-stat"></span></div>
    <div id="kb-board" style="display:flex;flex-direction:column;gap:4px;margin:14px 0;font-size:11px"></div>
    <div class="t-hint" id="kb-msg">按住多个键看能同时识别几个（无冲）；快速连点同一个键可以观察有没有连击/抖动。</div>
  </section></div>`;
  const board = root.querySelector('#kb-board'), stat = root.querySelector('#kb-stat'), msg = root.querySelector('#kb-msg'), layout = root.querySelector('#kb-layout');
  const ROWS = ['`1234567890-=', 'qwertyuiop[]\\', "asdfghjkl;'", 'zxcvbnm,./'];
  const KEYS = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
  let down = new Set(), maxChord = 0, tested = new Set(), lastTime = {}, dbl = 0;
  const draw = () => {
    board.innerHTML = [KEYS, ...ROWS].map((row, ri) => `<div style="display:flex;gap:4px;justify-content:center">${[...row].map((k) => `<span class="t-chip ${down.has(k.toLowerCase()) ? 'on' : ''}" data-kb="${L.esc(k.toLowerCase())}" style="min-width:30px;text-align:center;padding:5px 2px;${tested.has(k.toLowerCase()) ? 'border:1px solid #7d9a76' : ''}">${L.esc(k)}</span>`).join('')}</div>`).join('') + `<div style="display:flex;gap:4px;justify-content:center"><span class="t-chip" data-kb=" " style="min-width:200px;text-align:center;padding:5px">Space</span><span class="t-chip" data-kb="shift" style="padding:5px">Shift</span><span class="t-chip" data-kb="control" style="padding:5px">Ctrl</span><span class="t-chip" data-kb="alt" style="padding:5px">Alt</span><span class="t-chip" data-kb="enter" style="padding:5px">Enter</span></div>`;
    stat.textContent = `同时按下 ${down.size} 键 · 最大 ${maxChord} 键无冲 · 已测 ${tested.size} 键 · 疑似连击 ${dbl} 次`;
  };
  const keyOf = (e) => { let k = e.key.toLowerCase(); if (k === ' ') k = ' '; return k; };
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea,select')) return;
    const k = keyOf(e); down.add(k); tested.add(k); maxChord = Math.max(maxChord, down.size);
    const now = Date.now(); if (lastTime[k] && now - lastTime[k] < 45) dbl++; lastTime[k] = now;
    msg.textContent = `当前：${L.esc(e.key)}　code=${L.esc(e.code)}　keyCode=${e.keyCode}　${e.repeat ? '（repeat 自动重复）' : ''}`;
    draw(); e.preventDefault();
  });
  document.addEventListener('keyup', (e) => { down.delete(keyOf(e)); draw(); });
  root.querySelector('#kb-reset').onclick = () => { down = new Set(); maxChord = 0; tested = new Set(); dbl = 0; draw(); };
  K.setAction('重置', () => root.querySelector('#kb-reset').click());
  draw();
});
