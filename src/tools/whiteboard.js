/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>画板</h2><span class="hint">鼠标 / 触屏都能画</span></div>
    <div class="t-row" style="margin-bottom:10px">
      <select class="t-select" id="tool" style="width:auto"><option>画笔</option><option>矩形</option><option>箭头</option><option>便签</option><option>文字</option><option>橡皮</option></select>
      <input class="t-input" type="color" id="color" value="#b4552d" style="width:52px;padding:3px;height:36px">
      <input class="t-range" type="range" id="size" min="1" max="14" value="3" style="width:110px">
      <button class="t-btn" type="button" id="undo">撤销</button><button class="t-btn" type="button" id="clear">清空</button>
      <button class="t-btn" type="button" id="png">导出 PNG</button><button class="t-btn" type="button" id="svg">导出 SVG</button>
    </div>
    <canvas id="cv" width="1000" height="560" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#fff;touch-action:none;cursor:crosshair"></canvas>
    <p class="t-hint">便签 / 文字工具点一下画布会弹出输入框；所有笔迹留在本机内存里，导出后关掉页面就没了。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const cv = $('#cv'), g = cv.getContext('2d'); let ops = [], drawing = false, start = null;
  const redraw = () => {
    g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    for (const o of ops) {
      g.save(); g.strokeStyle = o.color; g.fillStyle = o.color; g.lineWidth = o.size; g.lineCap = 'round'; g.lineJoin = 'round';
      if (o.type === '画笔' || o.type === '橡皮') { g.globalCompositeOperation = o.type === '橡皮' ? 'destination-out' : 'source-over'; g.beginPath(); o.pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); }
      else if (o.type === '矩形') g.strokeRect(o.a.x, o.a.y, o.b.x - o.a.x, o.b.y - o.a.y);
      else if (o.type === '箭头') { g.beginPath(); g.moveTo(o.a.x, o.a.y); g.lineTo(o.b.x, o.b.y); g.stroke(); const an = Math.atan2(o.b.y - o.a.y, o.b.x - o.a.x); g.beginPath(); g.moveTo(o.b.x, o.b.y); g.lineTo(o.b.x - 12 * Math.cos(an - .4), o.b.y - 12 * Math.sin(an - .4)); g.lineTo(o.b.x - 12 * Math.cos(an + .4), o.b.y - 12 * Math.sin(an + .4)); g.closePath(); g.fill(); }
      else if (o.type === '便签') { g.globalAlpha = .85; g.fillStyle = '#f6e2b8'; g.fillRect(o.a.x, o.a.y, 160, 90); g.globalAlpha = 1; g.fillStyle = '#4a3b2a'; g.font = '15px sans-serif'; (o.text || '').split('\n').forEach((t, i) => g.fillText(t, o.a.x + 10, o.a.y + 24 + i * 20)); }
      else if (o.type === '文字') { g.font = `${14 + o.size * 2}px sans-serif`; g.fillText(o.text || '', o.a.x, o.a.y); }
      g.restore();
    }
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', (e) => {
    const p = pt(e), type = $('#tool').value;
    if (type === '便签' || type === '文字') { const t = prompt(type === '便签' ? '便签内容（可换行）' : '输入文字', type === '便签' ? '写点什么' : '文字'); if (t) { ops.push({ type, a: p, color: $('#color').value, size: Number($('#size').value), text: t }); redraw(); } return; }
    drawing = true; start = p; cv.setPointerCapture(e.pointerId);
    ops.push({ type, a: p, b: p, color: $('#color').value, size: Number($('#size').value), pts: [p] });
  });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const o = ops[ops.length - 1], p = pt(e); o.b = p; if (o.pts) o.pts.push(p); redraw(); });
  cv.addEventListener('pointerup', () => { drawing = false; });
  $('#undo').onclick = () => { ops.pop(); redraw(); };
  $('#clear').onclick = () => { ops = []; redraw(); };
  $('#png').onclick = () => K.canvasDownload(cv, '白板.png');
  $('#svg').onclick = () => {
    const inner = ops.map((o) => {
      const c = o.color;
      if (o.type === '矩形') return `<rect x="${o.a.x}" y="${o.a.y}" width="${o.b.x - o.a.x}" height="${o.b.y - o.a.y}" fill="none" stroke="${c}" stroke-width="${o.size}"/>`;
      if (o.type === '箭头') return `<line x1="${o.a.x}" y1="${o.a.y}" x2="${o.b.x}" y2="${o.b.y}" stroke="${c}" stroke-width="${o.size}"/>`;
      if (o.type === '文字' || o.type === '便签') return `<text x="${o.a.x + 8}" y="${o.a.y + 22}" fill="#3d3328" font-size="15">${L.esc(o.text || '')}</text>`;
      return `<polyline points="${(o.pts || []).map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${o.size}"/>`;
    }).join('');
    K.download('白板.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cv.width} ${cv.height}"><rect width="100%" height="100%" fill="#fff"/>${inner}</svg>`, 'image/svg+xml');
  };
  K.setAction('导出 PNG', () => $('#png').click());
  redraw();
});
