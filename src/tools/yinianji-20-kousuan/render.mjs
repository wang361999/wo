import { rng, int, questionGrid, answerBlock, sheetTitle } from '../common.mjs';

export const defaultOpts = { count: 40, mode: 'mix', cols: 4, showAns: 0 };

export function controls() {
  return `<span class="ctl-label">题量</span>
    <select class="ctl-select" data-opt="count">
      <option value="20">20 题</option><option value="40" selected>40 题</option><option value="60">60 题</option>
    </select>
    <span class="ctl-label">类型</span>
    <select class="ctl-select" data-opt="mode">
      <option value="mix" selected>加减混合</option><option value="add">只算加法</option><option value="sub">只算减法</option>
    </select>
    <span class="ctl-label">每行</span>
    <select class="ctl-select" data-opt="cols"><option value="4" selected>4 题</option><option value="5">5 题</option></select>
    <label class="ctl-label"><input type="checkbox" data-opt="showAns"> 题后直接显示答案</label>
    <button class="btn ghost" data-action="refresh">换一批</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>`;
}

export function readOpts(root) {
  const g = (n, d) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return {
    count: Number(val('count', 40)), mode: val('mode', 'mix'), cols: Number(val('cols', 4)),
    showAns: g('showAns') && g('showAns').checked ? 1 : 0,
  };
}

function makeQuestions(r, count, mode) {
  const qs = [];
  let guard = 0;
  while (qs.length < count && guard++ < count * 30) {
    const isAdd = mode === 'add' || (mode === 'mix' && r() < 0.5);
    if (isAdd) {
      const a = int(r, 1, 19);
      const b = int(r, 1, 20 - a);
      qs.push({ text: `${a} + ${b}`, answer: String(a + b) });
    } else {
      const a = int(r, 2, 20);
      const b = int(r, 1, a);
      qs.push({ text: `${a} - ${b}`, answer: String(a - b) });
    }
  }
  return qs;
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const r = rng(seed);
  const qs = makeQuestions(r, o.count, o.mode);
  const title = sheetTitle('20 以内加减法口算练习', `共 ${qs.length} 题　姓名：____________　日期：__________　用时：______ 分　对______ 题`);
  const grid = questionGrid(qs, o.cols, !o.showAns);
  const ans = o.showAns ? '' : answerBlock(qs, 6);
  return title + grid + ans;
}
