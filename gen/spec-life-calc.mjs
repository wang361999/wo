// 生活与计算类：日期 / 单位 / 换算 / 证件 / 健康，全部浏览器本地计算。
// 农历、节假日、称谓、汇率类均为内置精简口径，已在各工具说明里标注，不冒充完整官方数据。
export const S = {};

/* ---------- 计算器：自写表达式解析，不用 eval ---------- */
S['calculator'] = { kind: 'custom', render: (root, K) => {
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
} };

/* ---------- 进制计算器 ---------- */
S['radix-calc'] = { kind: 'form', titleIn: '输入与运算', titleOut: '各进制与位运算',
  fields: [
    { id: 'num', label: '数值', type: 'text', default: '255' },
    { id: 'from', label: '源进制', type: 'select', options: ['10 十进制', '2 二进制', '8 八进制', '16 十六进制'] },
    { id: 'op', label: '位运算', type: 'select', options: ['不运算', 'AND', 'OR', 'XOR', '左移 <<', '右移 >>', '取反 ~'] },
    { id: 'b', label: '第二个数 / 移位位数', type: 'text', default: '3' }],
  primary: '复制全部结果', hintOut: '用 BigInt 算，不受 32 位限制。取反按 32 位有符号展示，IEEE754 一栏是双精度浮点数的原始位。',
  compute: (v) => {
    const rad = Number(String(v.from).split(' ')[0]);
    let n;
    try { n = BigInt(rad === 10 ? String(v.num).trim() : L.radixCvt(String(v.num).trim(), rad, 10)); } catch (e) { return { error: '数值与所选进制对不上：' + e.message }; }
    const r2 = n.toString(2), r8 = n.toString(8), r10 = n.toString(10), r16 = n.toString(16).toUpperCase();
    let bit = '未运算';
    try {
      const m = BigInt(rad === 10 ? String(v.b).trim() : L.radixCvt(String(v.b).trim(), rad, 10));
      if (v.op === 'AND') bit = (n & m).toString(10);
      else if (v.op === 'OR') bit = (n | m).toString(10);
      else if (v.op === 'XOR') bit = (n ^ m).toString(10);
      else if (v.op.startsWith('左移')) bit = (n << m).toString(10);
      else if (v.op.startsWith('右移')) bit = (n >> m).toString(10);
      else if (v.op.startsWith('取反')) bit = '~' + n.toString(10) + ' = ' + (~Number(n & 0xffffffffn)).toString();
    } catch (e) { bit = '运算出错：' + e.message; }
    const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, Number(n), false);
    const bits = L.bytesToHex(new Uint8Array(dv.buffer), ' ');
    const text = [`十进制：${r10}`, `二进制：${r2}`, `八进制：${r8}`, `十六进制：${r16}`, `位运算（${L.esc(v.op)}）：${bit}`, `IEEE754 双精度位（大端）：${bits}`, `二进制位数：${r2.replace('-', '').length} bit`].join('\n');
    return { text, copy: text, stats: [{ label: 'DEC', value: r10 }, { label: 'HEX', value: r16 }, { label: 'BIN', value: r2.length > 18 ? r2.slice(0, 18) + '…' : r2 }] };
  } };

