/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>做个决定</h2><span class="hint">转一下，交给运气</span></div>
    <div class="t-row" style="align-items:flex-start"><textarea class="t-textarea grow" id="dw-opts" rows="7" placeholder="每行一个选项，可写 名称,权重">吃火锅,1\n吃烤肉,1\n在家做饭,2\n点外卖,1</textarea>
      <div style="min-width:260px;text-align:center"><canvas id="dw-cv" width="260" height="260" style="max-width:100%;border-radius:50%"></canvas><div class="t-hint" id="dw-result" style="margin-top:10px;font-size:16px;font-weight:700">—</div></div></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="dw-spin">转！</button><button type="button" class="t-btn" id="dw-shuffle">打乱顺序</button></div>
    <div class="t-hint">权重越大占的扇面越宽。结果纯随机，不记录也不上传。</div>
  </section></div>`;
  const opts = root.querySelector('#dw-opts'), cv = root.querySelector('#dw-cv'), g = cv.getContext('2d'), res = root.querySelector('#dw-result');
  const COLORS = ['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062', '#8c8c8c', '#a35d5d', '#5f8c7a', '#b07b4f'];
  let angle = 0, spinning = false, last = '';
  const parse = () => L.nonEmptyLines(opts.value).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', w: Math.max(0.01, Number(p[1]) || 1) }; });
  const draw = (list) => {
    const R = 125, cx = 130, cy = 130, total = list.reduce((a, x) => a + x.w, 0);
    g.clearRect(0, 0, 260, 260); let a0 = angle;
    list.forEach((x, i) => { const a1 = a0 + x.w / total * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fillStyle = COLORS[i % COLORS.length]; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.save(); g.translate(cx, cy); g.rotate((a0 + a1) / 2); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.fillText(x.name.slice(0, 8), R - 12, 5); g.restore(); a0 = a1; });
    g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fillStyle = '#2f2b26'; g.fill();
  };
  const spin = () => {
    if (spinning) return; const list = parse(); if (list.length < 2) { K.toast('至少写两个选项'); return; }
    spinning = true; const target = angle + Math.PI * 2 * (4 + Math.random() * 3), dur = 3200, t0 = performance.now(), from = angle;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const frame = (t) => { const p = Math.min(1, (t - t0) / dur); angle = from + (target - from) * ease(p); draw(list); if (p < 1) requestAnimationFrame(frame); else { spinning = false; const total = list.reduce((a, x) => a + x.w, 0); let a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), acc = 0, hit = list[0]; for (const x of list) { acc += x.w / total * Math.PI * 2; if (a <= acc) { hit = x; break; } } res.textContent = '🎯 ' + hit.name; last = hit.name; } };
    requestAnimationFrame(frame);
  };
  opts.addEventListener('input', () => draw(parse()));
  root.querySelector('#dw-spin').onclick = spin;
  root.querySelector('#dw-shuffle').onclick = () => { const list = parse(); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } opts.value = list.map((x) => x.name + ',' + x.w).join('\n'); draw(list); };
  K.setAction('转！', spin);
  draw(parse());
});
