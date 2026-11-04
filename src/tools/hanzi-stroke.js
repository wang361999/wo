/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>汉字笔顺 · 描红练习</h2><span class="hint">手写轨迹 + 回放</span></div>
    <div class="t-hint" style="padding:10px;background:#f6efe3;border-radius:8px;margin-bottom:12px">这个工具<b>不内置官方笔顺数据</b>（那需要逐字笔画库）。它做的是真实的另一半：田字格里给出浅灰范字，你用鼠标/手指在上面写，记录每一笔轨迹，可逐笔回放、撤销、清除。标准笔顺请对着字帖或教材，这里负责让你练手写和对照。</div>
    <div class="t-row"><input class="t-input" id="hs-char" value="永" maxlength="1" style="width:70px;font-size:24px;text-align:center"><button type="button" class="t-btn" id="hs-undo">↶ 撤销一笔</button><button type="button" class="t-btn" id="hs-replay">▶ 逐笔回放</button><button type="button" class="t-btn" id="hs-clear">清空</button><button type="button" class="t-btn" id="hs-png">导出 PNG</button></div>
    <canvas id="hs-cv" width="360" height="360" style="display:block;margin:14px auto;background:#fff;border:2px solid #b4552d;border-radius:6px;touch-action:none;cursor:crosshair;max-width:100%"></canvas>
    <div class="t-hint" id="hs-info" style="text-align:center">已写 0 笔</div>
  </section></div>`;
  const cv = root.querySelector('#hs-cv'), g = cv.getContext('2d'), char = root.querySelector('#hs-char'), info = root.querySelector('#hs-info');
  let strokes = [], cur = null, drawing = false;
  const grid = () => {
    g.clearRect(0, 0, 360, 360); g.strokeStyle = '#e2c9b8'; g.lineWidth = 1; g.setLineDash([6, 5]);
    g.beginPath(); g.moveTo(180, 0); g.lineTo(180, 360); g.moveTo(0, 180); g.lineTo(360, 180); g.moveTo(0, 0); g.lineTo(360, 360); g.moveTo(360, 0); g.lineTo(0, 360); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#b4552d'; g.lineWidth = 2; g.strokeRect(1, 1, 358, 358);
    g.fillStyle = '#e8e2d8'; g.font = '260px KaiTi, STKaiti, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(char.value || '永', 180, 188);
    g.strokeStyle = '#2f2b26'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    strokes.forEach((s) => { if (s.length < 2) return; g.beginPath(); g.moveTo(s[0].x, s[0].y); s.slice(1).forEach((p) => g.lineTo(p.x, p.y)); g.stroke(); });
    info.textContent = `已写 ${strokes.length} 笔　·　范字「${L.esc(char.value || '永')}」`;
  };
  const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * 360 / b.width, y: (e.clientY - b.top) * 360 / b.height }; };
  cv.addEventListener('pointerdown', (e) => { drawing = true; cur = [pos(e)]; strokes.push(cur); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; cur.push(pos(e)); grid(); });
  cv.addEventListener('pointerup', () => { drawing = false; grid(); });
  char.addEventListener('input', grid);
  root.querySelector('#hs-undo').onclick = () => { strokes.pop(); grid(); };
  root.querySelector('#hs-clear').onclick = () => { strokes = []; grid(); };
  root.querySelector('#hs-replay').onclick = async () => { const saved = strokes; strokes = []; grid(); for (const s of saved) { for (let i = 1; i <= s.length; i++) { strokes = [s.slice(0, i)]; grid(); await new Promise((r) => setTimeout(r, 12)); } } strokes = saved; grid(); };
  root.querySelector('#hs-png').onclick = () => K.canvasDownload(cv, '描红-' + (char.value || '字') + '.png');
  K.setAction('逐笔回放', () => root.querySelector('#hs-replay').click());
  grid();
});
