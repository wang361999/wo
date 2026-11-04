/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const OPEN = [
    ['意大利开局', '1.e4 e5 2.Nf3 Nc6 3.Bc4', '快速出象瞄 f7，最经典的入门开局'],
    ['西班牙开局（鲁伊·洛佩兹）', '1.e4 e5 2.Nf3 Nc6 3.Bb5', '给 e5 施压，长期局面博弈'],
    ['西西里防御', '1.e4 c5', '不对称局面，黑方最流行的应手'],
    ['法兰西防御', '1.e4 e6 2.d4 d5', '坚固但空间小，兵链是主题'],
    ['卡罗-康防御', '1.e4 c6 2.d4 d5', '比法兰西更稳，象不被困'],
    ['后翼弃兵', '1.d4 d5 2.c4', '白方用 c 兵换中心控制'],
    ['印度防御（王翼）', '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7', '黑方侧翼出象，让出中心再反击'],
    ['英国式开局', '1.c4', '从侧翼争 d5，灵活转调'],
    ['列蒂开局', '1.Nf3 d5 2.c4', '超现代派，先出马不急着占中心'],
    ['斯堪的纳维亚防御', '1.e4 d5', '黑方立刻挑战中心， queen 早出'],
  ];
  const PIECES = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>国际象棋开局速查</h2><span class="hint">10 个常见开局 · 离线精简</span></div>
    <div class="t-row"><select class="t-select" id="co-sel">${OPEN.map((o, i) => `<option value="${i}">${L.esc(o[0])}</option>`).join('')}</select><button type="button" class="t-btn primary" id="co-copy">复制着法</button><button type="button" class="t-btn" id="co-guess">猜下一步</button></div>
    <div class="t-row" style="margin:14px 0;align-items:flex-start"><div id="co-board" style="display:grid;grid-template-columns:repeat(8,1fr);width:min(100%,320px);border:2px solid #8a8073"></div><div style="flex:1;min-width:200px"><div class="t-hint">着法</div><div id="co-moves" style="font-size:17px;line-height:1.9;margin-top:6px"></div><div class="t-hint" id="co-note" style="margin-top:12px"></div></div></div>
    <div class="t-hint" id="co-quiz"></div>
    <p class="t-hint">内置 10 个常见开局与简要思路，做「猜下一步」练习。棋盘是按着法里的目标格<b>近似推断</b>棋子归位（没有做完整的合法走子与吃子判定），不是逐步回放引擎；也不是完整开局百科。</p>
  </section></div>`;
  const board = root.querySelector('#co-board'), moves = root.querySelector('#co-moves'), note = root.querySelector('#co-note'), quiz = root.querySelector('#co-quiz'), sel = root.querySelector('#co-sel');
  const init = () => { const b = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { let p = ''; if (r === 0) p = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'][c]; if (r === 1) p = 'P'; if (r === 6) p = 'p'; if (r === 7) p = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'][c]; b.push(p); } return b; };
  const sq = (s) => { if (!s || s.length < 2) return -1; const c = s.charCodeAt(0) - 97, r = 8 - Number(s[1]); return r * 8 + c; };
  const apply = (b, mv) => { const tokens = mv.replace(/\d+\./g, ' ').trim().split(/\s+/).filter(Boolean); tokens.forEach((t) => { const to = (t.match(/[a-h][1-8]/) || [])[0]; if (!to) return; const i = sq(to); if (i < 0) return; const piece = t[0]; let from = -1; const isWhite = piece === piece.toUpperCase(); const target = isWhite ? piece : piece.toUpperCase(); for (let j = 0; j < 64; j++) if (b[j] === target) { const fc = j % 8, fr = Math.floor(j / 8), tc = i % 8, tr = Math.floor(i / 8); if (piece === 'N' || piece === 'n') { if (Math.abs(fc - tc) + Math.abs(fr - tr) === 3 && fc !== tc && fr !== tr) { from = j; break; } } else if (fc === tc || fr === tr || Math.abs(fc - tc) === Math.abs(fr - tr)) { from = j; break; } } if (from >= 0) { b[i] = b[from]; b[from] = ''; } }); return b; };
  const show = () => { const o = OPEN[Number(sel.value)], b = apply(init(), o[1]); board.innerHTML = b.map((p, i) => { const r = Math.floor(i / 8), c = i % 8; return `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:22px;background:${(r + c) % 2 ? '#b8a888' : '#f0e6d2'}">${PIECES[p] || ''}</div>`; }).join(''); moves.textContent = o[1]; note.textContent = o[2]; quiz.textContent = ''; };
  sel.onchange = show;
  root.querySelector('#co-copy').onclick = () => K.copy(OPEN[Number(sel.value)][1]);
  root.querySelector('#co-guess').onclick = () => { const o = OPEN[Number(sel.value)], toks = o[1].replace(/\d+\./g, ' ').trim().split(/\s+/).filter(Boolean); if (toks.length < 2) return; const hidden = toks[toks.length - 1], shown = toks.slice(0, -1).join(' '); quiz.innerHTML = `<b>局面：</b>${L.esc(shown)} … 白/黑接下来走的是？<br><button type="button" class="t-btn" id="co-reveal" style="margin-top:8px">看答案</button>`; quiz.querySelector('#co-reveal').onclick = () => { quiz.innerHTML += `<div style="margin-top:8px;color:#b4552d;font-weight:700">答案：${L.esc(hidden)}</div>`; }; };
  K.setAction('换个开局', () => { sel.value = String((Number(sel.value) + 1) % OPEN.length); show(); });
  show();
});
