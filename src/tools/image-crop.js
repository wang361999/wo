/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>裁剪 / 旋转</h2><span class="hint">本地 canvas</span></div>
    <div class="t-drop" id="drop" style="min-height:76px"><div class="t">拖一张图进来</div><div class="s">点一下选择，或 Ctrl+V</div><input type="file" id="file" accept="image/*" hidden></div>
    <div class="t-row" style="margin:12px 0;flex-wrap:wrap">
      <select class="t-select" id="ratio" style="width:auto"><option value="0">自由</option><option value="1">1:1 方图</option><option value="0.75">3:4</option><option value="1.3333">4:3</option><option value="0.5625">9:16</option><option value="1.7778">16:9</option></select>
      <button class="t-btn" type="button" id="rotL">↺ 左转</button><button class="t-btn" type="button" id="rotR">↻ 右转</button>
      <button class="t-btn" type="button" id="flipH">⇋ 水平</button><button class="t-btn" type="button" id="flipV">⇅ 垂直</button>
      <button class="t-btn" type="button" id="round">圆形裁剪</button><button class="t-btn primary" type="button" id="dl" style="width:auto">下载裁剪图</button>
    </div>
    <canvas id="cv" width="720" height="480" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;cursor:crosshair;touch-action:none"></canvas>
    <p class="t-hint">拖一个框选裁剪区域，松开后右侧出预览；圆形裁剪会把四角变透明（导出 PNG）。</p>
  </section><section class="t-panel"><div class="t-head"><h2><span class="step">2</span>裁剪预览</h2></div><div class="t-preview" id="prev">等待框选</div></section></div>`;
  const $ = (s) => root.querySelector(s), cv = $('#cv'), g = cv.getContext('2d');
  let im = null, rot = 0, fh = false, fv = false, box = null, drawing = false, a = null, circle = false;
  const draw = () => {
    if (!im) return;
    const w = im.naturalWidth, h = im.naturalHeight;
    const swap = rot % 180 !== 0;
    cv.width = swap ? h : w; cv.height = swap ? w : h;
    g.save(); g.translate(cv.width / 2, cv.height / 2); g.rotate(rot * Math.PI / 180); g.scale(fh ? -1 : 1, fv ? -1 : 1);
    g.drawImage(im, -w / 2, -h / 2); g.restore();
    if (box) { g.strokeStyle = '#b4552d'; g.lineWidth = 2; g.strokeRect(box.x, box.y, box.w, box.h); }
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) * cv.width / r.width), y: Math.round((e.clientY - r.top) * cv.height / r.height) }; };
  const preview = () => {
    if (!box || !im) return;
    let { x, y, w, h } = box;
    const ratio = Number($('#ratio').value);
    if (ratio) { const r = ratio; if (w / h > r) { const nw = h * r; x += (w - nw) / 2; w = nw; } else { const nh = w / r; y += (h - nh) / 2; h = nh; } }
    const c2 = L.canvasOf(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), g2 = c2.getContext('2d');
    g2.drawImage(cv, x, y, w, h, 0, 0, c2.width, c2.height);
    if (circle) { g2.globalCompositeOperation = 'destination-in'; g2.beginPath(); g2.arc(c2.width / 2, c2.height / 2, Math.min(c2.width, c2.height) / 2, 0, Math.PI * 2); g2.fill(); g2.globalCompositeOperation = 'source-over'; }
    $('#prev').innerHTML = ''; const out = L.canvasOf(c2.width, c2.height); out.getContext('2d').drawImage(c2, 0, 0);
    const img = new Image(); img.src = c2.toDataURL('image/png'); img.style.maxHeight = '260px'; $('#prev').appendChild(img);
    root._out = out;
  };
  const setImg = async (f) => { im = await L.imageFromFile(f); rot = 0; fh = fv = false; box = null; draw(); };
  cv.addEventListener('pointerdown', (e) => { if (!im) return; drawing = true; a = pt(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pt(e); box = { x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w: Math.abs(p.x - a.x), h: Math.abs(p.y - a.y) }; draw(); });
  cv.addEventListener('pointerup', () => { drawing = false; preview(); });
  $('#rotL').onclick = () => { rot = (rot + 270) % 360; box = null; draw(); };
  $('#rotR').onclick = () => { rot = (rot + 90) % 360; box = null; draw(); };
  $('#flipH').onclick = () => { fh = !fh; draw(); };
  $('#flipV').onclick = () => { fv = !fv; draw(); };
  $('#round').onclick = () => { circle = !circle; K.toast(circle ? '圆形裁剪已开' : '已关闭'); preview(); };
  $('#ratio').onchange = preview;
  $('#dl').onclick = () => { if (root._out) K.canvasDownload(root._out, '裁剪.png'); else K.canvasDownload(cv, '裁剪.png'); };
  $('#file').onchange = () => $('#file').files[0] && setImg($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && setImg(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) setImg(f); });
  K.setAction('下载裁剪图', () => $('#dl').click());
});
