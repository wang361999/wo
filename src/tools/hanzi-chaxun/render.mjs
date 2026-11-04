// _data.mjs 由 build.mjs 从 src/data/hanzi.mjs 自动生成（单一数据源）
import { INDEX } from './_data.mjs';
import { esc, sheetTitle } from '../common.mjs';

export const defaultOpts = { keyword: '', radical: '' };

export function controls() {
  return `<label class="ctl-label">查字</label>
    <input class="ctl-input" type="search" data-opt="keyword" size="14" placeholder="输入字或拼音">
    <span class="ctl-label">部首</span>
    <select class="ctl-select" data-opt="radical"><option value="">全部部首</option>${INDEX.radicals.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select>
    <span class="hint">点字进入单字页，看笔顺分步和组词</span>
    <button class="btn" data-action="print">打印字表</button>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n) => { const el = g(n); return el ? el.value : ''; };
  return { keyword: val('keyword').trim(), radical: val('radical') };
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const kw = String(o.keyword).toLowerCase();
  const list = INDEX.items.filter((it) => {
    const hitKw = !kw || it.c.includes(kw) || it.p.includes(kw);
    const hitRad = !o.radical || it.r === o.radical;
    return hitKw && hitRad;
  });
  const rows = list.map((it) => `<tr>
    <td><a href="/hanzi/${esc(it.slug)}/" style="font-family:var(--serif);font-size:19px">${esc(it.c)}</a></td>
    <td>${esc(it.p)}</td><td class="num">${it.n}</td><td>${esc(it.r)}</td>
    <td>${esc(it.s)}</td><td>${esc(it.seq.slice(0, 3).join('、'))}${it.seq.length > 3 ? '…' : ''}</td>
    <td>${esc(it.w.slice(0, 2).join('、'))}</td>
  </tr>`).join('');
  return sheetTitle('一年级常用字 · 笔画笔顺部首组词速查', `共收录 ${INDEX.items.length} 字，当前显示 ${list.length} 字　|　每个字都有独立页面，可打印成字卡`) +
    `<table class="data-table"><thead><tr><th>字</th><th>拼音</th><th>笔画</th><th>部首</th><th>结构</th><th>笔顺（前三笔）</th><th>组词</th></tr></thead><tbody>${rows || '<tr><td colspan="7">没有匹配的字，换个关键词试试</td></tr>'}</tbody></table>`;
}