/* ---------- 单位换算（联动下拉） ---------- */
S['unit'] = { kind: 'custom', render: (root, K) => {
  const groups = D.unitsKeys;
  const opt = (arr, sel) => arr.map((x) => `<option value="${L.esc(x)}" ${x === sel ? 'selected' : ''}>${L.esc(x)}</option>`).join('');
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>单位换算</h2><span class="hint">${L.esc(String(groups.length))} 组 · 内置精简表</span></div>
    <div class="t-row">
      <select class="t-select" id="u-g">${opt(groups)}</select>
      <input class="t-input grow" id="u-n" type="number" value="1" step="any">
      <select class="t-select" id="u-f"></select>
      <span class="t-label" style="margin:0 6px">→</span>
      <select class="t-select" id="u-t"></select>
    </div>
    <div class="t-out" id="u-out" style="font-size:22px;font-weight:700;margin-top:14px">—</div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="u-copy">复制结果</button><button type="button" class="t-btn" id="u-swap">交换单位</button></div>
    <div class="t-refwrap" id="u-all" style="margin-top:14px"></div>
    <p class="t-hint">换算系数是内置精简值，涉及精确计量请以标准为准。</p>
  </section></div>`;
  const g = root.querySelector('#u-g'), f = root.querySelector('#u-f'), t = root.querySelector('#u-t'), n = root.querySelector('#u-n'), out = root.querySelector('#u-out'), all = root.querySelector('#u-all');
  const fill = () => { const list = D.units[g.value].map((x) => x[0]); const a = f.value, b = t.value; f.innerHTML = opt(list, a); t.innerHTML = opt(list, b); if (!list.includes(f.value)) f.value = list[0]; if (!list.includes(t.value)) t.value = list[1] || list[0]; };
  const run = () => {
    try { const r = L.convertUnit(Number(n.value), f.value, t.value, g.value); out.textContent = `${L.fmt(Number(n.value), 6)} ${f.value} = ${L.fmt(r, 8)} ${t.value}`;
      const base = D.units[g.value].map((x) => [x[0], L.convertUnit(Number(n.value), f.value, x[0], g.value)]);
      all.innerHTML = `<table class="t-table"><thead><tr><th>换算到</th><th>结果</th></tr></thead><tbody>${base.map((x) => `<tr><td>${L.esc(x[0])}</td><td>${L.fmt(x[1], 8)}</td></tr>`).join('')}</tbody></table>`;
    } catch (e) { out.textContent = '出错了：' + e.message; }
  };
  g.addEventListener('change', () => { fill(); run(); });
  [f, t].forEach((x) => x.addEventListener('change', run));
  n.addEventListener('input', run);
  root.querySelector('#u-copy').onclick = () => K.copy(out.textContent);
  root.querySelector('#u-swap').onclick = () => { const a = f.value; f.value = t.value; t.value = a; run(); };
  K.setAction('换算', run);
  fill(); run();
} };

/* ---------- 时间计算 ---------- */
S['time-calc'] = { kind: 'form', titleIn: '日期', titleOut: '计算结果',
  fields: [
    { id: 'a', label: '起始日期', type: 'text', default: '2026-01-01', placeholder: 'YYYY-MM-DD' },
    { id: 'b', label: '结束日期（差值模式）', type: 'text', default: '2026-12-31', placeholder: 'YYYY-MM-DD' },
    { id: 'add', label: '加减天数（推算模式）', type: 'number', default: 100, unit: '天，可负' }],
  primary: '复制结果', hintOut: '工作日按周一至周五计，不含法定节假日与调休（内置精简口径）。',
  compute: (v) => {
    const a = L.parseDate(v.a), b = L.parseDate(v.b);
    if (isNaN(a) || isNaN(b)) return { error: '日期填成 YYYY-MM-DD' };
    const d = L.diffDays(a, b), w = L.workdays(a, b), later = L.addDays(a, v.add);
    const text = [`${L.fmtDate(a)}（周${L.weekdayCN(a)}）→ ${L.fmtDate(b)}（周${L.weekdayCN(b)}）`, `相差 ${Math.abs(d)} 天（${d >= 0 ? '结束在之后' : '结束在之前'}）`, `约 ${L.round(Math.abs(d) / 7, 1)} 周 / ${L.round(Math.abs(d) / 30.44, 1)} 个月`, `其间工作日约 ${w} 天`, `起始日 ${v.add >= 0 ? '+' : ''}${v.add} 天 → ${L.fmtDate(later)}（周${L.weekdayCN(later)}）`, `起始日 ${v.add >= 0 ? '+' : ''}${v.add} 个月后 → ${L.fmtDate(L.addMonths(a, Math.round(v.add / 30)))}`].join('\n');
    return { text, copy: text, stats: [{ label: '相差', value: Math.abs(d) + ' 天' }, { label: '工作日', value: w + ' 天' }, { label: '推算日', value: L.fmtDate(later) }] };
  } };

/* ---------- 万年历 ---------- */
S['calendar'] = { kind: 'custom', render: (root, K) => {
  const HOLI = { '01-01': '元旦', '02-14': '情人节', '03-08': '妇女节', '03-12': '植树节', '04-01': '愚人节', '05-01': '劳动节', '05-04': '青年节', '06-01': '儿童节', '07-01': '建党节', '08-01': '建军节', '09-10': '教师节', '10-01': '国庆节', '12-24': '平安夜', '12-25': '圣诞节' };
  const JIE = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>万年历</h2><span class="hint">农历/节气为内置精简推算</span></div>
    <div class="t-row"><button type="button" class="t-btn" id="cal-prev">← 上月</button><select class="t-select" id="cal-y"></select><select class="t-select" id="cal-m"></select><button type="button" class="t-btn" id="cal-next">下月 →</button><button type="button" class="t-btn" id="cal-today">回到今天</button></div>
    <div class="t-refwrap" id="cal-grid" style="margin-top:14px"></div>
    <div class="t-hint" id="cal-info"></div>
  </section></div>`;
  const yS = root.querySelector('#cal-y'), mS = root.querySelector('#cal-m'), grid = root.querySelector('#cal-grid'), info = root.querySelector('#cal-info');
  const now = new Date(); let Y = now.getFullYear(), M = now.getMonth() + 1;
  yS.innerHTML = Array.from({ length: 121 }, (_, i) => 1900 + i).map((y) => `<option value="${y}" ${y === Y ? 'selected' : ''}>${y}</option>`).join('');
  mS.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => `<option value="${m}" ${m === M ? 'selected' : ''}>${m} 月</option>`).join('');
  const draw = () => {
    yS.value = Y; mS.value = M;
    const first = new Date(Y, M - 1, 1), days = new Date(Y, M, 0).getDate(), lead = first.getDay();
    let cells = '<table class="t-table"><thead><tr>' + ['日', '一', '二', '三', '四', '五', '六'].map((x) => `<th>${x}</th>`).join('') + '</tr></thead><tbody><tr>';
    for (let i = 0; i < lead; i++) cells += '<td></td>';
    let hol = [];
    for (let d = 1; d <= days; d++) {
      const dt = new Date(Y, M - 1, d), key = L.pad(M) + '-' + L.pad(d), h = HOLI[key];
      const today = dt.toDateString() === now.toDateString();
      const jie = d === 5 || d === 20 ? JIE[(M - 1) * 2 + (d === 20 ? 1 : 0)] : '';
      if (h) hol.push(`${M}月${d}日 ${h}`);
      cells += `<td style="text-align:center;${today ? 'background:#b4552d;color:#fff;border-radius:6px;font-weight:700' : (dt.getDay() === 0 || dt.getDay() === 6 ? 'color:#a35d5d' : '')}"><div>${d}</div><div style="font-size:10px;opacity:.8">${L.esc(h || jie || '')}</div></td>`;
      if ((lead + d) % 7 === 0) cells += '</tr><tr>';
    }
    cells += '</tr></tbody></table>';
    grid.innerHTML = cells;
    try { const lu = L.lunarLite(new Date(Y, M - 1, 15)); info.textContent = `${Y} 年 ${M} 月，共 ${days} 天；本月节日：${hol.length ? hol.join('、') : '无内置记录'}；农历（十五）参考：${lu}`; }
    catch (e) { info.textContent = `${Y} 年 ${M} 月，共 ${days} 天；本月节日：${hol.length ? hol.join('、') : '无内置记录'}`; }
  };
  root.querySelector('#cal-prev').onclick = () => { M--; if (M < 1) { M = 12; Y--; } draw(); };
  root.querySelector('#cal-next').onclick = () => { M++; if (M > 12) { M = 1; Y++; } draw(); };
  root.querySelector('#cal-today').onclick = () => { Y = now.getFullYear(); M = now.getMonth() + 1; draw(); };
  yS.onchange = () => { Y = Number(yS.value); draw(); };
  mS.onchange = () => { M = Number(mS.value); draw(); };
  K.setAction('回到今天', () => root.querySelector('#cal-today').click());
  draw();
} };

/* ---------- 年龄计算 ---------- */
S['age-calc'] = { kind: 'form', titleIn: '生日', titleOut: '年龄与倒计时',
  fields: [
    { id: 'birth', label: '出生日期', type: 'text', default: '1995-08-20', placeholder: 'YYYY-MM-DD' },
    { id: 'at', label: '算到哪天', type: 'text', default: '', placeholder: '留空 = 今天' }],
  primary: '复制结果', hintOut: '周岁按生日是否已过算，虚岁按出生即 1 岁、过春节加 1 的民间口径。星座按公历，生肖按农历年近似（立春前后可能差一年）。',
  compute: (v) => {
    const b = L.parseDate(v.birth), at = v.at ? L.parseDate(v.at) : new Date();
    if (isNaN(b) || isNaN(at)) return { error: '日期填成 YYYY-MM-DD' };
    const a = L.ageDetail(b, at);
    let next = new Date(at.getFullYear(), b.getMonth(), b.getDate());
    if (next <= at) next = new Date(at.getFullYear() + 1, b.getMonth(), b.getDate());
    const left = L.diffDays(at, next);
    const text = [`出生 ${L.fmtDate(b)}（周${L.weekdayCN(b)}）`, `算到 ${L.fmtDate(at)}`, `周岁：${a.years} 岁 ${a.months} 个月 ${a.days} 天`, `虚岁：${at.getFullYear() - b.getFullYear() + 1} 岁`, `已经活了 ${L.diffDays(b, at)} 天（约 ${L.round(L.diffDays(b, at) / 365.2425, 2)} 年）`, `下次生日：${L.fmtDate(next)}（周${L.weekdayCN(next)}），还有 ${left} 天`, `星座：${L.constellation(b.getMonth() + 1, b.getDate())}　生肖：${L.zodiac(b.getFullYear())}`].join('\n');
    return { text, copy: text, stats: [{ label: '周岁', value: a.years + ' 岁' }, { label: '下次生日', value: left + ' 天' }, { label: '已活', value: L.diffDays(b, at) + ' 天' }] };
  } };

