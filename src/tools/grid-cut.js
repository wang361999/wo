/* 九宫格切图：从原单页成品整体迁入，功能未做删减（拖动定位 / 缩放 / 六种预设 / 原生 ZIP 打包）。 */
import { cropWindow, sliceImage, canvasToBytes, triggerDownload, clamp } from '/lib/slice.js';
import { buildZip } from '/lib/zip.js';
import { setAction } from '/kit.js';

const HTML = `
<div class="gc-tool">
  <div id="drop" class="drop" role="button" tabindex="0" aria-label="选择或拖入图片">
    <div class="drop-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.6">
        <rect x="4" y="6" width="40" height="36" rx="4"/><path d="M4 32l10-10 8 8 8-11 14 15"/><circle cx="31" cy="16" r="3.5"/>
      </svg>
    </div>
    <p class="drop-title">点这里选图，或直接把图片拖进来</p>
    <p class="drop-hint">也可以直接 <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>V</kbd> 粘贴截图 · 支持 JPG / PNG / WebP 等浏览器能打开的格式</p>
    <input id="file" type="file" accept="image/*" hidden>
  </div>
  <div id="workspace" hidden>
    <div class="cols">
      <div class="panel">
        <div class="panel-head"><h2>调整画面</h2><button id="btnChange" class="link-btn" type="button">换一张图</button></div>
        <div class="stage-wrap"><canvas id="stage" aria-label="切图预览，可拖动调整位置"></canvas></div>
        <p class="drag-tip">在图上<b>按住拖动</b>可移动取景位置；<b>滚轮</b>或下方滑块可缩放</p>
        <div class="ctrl-row">
          <label class="ctrl-label" for="zoom">缩放 <span id="zoomVal">1.00×</span></label>
          <input id="zoom" type="range" min="1" max="3" step="0.01" value="1">
          <button id="btnReset" class="ghost-btn" type="button">还原位置</button>
        </div>
        <div class="ctrl-block">
          <p class="ctrl-label">切几格</p><div id="presets" class="chips"></div>
          <div class="custom-grid">
            <label>行 <input id="rows" type="number" min="1" max="8" value="3"></label>
            <label>列 <input id="cols" type="number" min="1" max="8" value="3"></label>
            <span class="custom-hint">1–8 之间，自己填也行</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>切好的图</h2><span id="outInfo" class="out-info"></span></div>
        <div id="thumbs" class="thumbs"></div>
        <div class="export">
          <button id="btnZip" class="primary-btn" type="button">打包下载全部（按编号命名）</button>
          <p class="export-hint">压缩包里是 <code>01.png</code>、<code>02.png</code>…… 选图时按这个顺序点，发出去就是对的。</p>
        </div>
        <div class="opts">
          <div class="opt"><label for="outSize">每张尺寸</label><select id="outSize">
            <option value="720">720 px</option><option value="1080" selected>1080 px（推荐）</option>
            <option value="1440">1440 px</option><option value="origin">跟随原图</option></select></div>
          <div class="opt"><label for="pad">留白边距</label><select id="pad">
            <option value="0" selected>无留白</option><option value="0.02">窄（2%）</option><option value="0.05">宽（5%）</option></select></div>
          <div class="opt"><span class="opt-label">背景色</span><div class="radios">
            <label><input type="radio" name="bg" value="#ffffff" checked><i class="sw" style="background:#fff"></i>白</label>
            <label><input type="radio" name="bg" value="#f6f1e6"><i class="sw" style="background:#f6f1e6"></i>米</label>
            <label><input type="radio" name="bg" value="#1c1b19"><i class="sw" style="background:#1c1b19"></i>黑</label></div></div>
          <div class="opt"><span class="opt-label">格式</span><div class="radios">
            <label><input type="radio" name="fmt" value="image/png" checked>PNG</label>
            <label><input type="radio" name="fmt" value="image/jpeg">JPG</label></div>
            <p id="jpgHint" class="tiny-hint" hidden>JPG 体积更小，但不支持透明。</p></div>
        </div>
      </div>
    </div>
    <p id="status" class="status" role="status" aria-live="polite"></p>
  </div>
</div>`;

const PRESETS = [
  { label: '九宫格 3×3', rows: 3, cols: 3 }, { label: '四宫格 2×2', rows: 2, cols: 2 },
  { label: '横三连 1×3', rows: 1, cols: 3 }, { label: '竖三连 3×1', rows: 3, cols: 1 },
  { label: '六宫格 2×3', rows: 2, cols: 3 }, { label: '横二连 1×2', rows: 1, cols: 2 },
];

