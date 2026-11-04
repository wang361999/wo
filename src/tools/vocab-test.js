/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>英语词汇量测试</h2><span class="hint">基于内置 COCA 词频精简表</span></div>
    <div class="t-out" id="vb-word" style="font-size:34px;font-weight:700;text-align:center;margin:18px 0">准备开始</div>
    <div class="t-hint" id="vb-prog" style="text-align:center"></div>
    <div class="t-actions" style="justify-content:center;margin:18px 0"><button type="button" class="t-btn primary" id="vb-know">认识</button><button type="button" class="t-btn" id="vb-no">不认识</button><button type="button" class="t-btn" id="vb-start">重新测试</button></div>
    <div class="t-refwrap" id="vb-result"></div>
    <p class="t-hint">按 COCA 词频分层抽 40 词，混入少量生造词做「乱猜校正」，估算词汇量区间。这是粗略自测，不是标准化考试，也非完整 COCA 语料。</p>
  </section></div>`;
  const wordEl = root.querySelector('#vb-word'), prog = root.querySelector('#vb-prog'), result = root.querySelector('#vb-result');
  const pool = Array.isArray(D.coca) ? D.coca : [];
  let qs = [], i = 0, yes = 0, fakeHit = 0;
  const start = () => {
    if (pool.length < 40) { wordEl.textContent = '词表不足'; prog.textContent = '内置离线词表太小，无法完成分层抽样'; return; }
    const picks = [];
    for (let band = 0; band < 8; band++) { const seg = pool.slice(Math.floor(band * pool.length / 8), Math.floor((band + 1) * pool.length / 8)); for (let j = 0; j < 4; j++) picks.push({ w: L.pick(seg), real: true, rank: Math.floor(band * pool.length / 8) + 1 }); }
    const fake = ['flinder', 'quarmon', 'delipher', 'brondle', 'tavist', 'glumper', 'sorrint', 'vallish'];
    fake.forEach((w) => picks.push({ w, real: false, rank: 0 }));
    qs = L.shuffle(picks); i = 0; yes = 0; fakeHit = 0; result.innerHTML = ''; show();
  };
  const show = () => { if (i >= qs.length) return finish(); wordEl.textContent = qs[i].w; prog.textContent = `第 ${i + 1} / ${qs.length} 题　·　认识 ${yes} 个`; };
  const ans = (know) => { if (!qs.length) return; const q = qs[i]; if (know && q.real) yes++; if (know && !q.real) fakeHit++; i++; show(); };
  const finish = () => {
    const totalReal = qs.filter((x) => x.real).length;
    const raw = yes / Math.max(1, totalReal), adj = Math.max(0, raw - fakeHit / 8 * 0.5);
    const est = Math.round(adj * Math.min(pool.length, 20000) / 100) * 100, lo = Math.max(0, Math.round(est * 0.8 / 100) * 100), hi = Math.round(est * 1.2 / 100) * 100;
    wordEl.textContent = '测试完成';
    prog.textContent = `认识 ${yes} / ${totalReal} 个真词，误认 ${fakeHit} / 8 个生造词`;
    const anchor = est < 3000 ? '中学/高考量级' : est < 6000 ? '四六级量级' : est < 10000 ? '雅思托福量级' : '进阶/学术量级';
    result.innerHTML = `<div class="t-stat-row"><div class="t-stat"><b>${L.fmt(est, 0)}</b><span>估算词汇量</span></div><div class="t-stat"><b>${L.fmt(lo, 0)}–${L.fmt(hi, 0)}</b><span>参考区间</span></div><div class="t-stat"><b>${anchor}</b><span>大致锚点</span></div></div><p class="t-hint">校正：把误认生造词的比例折半扣掉。样本只有 40 词、词表是离线精简版，波动很大，别拿这个数字较真。</p>`;
  };
  root.querySelector('#vb-know').onclick = () => ans(true);
  root.querySelector('#vb-no').onclick = () => ans(false);
  root.querySelector('#vb-start').onclick = start;
  K.setAction('认识 / 下一词', () => ans(true));
  start();
});
