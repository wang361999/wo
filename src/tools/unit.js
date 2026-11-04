/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const groups = D.unitsKeys;
  const opt = (arr, sel) => arr.map((x) => `<option value="${L.esc(x)}" ${x === sel ? 'selected' : ''}>${L.esc(x)}</option>`).join('');
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>单位换算</h2><span class="hint">${L.esc(String(groups.length))} 组 · 内置精简表</span></div>
    <div class="t-row">
      <select class="t-select" id="u-g">${opt(groups)}</select>
      <input class="t-input grow" id="u-n" type="number" value="1" step="any">
      <select class="t-select" id="u-f"></select>
      <span class="t-label" style="margin:0 6px">→</span>
      <select class="t-select" id="u-t"></select>
    </div>
    <div class="t-out" id="u-out" style="font-size:22px;font-weight:700;margin-top:14px">—</div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="u-copy">复制结果</button><button type="button" class="t-btn" id="u-swap">交换单位</button></div>
    <div class="t-refwrap" id="u-all" style="margin-top:14px"></div>
    <p class="t-hint">换算系数是内置精简值，涉及精确计量请以标准为准。</p>
  </section></div>`;
  const g = root.querySelector('#u-g'), f = root.querySelector('#u-f'), t = root.querySelector('#u-t'), n = root.querySelector('#u-n'), out = root.querySelector('#u-out'), all = root.querySelector('#u-all');
  const fill = () => { const list = D.units[g.value].map((x) => x[0]); const a = f.value, b = t.value; f.innerHTML = opt(list, a); t.innerHTML = opt(list, b); if (!list.includes(f.value)) f.value = list[0]; if (!list.includes(t.value)) t.value = list[1] || list[0]; };
  const run = () => {
    try { const r = L.convertUnit(Number(n.value), f.value, t.value, g.value); out.textContent = `${L.fmt(Number(n.value), 6)} ${f.value} = ${L.fmt(r, 8)} ${t.value}`;
      const base = D.units[g.value].map((x) => [x[0], L.convertUnit(Number(n.value), f.value, x[0], g.value)]);
      all.innerHTML = `<table class="t-table"><thead><tr><th>换算到</th><th>结果</th></tr></thead><tbody>${base.map((x) => `<tr><td>${L.esc(x[0])}</td><td>${L.fmt(x[1], 8)}</td></tr>`).join('')}</tbody></table>`;
    } catch (e) { out.textContent = '出错了：' + e.message; }
  };
  g.addEventListener('change', () => { fill(); run(); });
  [f, t].forEach((x) => x.addEventListener('change', run));
  n.addEventListener('input', run);
  root.querySelector('#u-copy').onclick = () => K.copy(out.textContent);
  root.querySelector('#u-swap').onclick = () => { const a = f.value; f.value = t.value; t.value = a; run(); };
  K.setAction('换算', run);
  fill(); run();
});
