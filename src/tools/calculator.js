/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const calc = (src) => {
    const s = String(src).replace(/\s+/g, '').replace(/π/g, 'PI').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round, pow: Math.pow };
    let i = 0;
    const primary = () => {
      if (s[i] === '(') { i++; const v = expr(); if (s[i] !== ')') throw new Error('缺右括号'); i++; return v; }
      if (s[i] === '+') { i++; return primary(); }
      if (s[i] === '-') { i++; return -primary(); }
      const w = /^[a-zA-Z]+/.exec(s.slice(i));
      if (w) {
        const name = w[0].toLowerCase(); i += w[0].length;
        if (name === 'pi') return Math.PI;
        if (name === 'e') return Math.E;
        const f = FN[name]; if (!f) throw new Error('不认识 ' + w[0]);
        let a;
        if (s[i] === '(') { i++; a = expr(); if (s[i] === ',') { i++; const b = expr(); a = name === 'pow' ? Math.pow(a, b) : a; } if (s[i] === ')') i++; }
        else a = primary();
        return f(a);
      }
      const n = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(s.slice(i));
      if (n) { i += n[0].length; let v = Number(n[0]); if (s[i] === '%') { i++; v /= 100; } return v; }
      throw new Error('第 ' + (i + 1) + ' 个字符读不懂');
    };
    const power = () => { let v = primary(); while (s[i] === '^' || s.slice(i, i + 2) === '**') { i += s[i] === '^' ? 1 : 2; v = Math.pow(v, primary()); } return v; };
    const term = () => { let v = power(); while (s[i] === '*' || s[i] === '/') { const o = s[i++]; const w = power(); v = o === '*' ? v * w : v / w; } return v; };
    const expr = () => { let v = term(); while (s[i] === '+' || s[i] === '-') { const o = s[i++]; const w = term(); v = o === '+' ? v + w : v - w; } return v; };
    const r = expr();
    if (i < s.length) throw new Error('多余内容：' + s.slice(i));
    if (!isFinite(r)) throw new Error('结果不是有限数');
    return r;
  };
  const keys = ['C', '⌫', '(', ')', '%', '^', 'sqrt(', 'pi', '7', '8', '9', '/', 'sin(', 'cos(', '4', '5', '6', '*', 'ln(', 'log(', '1', '2', '3', '-', 'abs(', 'e', '0', '.', '=', '+', 'Ans', '复制'];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>计算器</h2><span class="hint">本机运算 · 支持键盘输入</span></div>
    <input class="t-input" id="ca-expr" placeholder="例如 (1+2)*3^2 或 sqrt(2)+sin(pi/6)" style="font-size:17px;padding:12px">
    <div class="t-hint">支持 + − × ÷ ^ ( ) % 与 sin cos tan sqrt abs ln log exp floor ceil round pow、常量 pi / e。幂为左结合简化实现。</div>
    <div class="t-calcgrid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:14px 0">${keys.map((k) => `<button type="button" class="t-btn" data-k="${L.esc(k)}">${L.esc(k)}</button>`).join('')}</div>
    <div class="t-out" id="ca-out" style="font-size:24px;font-weight:700;min-height:38px">0</div>
    <p class="t-err" id="ca-err" style="display:none"></p>
    <div class="t-hint" id="ca-hist">历史：暂无</div>
  </section></div>`;
  const inp = root.querySelector('#ca-expr'), out = root.querySelector('#ca-out'), err = root.querySelector('#ca-err'), hist = root.querySelector('#ca-hist');
  let last = '0', history = [];
  const show = () => {
    err.style.display = 'none';
    if (!inp.value.trim()) { out.textContent = '0'; return; }
    try { const r = calc(inp.value); last = String(L.round(r, 10)); out.textContent = L.fmt(r, 10); }
    catch (e) { err.textContent = e.message; err.style.display = ''; }
  };
  const commit = () => {
    if (!inp.value.trim()) return;
    try { const r = calc(inp.value); const line = inp.value + ' = ' + L.fmt(r, 10); history.unshift(line); history = history.slice(0, 8); hist.textContent = '历史：' + history.join('　|　'); out.textContent = L.fmt(r, 10); last = String(L.round(r, 10)); }
    catch (e) { err.textContent = e.message; err.style.display = ''; }
  };
  root.addEventListener('input', show);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'C') { inp.value = ''; out.textContent = '0'; err.style.display = 'none'; }
    else if (k === '⌫') inp.value = inp.value.slice(0, -1);
    else if (k === '=') commit();
    else if (k === 'Ans') inp.value += last;
    else if (k === '复制') K.copy(out.textContent);
    else inp.value += k;
    show(); inp.focus();
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  K.setAction('= 计算', commit);
  show();
});
