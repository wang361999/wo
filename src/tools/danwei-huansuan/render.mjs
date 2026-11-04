import { esc, sheetTitle } from '../common.mjs';

// 单位表：group 内以 base 为基准；key 全局唯一，便于下拉里混合列出
const GROUPS = {
  length: { label: '长度', base: 'm', units: { km: ['千米', 1000], m: ['米', 1], dm: ['分米', 0.1], cm: ['厘米', 0.01], mm: ['毫米', 0.001] } },
  weight: { label: '重量', base: 'kg', units: { t: ['吨', 1000], kg: ['千克', 1], g: ['克', 0.001], gongjin: ['公斤', 1], jin: ['斤', 0.5] } },
  time:   { label: '时间', base: '分', units: { zhou: ['周', 10080], ri: ['日', 1440], shi: ['时', 60], fen: ['分', 1], miao: ['秒', 1 / 60] } },
  area:   { label: '面积', base: 'm²', units: { km2: ['平方千米', 1e6], ha: ['公顷', 1e4], m2: ['平方米', 1], dm2: ['平方分米', 0.01], cm2: ['平方厘米', 0.0001] } },
  volume: { label: '容量', base: 'L', units: { L: ['升', 1], mL: ['毫升', 0.001] } },
};

const TABLES = [
  { name: '长度', rows: [['1 千米 (km)', '1000 米 (m)'], ['1 米 (m)', '10 分米 (dm)'], ['1 分米 (dm)', '10 厘米 (cm)'], ['1 厘米 (cm)', '10 毫米 (mm)'], ['1 米', '100 厘米 = 1000 毫米']] },
  { name: '重量', rows: [['1 吨 (t)', '1000 千克 (kg)'], ['1 千克 (kg)', '1000 克 (g)'], ['1 千克', '1 公斤 = 2 斤'], ['1 斤', '500 克']] },
  { name: '时间', rows: [['1 周', '7 日'], ['1 日', '24 时'], ['1 时', '60 分'], ['1 分', '60 秒'], ['1 时', '3600 秒']] },
  { name: '面积', rows: [['1 平方千米', '100 公顷'], ['1 公顷', '10000 平方米'], ['1 平方米', '100 平方分米'], ['1 平方分米', '100 平方厘米']] },
  { name: '容量', rows: [['1 升 (L)', '1000 毫升 (mL)'], ['1 升', '1 立方分米']] },
];

function findGroup(key) {
  for (const [gk, g] of Object.entries(GROUPS)) {
    if (g.units[key]) return { gk, g };
  }
  return null;
}

function unitOptions(selected) {
  return Object.entries(GROUPS).map(([, g]) =>
    `<optgroup label="${esc(g.label)}">${Object.entries(g.units).map(([k, [name]]) =>
      `<option value="${esc(k)}" ${k === selected ? 'selected' : ''}>${esc(name)} (${esc(k)})</option>`).join('')}</optgroup>`
  ).join('');
}

export const defaultOpts = { num: 3, from: 'm', to: 'cm' };

export function controls() {
  return `<span class="ctl-label">数值</span>
    <input class="ctl-input" type="number" data-opt="num" value="3" step="any" style="width:96px">
    <select class="ctl-select" data-opt="from">${unitOptions('m')}</select>
    <span>换成</span>
    <select class="ctl-select" data-opt="to">${unitOptions('cm')}</select>
    <button class="btn" data-action="print">打印对照表</button>
    <span class="hint">同一类别的单位才能互相换算</span>`;
}

export function readOpts(root) {
  const g = (n) => root.querySelector(`[data-opt="${n}"]`);
  const val = (n, d) => { const el = g(n); return el ? el.value : d; };
  return { num: Number(val('num', 3)), from: val('from', 'm'), to: val('to', 'cm') };
}

export function render(seed, opts = defaultOpts) {
  const o = { ...defaultOpts, ...opts };
  const fg = findGroup(o.from), tg = findGroup(o.to);
  let conv;
  if (!fg || !tg || fg.gk !== tg.gk) {
    conv = `<div class="conv-row" style="margin:18px 0 26px"><span class="hint">左右请选择同一类别的单位（比如「米」换「厘米」）。</span></div>`;
  } else {
    const fromK = fg.g.units[o.from][1], toK = tg.g.units[o.to][1];
    const result = (o.num * fromK) / toK;
    const shown = Number.isFinite(result) ? (Math.round(result * 1e6) / 1e6).toLocaleString('zh-CN') : '—';
    const fn = fg.g.units[o.from][0], tn = tg.g.units[o.to][0];
    conv = `<div class="conv-row" style="margin:18px 0 26px">
      <span class="ctl-label">${esc(fg.g.label)}换算：</span>
      <span class="ctl-input" style="background:#fff">${esc(String(o.num))} ${esc(fn)}</span>
      <span>=</span><span class="conv-out">${esc(shown)} ${esc(tn)}</span>
      <span class="hint">改数值或单位，结果跟着变</span>
    </div>`;
  }
  const tables = TABLES.map((t) => `<h3 style="font-family:var(--serif);margin:24px 0 8px">${esc(t.name)}单位换算对照表</h3>
    <table class="data-table"><thead><tr><th>左边等于</th><th>右边这么多</th></tr></thead><tbody>${t.rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td></tr>`).join('')}</tbody></table>`).join('');
  return sheetTitle('小学常用单位换算对照表', '长度 · 重量 · 时间 · 面积 · 容量　|　打印出来贴在书桌前') + conv + tables;
}
