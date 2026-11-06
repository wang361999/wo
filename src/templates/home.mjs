// 首页：服务端一次性输出 286 个工具与 10 个分类的静态链接，客户端只做筛选与计数。
// DOM 契约（#grid .card / data-d / data-c / data-search）保持不变，app.js 不依赖具体视觉结构。
import { TOOLS, CATS, DEVS, CAT_MAP, DEV_NAME, MODE_NAME, MODE_DESC } from '../data/catalog.mjs';
import { svg, esc } from './layout.mjs';
import { cleanDesc } from './seo.mjs';

const inDev = (t, d) => d === 'all' || t.dev === d || t.dev === 'both';
const devCount = (d) => TOOLS.filter((t) => inDev(t, d)).length;
const catCount = (c, d) => TOOLS.filter((t) => inDev(t, d) && (c === 'all' || t.cat === c)).length;
const modeCount = (m) => TOOLS.filter((t) => t.mode === m).length;

const MODE_CLASS = { local: 'm-local', vendor: 'm-vendor', lite: 'm-lite' };

function devSeg() {
  return `<div class="dev-seg" role="group" aria-label="按设备端筛选">${DEVS.map((d) =>
    `<button data-dev="${d.id}" class="${d.id === 'all' ? 'on' : ''}">${d.name}<span class="n" data-dev-n="${d.id}">${devCount(d.id)}</span></button>`
  ).join('')}</div>`;
}

function catRail() {
  return `<div class="cat-rail" role="group" aria-label="按功能筛选">${CATS.map((c) =>
    `<button class="cat-chip ${c.id === 'all' ? 'on' : ''}" data-cat="${c.id}">${c.name}<span class="n" data-cat-n="${c.id}">${catCount(c.id, 'all')}</span></button>`
  ).join('')}</div>`;
}

function card(t) {
  const searchable = [t.name, t.desc, t.tags.join(' '), CAT_MAP[t.cat]?.name, DEV_NAME[t.dev], MODE_NAME[t.mode]]
    .join(' ').toLowerCase();
  const attrs = `data-d="${t.dev}" data-c="${t.cat}" data-search="${esc(searchable)}"`;
  return `<a class="card" href="/tools/${t.id}/" ${attrs}>
    <span class="card-head">
      <span class="card-ic" aria-hidden="true">${esc(t.icon)}</span>
      <b class="card-name">${esc(t.name)}</b>
      <span class="card-arw">${svg('i-arw')}</span>
    </span>
    <span class="card-desc">${esc(cleanDesc(t.desc))}</span>
    <span class="card-foot">
      <span class="card-cat">${esc(CAT_MAP[t.cat]?.name || '工具')}</span>
      <span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span>
      <span class="badge ${MODE_CLASS[t.mode]}">${MODE_NAME[t.mode]}</span>
    </span>
  </a>`;
}

/* 分类按钮是 JS 筛选控件，爬虫点不了。这里给 10 个真实分类页一份静态链接，
   让 /cat/<id>/ 能被发现，也把首页权重分给分类页。 */
function catLinks() {
  const items = CATS.filter((c) => c.id !== 'all').map((c) => {
    const list = TOOLS.filter((t) => t.cat === c.id);
    const eg = list.slice(0, 3).map((t) => t.name).join(' / ');
    return `<a class="seo-cat" href="/cat/${c.id}/">
      <span class="sc-ic" aria-hidden="true">${esc(c.icon)}</span>
      <span class="sc-main"><b>${esc(c.name)}</b><span class="sc-eg">${esc(eg)}</span></span>
      <span class="sc-n">${list.length} 个</span>
      <span class="sc-arw">${svg('i-arw')}</span>
    </a>`;
  }).join('\n');
  return `<section class="dir" id="categories" aria-label="按分类浏览工具">
    <div class="sec-head"><div><h2>按分类浏览</h2><p>10 个分类，每类都有独立页面，方便查找和收藏。</p></div></div>
    <div class="dir-grid">${items}</div>
  </section>`;
}

