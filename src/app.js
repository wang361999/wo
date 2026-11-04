import { cropWindow, sliceImage, canvasToBytes, triggerDownload, clamp } from './slice.js';
import { buildZip } from './zip.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  img: null,
  objUrl: null,
  fileName: 'image',
  rows: 3,
  cols: 3,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  outSize: '1080',
  padRatio: 0,
  bg: '#ffffff',
  format: 'image/png',
  quality: 0.92,
  win: null,
};

const PRESETS = [
  { label: '九宫格 3×3', rows: 3, cols: 3 },
  { label: '四宫格 2×2', rows: 2, cols: 2 },
  { label: '横三连 1×3', rows: 1, cols: 3 },
  { label: '竖三连 3×1', rows: 3, cols: 1 },
  { label: '六宫格 2×3', rows: 2, cols: 3 },
  { label: '横二连 1×2', rows: 1, cols: 2 },
];

function status(msg, kind = '') {
  const el = $('#status');
  el.textContent = msg;
  el.className = `status ${kind}`;
}

function ext() {
  return state.format === 'image/jpeg' ? 'jpg' : 'png';
}

function currentWin() {
  return cropWindow(
    state.img.naturalWidth, state.img.naturalHeight,
    state.zoom, state.offsetX, state.offsetY
  );
}

function realOutSize(win) {
  if (state.outSize !== 'origin') return Number(state.outSize);
  return Math.max(1, Math.round(win.side / Math.min(state.rows, state.cols)));
}

function padOf(size) {
  return Math.round(size * state.padRatio);
}

// ---------- 载入图片 ----------
function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    status('请选择图片文件（JPG / PNG / WebP 等）', 'err');
    return;
  }
  if (state.objUrl) URL.revokeObjectURL(state.objUrl);
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.img = img;
    state.objUrl = url;
    state.fileName = (file.name || '图片').replace(/\.[^.]+$/, '');
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    $('#zoom').value = '1';
    $('#zoomVal').textContent = '1.00×';
    $('#drop').hidden = true;
    $('#workspace').hidden = false;
    syncPreset();
    renderAll();
    status(`已载入 ${img.naturalWidth}×${img.naturalHeight}，在图上拖动可调整位置`, 'ok');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    status('这张图读不出来，换一张试试', 'err');
  };
  img.src = url;
}

// ---------- 预览（所见即所得） ----------
function renderStage() {
  const canvas = $('#stage');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  if (!cssW) return;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const win = currentWin();
  state.win = win;
  ctx.clearRect(0, 0, cssW, cssW);
  ctx.drawImage(state.img, win.sx, win.sy, win.side, win.side, 0, 0, cssW, cssW);

  // 网格分割线：双色描边，深浅底上都看得清
  const line = (x1, y1, x2, y2) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  };
  for (let c = 1; c < state.cols; c++) {
    const x = (cssW * c) / state.cols;
    line(x, 0, x, cssW);
  }
  for (let r = 1; r < state.rows; r++) {
    const y = (cssW * r) / state.rows;
    line(0, y, cssW, y);
  }

  // 序号角标
  const cellW = cssW / state.cols;
  const cellH = cssW / state.rows;
  const fs = Math.max(11, Math.min(16, cssW / 26));
  ctx.font = `600 ${fs}px -apple-system, "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const n = r * state.cols + c + 1;
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + fs * 1.35;
      const label = String(n).padStart(2, '0');
      const w = fs * 2.2;
      ctx.fillStyle = 'rgba(20,20,20,.62)';
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - fs * 0.85, w, fs * 1.7, fs * 0.5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, cx, cy + 0.5);
    }
  }
}

let rafPending = false;
function renderThumbs() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (!state.img) return;
    const grid = $('#thumbs');
    const win = currentWin();
    const size = 320;
    const cells = sliceImage(
      state.img, state.rows, state.cols, win, size,
      state.bg !== '#transparent' ? state.bg : '#ffffff',
      padOf(size)
    );
    grid.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0, 1fr))`;
    grid.replaceChildren();
    for (const cell of cells) {
      const box = document.createElement('div');
      box.className = 'thumb';
      cell.canvas.className = 'thumb-canvas';
      const badge = document.createElement('span');
      badge.className = 'thumb-badge';
      badge.textContent = String(cell.index).padStart(2, '0');
      const dl = document.createElement('button');
      dl.className = 'thumb-dl';
      dl.type = 'button';
      dl.textContent = '保存这张';
      dl.addEventListener('click', () => downloadOne(cell.index));
      box.append(cell.canvas, badge, dl);
      grid.append(box);
    }
    $('#outInfo').textContent = describeOutput(win);
  });
}

function describeOutput(win) {
  const size = realOutSize(win);
  const cw = win.side / state.cols;
  const chh = win.side / state.rows;
  const scale = size / Math.max(cw, chh);
  const w = Math.round(cw * scale) + padOf(size) * 2;
  const h = Math.round(chh * scale) + padOf(size) * 2;
  const total = state.rows * state.cols;
  return `${total} 张 · 每张约 ${w}×${h} px · 按 01 → ${String(total).padStart(2, '0')} 的顺序发`;
}

function renderAll() {
  if (!state.img) return;
  renderStage();
  renderThumbs();
}

// ---------- 导出 ----------
function makeFullCells() {
  const win = currentWin();
  const size = realOutSize(win);
  return { cells: sliceImage(state.img, state.rows, state.cols, win, size, state.bg, padOf(size)), win };
}

