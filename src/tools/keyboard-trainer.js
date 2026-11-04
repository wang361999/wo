/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const LINES = ['asdf jkl;', 'asdfghjkl;', 'the quick brown fox', '工具箱里有很多好用的小工具', 'practice makes progress'];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>键盘指法</h2><span class="hint">基准键 → 文章 · 实时 WPM</span></div>
    <div class="t-row"><select class="t-select" id="kt-lv"><option value="0">基准键</option><option value="1">全字母</option><option value="2">英文短句</option><option value="3">中文短句</option><option value="4">长句</option></select><button type="button" class="t-btn primary" id="kt-new">换一句</button><span class="t-hint" id="kt-stat"></span></div>
    <div id="kt-target" style="font-size:24px;letter-spacing:3px;line-height:2;background:#f7f3ea;padding:14px;border-radius:8px;margin:14px 0;min-height:70px"></div>
    <input class="t-input" id="kt-in" placeholder="点这里开始，跟着上面打" style="font-size:18px;letter-spacing:2px">
    <div class="t-hint" style="margin-top:10px">左手 asdf、右手 jkl; 是基准键位。中文短句用拼音输入时会受输入法影响，主要练节奏。</div>
  </section></div>`;
  const target = root.querySelector('#kt-target'), inp = root.querySelector('#kt-in'), stat = root.querySelector('#kt-stat'), lv = root.querySelector('#kt-lv');
  let text = '', t0 = 0, done = false;
  const next = () => { text = LINES[Number(lv.value)]; inp.value = ''; inp.focus(); t0 = 0; done = false; draw(); stat.textContent = '准备好就开始打'; };
  const draw = () => { const typed = Array.from(inp.value), src = Array.from(text); target.innerHTML = src.map((c, i) => `<span style="color:${i < typed.length ? (typed[i] === c ? '#4b7a4b' : '#a35d5d') : '#2f2b26'};${i === typed.length ? 'text-decoration:underline' : ''}">${L.esc(c === ' ' ? '·' : c)}</span>`).join(''); };
  inp.addEventListener('input', () => { if (done) return; if (!t0) t0 = Date.now(); draw(); const typed = inp.value; if (typed === text) { done = true; const sec = (Date.now() - t0) / 1000, wpm = (Array.from(text).join('').replace(/\s/g, '').length / 5) / sec * 60; stat.textContent = `✓ 完成：${L.round(sec, 1)} 秒 · 约 ${L.round(wpm, 0)} WPM`; next_auto(); } else { const ok = Array.from(typed).filter((c, i) => c === Array.from(text)[i]).length; stat.textContent = `正确 ${ok} / ${typed.length} 字`; } });
  const next_auto = () => setTimeout(() => { if (done) next(); }, 900);
  root.querySelector('#kt-new').onclick = next; lv.onchange = next;
  K.setAction('换一句', next); next();
});
