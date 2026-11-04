/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const SEL = (id, label, opts) => `<label class="t-label">${label} <select class="t-select" data-css="${id}">${opts.map((o) => `<option value="${o}">${o}</option>`).join('')}</select></label>`;
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>Flexbox / Grid 可视化</h2><span class="hint">调属性 → 实时预览 → 复制 CSS</span></div>
    <div class="t-row"><select class="t-select" id="fx-kind"><option value="flex">Flexbox</option><option value="grid">Grid</option></select><button type="button" class="t-btn primary" id="fx-copy">复制 CSS</button><button type="button" class="t-btn" id="fx-n">＋ 一个子项</button><button type="button" class="t-btn" id="fx-preset">常用预设</button></div>
    <div class="t-row" style="flex-wrap:wrap;margin:12px 0" id="fx-controls">
      ${SEL('flex-direction', '方向', ['row', 'row-reverse', 'column', 'column-reverse'])}
      ${SEL('justify-content', '主轴', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'])}
      ${SEL('align-items', '交叉轴', ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'])}
      ${SEL('flex-wrap', '换行', ['nowrap', 'wrap', 'wrap-reverse'])}
      ${SEL('gap', '间距', ['0', '8px', '16px', '24px'])}
      ${SEL('grid-template-columns', '列', ['repeat(3, 1fr)', 'repeat(2, 1fr)', 'repeat(4, 1fr)', '1fr 2fr', 'auto auto auto'])}
    </div>
    <div id="fx-preview" style="min-height:220px;background:#f7f3ea;border-radius:8px;padding:14px;display:flex;gap:8px"></div>
    <pre class="t-out" id="fx-code" style="margin-top:12px;white-space:pre-wrap;font-size:12px"></pre>
  </section></div>`;
  const kind = root.querySelector('#fx-kind'), preview = root.querySelector('#fx-preview'), code = root.querySelector('#fx-code'), controls = root.querySelector('#fx-controls');
  let n = 4;
  const vals = () => { const v = { display: kind.value }; controls.querySelectorAll('[data-css]').forEach((s) => { v[s.dataset.css] = s.value; }); return v; };
  const draw = () => {
    const v = vals();
    const used = kind.value === 'grid' ? { display: 'grid', 'grid-template-columns': v['grid-template-columns'], gap: v.gap, 'align-items': v['align-items'] } : { display: 'flex', 'flex-direction': v['flex-direction'], 'justify-content': v['justify-content'], 'align-items': v['align-items'], 'flex-wrap': v['flex-wrap'], gap: v.gap };
    Object.entries(used).forEach(([k, x]) => { preview.style[k] = x; });
    preview.innerHTML = Array.from({ length: n }, (_, i) => `<div style="background:${['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062'][i % 6]};color:#fff;border-radius:6px;padding:14px 18px;font-weight:700;min-width:60px;text-align:center">${i + 1}</div>`).join('');
    code.textContent = '.container {\n' + Object.entries(used).map(([k, x]) => `  ${k}: ${x};`).join('\n') + '\n}';
    controls.querySelectorAll('[data-css]').forEach((s) => { const isGrid = s.dataset.css === 'grid-template-columns'; s.parentElement.style.opacity = (kind.value === 'grid' ? isGrid || ['gap', 'align-items'].includes(s.dataset.css) : !isGrid) ? '1' : '.4'; });
  };
  controls.addEventListener('change', draw);
  kind.onchange = draw;
  root.querySelector('#fx-n').onclick = () => { n = Math.min(12, n + 1); draw(); };
  root.querySelector('#fx-preset').onclick = () => { const p = [['居中三列', 'grid', 'repeat(3, 1fr)', '16px'], ['两端对齐', 'flex', '', '8px'], ['纵向堆叠', 'flex', '', '8px']][Math.floor(Math.random() * 3)]; kind.value = p[1]; controls.querySelector('[data-css="gap"]').value = p[3]; if (p[2]) controls.querySelector('[data-css="grid-template-columns"]').value = p[2]; if (p[0] === '两端对齐') controls.querySelector('[data-css="justify-content"]').value = 'space-between'; if (p[0] === '纵向堆叠') controls.querySelector('[data-css="flex-direction"]').value = 'column'; draw(); K.toast('已套用：' + p[0]); };
  root.querySelector('#fx-copy').onclick = () => K.copy(code.textContent);
  K.setAction('复制 CSS', () => root.querySelector('#fx-copy').click());
  draw();
});