export default function mount(root) {
  root.innerHTML = HTML;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const state = { img: null, objUrl: null, fileName: 'image', rows: 3, cols: 3,
    zoom: 1, offsetX: 0, offsetY: 0, outSize: '1080', padRatio: 0, bg: '#ffffff',
    format: 'image/png', quality: 0.92, win: null };

  const status = (msg, kind = '') => { const el = $('#status'); el.textContent = msg; el.className = `status ${kind}`; };
  const ext = () => state.format === 'image/jpeg' ? 'jpg' : 'png';
  const currentWin = () => cropWindow(state.img.naturalWidth, state.img.naturalHeight, state.zoom, state.offsetX, state.offsetY);
  const realOutSize = (win) => state.outSize !== 'origin' ? Number(state.outSize) : Math.max(1, Math.round(win.side / Math.min(state.rows, state.cols)));
  const padOf = (size) => Math.round(size * state.padRatio);

  function loadImage(file) {
    if (!file || !file.type.startsWith('image/')) { status('请选择图片文件（JPG / PNG / WebP 等）', 'err'); return; }
    if (state.objUrl) URL.revokeObjectURL(state.objUrl);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.img = img; state.objUrl = url;
      state.fileName = (file.name || '图片').replace(/\.[^.]+$/, '');
      state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
      $('#zoom').value = '1'; $('#zoomVal').textContent = '1.00×';
      $('#drop').hidden = true; $('#workspace').hidden = false;
      syncPreset(); renderAll();
      status(`已载入 ${img.naturalWidth}×${img.naturalHeight}，在图上拖动可调整位置`, 'ok');
    };
    img.onerror = () => { URL.revokeObjectURL(url); status('这张图读不出来，换一张试试', 'err'); };
    img.src = url;
  }

  function renderStage() {
    const canvas = $('#stage');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    if (!cssW) return;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssW * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const win = currentWin(); state.win = win;
    ctx.clearRect(0, 0, cssW, cssW);
    ctx.drawImage(state.img, win.sx, win.sy, win.side, win.side, 0, 0, cssW, cssW);
    const line = (x1, y1, x2, y2) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
    };
    for (let c = 1; c < state.cols; c++) line(cssW * c / state.cols, 0, cssW * c / state.cols, cssW);
    for (let r = 1; r < state.rows; r++) line(0, cssW * r / state.rows, cssW, cssW * r / state.rows);
    const cellW = cssW / state.cols, cellH = cssW / state.rows;
    const fs = Math.max(11, Math.min(16, cssW / 26));
    ctx.font = `600 ${fs}px -apple-system, "PingFang SC", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < state.rows; r++) for (let c = 0; c < state.cols; c++) {
      const n = r * state.cols + c + 1;
      const cx = c * cellW + cellW / 2, cy = r * cellH + fs * 1.35;
      const label = String(n).padStart(2, '0'), w = fs * 2.2;
      ctx.fillStyle = 'rgba(20,20,20,.62)';
      ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - fs * 0.85, w, fs * 1.7, fs * 0.5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(label, cx, cy + 0.5);
    }
  }

  let rafPending = false;
  function renderThumbs() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!state.img) return;
      const grid = $('#thumbs'), win = currentWin(), size = 320;
      const cells = sliceImage(state.img, state.rows, state.cols, win, size, '#ffffff', padOf(size));
      grid.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0, 1fr))`;
      grid.replaceChildren();
      for (const cell of cells) {
        const box = document.createElement('div'); box.className = 'thumb';
        cell.canvas.className = 'thumb-canvas';
        const badge = document.createElement('span'); badge.className = 'thumb-badge';
        badge.textContent = String(cell.index).padStart(2, '0');
        const dl = document.createElement('button'); dl.className = 'thumb-dl'; dl.type = 'button';
        dl.textContent = '保存这张'; dl.addEventListener('click', () => downloadOne(cell.index));
        box.append(cell.canvas, badge, dl); grid.append(box);
      }
      const s = realOutSize(win), cw = win.side / state.cols, chh = win.side / state.rows;
      const scale = s / Math.max(cw, chh), total = state.rows * state.cols;
      $('#outInfo').textContent = `${total} 张 · 每张约 ${Math.round(cw * scale) + padOf(s) * 2}×${Math.round(chh * scale) + padOf(s) * 2} px · 按 01 → ${String(total).padStart(2, '0')} 的顺序发`;
    });
  }
  const renderAll = () => { if (state.img) { renderStage(); renderThumbs(); } };
  const makeFullCells = () => { const win = currentWin(), size = realOutSize(win);
    return { cells: sliceImage(state.img, state.rows, state.cols, win, size, state.bg, padOf(size)), win }; };

  async function downloadOne(index) {
    if (!state.img) return;
    try {
      const { cells } = makeFullCells(), cell = cells.find((c) => c.index === index);
      const bytes = await canvasToBytes(cell.canvas, state.format, state.quality);
      triggerDownload(new Blob([bytes], { type: state.format }), `${state.fileName}_${String(index).padStart(2, '0')}.${ext()}`);
      status(`已保存第 ${String(index).padStart(2, '0')} 张`, 'ok');
    } catch (e) { status(`保存失败：${e.message}`, 'err'); }
  }
  async function downloadAll() {
    if (!state.img) return;
    const btn = $('#btnZip'); btn.disabled = true; status('正在生成图片并打包…');
    try {
      const { cells } = makeFullCells(), entries = [];
      for (const cell of cells) {
        const bytes = await canvasToBytes(cell.canvas, state.format, state.quality);
        entries.push({ name: `${String(cell.index).padStart(2, '0')}.${ext()}`, data: bytes });
      }
      triggerDownload(buildZip(entries), `${state.fileName}_${state.rows}x${state.cols}_${entries.length}张.zip`);
      status(`打包好了：${entries.length} 张，按 01 → ${String(entries.length).padStart(2, '0')} 的顺序发`, 'ok');
    } catch (e) { status(`打包失败：${e.message}`, 'err'); }
    finally { btn.disabled = false; }
  }

  function syncPreset() {
    $$('#presets button').forEach((b) => b.classList.toggle('active',
      Number(b.dataset.rows) === state.rows && Number(b.dataset.cols) === state.cols));
  }

  const input = $('#file'), drop = $('#drop');
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { if (input.files?.[0]) loadImage(input.files[0]); input.value = ''; });
  $('#btnChange').addEventListener('click', () => input.click());
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) loadImage(f); });
  ['dragover', 'drop'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault()));
  document.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f && f.type.startsWith('image/')) loadImage(f); });
  document.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((it) => it.type.startsWith('image/'));
    if (item) loadImage(item.getAsFile());
  });

  for (const p of PRESETS) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = p.label;
    b.dataset.rows = p.rows; b.dataset.cols = p.cols;
    b.addEventListener('click', () => { state.rows = p.rows; state.cols = p.cols;
      $('#rows').value = p.rows; $('#cols').value = p.cols; syncPreset(); renderAll(); });
    $('#presets').append(b);
  }
  syncPreset();
  const customChange = () => {
    state.rows = clamp(parseInt($('#rows').value, 10) || 1, 1, 8);
    state.cols = clamp(parseInt($('#cols').value, 10) || 1, 1, 8);
    $('#rows').value = state.rows; $('#cols').value = state.cols; syncPreset(); renderAll();
  };
  $('#rows').addEventListener('change', customChange);
  $('#cols').addEventListener('change', customChange);
  $('#zoom').addEventListener('input', (e) => { state.zoom = Number(e.target.value);
    $('#zoomVal').textContent = `${state.zoom.toFixed(2)}×`; renderAll(); });
  $('#btnReset').addEventListener('click', () => { state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
    $('#zoom').value = '1'; $('#zoomVal').textContent = '1.00×'; renderAll(); });
  $('#outSize').addEventListener('change', (e) => { state.outSize = e.target.value; renderThumbs(); });
  $('#pad').addEventListener('change', (e) => { state.padRatio = Number(e.target.value); renderThumbs(); });
  $$('[name=bg]').forEach((r) => r.addEventListener('change', (e) => { state.bg = e.target.value; renderThumbs(); }));
  $$('[name=fmt]').forEach((r) => r.addEventListener('change', (e) => { state.format = e.target.value;
    $('#jpgHint').hidden = state.format !== 'image/jpeg'; }));
  $('#btnZip').addEventListener('click', downloadAll);

  const stage = $('#stage'); let dragging = false, lastX = 0, lastY = 0;
  stage.addEventListener('pointerdown', (e) => { if (!state.img) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    stage.setPointerCapture(e.pointerId); stage.classList.add('dragging'); });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging || !state.img) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const win = state.win || currentWin(), rect = stage.getBoundingClientRect();
    if (win.maxX > 0) state.offsetX = clamp(state.offsetX - (2 * dx * win.side) / (rect.width * win.maxX), -1, 1);
    if (win.maxY > 0) state.offsetY = clamp(state.offsetY - (2 * dy * win.side) / (rect.height * win.maxY), -1, 1);
    renderStage(); renderThumbs();
  });
  const stop = () => { dragging = false; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', stop); stage.addEventListener('pointercancel', stop);
  stage.addEventListener('wheel', (e) => { if (!state.img) return; e.preventDefault();
    state.zoom = clamp(state.zoom - Math.sign(e.deltaY) * 0.08, 1, 3);
    $('#zoom').value = String(state.zoom); $('#zoomVal').textContent = `${state.zoom.toFixed(2)}×`; renderAll();
  }, { passive: false });
  window.addEventListener('resize', renderStage);

  setAction('打包下载全部', () => { if (!state.img) { status('先放一张图进来', 'err'); return; } downloadAll(); });
}
