// 门面：服务端一次性输出全部 286 张卡与两套导航 DOM；客户端 JS 只做筛选与计数。
import { TOOLS, CATS, DEVS, CAT_MAP, DEV_NAME, MODE_NAME, MODE_DESC } from '../data/catalog.mjs';
import { svg, esc } from './layout.mjs';

const inDev = (t, d) => d === 'all' || t.dev === d || t.dev === 'both';
const devCount = (d) => TOOLS.filter((t) => inDev(t, d)).length;
const catCount = (c, d) => TOOLS.filter((t) => inDev(t, d) && (c === 'all' || t.cat === c)).length;
const modeCount = (m) => TOOLS.filter((t) => t.mode === m).length;

const MODE_CLASS = { local: 'm-local', vendor: 'm-vendor', lite: 'm-lite' };

function devSeg() {
  return `<div class="dev-seg" role="group" aria-label="按设备端筛选">${DEVS.map((d) =>
    `<button data-dev="${d.id}" class="${d.id === 'all' ? 'on' : ''}">${d.name}<span class="n" data-dev-n="${d.id}">${devCount(d.id)}</span></button>`
  ).join('')}</div>
  <p class="dev-cap" id="devCap">标「两端」的工具在哪一边都能用。</p>`;
}

function catList() {
  return `<div class="side-list">${CATS.map((c) =>
    `<button class="side-link ${c.id === 'all' ? 'on' : ''}" data-cat="${c.id}">
      <span class="side-row"><span class="cat-emoji">${c.icon}</span>${c.name}</span>
      <span class="n" data-cat-n="${c.id}">${catCount(c.id, 'all')}</span></button>`
  ).join('')}</div>`;
}

function mCats() {
  return `<div class="m-cats" role="group" aria-label="按功能筛选">${CATS.map((c) =>
    `<button class="m-chip ${c.id === 'all' ? 'on' : ''}" data-cat="${c.id}">${c.name}<span class="n" data-cat-n="${c.id}">${catCount(c.id, 'all')}</span></button>`
  ).join('')}</div>`;
}

function card(t) {
  const searchable = [t.name, t.desc, t.tags.join(' '), CAT_MAP[t.cat]?.name, DEV_NAME[t.dev], MODE_NAME[t.mode]]
    .join(' ').toLowerCase();
  // 卡片用 data-d / data-c，避免与导航按钮的 data-dev / data-cat 事件委托冲突
  const attrs = `data-d="${t.dev}" data-c="${t.cat}" data-search="${esc(searchable)}"`;
  const inner = `<div class="card-top">
      <span class="card-ic">${esc(t.icon)}</span>
      <span class="badges">
        <span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span>
        <span class="badge ${MODE_CLASS[t.mode]}">${MODE_NAME[t.mode]}</span>
      </span>
    </div>
    <h3 class="card-name">${esc(t.name)}</h3>
    <p class="card-desc">${esc(t.desc)}</p>
    <div class="card-tags">${t.tags.slice(0, 3).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>`;
  return `<a class="card" href="/tools/${t.id}/" ${attrs}>${inner}</a>`;
}

function spec() {
  return `<details class="spec">
    <summary>${svg('i-arw', 'arw')}这套工具箱是怎么组织的（点开看结构）</summary>
    <div class="spec-body">
      <div class="spec-card"><h3><span class="num">01</span>分类分两级</h3>
        <p>第一级按<b>设备端</b>（电脑端 / 手机端）切，第二级按<b>功能</b>分成 10 类。标「两端」的工具在两边都能找到，切一级时二级的数字会跟着变。</p></div>
      <div class="spec-card"><h3><span class="num">02</span>两端各一套布局</h3>
        <p>电脑端：分类固定在左侧，卡片多列铺开。手机端：顶部分段 + 分类横滑 + 单列卡片，工具页的操作按钮吸在屏幕底部。不是同一套等比缩小。</p></div>
      <div class="spec-card"><h3><span class="num">03</span>一张表管全部</h3>
        <p>工具和分类写在同一份注册表里，卡片、两端计数、搜索结果全从这张表算出来。加一个工具只加一行，不用改壳。</p></div>
      <div class="spec-card"><h3><span class="num">04</span>全部接入，不做空壳页</h3>
        <p>286 个工具各有独立网址、打开就能跑。<b>没有一张卡片是点了只弹说明的占位</b>；纯静态站承接不了的能力，会在工具页里写明边界，不假装支持。</p></div>
    </div>
    <p class="spec-foot">实现档位：<b>纯本地</b> ${modeCount('local')} 个（只用浏览器原生能力）· <b>本地库</b> ${modeCount('vendor')} 个（处理库已打包在 /vendor/，首次加载脚本，不联网）· <b>离线精简</b> ${modeCount('lite')} 个（内置精简数据集，边界写在工具里）。三档加起来就是 ${TOOLS.length} 个，全部可用。</p>
  </details>`;
}

export function homeHTML() {
  const cards = TOOLS.map(card).join('\n');
  return `
<section class="m-top">
  ${devSeg()}
  ${mCats()}
</section>

<div class="pc-shell">
  <aside class="sidebar">
    <p class="side-title">按设备端</p>
    ${devSeg()}
    <p class="side-title" style="margin-top:20px">按功能</p>
    ${catList()}
    <p class="side-note">电脑端把分类固定在左侧、工具多列铺开，适合鼠标拖文件、精细调参数。窄屏会自动换成手机端那套布局。</p>
  </aside>
  <div class="pc-main">
    <section class="hero">
      <h1>一堆小工具，随手拿来用</h1>
      <p class="lede">打开就能用，不用注册，也不用把文件传到别人服务器上。<b>${TOOLS.length} 个工具全部点开就能干活</b>，按设备端和功能分类找。</p>
      <div class="search">${svg('i-search')}
        <input id="q" type="search" placeholder="找工具：切图、Base64、房贷、颜色…" autocomplete="off" aria-label="搜索工具">
        <button class="clear hidden" id="qClear" aria-label="清空">×</button>
      </div>
    </section>
    <div class="result-bar">
      <span class="label" id="resultLabel"><b>全部工具</b> · 共 <b>${TOOLS.length}</b> 个</span>
      <div class="legend">
        <span><i style="background:var(--ok)"></i>纯本地 ${modeCount('local')}</span>
        <span><i style="background:#e0c07a"></i>本地库 ${modeCount('vendor')}</span>
        <span><i style="background:#8ba6b8"></i>离线精简 ${modeCount('lite')}</span>
      </div>
    </div>
    <div class="grid" id="grid">${cards}</div>
    <div class="empty hidden" id="emptyState">${svg('i-empty')}
      <p>没找到匹配的工具</p><p style="font-size:12.5px">换个词，或者清空筛选看看全部分类</p>
      <button type="button" data-reset="1">清空筛选</button>
    </div>
    ${spec()}
  </div>
</div>
`;
}