async function downloadOne(index) {
  if (!state.img) return;
  try {
    const { cells } = makeFullCells();
    const cell = cells.find((c) => c.index === index);
    const bytes = await canvasToBytes(cell.canvas, state.format, state.quality);
    triggerDownload(new Blob([bytes], { type: state.format }),
      `${state.fileName}_${String(index).padStart(2, '0')}.${ext()}`);
    status(`已保存第 ${String(index).padStart(2, '0')} 张`, 'ok');
  } catch (e) {
    status(`保存失败：${e.message}`, 'err');
  }
}

async function downloadAll() {
  if (!state.img) return;
  const btn = $('#btnZip');
  btn.disabled = true;
  status('正在生成图片并打包…');
  try {
    const { cells } = makeFullCells();
    const entries = [];
    for (const cell of cells) {
      const bytes = await canvasToBytes(cell.canvas, state.format, state.quality);
      entries.push({
        name: `${String(cell.index).padStart(2, '0')}.${ext()}`,
        data: bytes,
      });
    }
    const zip = buildZip(entries);
    triggerDownload(zip, `${state.fileName}_${state.rows}x${state.cols}_${entries.length}张.zip`);
    status(`打包好了：${entries.length} 张，按 01 → ${String(entries.length).padStart(2, '0')} 的顺序发`, 'ok');
  } catch (e) {
    status(`打包失败：${e.message}`, 'err');
  } finally {
    btn.disabled = false;
  }
}

// ---------- 交互绑定 ----------
function syncPreset() {
  $$('#presets button').forEach((b) => {
    b.classList.toggle('active',
      Number(b.dataset.rows) === state.rows && Number(b.dataset.cols) === state.cols);
  });
}

function bind() {
  const input = $('#file');
  const drop = $('#drop');

  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files?.[0]) loadImage(input.files[0]);
    input.value = '';
  });
  $('#btnChange').addEventListener('click', () => input.click());

  ['dragenter', 'dragover'].forEach((t) =>
    drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) =>
    drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) loadImage(f);
  });
  // 上传后上传区会隐藏，用全局拖拽保证任何时候都能拖张新图进来替换
  ['dragover', 'drop'].forEach((t) =>
    document.addEventListener(t, (e) => e.preventDefault()));
  document.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) loadImage(f);
  });
  // 粘贴截图：最顺手的入口
  document.addEventListener('paste', (e) => {
    const items = [...(e.clipboardData?.items || [])];
    const item = items.find((it) => it.type.startsWith('image/'));
    if (item) loadImage(item.getAsFile());
  });

  // 预设网格
  const presetBox = $('#presets');
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.label;
    b.dataset.rows = p.rows;
    b.dataset.cols = p.cols;
    b.addEventListener('click', () => {
      state.rows = p.rows;
      state.cols = p.cols;
      $('#rows').value = p.rows;
      $('#cols').value = p.cols;
      syncPreset();
      renderAll();
    });
    presetBox.append(b);
  }
  syncPreset();

  const customChange = () => {
    state.rows = clamp(parseInt($('#rows').value, 10) || 1, 1, 8);
    state.cols = clamp(parseInt($('#cols').value, 10) || 1, 1, 8);
    $('#rows').value = state.rows;
    $('#cols').value = state.cols;
    syncPreset();
    renderAll();
  };
  $('#rows').addEventListener('change', customChange);
  $('#cols').addEventListener('change', customChange);

  $('#zoom').addEventListener('input', (e) => {
    state.zoom = Number(e.target.value);
    $('#zoomVal').textContent = `${state.zoom.toFixed(2)}×`;
    renderAll();
  });
  $('#btnReset').addEventListener('click', () => {
    state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
    $('#zoom').value = '1'; $('#zoomVal').textContent = '1.00×';
    renderAll();
  });

  $('#outSize').addEventListener('change', (e) => { state.outSize = e.target.value; renderThumbs(); });
  $('#pad').addEventListener('change', (e) => { state.padRatio = Number(e.target.value); renderThumbs(); });
  $$('[name=bg]').forEach((r) => r.addEventListener('change', (e) => {
    state.bg = e.target.value; renderThumbs();
  }));
  $$('[name=fmt]').forEach((r) => r.addEventListener('change', (e) => {
    state.format = e.target.value;
    $('#jpgHint').hidden = state.format !== 'image/jpeg';
  }));

  $('#btnZip').addEventListener('click', downloadAll);

  // 在预览图上拖动定位
  const stage = $('#stage');
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (!state.img) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging || !state.img) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const win = state.win || currentWin();
    const rect = stage.getBoundingClientRect();
    if (win.maxX > 0) {
      state.offsetX = clamp(state.offsetX - (2 * dx * win.side) / (rect.width * win.maxX), -1, 1);
    }
    if (win.maxY > 0) {
      state.offsetY = clamp(state.offsetY - (2 * dy * win.side) / (rect.height * win.maxY), -1, 1);
    }
    renderStage();
    renderThumbs();
  });
  const stop = () => { dragging = false; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('wheel', (e) => {
    if (!state.img) return;
    e.preventDefault();
    state.zoom = clamp(state.zoom - Math.sign(e.deltaY) * 0.08, 1, 3);
    $('#zoom').value = String(state.zoom);
    $('#zoomVal').textContent = `${state.zoom.toFixed(2)}×`;
    renderAll();
  }, { passive: false });

  window.addEventListener('resize', renderStage);
}

bind();
