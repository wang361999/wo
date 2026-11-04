import { rng, int, questionGrid, answerBlock, sheetTitle } from '../common.mjs';

export const defaultOpts = { count: 40, mode: 'mix', cols: 4, showAns: 0 };

export function controls() {
  return `<span class="ctl-label">题量</span>
    <select class="ctl-select" data-opt="count">
      <option value="20">20 题</option><option value="40" selected>40 题</option><option value="60">60 题</option>
    </select>
    <span class="ctl-label">类型</span>
    <select class="ctl-select" data-opt="mode">
      <option value="mix" selected>加减混合</option><option value="add">进位加法</option><option value="sub">退位减法</option>
    </select>
    <span class="ctl-label">每行</span>
    <select class="ctl-select" data-opt="cols"><option value="4" selected>4 题</option><option value="5">5 题</option></select>
    <label class="ctl-label"><input type="checkbox" data-opt="showAns"> 题后直接显示答案</label>
    <button class="btn ghost" data-action="refresh">换一批</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return {
    count: Number(val('count', 40)), mode: val('mode', 'mix'), cols: Number(val('cols', 4)),
    showAns: g('showAns') && g('showAns').checked ? 1 : 0,
  };
}

function makeQuestions(r, count, mode) {
  const qs = [];
  let guard = 0;
  while (qs.length < count && guard++ < count * 40) {
    const isAdd = mode === 'add' || (mode === 'mix' && r() < 0.5);
    if (isAdd) {
      // 保证大部分是进位加法
      const a = int(r, 15, 89);
      const b = int(r, Math.max(1, 10 - (a % 10)), 99 - a);
      if (b < 1 || a + b > 100) continue;
      qs.push({ text: `${a} + ${b}`, answer: String(a + b) });
    } else {
      const a = int(r, 21, 100);
      const b = int(r, Math.max(1, (a % 10) + 1), a);
      if (b > a) continue;
      qs.push({ text: `${a} - ${b}`, answer: String(a - b) });
    }
  }
  return qs;
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const r = rng(seed);
  const qs = makeQuestions(r, o.count, o.mode);
  const title = sheetTitle('100 以内加减法练习（含进位 / 退位）', `共 ${qs.length} 题　姓名：____________　日期：__________　用时：______ 分　对______ 题`);
  const grid = questionGrid(qs, o.cols, !o.showAns);
  const ans = o.showAns ? '' : answerBlock(qs, 6);
  return title + grid + ans;
}
