/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const TEXTS = [
    '春天来得慢，窗外的树先是抽出一点嫩芽，然后忽然就绿成了一片。',
    '所谓效率，不是把每一分钟都填满，而是知道哪些事根本不必做。',
    '他沿着河走，水声盖过了脚步，也盖过了心里那些反复念叨的话。',
    '工具的意义在于，让复杂的事情变简单，而不是让简单的事情变复杂。',
  ];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>打字测速</h2><span class="hint">中文语料 · 计时/计篇双模式</span></div>
    <div class="t-row"><select class="t-select" id="ty-mode"><option value="time">计时模式（60 秒）</option><option value="text">计篇模式（打完一段）</option></select><button type="button" class="t-btn primary" id="ty-start">开始</button><span class="t-hint" id="ty-stat"></span></div>
    <div id="ty-target" style="font-size:19px;line-height:2;letter-spacing:1px;background:#f7f3ea;padding:14px;border-radius:8px;margin:14px 0;min-height:80px"></div>
    <textarea class="t-textarea" id="ty-input" rows="3" placeholder="点开始后在这里跟着打" disabled></textarea>
    <div class="t-stat-row" id="ty-result" style="margin-top:14px"></div>
    <p class="t-hint">按「正确字数 ÷ 分钟」算速度，错字不计入。计时模式到点自动停，计篇模式打完整段自动停。</p>
  </section></div>`;
  const target = root.querySelector('#ty-target'), input = root.querySelector('#ty-input'), stat = root.querySelector('#ty-stat'), result = root.querySelector('#ty-result'), mode = root.querySelector('#ty-mode');
  let text = TEXTS[0], t0 = 0, timer = null, running = false;
  const render = (typed) => { const arr = Array.from(text); target.innerHTML = Array.from(typed + '\u200b').map((c, i) => { if (c === '\u200b') return ''; const ok = c === arr[i]; return `<span style="color:${ok ? '#4b7a4b' : '#a35d5d'};${i === Array.from(typed).length - 1 ? 'text-decoration:underline' : ''}">${L.esc(c === ' ' ? '·' : c)}</span>`; }).join('') + arr.slice(Array.from(typed).length).map((c) => `<span style="opacity:.45">${L.esc(c)}</span>`).join(''); };
  const stop = () => { clearInterval(timer); timer = null; running = false; input.disabled = true; const sec = Math.max(1, (Date.now() - t0) / 1000), typed = input.value; const arr = Array.from(text), t = Array.from(typed); let ok = 0; t.forEach((c, i) => { if (c === arr[i]) ok++; }); const cpm = ok / sec * 60, acc = t.length ? ok / t.length * 100 : 0; result.innerHTML = `<div class="t-stat"><b>${L.round(cpm, 0)}</b><span>字/分钟</span></div><div class="t-stat"><b>${L.round(acc, 1)}%</b><span>正确率</span></div><div class="t-stat"><b>${L.round(sec, 1)}s</b><span>用时</span></div><div class="t-stat"><b>${ok}</b><span>正确字数</span></div>`; stat.textContent = '已结束，点开始再来一次'; };
  const start = () => { text = L.pick(TEXTS); input.value = ''; input.disabled = false; input.focus(); running = true; t0 = Date.now(); result.innerHTML = ''; render(''); clearInterval(timer); if (mode.value === 'time') timer = setInterval(() => { const left = Math.max(0, 60 - (Date.now() - t0) / 1000); stat.textContent = `剩余 ${L.round(left, 0)} 秒`; if (left <= 0) stop(); }, 200); else stat.textContent = '计篇模式：打完这一整段自动结束'; };
  input.addEventListener('input', () => { if (!running) return; render(input.value); if (mode.value === 'text' && input.value.length >= Array.from(text).length) stop(); });
  root.querySelector('#ty-start').onclick = start;
  K.setAction('开始测速', start);
  render('');
});