/* ---------- 预产期 ---------- */
S['due-date'] = { kind: 'form', titleIn: '推算依据', titleOut: '孕期时间表',
  fields: [
    { id: 'way', label: '按什么推', type: 'select', options: ['末次月经首日', '受孕日', 'B 超孕周'] },
    { id: 'date', label: '日期', type: 'text', default: '2026-03-01', placeholder: 'YYYY-MM-DD' },
    { id: 'week', label: 'B 超显示孕周（该模式填）', type: 'number', default: 12, unit: '周' },
    { id: 'cycle', label: '月经周期', type: 'number', default: 28, unit: '天' }],
  primary: '复制时间表', hintOut: 'Naegele 法则：末次月经首日 + 280 天（周期不是 28 天时按差值微调）。B 超模式按已孕周反推。仅为估算，产检以医生核定为准。',
  compute: (v) => {
    const d = L.parseDate(v.date); if (isNaN(d)) return { error: '日期填成 YYYY-MM-DD' };
    let due;
    if (v.way === '受孕日') due = L.addDays(d, 266);
    else if (v.way.startsWith('B 超')) due = L.addDays(d, Math.round((40 - v.week) * 7));
    else due = L.addDays(d, 280 + (v.cycle - 28));
    const today = new Date();
    const passed = L.diffDays(L.addDays(due, -280), today), w = Math.floor(passed / 7), dd = ((passed % 7) + 7) % 7;
    const pct = L.clamp(passed / 280 * 100, 0, 100);
    const marks = [['NT 检查', 11], ['唐筛/无创', 16], ['大排畸', 22], ['糖耐', 24], ['胎心监护', 32], ['足月', 37]].map(([n, wk]) => `${n}：约孕 ${wk} 周（${L.fmtDate(L.addDays(L.addDays(due, -280), wk * 7))}）`);
    const text = [`推算依据：${L.esc(v.way)} ${L.fmtDate(d)}`, `预产期：${L.fmtDate(due)}（周${L.weekdayCN(due)}）`, passed >= 0 && passed <= 280 ? `今天约孕 ${w} 周 ${dd} 天，孕期进度 ${L.fmt(pct, 1)}%` : '今天不在推算的孕期内，改一下日期', '', '产检里程碑（按预产期反推）：', ...marks, '', '40 周只是平均值，37–42 周分娩都属于正常范围'].join('\n');
    return { text, copy: text, stats: [{ label: '预产期', value: L.fmtDate(due) }, { label: '当前孕周', value: w + ' 周' }, { label: '进度', value: L.fmt(pct, 1) + '%' }] };
  } };

/* ---------- 排卵期 ---------- */
S['ovulation'] = { kind: 'form', titleIn: '周期信息', titleOut: '易孕窗口',
  fields: [
    { id: 'start', label: '上次月经首日', type: 'text', default: '2026-06-01', placeholder: 'YYYY-MM-DD' },
    { id: 'cycle', label: '周期长度', type: 'number', default: 28, unit: '天' },
    { id: 'period', label: '经期长度', type: 'number', default: 5, unit: '天' }],
  primary: '复制日历', hintOut: '排卵日约为下次月经前 14 天，易孕窗口取排卵日前 5 天到后 1 天。这是日历法估算，不用于避孕判断。',
  compute: (v) => {
    const s = L.parseDate(v.start); if (isNaN(s)) return { error: '日期填成 YYYY-MM-DD' };
    const ov = L.addDays(s, v.cycle - 14), winA = L.addDays(ov, -5), winB = L.addDays(ov, 1), next = L.addDays(s, v.cycle);
    let cal = '';
    for (let k = 0; k < 3; k++) {
      const a = L.addDays(s, k * v.cycle), o = L.addDays(a, v.cycle - 14);
      cal += `<tr><td>第 ${k + 1} 周期</td><td>${L.fmtDate(a)}</td><td>${L.fmtDate(L.addDays(a, v.period - 1))}</td><td>${L.fmtDate(o)}</td><td>${L.fmtDate(L.addDays(o, -5))} ~ ${L.fmtDate(L.addDays(o, 1))}</td></tr>`;
    }
    const text = [`上次月经：${L.fmtDate(s)}，周期 ${v.cycle} 天`, `预计排卵日：${L.fmtDate(ov)}（周${L.weekdayCN(ov)}）`, `易孕窗口：${L.fmtDate(winA)} ~ ${L.fmtDate(winB)}`, `下次月经预计：${L.fmtDate(next)}`, '', '未来三个周期：', ...[0, 1, 2].map((k) => { const a = L.addDays(s, k * v.cycle), o = L.addDays(a, v.cycle - 14); return `${L.fmtDate(a)} 月经 → ${L.fmtDate(o)} 排卵`; })].join('\n');
    return { text, copy: text, stats: [{ label: '排卵日', value: L.fmtDate(ov) }, { label: '距今天', value: L.diffDays(new Date(), ov) + ' 天' }, { label: '下次经期', value: L.fmtDate(next) }],
      preview: `<p class="t-hint">三个月周期表</p><table class="t-table"><thead><tr><th>周期</th><th>月经首日</th><th>经期结束</th><th>排卵日</th><th>易孕窗口</th></tr></thead><tbody>${cal}</tbody></table>` };
  } };

/* ---------- 亩与平方米 ---------- */
S['land-area'] = { kind: 'form', titleIn: '面积数值', titleOut: '各口径换算',
  fields: [
    { id: 'v', label: '数值', type: 'number', default: 1 },
    { id: 'u', label: '单位', type: 'select', options: ['亩', '平方米', '分', '厘', '公顷', '英亩', '平方公里'] }],
  primary: '复制结果', hintOut: '市制 1 亩 = 666.6667 ㎡ = 60 平方丈；1 公顷 = 15 亩。注意「大亩/小亩」「东北垧」等地方口径不同，见下方辨析。',
  compute: (v) => {
    const F = (n, d = 4) => L.fmt(L.round(n, d), d);
    const toM2 = { '亩': 666.6666667, '平方米': 1, '分': 66.66666667, '厘': 6.666666667, '公顷': 10000, '英亩': 4046.8564224, '平方公里': 1000000 };
    const m2 = v.v * toM2[v.u];
    const text = [`${F(v.v)} ${L.esc(v.u)} =`, `　${F(m2)} 平方米`, `　${F(m2 / 666.6666667)} 亩（市亩）`, `　${F(m2 / 66.66666667)} 分`, `　${F(m2 / 6.666666667)} 厘`, `　${F(m2 / 10000)} 公顷`, `　${F(m2 / 4046.8564224)} 英亩`, `　${F(m2 / 1000000)} 平方公里`, `　${F(m2 / 0.6666666667)} 平方丈`].join('\n');
    return { text, copy: text, stats: [{ label: '亩', value: F(m2 / 666.6666667) }, { label: '公顷', value: F(m2 / 10000) }, { label: '平方米', value: F(m2) }],
      preview: `<p class="t-hint">五种「亩」辨析：市亩 666.67㎡（通用）；东北「垧」约 15 亩 = 1 公顷；部分地区「大亩」1000㎡、「小亩」666.67㎡；台湾「甲」约 9699㎡；日本「反」约 991.7㎡。签合同务必写明平方米。</p>` };
  } };

