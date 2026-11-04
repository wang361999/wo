/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>色觉自测（近似伪等色图）</h2><span class="hint">11 题 · 仅供参考</span></div>
    <div class="t-out" id="cb-prog" style="text-align:center">点「开始」出题</div>
    <canvas id="cb-cv" width="300" height="300" style="display:block;margin:14px auto;border-radius:50%"></canvas>
    <div id="cb-opts" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>
    <div class="t-actions" style="justify-content:center"><button type="button" class="t-btn primary" id="cb-start">开始 / 下一题</button></div>
    <div class="t-hint" id="cb-result" style="text-align:center;margin-top:12px"></div>
    <p class="t-hint">这是算法生成的近似图，不是标准石原氏色盲检查图，配色与圆点密度都不规范。红绿色觉倾向只能当提示，不能代替医院检查。</p>
  </section></div>`;
  const cv = root.querySelector('#cb-cv'), g = cv.getContext('2d'), opts = root.querySelector('#cb-opts'), prog = root.querySelector('#cb-prog'), result = root.querySelector('#cb-result');
  const PAIRS = [[['#c96a4b', '#d08a5a', '#b8553c'], ['#5f8c62', '#7aa06a', '#4d7a55']], [['#8a6fa0', '#9b7fb0', '#7a5f90'], ['#c9a24b', '#d4b05d', '#b88f3c']], [['#b4552d', '#c4653d', '#a04a25'], ['#6b8fa8', '#7f9fb5', '#5a7e96']]];
  let i = 0, score = 0, cur = 0;
  const drawPlate = (num, fg, bg) => {
    g.clearRect(0, 0, 300, 300); g.fillStyle = '#eee8dc'; g.fillRect(0, 0, 300, 300);
    for (let k = 0; k < 900; k++) { const x = Math.random() * 300, y = Math.random() * 300, r = 3 + Math.random() * 9; if (Math.hypot(x - 150, y - 150) > 145) continue; g.fillStyle = L.pick(bg); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.save(); g.beginPath(); g.arc(150, 150, 145, 0, Math.PI * 2); g.clip();
    g.fillStyle = L.pick(fg); g.font = 'bold 130px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), 150, 155); g.restore();
  };
  const next = () => {
    if (i >= 11) { prog.textContent = '11 题做完'; const wrong = 11 - score; result.innerHTML = `<b>答对 ${score} / 11</b><br>${wrong <= 1 ? '没有明显的红绿色觉分辨倾向' : wrong <= 4 ? '有几题吃力，可能在红绿相近色上分辨偏弱' : '多题偏吃力，建议去正规机构做一次色觉检查'}<br><small>题目是近似生成图，结论仅供参考，不作诊断。</small>`; return; }
    cur = L.randInt(10, 99); const [fg, bg] = L.pick(PAIRS); drawPlate(cur, fg, bg);
    const cand = [cur, (cur + L.randInt(1, 9)) % 100, (cur + L.randInt(10, 25)) % 100, (cur + L.randInt(26, 40)) % 100];
    const set = [...new Set(cand)].slice(0, 4); while (set.length < 4) set.push(L.randInt(0, 99));
    opts.innerHTML = L.shuffle(set).map((x) => `<button type="button" class="t-btn" data-cb="${x}">${x}</button>`).join('');
    prog.textContent = `第 ${i + 1} / 11 题　看清里面的数字，选出它`;
  };
  opts.addEventListener('click', (e) => { const b = e.target.closest('[data-cb]'); if (!b) return; if (Number(b.dataset.cb) === cur) score++; i++; next(); });
  root.querySelector('#cb-start').onclick = () => { i = 0; score = 0; result.innerHTML = ''; next(); };
  K.setAction('开始 / 下一题', () => root.querySelector('#cb-start').click());
});
