/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const KEY = 'yiyegongju.sticky.v1';
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>便签墙</h2><span class="hint">拖动 · 旋转 · 本地保存</span></div>
    <div class="t-row"><select class="t-select" id="sb-theme"><option value="软木板">软木板</option><option value="暗棕扑克">暗棕扑克</option><option value="工坊洞洞板">工坊洞洞板</option></select><button type="button" class="t-btn primary" id="sb-add">＋ 便签</button><button type="button" class="t-btn" id="sb-full">全屏专注</button><button type="button" class="t-btn" id="sb-clear">清空</button></div>
    <div id="sb-board" style="position:relative;height:460px;border-radius:8px;overflow:hidden;margin-top:14px;background:#c8a878"></div>
    <p class="t-hint">按住便签拖动，双击编辑文字；拖动右下角的小三角缩放，右键旋转。内容存在本机浏览器里。</p>
  </section></div>`;
  const board = root.querySelector('#sb-board'), theme = root.querySelector('#sb-theme');
  const BG = { '软木板': '#c8a878', '暗棕扑克': '#3c5140', '工坊洞洞板': '#a8a49c repeating-radial-gradient(#8d8981 2px,transparent 3px) 0 0/24px 24px' };
  let notes = []; try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { notes = [] }
  const save = () => localStorage.setItem(KEY, JSON.stringify(notes));
  const COLORS = ['#f6e6b8', '#d9e9d2', '#f2d4cf', '#d7e3f2', '#eadcf2'];
  const draw = () => {
    board.style.background = theme.value === '工坊洞洞板' ? 'radial-gradient(#8d8981 2px,#a8a49c 3px) 0 0/24px 24px' : BG[theme.value];
    board.innerHTML = notes.map((n) => `<div data-sb="${n.id}" style="position:absolute;left:${n.x}px;top:${n.y}px;transform:rotate(${n.rot}deg) scale(${n.s});transform-origin:top left;width:150px;min-height:120px;background:${n.color};padding:12px;border-radius:3px;box-shadow:0 4px 12px #0003;cursor:grab;font-size:14px;line-height:1.5"><div data-sbtext="${n.id}" style="min-height:88px;white-space:pre-wrap">${L.esc(n.text)}</div><div style="position:absolute;right:2px;bottom:1px;cursor:nwse-resize;opacity:.5" data-sbres="${n.id}">◢</div></div>`).join('');
  };
  let drag = null;
  board.addEventListener('pointerdown', (e) => {
    const res = e.target.closest('[data-sbres]'), card = e.target.closest('[data-sb]'); if (!card) return;
    const n = notes.find((x) => String(x.id) === card.dataset.sb); if (!n) return;
    drag = { n, x0: e.clientX, y0: e.clientY, nx: n.x, ny: n.y, ns: n.s, mode: res ? 'size' : 'move' };
    card.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointermove', (e) => { if (!drag) return; const dx = (e.clientX - drag.x0), dy = (e.clientY - drag.y0); if (drag.mode === 'size') drag.n.s = L.clamp(drag.ns + dx / 300, 0.6, 1.8); else { drag.n.x = L.clamp(drag.nx + dx, 0, board.clientWidth - 60); drag.n.y = L.clamp(drag.ny + dy, 0, board.clientHeight - 40); } drag.n.rot = drag.n.rot; draw(); });
  board.addEventListener('pointerup', () => { if (drag) { save(); drag = null; } });
  board.addEventListener('dblclick', (e) => { const c = e.target.closest('[data-sb]'); if (!c) return; const n = notes.find((x) => String(x.id) === c.dataset.sb); if (!n) return; const t = prompt('便签内容：', n.text); if (t !== null) { n.text = t; save(); draw(); } });
  board.addEventListener('contextmenu', (e) => { const c = e.target.closest('[data-sb]'); if (!c) return; e.preventDefault(); const n = notes.find((x) => String(x.id) === c.dataset.sb); n.rot = (n.rot || 0) + 8; save(); draw(); });
  root.querySelector('#sb-add').onclick = () => { notes.push({ id: Date.now() + Math.random(), text: '新便签', color: COLORS[notes.length % COLORS.length], x: 30 + (notes.length * 30) % 400, y: 30 + (notes.length * 25) % 280, rot: (notes.length % 5 - 2) * 3, s: 1 }); save(); draw(); };
  root.querySelector('#sb-clear').onclick = () => { notes = []; save(); draw(); };
  root.querySelector('#sb-full').onclick = () => { if (board.requestFullscreen) board.requestFullscreen(); };
  theme.onchange = draw;
  K.setAction('＋ 便签', () => root.querySelector('#sb-add').click());
  if (!notes.length) { notes.push({ id: 1, text: '双击我改文字\n拖我可以移动', color: COLORS[0], x: 60, y: 50, rot: -3, s: 1 }); notes.push({ id: 2, text: '右键旋转\n右下角 ◢ 缩放', color: COLORS[2], x: 260, y: 120, rot: 4, s: 1 }); save(); }
  draw();
});