/* ---------- 身份证解析 ---------- */
S['id-card'] = { kind: 'form', titleIn: '号码', titleOut: '解析结果', wide: true,
  fields: [{ id: 'txt', label: '18 位身份证号（可多行批量）', type: 'textarea', rows: 4, default: '11010519491231002X' }],
  primary: '复制结果', hintOut: '本地校验：结构、出生日期、性别、校验位（GB 11643-1999）、户籍地按前 6 位行政区划代码查内置精简表。不联网、不记录。',
  compute: (v) => {
    const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2], C = '10X98765432';
    const region = Object.fromEntries((D.idRegion || []).map((x) => [x[0], x[1]]));
    const one = (s) => {
      s = s.trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(s)) return `${s}：格式不对（应为 18 位，末位可为 X）`;
      const y = Number(s.slice(6, 10)), m = Number(s.slice(10, 12)), d = Number(s.slice(12, 14));
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return `${s}：出生日期不合法`;
      let sum = 0; for (let i = 0; i < 17; i++) sum += Number(s[i]) * W[i];
      const ok = C[sum % 11] === s[17];
      const sex = Number(s[16]) % 2 ? '男' : '女';
      const prov = region[s.slice(0, 2)] || '未知';
      const age = L.ageDetail(dt).years;
      return `${s}：${ok ? '✓ 校验位正确' : '✗ 校验位不符（应为 ' + C[sum % 11] + '）'}｜${y}-${L.pad(m)}-${L.pad(d)}｜${sex}｜${age} 岁｜户籍地 ${prov}（${s.slice(0, 6)}）｜脱敏 ${s.slice(0, 6)}********${s.slice(14)}`;
    };
    const list = L.nonEmptyLines(v.txt);
    if (!list.length) return { error: '至少填一个号码' };
    return { text: list.map(one).join('\n'), copy: list.map(one).join('\n'), stats: [{ label: '条数', value: list.length + ' 条' }],
      preview: `<p class="t-hint">行政区划代码为内置精简表，只精确到省级（前 2 位）；旧代码、撤并地区可能查不到。</p>` };
  } };

/* ---------- 手机号归属地 ---------- */
S['phone-location'] = { kind: 'form', titleIn: '号码', titleOut: '查询结果', wide: true,
  fields: [{ id: 'txt', label: '手机号（可多行批量）', type: 'textarea', rows: 4, default: '13800138000' }],
  primary: '复制结果', hintOut: '离线精简库：能按前 3 位判断运营商、校验号段格式、给出区号对照。精确到省市需要完整号段库，静态站不内置，也不联网查（查了就会留下记录）。',
  compute: (v) => {
    const ops = D.phoneOp || {};
    const region = Object.fromEntries((D.idRegion || []).map((x) => [x[0], x[1]]));
    const one = (raw) => {
      const s = String(raw).replace(/[\s-]/g, '');
      if (!/^1\d{10}$/.test(s)) return `${s}：不是 11 位手机号`;
      const p3 = s.slice(0, 3), p7 = s.slice(0, 7);
      const op = ops[p3.slice(0, 2)] || ops[p3] || '未知运营商（可能是虚拟运营商/新号段）';
      return `${s}：${op}｜号段 ${p7}****｜${L.esc(v.txt && p3 === '138' ? '138 为早期中国移动号段' : '前 3 位 ' + p3)}｜脱敏 ${s.slice(0, 3)}****${s.slice(7)}`;
    };
    const list = L.nonEmptyLines(v.txt); if (!list.length) return { error: '至少填一个号码' };
    const text = list.map(one).join('\n');
    return { text, copy: text, stats: [{ label: '条数', value: list.length + ' 条' }],
      preview: `<p class="t-hint">省市归属需要「号段→地区」完整库（几十万条），本地不含。这里给的是区号↔省级对照：${Object.entries(region).slice(0, 8).map(([k, x]) => k + ' ' + L.esc(x)).join('、')} …</p>` };
  } };

/* ---------- 亲戚称呼 ---------- */
S['relative-calc'] = { kind: 'form', titleIn: '关系链', titleOut: '该怎么叫',
  fields: [{ id: 'chain', label: '关系链', type: 'text', default: '爸爸的妈妈的弟弟', placeholder: '如 爸爸的弟弟 / 妈妈的姐姐的丈夫' }],
  primary: '复制称呼', hintOut: '内置常见组合速查（父系/母系、长幼、配偶）。中文称谓各地差很多，超长链或远房旁系这里可能给不出，会如实提示而不是瞎编。',
  compute: (v) => {
    const M = {
      '爸爸': '父亲', '妈妈': '母亲', '爸爸的爸爸': '爷爷', '爸爸的妈妈': '奶奶', '妈妈的爸爸': '外公', '妈妈的妈妈': '外婆',
      '爸爸的哥哥': '伯父', '爸爸的弟弟': '叔叔', '爸爸的姐姐': '姑妈', '爸爸的妹妹': '姑姑', '爸爸的哥哥的妻子': '伯母', '爸爸的弟弟的妻子': '婶婶',
      '妈妈的哥哥': '舅舅', '妈妈的弟弟': '舅舅', '妈妈的姐姐': '姨妈', '妈妈的妹妹': '姨妈', '妈妈的哥哥的妻子': '舅妈', '妈妈的弟弟的妻子': '舅妈',
      '姐姐': '姐姐', '妹妹': '妹妹', '哥哥': '哥哥', '弟弟': '弟弟', '丈夫': '丈夫', '妻子': '妻子', '儿子': '儿子', '女儿': '女儿',
      '爸爸的弟弟的儿子': '堂兄弟', '爸爸的弟弟的女儿': '堂姐妹', '爸爸的姐妹的儿子': '表兄弟', '妈妈的兄弟姐妹的儿子': '表兄弟',
      '哥哥的妻子': '嫂子', '弟弟的妻子': '弟媳', '姐姐的丈夫': '姐夫', '妹妹的丈夫': '妹夫', '儿子的妻子': '儿媳', '女儿的丈夫': '女婿',
      '丈夫的爸爸': '公公', '丈夫的妈妈': '婆婆', '妻子的爸爸': '岳父', '妻子的妈妈': '岳母', '丈夫的哥哥': '大伯', '妻子的兄弟': '舅子',
    };
    const s = String(v.chain || '').replace(/\s/g, '');
    if (!s) return { error: '填一条关系链，比如 爸爸的弟弟' };
    let res = M[s];
    if (!res) {
      const parts = s.split('的');
      if (parts.length >= 2) {
        const head = parts.slice(0, 2).join('的');
        if (M[head]) res = M[head] + '一方的' + parts.slice(2).join('的') + '（这层关系超出内置表，只能给到「' + M[head] + '」这一层）';
      }
    }
    const text = res ? [`${s} → ${res}`, '', '提示：同一关系在南北方叫法可能不同（外婆/姥姥、姑妈/姑姑），以家里习惯为准。'] : [`${s}：内置表里没有这条关系链。`, '可以试更短的写法，例如「爸爸的弟弟」「妈妈的姐姐」「丈夫的妈妈」。', '（不瞎编称呼，查不到就直说。）'].join('\n');
    return { text, copy: text, stats: [{ label: '链条层数', value: s.split('的').length + ' 层' }, { label: '结果', value: res ? '已匹配' : '未收录' }],
      preview: `<p class="t-hint">内置 ${Object.keys(M).length} 条常见组合。可点下面任意一条回填：${Object.keys(M).slice(0, 12).map((k) => `<button type="button" class="t-chip" onclick="var i=document.querySelector('#f-chain');if(i){i.value='${L.esc(k)}';i.dispatchEvent(new Event('input',{bubbles:true}))}">${L.esc(k)}</button>`).join('')}</p>` };
  } };

