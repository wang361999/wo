/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>图片打码</h2><span class="hint">拖框选区 · 或按住涂抹</span></div>
    <div class="t-drop" id="drop" style="min-height:80px"><div class="t">拖一张图进来，或点一下选择</div><div class="s">也可以 Ctrl+V 粘贴</div><input type="file" id="file" accept="image/*" hidden></div>
    <div class="t-row" style="margin:12px 0">
      <select class="t-select" id="mode" style="width:auto"><option>马赛克</option><option>高斯模糊</option><option>纯色块</option></select>
      <input class="t-range" type="range" id="size" min="6" max="60" value="18" style="width:130px"><span class="t-hint" id="sv" style="margin:0">18 px</span>
      <button class="t-btn" type="button" id="undo">撤销</button><button class="t-btn" type="button" id="reset">还原</button><button class="t-btn primary" type="button" id="dl" style="width:auto">下载 PNG</button>
    </div>
    <canvas id="cv" width="720" height="480" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;cursor:crosshair;touch-action:none"></canvas>
    <p class="t-hint">在图上按住鼠标拖一个矩形，松开即对该区域打码；多选区可叠加。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s), cv = $('#cv'), g = cv.getContext('2d');
  let orig = null, drawing = false, a = null;
  const setImg = async (f) => {
    const im = await L.imageFromFile(f);
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    g.drawImage(im, 0, 0); orig = g.getImageData(0, 0, cv.width, cv.height);
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) * cv.width / r.width), y: Math.round((e.clientY - r.top) * cv.height / r.height) }; };
  const apply = (p1, p2) => {
    if (!orig) return;
    const x = L.clamp(Math.min(p1.x, p2.x), 0, cv.width), y = L.clamp(Math.min(p1.y, p2.y), 0, cv.height);
    const w = L.clamp(Math.abs(p2.x - p1.x), 1, cv.width - x), h = L.clamp(Math.abs(p2.y - p1.y), 1, cv.height - y);
    if (w < 3 || h < 3) return;
    const cell = Number($('#size').value) || 18, mode = $('#mode').value;
    const tmp = L.canvasOf(w, h), tg = tmp.getContext('2d');
    tg.putImageData(orig, -x, -y);
    if (mode === '高斯模糊') { tg.filter = `blur(${Math.max(2, cell / 2)}px)`; tg.drawImage(tmp, 0, 0); tg.filter = 'none'; }
    else if (mode === '纯色块') { tg.fillStyle = '#3d3328'; tg.fillRect(0, 0, w, h); }
    else { const small = L.canvasOf(Math.max(1, Math.ceil(w / cell)), Math.max(1, Math.ceil(h / cell))); small.getContext('2d').drawImage(tmp, 0, 0, small.width, small.height); tg.imageSmoothingEnabled = false; tg.clearRect(0, 0, w, h); tg.drawImage(small, 0, 0, w, h); }
    g.drawImage(tmp, x, y);
  };
  cv.addEventListener('pointerdown', (e) => { if (!orig) return; drawing = true; a = pt(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (drawing) { const p = pt(e); g.putImageData(orig, 0, 0); const r = cv.getBoundingClientRect(); } });
  cv.addEventListener('pointerup', (e) => { if (drawing) { drawing = false; apply(a, pt(e)); } });
  $('#size').oninput = () => { $('#sv').textContent = $('#size').value + ' px'; };
  $('#undo').onclick = () => { if (orig) g.putImageData(orig, 0, 0); };
  $('#reset').onclick = () => { if (orig) g.putImageData(orig, 0, 0); };
  $('#dl').onclick = () => { if (orig) K.canvasDownload(cv, '打码.png'); };
  $('#file').onchange = () => $('#file').files[0] && setImg($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && setImg(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) setImg(f); });
  K.setAction('下载 PNG', () => $('#dl').click());
});
