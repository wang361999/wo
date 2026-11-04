/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>翻卡配对</h2><span class="hint">计时 / 步数</span></div>
    <div class="t-row"><select class="t-select" id="mm-size"><option value="3x4">3×4（6 对）</option><option value="4x4">4×4（8 对）</option><option value="4x5">4×5（10 对）</option><option value="6x6">6×6（18 对）</option></select><button type="button" class="t-btn primary" id="mm-new">重新开局</button><span class="t-hint" id="mm-stat"></span></div>
    <div id="mm-grid" style="display:grid;gap:8px;margin:14px 0;max-width:520px"></div>
    <p class="t-hint">翻开两张一样的就配对成功。四档难度只是网格和牌数不同。</p>
  </section></div>`;
  const grid = root.querySelector('#mm-grid'), size = root.querySelector('#mm-size'), stat = root.querySelector('#mm-stat');
  const EMOJI = ['🍎', '🍊', '🍇', '🍉', '🍓', '🍒', '🥝', '🍑', '🥑', '🍍', '🌽', '🥕', '🍄', '🌰', '🍯', '🧀', '🍞', '🥨'];
  let deck = [], open = [], matched = new Set(), moves = 0, t0 = 0, tick = null, lock = false;
  const newGame = () => {
    const [r, c] = size.value.split('x').map(Number), pairs = Math.floor(r * c / 2);
    deck = L.shuffle([...EMOJI.slice(0, pairs), ...EMOJI.slice(0, pairs)].map((e, i) => ({ e, id: i })));
    open = []; matched = new Set(); moves = 0; lock = false; clearInterval(tick); t0 = Date.now();
    grid.style.gridTemplateColumns = `repeat(${c},1fr)`; draw();
    tick = setInterval(() => { stat.textContent = `步数 ${moves}　·　用时 ${Math.floor((Date.now() - t0) / 1000)} 秒　·　配对 ${matched.size / 2}/${pairs}`; }, 500);
    stat.textContent = `步数 0　·　配对 0/${pairs}`;
  };
  const draw = () => { grid.innerHTML = deck.map((d, i) => `<button type="button" class="t-btn" data-mm="${i}" style="height:64px;font-size:28px;${matched.has(i) || open.includes(i) ? 'background:#f3eee6' : 'background:#b4552d;color:transparent'}">${matched.has(i) || open.includes(i) ? d.e : '?'}</button>`).join(''); };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mm]'); if (!b || lock) return;
    const i = Number(b.dataset.mm); if (matched.has(i) || open.includes(i)) return;
    open.push(i); draw();
    if (open.length === 2) { moves++; lock = true; const [a, c] = open; if (deck[a].e === deck[c].e) { matched.add(a); matched.add(c); open = []; lock = false; draw(); if (matched.size === deck.length) { clearInterval(tick); stat.textContent = `🎉 全部配对！${moves} 步 / ${Math.floor((Date.now() - t0) / 1000)} 秒`; } } else setTimeout(() => { open = []; lock = false; draw(); }, 700); }
  });
  root.querySelector('#mm-new').onclick = newGame; size.onchange = newGame;
  K.setAction('重新开局', newGame); newGame();
});
