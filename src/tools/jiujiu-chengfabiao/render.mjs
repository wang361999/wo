import { rng, sheetTitle } from '../common.mjs';

export const defaultOpts = { mode: 'full' };

export function controls() {
  return `<span class="ctl-label">版式</span>
    <select class="ctl-select" data-opt="mode">
      <option value="full" selected>完整乘法表 · 背诵用</option>
      <option value="blank">填空练习 · 默写用</option>
      <option value="blank-half">填空练习 · 挖一半</option>
    </select>
    <button class="btn ghost" data-action="refresh">换一批填空</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>`;
}

export function readOpts(root) {
  const el = root.querySelector('[data-opt="mode"]');
  return { mode: el ? el.value : 'full' };
}

function buildRows(r, mode) {
  const rows = [];
  for (let i = 1; i <= 9; i++) {
    const cells = [];
    for (let j = 1; j <= i; j++) {
      const prod = i * j;
      let hide = false;
      if (mode === 'blank') hide = true;
      if (mode === 'blank-half') hide = r() < 0.5;
      const expr = `${j}×${i}=`;
      cells.push(hide
        ? `<td>${expr}<span class="blank">____</span></td>`
        : `<td>${expr}${prod}</td>`);
    }
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  return rows.join('');
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const r = rng(seed);
  const label = o.mode === 'full' ? '九九乘法表（完整版）' : '九九乘法表（填空练习）';
  const meta = o.mode === 'full'
    ? '横着背、竖着背都可以　|　打印后贴在书桌前'
    : '把得数填在横线上　|　姓名：__________　日期：________';
  return sheetTitle(label, meta) +
    `<table class="mul-table">${buildRows(r, o.mode)}</table>` +
    `<p class="mul-note">小九九：每行的最后一个都是「几乘几等于几十几」，先横着读熟，再竖着比较。</p>`;
}
