/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>在线刷题</h2><span class="hint">粘题库 → 即时判分</span></div>
    <textarea class="t-textarea" id="qz-src" rows="6" placeholder="每行一题：题目 | A.xxx | B.xxx | C.xxx | D.xxx | 答案 | 解析">地球自转一周约多久？ | A.12小时 | B.24小时 | C.30天 | D.365天 | B | 一个太阳日约 24 小时\nHTTP 200 表示？ | A.未找到 | B.成功 | C.重定向 | D.服务端错误 | B | 200 OK\n水的化学式是？ | A.H2O | B.CO2 | C.O2 | D.NaCl | A | 两个氢一个氧</textarea>
    <div class="t-row" style="margin:12px 0"><button type="button" class="t-btn primary" id="qz-start">开始练习</button><button type="button" class="t-btn" id="qz-shuffle">乱序</button><span class="t-hint" id="qz-prog"></span></div>
    <div id="qz-stage"></div>
    <div class="t-refwrap" id="qz-result" style="margin-top:12px"></div>
  </section></div>`;
  const src = root.querySelector('#qz-src'), stage = root.querySelector('#qz-stage'), prog = root.querySelector('#qz-prog'), result = root.querySelector('#qz-result');
  let qs = [], i = 0, right = 0, answered = false;
  const parse = () => L.nonEmptyLines(src.value).map((l) => { const p = l.split('|').map((x) => x.trim()); const opts = p.slice(1, -2).filter(Boolean); const ans = p[p.length - 2]; const exp = p[p.length - 1]; return { q: p[0], opts, ans, exp }; }).filter((x) => x.q && x.opts.length && x.ans);
  const show = () => {
    if (!qs.length) { stage.innerHTML = '<p class="t-hint">题库是空的，或格式不对。每行：题目 | A.xxx | B.xxx | 答案 | 解析</p>'; return; }
    if (i >= qs.length) { stage.innerHTML = `<div class="t-out" style="font-size:20px">🎉 做完了：${right} / ${qs.length}，正确率 ${L.round(right / qs.length * 100, 1)}%</div>`; return; }
    const q = qs[i]; answered = false;
    stage.innerHTML = `<div class="t-hint">第 ${i + 1} / ${qs.length} 题</div><div style="font-size:18px;font-weight:700;margin:10px 0">${L.esc(q.q)}</div><div id="qz-opts">${q.opts.map((o, j) => `<button type="button" class="t-btn" data-qo="${L.esc(o)}" style="display:block;width:100%;text-align:left;margin:6px 0">${L.esc(o)}</button>`).join('')}</div><div id="qz-fb" style="margin-top:10px"></div><button type="button" class="t-btn primary" id="qz-next" style="display:none;margin-top:10px">下一题 →</button>`;
    prog.textContent = `已答 ${i} 题，答对 ${right} 题`;
  };
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qo]'); if (b && !answered) {
      answered = true; const q = qs[i], pick = b.dataset.qo, ok = pick.trim().replace(/^[A-Da-d][.、.]\s*/, '').startsWith(q.ans.replace(/^[A-Da-d][.、.]\s*/, '')) || pick.trim()[0] === q.ans.trim()[0];
      if (ok) right++;
      stage.querySelectorAll('[data-qo]').forEach((x) => { const isAns = x.dataset.qo.trim()[0] === q.ans.trim()[0]; if (isAns) x.style.background = '#cfe3cf'; if (x === b && !ok) x.style.background = '#f2c9bd'; x.disabled = true; });
      stage.querySelector('#qz-fb').innerHTML = `<div style="font-weight:700;color:${ok ? '#4b7a4b' : '#a35d5d'}">${ok ? '✓ 答对了' : '✗ 答错了，正确答案 ' + L.esc(q.ans)}</div><div class="t-hint">${L.esc(q.exp || '（这题没写解析）')}</div>`;
      const nx = stage.querySelector('#qz-next'); nx.style.display = ''; nx.onclick = () => { i++; show(); };
    }
  });
  root.querySelector('#qz-start').onclick = () => { qs = parse(); i = 0; right = 0; result.innerHTML = ''; show(); };
  root.querySelector('#qz-shuffle').onclick = () => { qs = L.shuffle(parse()); i = 0; right = 0; result.innerHTML = ''; show(); K.toast('已乱序'); };
  K.setAction('开始练习', () => root.querySelector('#qz-start').click());
  show();
});