/* ---------- 千焦大卡 ---------- */
S['kj-kcal'] = { kind: 'form', titleIn: '食品标签', titleOut: '热量换算',
  fields: [
    { id: 'v', label: '数值', type: 'number', default: 2000 },
    { id: 'u', label: '单位', type: 'select', options: ['kJ 千焦', 'kcal 大卡'] },
    { id: 'per', label: '标签标注的是每', type: 'number', default: 100, unit: '克/毫升' },
    { id: 'eat', label: '实际吃了', type: 'number', default: 50, unit: '克/毫升' },
    { id: 'kcalRef', label: '每日参考摄入', type: 'number', default: 2000, unit: 'kcal' }],
  primary: '复制结果', hintOut: '1 kcal ≈ 4.184 kJ。NRV% 按 8400 kJ / 2000 kcal 的通用参考值算；运动消耗按 60kg 成年人粗略估算。',
  compute: (v) => {
    const F = (n, d = 1) => L.fmt(L.round(n, d), d);
    const kcal = v.u.startsWith('kJ') ? v.v / 4.184 : v.v, kj = kcal * 4.184;
    const per = v.per > 0 ? v.eat / v.per : 0, eatKcal = kcal * per, eatKj = kj * per;
    const nrv = eatKcal / Math.max(1, v.kcalRef) * 100;
    const mins = { '散步': 3.5, '快走': 5, '慢跑': 9, '骑车': 7, '游泳': 10 };
    const text = [`${F(v.v)} ${L.esc(v.u)} = ${F(kj)} kJ = ${F(kcal)} kcal`, `标签每 ${F(v.per)} g，实际吃 ${F(v.eat)} g（${F(per * 100)} 份）`, `这一份实际摄入：${F(eatKj)} kJ / ${F(eatKcal)} kcal`, `占每日参考（${F(v.kcalRef)} kcal）的 NRV ${F(nrv)}%`, '', '大概要动多久才能消耗掉（60kg 成年人粗估）：', ...Object.entries(mins).map(([k, x]) => `　${k}约 ${F(eatKcal / x)} 分钟`)].join('\n');
    return { text, copy: text, stats: [{ label: '这一份', value: F(eatKcal) + ' kcal' }, { label: 'NRV', value: F(nrv) + '%' }, { label: '慢跑', value: F(eatKcal / 9) + ' 分钟' }] };
  } };