function spec() {
  return `<details class="spec">
    <summary><span>关于本站</span><span class="sm-plus">＋</span></summary>
    <div class="spec-body">
      <div class="spec-card"><h3>两级筛选</h3>
        <p>先按<b>设备端</b>缩小范围，再按<b>功能分类</b>查找。选中设备端后，分类后面的数字会跟着变，不用在两个列表里来回试。</p></div>
      <div class="spec-card"><h3>一张注册表管全部</h3>
        <p>工具名称、分类、描述都写在同一份注册表里。首页索引、分类页、工具页和站点地图都从这张表生成，加一个工具只需要加一行。</p></div>
      <div class="spec-card"><h3>每个工具都有独立网址</h3>
        <p>${TOOLS.length} 个工具各有自己的页面，打开就能用。没有「卡片能点、点进去只有说明」的空壳页；静态站承接不了的能力，会在工具页里写明边界。</p></div>
      <div class="spec-card"><h3>数据留在你的设备上</h3>
        <p>没有账号系统，没有上传接口，也没有访问埋点。图片和文本只在当前浏览器标签页里被读取，刷新或关闭页面后就不留痕迹。</p></div>
    </div>
    <p class="spec-foot">实现方式　纯本地 ${modeCount('local')} 个 · 本地库 ${modeCount('vendor')} 个 · 离线精简 ${modeCount('lite')} 个　|　${MODE_DESC.local}${MODE_DESC.vendor}${MODE_DESC.lite}合计 ${TOOLS.length} 个，全部可用。</p>
  </details>`;
}

export function homeHTML() {
  return `
<section class="hero">
  <div class="hero-eyebrow"><span class="eyebrow-dot"></span>免费 · 无需注册 · 文件不上传</div>
  <h1>常用小工具，<br><span>一页就够了</span></h1>
  <p class="hero-lede">PDF、图片、文本、计算、CSS 生成器……${TOOLS.length} 个工具按分类整理在这里。所有处理都在你的浏览器里完成，不用登录，文件不会上传到任何服务器。</p>
  <div class="hero-search">${svg('i-search')}
    <input id="q" type="search" placeholder="搜索工具名称或功能" autocomplete="off" aria-label="搜索工具">
    <kbd class="kbd">/</kbd>
    <button class="clear hidden" id="qClear" aria-label="清空">×</button>
  </div>
  <div class="hero-stats">
    <span><b>${TOOLS.length}</b> 个在线工具</span>
    <span><b>0</b> 次文件上传</span>
    <span><b>100%</b> 浏览器本地运行</span>
  </div>
</section>

<section class="filters" aria-label="筛选工具">
  <div class="filter-row">
    <span class="filter-label">适用设备</span>
    <div class="filter-main">${devSeg()}
      <p class="dev-cap" id="devCap">标「两端」的工具在电脑和手机上都能用。</p></div>
  </div>
  <div class="filter-row last">
    <span class="filter-label">功能分类</span>
    <div class="filter-main">${catRail()}</div>
  </div>
</section>

<div class="result-bar">
  <span class="label" id="resultLabel"><b>全部工具</b> · 共 <b>${TOOLS.length}</b> 个</span>
  <div class="legend">
    <span><i class="lg-local"></i>纯本地 ${modeCount('local')}</span>
    <span><i class="lg-vendor"></i>本地库 ${modeCount('vendor')}</span>
    <span><i class="lg-lite"></i>离线精简 ${modeCount('lite')}</span>
  </div>
</div>

<div class="grid" id="grid">${TOOLS.map(card).join('\n')}</div>
<div class="empty hidden" id="emptyState">${svg('i-empty')}
  <p>没有找到匹配的工具</p><p class="empty-sub">换个关键词，或清空筛选条件看看全部工具</p>
  <button type="button" data-reset="1">清空筛选</button>
</div>

${catLinks()}
${spec()}
`;
}
