/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>Emoji 与符号</h2><span class="hint">点一下复制 · 内置 ${L.D.emoji.length} 项</span></div>
    <input class="t-input" id="q" type="search" placeholder="搜 笑 / 心 / 箭头 / 动物 / 庆祝 / 警告">
    <div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;margin-top:14px"></div>
    <p class="t-hint">点击复制符号，双击可收藏（仅本次会话）。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const draw = () => {
    const k = ($('#q').value || '').trim();
    const rows = L.D.emoji.filter((r) => !k || r.join(' ').includes(k));
    $('#grid').innerHTML = rows.slice(0, 300).map((r) => `<button type="button" class="t-chip" data-e="${L.esc(r[0])}" title="${L.esc(r[1])} ${L.esc(r[2])}" style="font-size:24px;padding:8px 4px">${r[0]}</button>`).join('') || '<p class="t-hint">没找到。</p>';
  };
  $('#q').oninput = draw;
  $('#grid').onclick = (e) => { const b = e.target.closest('[data-e]'); if (b) K.copy(b.dataset.e); };
  draw();
});
