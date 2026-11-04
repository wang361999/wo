/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const KEY = 'yiyegongju.flashcard.v1';
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>记忆卡片</h2><span class="hint">一行一张：问题 | 答案 | 分组</span></div>
    <textarea class="t-textarea" id="fc-src" rows="5" placeholder="apple | 苹果 | 单词\nHTTP 404 | 资源未找到 | 网络\n光合作用 | 植物把光能转成化学能 | 生物">apple | 苹果 | 单词\nHTTP 404 | 资源未找到 | 网络\n光合作用 | 植物把光能转成化学能 | 生物\nTCP | 传输控制协议 | 网络</textarea>
    <div class="t-row" style="margin:12px 0"><select class="t-select" id="fc-group"><option value="">全部分组</option></select><button type="button" class="t-btn" id="fc-shuffle">洗牌</button><button type="button" class="t-btn" id="fc-reset">重置掌握</button><span class="t-hint" id="fc-prog"></span></div>
    <div id="fc-card" style="min-height:180px;background:#f3eee6;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-size:22px;cursor:pointer;user-select:none"></div>
    <div class="t-actions" style="margin-top:12px;justify-content:center"><button type="button" class="t-btn" id="fc-prev">← 上一张</button><button type="button" class="t-btn primary" id="fc-flip">翻面</button><button type="button" class="t-btn" id="fc-next">下一张 →</button><button type="button" class="t-btn" id="fc-know">✓ 已掌握</button></div>
    <div class="t-hint" style="margin-top:10px" id="fc-back"></div>
  </section></div>`;
  const src = root.querySelector('#fc-src'), card = root.querySelector('#fc-card'), group = root.querySelector('#fc-group'), prog = root.querySelector('#fc-prog'), back = root.querySelector('#fc-back');
  let cards = [], idx = 0, flipped = false, known = {};
  try { known = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { known = {}; }
  const parse = () => L.nonEmptyLines(src.value).map((l, i) => { const p = l.split('|').map((x) => x.trim()); return { id: i, q: p[0] || '?', a: p[1] || '（没写答案）', g: p[2] || '默认' }; });
  const rebuild = () => { cards = parse(); const gs = [...new Set(cards.map((x) => x.g))]; const cur = group.value; group.innerHTML = '<option value="">全部分组</option>' + gs.map((x) => `<option value="${L.esc(x)}">${L.esc(x)}</option>`).join(''); group.value = gs.includes(cur) ? cur : ''; idx = 0; flipped = false; show(); };
  const active = () => group.value ? cards.filter((x) => x.g === group.value) : cards;
  const show = () => { const a = active(); if (!a.length) { card.textContent = '没有卡片，先在上面按「问题 | 答案 | 分组」写几行'; prog.textContent = ''; return; } idx = L.clamp(idx, 0, a.length - 1); const c = a[idx]; card.textContent = flipped ? c.a : c.q; card.style.background = flipped ? '#e6efe3' : '#f3eee6'; prog.textContent = `${idx + 1} / ${a.length}　已掌握 ${a.filter((x) => known[x.g + '|' + x.q]).length} 张`; back.textContent = flipped ? '答案面 · 点卡片也能翻回去' : '问题面 · 点卡片翻开答案'; };
  const flip = () => { flipped = !flipped; show(); };
  src.addEventListener('input', rebuild);
  group.addEventListener('change', () => { idx = 0; flipped = false; show(); });
  card.onclick = flip;
  root.querySelector('#fc-flip').onclick = flip;
  root.querySelector('#fc-prev').onclick = () => { idx--; flipped = false; show(); };
  root.querySelector('#fc-next').onclick = () => { idx++; flipped = false; show(); };
  root.querySelector('#fc-know').onclick = () => { const a = active(); if (!a.length) return; const c = a[idx]; known[c.g + '|' + c.q] = 1; localStorage.setItem(KEY, JSON.stringify(known)); idx++; flipped = false; show(); K.toast('已标记掌握'); };
  root.querySelector('#fc-shuffle').onclick = () => { cards = L.shuffle(cards); idx = 0; flipped = false; show(); };
  root.querySelector('#fc-reset').onclick = () => { known = {}; localStorage.removeItem(KEY); show(); };
  K.setAction('翻面 / 下一张', () => { if (!flipped) flip(); else root.querySelector('#fc-next').click(); });
  rebuild();
});
