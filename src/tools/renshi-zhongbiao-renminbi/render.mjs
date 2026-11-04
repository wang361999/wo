import { rng, int, pick, sheetTitle, esc } from '../common.mjs';

export const defaultOpts = { clocks: 8, money: 16, showAns: 0 };

export function controls() {
  return `<span class="ctl-label">钟面</span>
    <select class="ctl-select" data-opt="clocks"><option value="4">4 个</option><option value="8" selected>8 个</option><option value="12">12 个</option></select>
    <span class="ctl-label">换算题</span>
    <select class="ctl-select" data-opt="money"><option value="8">8 题</option><option value="16" selected>16 题</option><option value="24">24 题</option></select>
    <label class="ctl-label"><input type="checkbox" data-opt="showAns"> 直接显示答案</label>
    <button class="btn ghost" data-action="refresh">换一批</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return { clocks: Number(val('clocks', 8)), money: Number(val('money', 16)), showAns: g('showAns') && g('showAns').checked ? 1 : 0 };
}

function clockSvg(h, m) {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    const x1 = 50 + 38 * Math.cos(a), y1 = 50 + 38 * Math.sin(a);
    const x2 = 50 + 43 * Math.cos(a), y2 = 50 + 43 * Math.sin(a);
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#585249" stroke-width="${i % 3 === 0 ? 2 : 1}"/>`);
  }
  const ha = ((h % 12) * 30 + m * 0.5 - 90) * Math.PI / 180;
  const ma = (m * 6 - 90) * Math.PI / 180;
  const hx = 50 + 22 * Math.cos(ha), hy = 50 + 22 * Math.sin(ha);
  const mx = 50 + 31 * Math.cos(ma), my = 50 + 31 * Math.sin(ma);
  return `<svg viewBox="0 0 100 100" aria-label="钟面"><circle cx="50" cy="50" r="45" fill="#fff" stroke="#26231e" stroke-width="2"/>${ticks.join('')}
    <line x1="50" y1="50" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#26231e" stroke-width="3.4" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#26231e" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="2.5" fill="#9c3a2c"/></svg>`;
}

function makeMoney(r) {
  const type = int(r, 1, 4);
  if (type === 1) { const y = int(r, 1, 9), j = int(r, 1, 9); return { text: `${y}元${j}角 = (　)角`, answer: `${y * 10 + j}角` }; }
  if (type === 2) { const j = int(r, 11, 98); return { text: `${j}角 = (　)元(　)角`, answer: `${Math.floor(j / 10)}元${j % 10}角` }; }
  if (type === 3) { const y = int(r, 2, 9), j = int(r, 1, y * 10 - 1); return { text: `${y}元 - ${j}角 = (　)角`, answer: `${y * 10 - j}角` }; }
  const a = int(r, 1, 9), b = int(r, 1, 9); return { text: `${a}角 + ${b}角 = (　)元(　)角`, answer: `${Math.floor((a + b) / 10)}元${(a + b) % 10}角` };
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const r = rng(seed);
  const times = Array.from({ length: o.clocks }, () => ({ h: int(r, 1, 12), m: pick(r, [0, 30, 5, 15, 45, 10, 20, 25, 35, 40, 50, 55]) }));
  const clockItems = times.map((t, i) => {
    const label = `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`;
    return `<div class="clock-item">${clockSvg(t.h, t.m)}<div class="cap">${i + 1}. ${o.showAns ? `<span class="ans">${label}</span>` : '____:____'}</div></div>`;
  }).join('');
  const mq = Array.from({ length: o.money }, () => makeMoney(r));
  const moneyRows = mq.map((q, i) => `<div class="q-item">${i + 1}. ${esc(q.text)}${o.showAns ? ` <span class="ans">${esc(q.answer)}</span>` : ''}</div>`).join('');
  const ansList = times.map((t, i) => `${i + 1}. ${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`).join('　') +
    '<br>' + mq.map((q, i) => `${i + 1}. ${esc(q.answer)}`).join('　');
  const ans = o.showAns ? '' : `<details class="answer-block"><summary>参考答案</summary><div style="font-size:13px;line-height:2;margin-top:10px">${ansList}</div></details>`;
  return sheetTitle('认识钟表 · 人民币换算练习', '写出钟面上的时间，再完成元角分换算　|　姓名：__________　日期：________') +
    `<div class="clock-grid">${clockItems}</div>` +
    `<h3 style="font-family:var(--serif);margin:26px 0 10px">元角分换算（1 元 = 10 角，1 角 = 10 分）</h3>` +
    `<div class="q-grid cols-4">${moneyRows}</div>` + ans;
}
