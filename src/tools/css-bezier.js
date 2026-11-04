/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>cubic-bezier 缓动曲线</h2><span class="hint">拖控制点 · 动画预览 · 复制 CSS</span></div>
    <div class="t-row"><select class="t-select" id="bz-preset"><option value="">自定义</option><option value="0.25,0.1,0.25,1">ease</option><option value="0,0,1,1">linear</option><option value="0.42,0,1,1">ease-in</option><option value="0,0,0.58,1">ease-out</option><option value="0.42,0,0.58,1">ease-in-out</option><option value="0.4,0,0.2,1">Material 标准</option><option value="0.34,1.56,0.64,1">回弹</option><option value="0.68,-0.55,0.27,1.55">强回弹</option></select><input class="t-input grow" id="bz-val" value="0.25,0.1,0.25,1"><button type="button" class="t-btn primary" id="bz-copy">复制 CSS</button><button type="button" class="t-btn" id="bz-play">▶ 播动画</button></div>
    <div class="t-row" style="margin-top:14px;align-items:flex-start"><svg id="bz-svg" width="260" height="260" viewBox="0 0 260 260" style="background:#f7f3ea;border-radius:8px;flex:none"><line x1="30" y1="230" x2="230" y2="230" stroke="#c9c0b2"/><line x1="30" y1="230" x2="30" y2="30" stroke="#c9c0b2"/><path id="bz-path" d="" fill="none" stroke="#b4552d" stroke-width="3"/><line id="bz-l1" stroke="#6b8fa8" stroke-width="1"/><line id="bz-l2" stroke="#6b8fa8" stroke-width="1"/><circle id="bz-p1" r="9" fill="#b4552d" style="cursor:grab"/><circle id="bz-p2" r="9" fill="#b4552d" style="cursor:grab"/></svg>
      <div style="flex:1;min-width:200px"><div class="t-hint">动画预览</div><div style="height:120px;background:#f7f3ea;border-radius:8px;position:relative;overflow:hidden;margin-top:6px"><div id="bz-ball" style="position:absolute;top:44px;left:10px;width:36px;height:36px;border-radius:50%;background:#b4552d"></div></div><div class="t-hint" id="bz-note" style="margin-top:10px"></div></div></div>
    <p class="t-hint">横轴时间、纵轴进度，两个控制点可以拖出画布外（回弹效果需要 y &lt; 0 或 &gt; 1）。</p>
  </section></div>`;
  const svg = root.querySelector('#bz-svg'), p1 = root.querySelector('#bz-p1'), p2 = root.querySelector('#bz-p2'), path = root.querySelector('#bz-path'), l1 = root.querySelector('#bz-l1'), l2 = root.querySelector('#bz-l2'), val = root.querySelector('#bz-val'), preset = root.querySelector('#bz-preset'), ball = root.querySelector('#bz-ball'), note = root.querySelector('#bz-note');
  let xy = [0.25, 0.1, 0.25, 1], drag = null;
  const X = (t) => 30 + t * 200, Y = (v) => 230 - v * 200;
  const draw = () => {
    const [x1, y1, x2, y2] = xy;
    p1.setAttribute('cx', X(x1)); p1.setAttribute('cy', Y(y1)); p2.setAttribute('cx', X(x2)); p2.setAttribute('cy', Y(y2));
    path.setAttribute('d', `M30,230 C${X(x1)},${Y(y1)} ${X(x2)},${Y(y2)} 230,30`);
    l1.setAttribute('x1', 30); l1.setAttribute('y1', 230); l1.setAttribute('x2', X(x1)); l1.setAttribute('y2', Y(y1));
    l2.setAttribute('x1', 230); l2.setAttribute('y1', 30); l2.setAttribute('x2', X(x2)); l2.setAttribute('y2', Y(y2));
    val.value = xy.map((n) => L.round(n, 2)).join(',');
    note.textContent = `transition: all .6s cubic-bezier(${val.value});`;
    ball.style.transition = 'none'; ball.style.left = '10px';
  };
  const parseVal = () => { const a = String(val.value).split(',').map((x) => Number(x.trim())); if (a.length === 4 && a.every((x) => isFinite(x))) { xy = a; preset.value = ''; draw(); } };
  val.addEventListener('input', parseVal);
  preset.onchange = () => { if (preset.value) { xy = preset.value.split(',').map(Number); draw(); } };
  const down = (e, which) => { drag = which; e.preventDefault(); };
  p1.addEventListener('pointerdown', (e) => down(e, 1)); p2.addEventListener('pointerdown', (e) => down(e, 2));
  svg.addEventListener('pointermove', (e) => { if (!drag) return; const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * 260 / b.width, y = (e.clientY - b.top) * 260 / b.height; if (drag === 1) { xy[0] = L.clamp((x - 30) / 200, 0, 1); xy[1] = L.round((230 - y) / 200, 2); } else { xy[2] = L.clamp((x - 30) / 200, 0, 1); xy[3] = L.round((230 - y) / 200, 2); } preset.value = ''; draw(); });
  svg.addEventListener('pointerup', () => { drag = null; });
  root.querySelector('#bz-copy').onclick = () => K.copy(`transition: all .6s cubic-bezier(${val.value});`);
  root.querySelector('#bz-play').onclick = () => { ball.style.transition = 'none'; ball.style.left = '10px'; requestAnimationFrame(() => { ball.style.transition = `left .9s cubic-bezier(${val.value})`; ball.style.left = 'calc(100% - 46px)'; }); };
  K.setAction('▶ 播动画', () => root.querySelector('#bz-play').click());
  draw();
});