/* ---------- 烹饪单位换算 ---------- */
S['cooking-convert'] = { kind: 'form', titleIn: '量具与食材', titleOut: '克 / 毫升',
  fields: [
    { id: 'v', label: '数量', type: 'number', default: 1 },
    { id: 'tool', label: '量具', type: 'select', options: ['杯 cup (美 240ml)', '汤匙 tbsp (15ml)', '茶匙 tsp (5ml)', '日式量杯 (200ml)', '毫升 ml', '克 g'] },
    { id: 'food', label: '食材密度', type: 'select', options: ['水', '牛奶', '食用油', '蜂蜜', '白砂糖(细)', '面粉(中筋)', '米粉', '玉米淀粉', '可可粉', '盐(细)', '黄油', '糖粉', '燕麦片', '大米(生)', '酱油', '醋', '番茄酱', '花生酱', '酸奶'] },
    { id: 'dir', label: '方向', type: 'select', options: ['量具 → 克', '克 → 量具'] }],
  primary: '复制结果', hintOut: '体积 × 密度(g/ml) = 重量。内置常见食材密度（离线精简值），不同品牌/压实程度会差不少，烘焙建议还是上秤。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const dens = Object.fromEntries((D.cooking || []).map((x) => [x[0], Number(x[1])]));
    const vol = { '杯 cup (美 240ml)': 240, '汤匙 tbsp (15ml)': 15, '茶匙 tsp (5ml)': 5, '日式量杯 (200ml)': 200, '毫升 ml': 1, '克 g': 1 };
    const ml = vol[v.tool] || 1, d = dens[v.food] || 1;
    const g = v.tool === '克 g' ? v.v : v.v * ml * d;
    const back = v.dir.startsWith('克') ? v.v / (ml * d) : g;
    const text = [`食材：${L.esc(v.food)}（密度约 ${F(d, 3)} g/ml）`, `量具：${L.esc(v.tool)}（1 单位 = ${F(ml)} ml）`, v.dir.startsWith('克') ? `${F(v.v)} 克 ≈ ${F(back)} 个${L.esc(v.tool.split(' ')[0])}` : `${F(v.v)} × ${L.esc(v.tool)} ≈ ${F(g)} 克 / ${F(v.v * ml)} 毫升`, `常见换算：1 杯面粉 ≈ 120 g，1 杯糖 ≈ 200 g，1 汤匙油 ≈ 14 g`].join('\n');
    const rows = Object.entries(dens).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${F(x, 3)}</td><td>${F(240 * x, 0)}</td></tr>`).join('');
    return { text, copy: text, stats: [{ label: '重量', value: F(g) + ' g' }, { label: '体积', value: F(v.v * ml) + ' ml' }, { label: '密度', value: F(d, 3) }],
      preview: `<p class="t-hint">内置食材密度（g/ml，第三列=1 美杯约多少克）</p><table class="t-table"><thead><tr><th>食材</th><th>密度</th><th>1 杯</th></tr></thead><tbody>${rows}</tbody></table>` };
  } };

/* ---------- 空调匹数 ---------- */
S['ac-power'] = { kind: 'form', titleIn: '输入', titleOut: '匹数与制冷量',
  fields: [
    { id: 'v', label: '数值', type: 'number', default: 1.5 },
    { id: 'u', label: '按什么填', type: 'select', options: ['匹', '制冷量 W', '型号数字(如 35)', '房间面积 ㎡'] }],
  primary: '复制结果', hintOut: '1 匹（正匹）≈ 2500 W 制冷量；型号 KFR-35GW 里的 35 就是 3500 W = 1.5 匹。按面积选只是粗估，顶层/西晒/大玻璃要往上加。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let w;
    if (v.u === '匹') w = v.v * 2500;
    else if (v.u.startsWith('制冷量')) w = v.v;
    else if (v.u.startsWith('型号')) w = v.v * 100;
    else w = v.v * 150;
    const hp = w / 2500, model = Math.round(w / 100), area = w / 150;
    const text = [`制冷量约 ${F(w, 0)} W，约 ${F(hp, 1)} 匹`, `对应型号数字：KFR-${model}GW / KFR-${model}LW`, `按 150 W/㎡ 估算适用面积：${F(area)} ㎡`, `常见档位：23(小1匹) / 26(大1匹) / 35(1.5匹) / 50(2匹) / 72(3匹)`, `型号解读：K=空调 F=分体 R=热泵 35=3500W G=挂机 / L=柜机 W=室外机`].join('\n');
    return { text, copy: text, stats: [{ label: '制冷量', value: F(w, 0) + ' W' }, { label: '匹数', value: F(hp, 1) + ' 匹' }, { label: '适用面积', value: F(area) + ' ㎡' }],
      preview: `<p class="t-hint">按面积估算未计层高、朝向、隔热与人数；西晒或顶楼建议在结果上加 10–20%。</p>` };
  } };

/* ---------- 屏幕 PPI ---------- */
S['screen-ppi'] = { kind: 'form', titleIn: '屏幕参数', titleOut: '尺寸与清晰度',
  fields: [
    { id: 'inch', label: '对角线', type: 'number', default: 27, unit: '英寸' },
    { id: 'w', label: '水平分辨率', type: 'number', default: 3840, unit: 'px' },
    { id: 'h', label: '垂直分辨率', type: 'number', default: 2160, unit: 'px' },
    { id: 'scale', label: '系统缩放', type: 'select', options: ['100%', '125%', '150%', '200%'] }],
  primary: '复制结果', hintOut: 'PPI = √(宽²+高²) ÷ 对角线英寸。点距是相邻像素的物理间距，缩放建议按常见操作系统档位给。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const diag = Math.sqrt(v.w * v.w + v.h * v.h), ppi = diag / Math.max(0.1, v.inch);
    const ratio = v.w / Math.max(1, v.h), wcm = v.inch * 2.54 * ratio / Math.sqrt(1 + ratio * ratio), hcm = wcm / ratio;
    const pitch = 25.4 / ppi, sc = Number(String(v.scale).replace('%', '')) / 100;
    const rec = ppi > 200 ? '150%–200%' : ppi > 140 ? '125%–150%' : '100%';
    const text = [`${v.w} × ${v.h}，${v.inch} 英寸，比例 ${F(ratio, 3)}:1`, `PPI：${F(ppi)}（每英寸像素）`, `点距：${F(pitch, 3)} mm`, `实际宽 ${F(wcm)} cm × 高 ${F(hcm)} cm`, `逻辑分辨率（${L.esc(v.scale)} 缩放）：${F(v.w / sc, 0)} × ${F(v.h / sc, 0)}`, `按 PPI 建议缩放：${rec}`, `观看距离 60cm 时，超过约 ${F(60 * 0.01745 * 2 * 3438 / 60, 0)} PPI 肉眼难分辨单个像素（视网膜阈值粗估）`].join('\n');
    return { text, copy: text, stats: [{ label: 'PPI', value: F(ppi) }, { label: '点距', value: F(pitch, 3) + ' mm' }, { label: '宽度', value: F(wcm) + ' cm' }] };
  } };

/* ---------- 胎压换算 ---------- */
S['tire-pressure'] = { kind: 'form', titleIn: '胎压', titleOut: '换算与修正',
  fields: [
    { id: 'v', label: '数值', type: 'number', default: 2.3 },
    { id: 'u', label: '单位', type: 'select', options: ['bar', 'psi', 'kPa', 'kg/cm²（公斤）'] },
    { id: 'temp', label: '测量时气温', type: 'number', default: 20, unit: '℃' },
    { id: 'cold', label: '状态', type: 'select', options: ['冷胎（停车 3h 以上）', '热胎（刚跑过）'] }],
  primary: '复制结果', hintOut: '1 bar = 100 kPa ≈ 14.5 psi ≈ 1.02 kg/cm²。气温每变 10℃，胎压约变 0.07 bar；热胎读数通常比冷胎高 0.2–0.3 bar。厂商标的是冷胎值。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const toBar = { 'bar': 1, 'psi': 0.0689476, 'kPa': 0.01, 'kg/cm²（公斤）': 0.980665 };
    const bar = v.v * toBar[v.u];
    const corr = (20 - v.temp) * 0.007, hot = v.cold.startsWith('热') ? -0.25 : 0;
    const coldEq = bar + corr + hot;
    const text = [`${F(v.v)} ${L.esc(v.u)} =`, `　${F(bar)} bar`, `　${F(bar * 14.5038)} psi`, `　${F(bar * 100)} kPa`, `　${F(bar * 1.01972)} kg/cm²`, `折算到 20℃ 冷胎参考值：${F(coldEq)} bar${hot ? '（已扣热胎虚高 0.25 bar）' : ''}`, `常见家用车冷胎建议 2.2–2.5 bar，具体看车门 B 柱标签`].join('\n');
    return { text, copy: text, stats: [{ label: 'bar', value: F(bar) }, { label: 'psi', value: F(bar * 14.5038) }, { label: 'kPa', value: F(bar * 100) }],
      preview: `<p class="t-hint">季节掉压：秋冬降温 10℃ 大约掉 0.07 bar，入冬补一次气很正常。报警先查慢撒气，别只补气了事。</p>` };
  } };

/* ---------- 坡度换算 ---------- */
S['slope-convert'] = { kind: 'form', titleIn: '坡度', titleOut: '各口径换算',
  fields: [
    { id: 'v', label: '数值', type: 'number', default: 8 },
    { id: 'u', label: '单位', type: 'select', options: ['百分比 %', '角度 °', '比例 1:n（填 n）', '千分比 ‰'] },
    { id: 'rise', label: '高差（可选，算斜长）', type: 'number', default: 0, unit: '米' }],
  primary: '复制结果', hintOut: '坡度百分比 = tan(角度) × 100%；1:n 是「升高 1 需水平走 n」。高差与斜长按勾股定理算。附常见场景限值。',
  compute: (v) => {
    const F = (n, d = 3) => L.fmt(L.round(n, d), d);
    let pct, deg;
    if (v.u.startsWith('角度')) { deg = v.v; pct = Math.tan(deg * Math.PI / 180) * 100; }
    else if (v.u.startsWith('比例')) { pct = 100 / Math.max(0.0001, v.v); deg = Math.atan(pct / 100) * 180 / Math.PI; }
    else if (v.u.startsWith('千分')) { pct = v.v / 10; deg = Math.atan(pct / 100) * 180 / Math.PI; }
    else { pct = v.v; deg = Math.atan(pct / 100) * 180 / Math.PI; }
    const n = pct > 0 ? 100 / pct : Infinity;
    const run = v.rise > 0 && pct > 0 ? v.rise / (pct / 100) : 0, slant = Math.sqrt(run * run + v.rise * v.rise);
    const text = [`坡度百分比：${F(pct)}%`, `角度：${F(deg)}°`, `比例：1 : ${isFinite(n) ? F(n) : '∞（水平）'}`, `千分比：${F(pct * 10)}‰`, v.rise > 0 && pct > 0 ? `高差 ${F(v.rise)} m → 水平距离 ${F(run)} m，斜长 ${F(slant)} m` : '', '', '场景限值：无障碍坡道 ≤ 8.3%(1:12)；地下车库坡道 ≤ 15%；高速公路最大纵坡一般 ≤ 3–5%；山区公路可达 9%'].join('\n').trim();
    return { text, copy: text, stats: [{ label: '百分比', value: F(pct) + '%' }, { label: '角度', value: F(deg) + '°' }, { label: '比例', value: '1:' + F(n) }] };
  } };

/* ---------- 印刷尺寸 / DPI ---------- */
S['print-dpi'] = { kind: 'form', titleIn: '像素与纸张', titleOut: '印刷尺寸',
  fields: [
    { id: 'px', label: '像素（宽或高）', type: 'number', default: 2480 },
    { id: 'dpi', label: '输出 DPI', type: 'number', default: 300, unit: '点/英寸' },
    { id: 'paper', label: '纸张', type: 'select', options: ['A4 210×297mm', 'A3 297×420mm', 'A5 148×210mm', '名片 90×54mm', '6 寸照片 152×102mm'] },
    { id: 'bleed', label: '出血', type: 'number', default: 3, unit: 'mm' }],
  primary: '复制结果', hintOut: '毫米 = 像素 ÷ DPI × 25.4。300 DPI 是印刷常用精度，喷绘/大画幅可降到 72–150 DPI。pt 与 pica 是排版单位（1pt = 1/72 英寸）。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const mm = v.px / Math.max(1, v.dpi) * 25.4;
    const P = { 'A4 210×297mm': [210, 297], 'A3 297×420mm': [297, 420], 'A5 148×210mm': [148, 210], '名片 90×54mm': [90, 54], '6 寸照片 152×102mm': [152, 102] }[v.paper];
    const full = P.map((x) => Math.round((x + v.bleed * 2) / 25.4 * v.dpi));
    const text = [`${F(v.px, 0)} px @ ${F(v.dpi, 0)} DPI = ${F(mm)} mm`, `反过来：1 mm = ${F(v.dpi / 25.4, 2)} px`, `${L.esc(v.paper)} 整页像素：${Math.round(P[0] / 25.4 * v.dpi)} × ${Math.round(P[1] / 25.4 * v.dpi)} px`, `含 ${v.bleed}mm 出血：${full[0]} × ${full[1]} px（成品尺寸 ${P[0]}×${P[1]}mm + 四周各 ${v.bleed}mm）`, `${F(mm)} mm = ${F(mm * 2.83465, 2)} pt = ${F(mm / 4.2333, 3)} pica`, '提示：屏幕上看着清晰不等于能印，关键是像素总量 ÷ 实际印出来的尺寸'].join('\n');
    return { text, copy: text, stats: [{ label: '对应毫米', value: F(mm) + ' mm' }, { label: '整页宽', value: Math.round(P[0] / 25.4 * v.dpi) + ' px' }, { label: 'pt', value: F(mm * 2.83465) }] };
  } };

/* ---------- 装修用量四件套 ---------- */
S['floor-material-calc'] = { kind: 'form', titleIn: '房间与地板', titleOut: '用量估算',
  fields: [
    { id: 'len', label: '房间长', type: 'number', default: 5, unit: '米' },
    { id: 'wid', label: '房间宽', type: 'number', default: 4, unit: '米' },
    { id: 'pl', label: '单块地板长', type: 'number', default: 1.2, unit: '米' },
    { id: 'pw', label: '单块地板宽', type: 'number', default: 0.15, unit: '米' },
    { id: 'loss', label: '损耗率', type: 'number', default: 8, unit: '%' },
    { id: 'perBox', label: '每包片数', type: 'number', default: 10, unit: '片' }],
  primary: '复制结果', hintOut: '按面积除以单块面积估块数，再加损耗。人字拼/斜铺损耗要提到 10–15%，异形房间另算。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const area = v.len * v.wid, one = v.pl * v.pw;
    const net = Math.ceil(area / Math.max(0.0001, one)), buy = Math.ceil(net * (1 + v.loss / 100)), boxes = Math.ceil(buy / Math.max(1, v.perBox));
    const text = [`房间面积：${F(area)} ㎡（${F(v.len)} × ${F(v.wid)} m）`, `单块面积：${F(one, 4)} ㎡`, `净需 ${net} 片`, `含 ${v.loss}% 损耗：建议采购 ${buy} 片`, `按每包 ${v.perBox} 片：约 ${boxes} 包`, `含损耗铺装面积：${F(buy * one)} ㎡`].join('\n');
    return { text, copy: text, stats: [{ label: '净需', value: net + ' 片' }, { label: '建议采购', value: buy + ' 片' }, { label: '包数', value: boxes + ' 包' }] };
  } };

S['tile-material-calc'] = { kind: 'form', titleIn: '铺贴参数', titleOut: '瓷砖用量',
  fields: [
    { id: 'where', label: '铺在哪', type: 'select', options: ['地砖（按地面面积）', '墙砖（按周长×高）'] },
    { id: 'len', label: '房间长', type: 'number', default: 5, unit: '米（墙砖按长）' },
    { id: 'wid', label: '房间宽', type: 'number', default: 4, unit: '米（墙砖按宽）' },
    { id: 'height', label: '墙砖铺贴高度', type: 'number', default: 2.4, unit: '米' },
    { id: 'size', label: '砖规格', type: 'select', options: ['300×300mm', '600×600mm', '800×800mm', '300×600mm', '600×1200mm'] },
    { id: 'hole', label: '门窗扣减面积', type: 'number', default: 2, unit: '㎡' },
    { id: 'loss', label: '损耗率', type: 'number', default: 8, unit: '%' }],
  primary: '复制结果', hintOut: '地砖按长×宽，墙砖按周长×高，都扣掉门窗；异形切割多的把损耗调到 10%。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const gross = v.where.startsWith('地砖') ? v.len * v.wid : (v.len + v.wid) * 2 * v.height;
    const area = Math.max(0, gross - v.hole);
    const [a, b] = v.size.split('×').map((x) => Number(String(x).replace('mm', '')) / 1000);
    const one = a * b, net = Math.ceil(area / Math.max(0.0001, one)), buy = Math.ceil(net * (1 + v.loss / 100));
    const text = [`${L.esc(v.where)}：毛面积 ${F(gross)} ㎡，扣门窗 ${F(v.hole)} ㎡ → 净面积 ${F(area)} ㎡`, `砖规格 ${L.esc(v.size)}（${F(one, 4)} ㎡/片）`, `净需 ${net} 片`, `含 ${v.loss}% 损耗：建议采购 ${buy} 片`, `约 ${F(buy * one)} ㎡（含损耗）`, '提示：大砖上墙要加背胶与瓷砖胶，损耗和人工都更高'].join('\n');
    return { text, copy: text, stats: [{ label: '净面积', value: F(area) + ' ㎡' }, { label: '净需', value: net + ' 片' }, { label: '建议采购', value: buy + ' 片' }] };
  } };

S['paint-material-calc'] = { kind: 'form', titleIn: '墙面参数', titleOut: '涂料用量',
  fields: [
    { id: 'len', label: '房间长', type: 'number', default: 5, unit: '米' },
    { id: 'wid', label: '房间宽', type: 'number', default: 4, unit: '米' },
    { id: 'height', label: '层高', type: 'number', default: 2.7, unit: '米' },
    { id: 'ceil', label: '是否刷顶面', type: 'checkbox', default: true },
    { id: 'hole', label: '门窗扣减', type: 'number', default: 5, unit: '㎡' },
    { id: 'coats', label: '涂刷遍数', type: 'number', default: 2, unit: '遍' },
    { id: 'cover', label: '每升可刷', type: 'number', default: 10, unit: '㎡/遍' },
    { id: 'bucket', label: '每桶容量', type: 'number', default: 5, unit: 'L' }],
  primary: '复制结果', hintOut: '乳胶漆一般一底两面；覆盖率看桶身标注（常见 10–14 ㎡/L/遍），粗糙墙面会多吃料。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const wall = (v.len + v.wid) * 2 * v.height, top = v.ceil ? v.len * v.wid : 0;
    const area = Math.max(0, wall + top - v.hole), liters = area * v.coats / Math.max(0.1, v.cover), buckets = Math.ceil(liters / Math.max(0.1, v.bucket));
    const text = [`墙面 ${F(wall)} ㎡${v.ceil ? ` + 顶面 ${F(top)} ㎡` : ''} − 门窗 ${F(v.hole)} ㎡ = ${F(area)} ㎡`, `涂 ${v.coats} 遍，按 ${v.cover} ㎡/L/遍`, `需涂料约 ${F(liters)} L`, `按每桶 ${v.bucket} L：约 ${buckets} 桶`, '提示：深色漆、新墙未上底漆、滚涂损耗都会让实际用量上浮 10–20%'].join('\n');
    return { text, copy: text, stats: [{ label: '涂刷面积', value: F(area) + ' ㎡' }, { label: '需涂料', value: F(liters) + ' L' }, { label: '桶数', value: buckets + ' 桶' }] };
  } };

S['wallpaper-calc'] = { kind: 'form', titleIn: '墙面与壁纸', titleOut: '卷数估算',
  fields: [
    { id: 'len', label: '房间长', type: 'number', default: 5, unit: '米' },
    { id: 'wid', label: '房间宽', type: 'number', default: 4, unit: '米' },
    { id: 'height', label: '铺贴高度', type: 'number', default: 2.6, unit: '米' },
    { id: 'hole', label: '门窗扣减宽度', type: 'number', default: 1.5, unit: '米（按宽度扣）' },
    { id: 'rollW', label: '卷宽', type: 'number', default: 0.53, unit: '米' },
    { id: 'rollL', label: '卷长', type: 'number', default: 10, unit: '米' },
    { id: 'pattern', label: '花型', type: 'select', options: ['素色 / 竖条（不对花）', '平铺小花（对花 0.1m）', '大花（对花 0.3m）'] }],
  primary: '复制结果', hintOut: '按「周长 ÷ 卷宽 = 幅数」再乘每卷能裁几幅。对花越大越费，门窗按宽度减掉相应幅数（这里做简化）。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const peri = (v.len + v.wid) * 2 - v.hole;
    const panels = Math.ceil(peri / Math.max(0.01, v.rollW));
    const extra = v.pattern.startsWith('大花') ? 0.3 : v.pattern.startsWith('平铺') ? 0.1 : 0;
    const perPanel = v.height + extra + 0.1, perRoll = Math.floor(v.rollL / Math.max(0.01, perPanel));
    const rolls = Math.ceil(panels / Math.max(1, perRoll));
    const text = [`有效周长：${F(peri)} m（已扣门窗 ${F(v.hole)} m）`, `每幅宽 ${v.rollW} m → 需 ${panels} 幅`, `每幅需 ${F(perPanel)} m（含 ${F(extra)} m 对花 + 0.1 m 裁边）`, `每卷 ${v.rollL} m 可裁 ${perRoll} 幅`, `建议采购 ${rolls} 卷`, '提示：同批次号要一次买齐，不同批次会有色差；多买 1 卷备补'].join('\n');
    return { text, copy: text, stats: [{ label: '需幅数', value: panels + ' 幅' }, { label: '每卷可裁', value: perRoll + ' 幅' }, { label: '卷数', value: rolls + ' 卷' }] };
  } };

/* ---------- 宠物年龄 ---------- */
S['pet-age'] = { kind: 'form', titleIn: '宠物信息', titleOut: '换算人类岁数',
  fields: [
    { id: 'pet', label: '猫还是狗', type: 'select', options: ['猫', '小型犬', '中型犬', '大型犬'] },
    { id: 'years', label: '实际年龄', type: 'number', default: 3, unit: '岁' }],
  primary: '复制结果', hintOut: '狗常用「第 1 年≈15、第 2 年≈+9，之后每年按体型 4–8 岁」的简化曲线；猫前两年折算更快。不同品种差异大，只作体感参考。',
  compute: (v) => {
    const F = (n, d = 1) => L.fmt(L.round(n, d), d);
    const y = Math.max(0, v.years);
    let human;
    if (v.pet === '猫') human = y <= 1 ? 15 : y <= 2 ? 24 : 24 + (y - 2) * 4;
    else { const k = v.pet === '小型犬' ? 4 : v.pet === '中型犬' ? 5.5 : 7; human = y <= 1 ? 15 : y <= 2 ? 24 : 24 + (y - 2) * k; }
    const stage = human < 18 ? '幼年/少年' : human < 45 ? '青壮年' : human < 65 ? '中年' : '老年';
    const tips = human >= 65 ? ['建议每半年体检一次', '关注关节、牙齿与肾功能', '换易消化、控磷的老年粮'] : human < 18 ? ['按时完成疫苗与驱虫', '社会化训练窗口期', '注意别过量补钙'] : ['保持规律运动与体重', '每年一次体检与口腔检查', '控制零食占比'];
    const text = [`${L.esc(v.pet)} ${F(y)} 岁 ≈ 人类 ${F(human)} 岁`, `生命阶段：${stage}`, '', '护理提示：', ...tips.map((x) => '　· ' + x), '', '换算口径：第 1 年≈15 岁、第 2 年≈24 岁，之后狗按体型每年 +4~7 岁、猫每年 +4 岁'].join('\n');
    const rows = [1, 2, 3, 5, 8, 10, 12, 15].map((a) => { let h; if (v.pet === '猫') h = a <= 1 ? 15 : a <= 2 ? 24 : 24 + (a - 2) * 4; else { const k = v.pet === '小型犬' ? 4 : v.pet === '中型犬' ? 5.5 : 7; h = a <= 1 ? 15 : a <= 2 ? 24 : 24 + (a - 2) * k; } return `<tr><td>${a}</td><td>${F(h)}</td></tr>`; }).join('');
    return { text, copy: text, stats: [{ label: '人类岁数', value: F(human) + ' 岁' }, { label: '阶段', value: stage }],
      preview: `<p class="t-hint">常见年龄对照（岁）</p><table class="t-table"><thead><tr><th>实际</th><th>≈人类</th></tr></thead><tbody>${rows}</tbody></table>` };
  } };
