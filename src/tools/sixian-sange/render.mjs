import { esc, sheetTitle } from '../common.mjs';

export const defaultOpts = { text: 'a o e i u ü', lines: 8, trace: 1 };

export function controls() {
  return `<label class="ctl-label">内容（拼音或字母，空格分隔）</label>
    <input class="ctl-input" type="text" data-opt="text" value="a o e i u ü" size="26" placeholder="留空即生成空白书写纸">
    <span class="ctl-label">行数</span>
    <select class="ctl-select" data-opt="lines"><option value="6">6 行</option><option value="8" selected>8 行</option><option value="10">10 行</option></select>
    <label class="ctl-label"><input type="checkbox" data-opt="trace" checked> 第二行浅色描红</label>
    <button class="btn ghost" data-action="refresh">生成</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return {
    text: val('text', defaultOpts.text),
    lines: Number(val('lines', 8)),
    trace: g('trace') && g('trace').checked ? 1 : 0,
  };
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const tokens = String(o.text).trim().split(/[\s,，、]+/).filter(Boolean);
  const rows = [];
  for (let i = 0; i < o.lines; i++) {
    let inner = '';
    if (i === 0) {
      inner = tokens.map((t) => `<span class="py-cell">${esc(t)}</span>`).join('');
    } else if (i === 1 && o.trace) {
      inner = tokens.map((t) => `<span class="py-cell">${esc(t)}</span>`).join('');
    }
    const cls = (i === 1 && o.trace) ? 'py-line trace' : 'py-line';
    rows.push(`<div class="py-row"><div class="${cls}">${inner}</div></div>`);
  }
  return sheetTitle('四线三格拼音书写纸', '第一行是范写，浅色一行照着描，其余空格自己写　|　姓名：__________　日期：________') + rows.join('');
}
