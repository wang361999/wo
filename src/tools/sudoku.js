/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数独</h2><span class="hint">唯一解 · 不用猜</span></div>
    <div class="t-row"><select class="t-select" id="sd-lv"><option value="30">简单</option><option value="40" selected>中等</option><option value="50">困难</option><option value="58">专家</option></select><button type="button" class="t-btn primary" id="sd-new">新题</button><button type="button" class="t-btn" id="sd-hint">提示一格</button><button type="button" class="t-btn" id="sd-check">检查</button><span class="t-hint" id="sd-stat"></span></div>
    <div id="sd-grid" style="display:grid;grid-template-columns:repeat(9,1fr);gap:1px;background:#8a8073;border:2px solid #8a8073;width:min(100%,400px);margin:14px auto"></div>
    <div class="t-row" style="justify-content:center"><span class="t-label">选数字：</span>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="t-btn" data-sdnum="${n}" style="width:38px;padding:6px 0">${n}</button>`).join('')}<button type="button" class="t-btn" data-sdnum="0">×</button></div>
    <p class="t-hint">先点一个格子，再点下面的数字填入。题目用回溯生成并挖洞，保证唯一解；提示会讲这一格为什么只能填这个数。</p>
  </section></div>`;
  const grid = root.querySelector('#sd-grid'), stat = root.querySelector('#sd-stat'), lv = root.querySelector('#sd-lv');
  let puzzle = [], solution = [], board = [], fixed = new Set(), sel = -1, t0 = 0, tick = null;
  const ok = (b, i, n) => { const r = Math.floor(i / 9), c = i % 9; for (let k = 0; k < 9; k++) { if (b[r * 9 + k] === n || b[k * 9 + c] === n) return false; } const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (b[(br + x) * 9 + bc + y] === n) return false; return true; };
  const solve = (b) => { const i = b.indexOf(0); if (i < 0) return true; for (let n = 1; n <= 9; n++) if (ok(b, i, n)) { b[i] = n; if (solve(b)) return true; b[i] = 0; } return false; };
  const count = (b, lim = 2) => { const i = b.indexOf(0); if (i < 0) return 1; let total = 0; for (let n = 1; n <= 9; n++) if (ok(b, i, n)) { b[i] = n; total += count(b, lim); b[i] = 0; if (total >= lim) break; } return total; };
  const gen = () => {
    const b = Array(81).fill(0); const fill = (p) => { if (p === 81) return true; const nums = L.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]); for (const n of nums) if (ok(b, p, n)) { b[p] = n; if (fill(p + 1)) return true; b[p] = 0; } return false; }; fill(0);
    solution = [...b]; puzzle = [...b];
    const order = L.shuffle(Array.from({ length: 81 }, (_, i) => i)); let removed = 0;
    for (const i of order) { if (removed >= Number(lv.value)) break; const save = puzzle[i]; puzzle[i] = 0; if (count([...puzzle], 2) !== 1) puzzle[i] = save; else removed++; }
    board = [...puzzle]; fixed = new Set(puzzle.map((x, i) => x ? i : -1).filter((i) => i >= 0)); sel = -1;
    clearInterval(tick); t0 = Date.now(); tick = setInterval(() => { stat.textContent = `用时 ${Math.floor((Date.now() - t0) / 1000)} 秒　·　已填 ${board.filter((x, i) => x && !fixed.has(i)).length} 格`; }, 500);
    draw();
  };
  const draw = () => { grid.innerHTML = board.map((n, i) => { const r = Math.floor(i / 9), c = i % 9, bx = Math.floor(c / 3) + Math.floor(r / 3) * 3; const border = c % 3 === 2 && c !== 8 ? 'border-right:2px solid #8a8073;' : ''; const bb = r % 3 === 2 && r !== 8 ? 'border-bottom:2px solid #8a8073;' : ''; return `<button type="button" data-sd="${i}" style="aspect-ratio:1;background:${sel === i ? '#e8d5c4' : fixed.has(i) ? '#f7f3ea' : '#fff'};border:1px solid #ddd6cc;${border}${bb}font-size:18px;font-weight:${fixed.has(i) ? 700 : 400};color:${fixed.has(i) ? '#2f2b26' : '#b4552d'}">${n || ''}</button>`; }).join(''); };
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-sd]'); if (!b) return; sel = Number(b.dataset.sd); draw(); });
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-sdnum]'); if (!b || sel < 0 || fixed.has(sel)) return; const n = Number(b.dataset.sdnum); board[sel] = n; draw(); });
  root.querySelector('#sd-new').onclick = gen; lv.onchange = gen;
  root.querySelector('#sd-hint').onclick = () => { const empties = board.map((x, i) => x ? -1 : i).filter((i) => i >= 0); if (!empties.length) return; const i = empties[0], n = solution[i], r = Math.floor(i / 9) + 1, c = i % 9 + 1; const cand = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => ok(board, i, x)); board[i] = n; sel = i; draw(); stat.textContent = `第 ${r} 行 ${c} 列：这一格候选只有 ${cand.join('、')}，所以填 ${n}`; };
  root.querySelector('#sd-check').onclick = () => { const bad = board.map((x, i) => x && x !== solution[i] ? i : -1).filter((i) => i >= 0); stat.textContent = bad.length ? `有 ${bad.length} 格填错了（已标红）` : board.includes(0) ? '目前填的都对，继续' : '🎉 全部正确！'; if (bad.length) { bad.forEach((i) => { const el = grid.querySelector(`[data-sd="${i}"]`); if (el) el.style.background = '#f2c9bd'; }); } };
  K.setAction('新题', gen); gen();
});
