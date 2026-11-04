import { esc, sheetTitle } from '../common.mjs';

export const defaultOpts = { chars: '一二三上口日', perRow: 8, traceCount: 2 };

export function controls() {
  return `<label class="ctl-label">生字</label>
    <input class="ctl-input" type="text" data-opt="chars" value="一二三上口日" size="22" placeholder="输入要练的字，如：天地人">
    <span class="ctl-label">每行格数</span>
    <select class="ctl-select" data-opt="perRow"><option value="6">6 格</option><option value="8" selected>8 格</option><option value="10">10 格</option></select>
    <span class="ctl-label">描红格</span>
    <select class="ctl-select" data-opt="traceCount"><option value="1">1 格</option><option value="2" selected>2 格</option><option value="3">3 格</option></select>
    <button class="btn ghost" data-action="refresh">生成字帖</button>
    <button class="btn" data-action="print">打印 / 存为 PDF</button>
    <span class="hint">改动输入框后点「生成字帖」</span>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return {
    chars: val('chars', defaultOpts.chars),
    perRow: Number(val('perRow', 8)),
    traceCount: Number(val('traceCount', 2)),
  };
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const chars = Array.from(String(o.chars).replace(/[\s,，、]/g, '')).slice(0, 16);
  const list = chars.length ? chars : Array.from(defaultOpts.chars);
  const rows = list.map((c) => {
    let cells = `<div class="tian model">${esc(c)}</div>`;
    for (let i = 1; i < o.perRow; i++) {
      cells += i <= o.traceCount
        ? `<div class="tian trace">${esc(c)}</div>`
        : `<div class="tian empty">${esc(c)}</div>`;
    }
    return `<p class="zi-row-label">${esc(c)}</p><div class="zi-row">${cells}</div>`;
  }).join('');
  return sheetTitle('田字格生字字帖', `每个字一行：先看范字，再描红，最后自己写　|　姓名：__________　日期：________`) + rows;
}
