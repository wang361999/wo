/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const KEY = 'yiyegongju.notes.v1', COLORS = ['#f6e6b8', '#d9e9d2', '#f2d4cf', '#d7e3f2', '#eadcf2'];
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(items));
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>便签本</h2><span class="hint">点便签直接改，自动保存</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="nt-add">＋ 新便签</button><button type="button" class="t-btn" id="nt-copy">复制全部</button></div>
    <div id="nt-wrap" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:14px"></div>
    <p class="t-hint">提示音用 WebAudio 在本机合成，不加载外部音频。</p>
  </section></div>`;
  const wrap = root.querySelector('#nt-wrap');
  const draw = () => {
    wrap.innerHTML = items.length ? items.map((n) => `<div style="background:${n.color};border-radius:6px;padding:12px;min-height:130px;box-shadow:0 2px 8px #0001;position:relative">
      <textarea data-ntext="${n.id}" style="width:100%;height:92px;border:0;background:transparent;resize:none;font:inherit;color:#2f2b26;outline:none">${L.esc(n.text)}</textarea>
      <div style="font-size:11px;opacity:.6">${new Date(n.at).toLocaleString('zh-CN')}</div>
      <button type="button" class="t-btn" data-ncopy="${n.id}" style="position:absolute;top:6px;right:26px;padding:2px 7px">复制</button>
      <button type="button" class="t-btn" data-ndel="${n.id}" style="position:absolute;top:6px;right:4px;padding:2px 7px">×</button>
    </div>`).join('') : '<p class="t-hint">还没有便签，点上面「＋ 新便签」。</p>';
  };
  root.querySelector('#nt-add').onclick = () => { items.unshift({ id: Date.now() + Math.random(), text: '', color: COLORS[items.length % COLORS.length], at: Date.now() }); save(); draw(); wrap.querySelector('textarea')?.focus(); };
  root.querySelector('#nt-copy').onclick = () => K.copy(items.map((n) => n.text).filter(Boolean).join('\n\n---\n\n'));
  root.addEventListener('input', (e) => { const t = e.target.closest('[data-ntext]'); if (t) { const n = items.find((x) => String(x.id) === t.dataset.ntext); if (n) { n.text = t.value; n.at = Date.now(); save(); } } });
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-ncopy]'); if (c) { const n = items.find((x) => String(x.id) === c.dataset.ncopy); if (n) K.copy(n.text); return; }
    const d = e.target.closest('[data-ndel]'); if (d) { items = items.filter((x) => String(x.id) !== d.dataset.ndel); save(); draw(); }
  });
  K.setAction('＋ 新便签', () => root.querySelector('#nt-add').click());
  draw();
});
