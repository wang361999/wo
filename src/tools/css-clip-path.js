/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const PRESETS = {
    '矩形 inset': 'inset(10% 10% 10% 10% round 20px)', '圆形': 'circle(45% at 50% 50%)', '椭圆': 'ellipse(40% 30% at 50% 50%)',
    '三角形': 'polygon(50% 0%, 0% 100%, 100% 100%)', '五角星': 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    '箭头': 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)',
    '对话气泡': 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 12% 100%, 10% 75%, 0% 75%)',
    '菱形': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', '六边形': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    '斜切': 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
  };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>CSS 剪切路径</h2><span class="hint">预设 + 自定义 polygon · 实时预览</span></div>
    <div class="t-row"><select class="t-select" id="cp-preset">${Object.keys(PRESETS).map((k) => `<option value="${L.esc(k)}">${L.esc(k)}</option>`).join('')}</select><button type="button" class="t-btn primary" id="cp-copy">复制 CSS</button></div>
    <div class="t-row" style="margin:12px 0"><input class="t-input grow" id="cp-val" value="${L.esc(PRESETS['五角星'])}"><label class="t-check"><input type="checkbox" id="cp-dots" checked>显示顶点</label></div>
    <div style="display:flex;justify-content:center;background:#f7f3ea;border-radius:8px;padding:20px;overflow:hidden"><div id="cp-shape" style="width:280px;height:280px;background:linear-gradient(135deg,#b4552d,#c98a4b);position:relative"></div></div>
    <div class="t-hint" style="margin-top:10px">在预览框里点一下可以给 polygon 追加一个顶点（按百分比记录）；改上面的输入框也能直接写任意 clip-path。</div>
  </section></div>`;
  const preset = root.querySelector('#cp-preset'), val = root.querySelector('#cp-val'), shape = root.querySelector('#cp-shape'), dots = root.querySelector('#cp-dots');
  const draw = () => { shape.style.clipPath = val.value; shape.innerHTML = ''; if (dots.checked && val.value.startsWith('polygon')) { const pts = val.value.replace(/^polygon\(|\)$/g, '').split(',').map((s) => s.trim().split(/\s+/).map((x) => parseFloat(x))); pts.forEach((p, i) => { if (!isFinite(p[0]) || !isFinite(p[1])) return; const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${p[0]}%;top:${p[1]}%;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #2f2b26;transform:translate(-50%,-50%);font-size:9px;text-align:center;line-height:9px`; d.textContent = i; shape.appendChild(d); }); } };
  preset.onchange = () => { val.value = PRESETS[preset.value]; draw(); };
  val.addEventListener('input', () => { preset.value = ''; draw(); });
  dots.onchange = draw;
  shape.addEventListener('click', (e) => { if (!val.value.startsWith('polygon')) { K.toast('先选一个 polygon 预设才能加顶点'); return; } const b = shape.getBoundingClientRect(), x = L.round((e.clientX - b.left) / b.width * 100, 1), y = L.round((e.clientY - b.top) / b.height * 100, 1); const inner = val.value.replace(/^polygon\(|\)$/g, ''); val.value = `polygon(${inner}, ${x}% ${y}%)`; preset.value = ''; draw(); });
  root.querySelector('#cp-copy').onclick = () => K.copy(`clip-path: ${val.value};`);
  K.setAction('复制 CSS', () => root.querySelector('#cp-copy').click());
  draw();
});
