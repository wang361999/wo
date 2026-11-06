// 索引式门面：服务端一次性输出 286 条索引与 10 个分类静态链接；客户端只做筛选计数。
// 视觉上是「目录 / 终端」，不再是卡片宫格；DOM 契约（#grid .card / data-d / data-c）保持不变。
import { TOOLS, CATS, DEVS, CAT_MAP, DEV_NAME, MODE_NAME, MODE_DESC } from '../data/catalog.mjs';
import { svg, esc } from './layout.mjs';
import { cleanDesc } from './seo.mjs';

const inDev = (t, d) => d === 'all' || t.dev === d || t.dev === 'both';
const devCount = (d) => TOOLS.filter((t) => inDev(t, d)).length;
const catCount = (c, d) => TOOLS.filter((t) => inDev(t, d) && (c === 'all' || t.cat === c)).length;
const modeCount = (m) => TOOLS.filter((t) => t.mode === m).length;
const no = (n) => String(n).padStart(3, '0');

const MODE_CLASS = { local: 'm-local', vendor: 'm-vendor', lite: 'm-lite' };

function devSeg() {
  return `<div class="dev-seg" role="group" aria-label="按设备端筛选">${DEVS.map((d) =>
    `<button data-dev="${d.id}" class="${d.id === 'all' ? 'on' : ''}"><span class="ds-id">${d.id.toUpperCase()}</span>${d.name}<span class="n" data-dev-n="${d.id}">${devCount(d.id)}</span></button>`
  ).join('')}</div>`;
}

function catRail() {
  return `<div class="cat-rail" role="group" aria-label="按功能筛选">${CATS.map((c, i) =>
    `<button class="cat-chip ${c.id === 'all' ? 'on' : ''}" data-cat="${c.id}">
       <span class="cc-no">${no(i)}</span>${c.name}<span class="n" data-cat-n="${c.id}">${catCount(c.id, 'all')}</span></button>`
  ).join('')}</div>`;
}

function card(t, i) {
  const searchable = [t.name, t.desc, t.tags.join(' '), CAT_MAP[t.cat]?.name, DEV_NAME[t.dev], MODE_NAME[t.mode]]
    .join(' ').toLowerCase();
  const attrs = `data-d="${t.dev}" data-c="${t.cat}" data-search="${esc(searchable)}"`;
  return `<a class="card" href="/tools/${t.id}/" ${attrs}>
    <span class="card-no">${no(i + 1)}</span>
    <span class="card-body">
      <span class="card-line"><span class="card-ic" aria-hidden="true">${esc(t.icon)}</span><b class="card-name">${esc(t.name)}</b></span>
      <span class="card-desc">${esc(cleanDesc(t.desc))}</span>
    </span>
    <span class="card-tail">
      <span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span>
      <span class="badge ${MODE_CLASS[t.mode]}">${MODE_NAME[t.mode]}</span>
      <span class="card-arw">${svg('i-up')}</span>
    </span>
  </a>`;
}

/* 分类按钮是 JS 筛选控件，爬虫点不了。这里给 10 个真实分类页一份静态链接，
   让 /cat/<id>/ 能被发现，也把首页权重分给分类页。 */
function catLinks() {
  const items = CATS.filter((c) => c.id !== 'all').map((c, i) => {
    const list = TOOLS.filter((t) => t.cat === c.id);
    const eg = list.slice(0, 3).map((t) => t.name).join(' / ');
    return `<a class="seo-cat" href="/cat/${c.id}/">
      <span class="sc-no">${no(i + 1)}</span>
      <span class="sc-main"><b>${esc(c.name)}</b><span class="sc-eg">${esc(eg)}</span></span>
      <span class="sc-n">${String(list.length).padStart(2, '0')}</span>
      <span class="sc-arw">${svg('i-up')}</span>
    </a>`;
  }).join('\n');
  return `<section class="dir" aria-label="按分类浏览工具">
    <div class="sec-head"><span class="sec-no">02</span><h2>按分类浏览</h2>
      <p>十类工具，每类都有独立页面，工具和用法列在一起。</p></div>
    <div class="dir-grid">${items}</div>
  </section>`;
}

function spec() {
  return `<details class="spec">
    <summary><span class="sec-no">03</span>${svg('i-arw', 'arw')}<span>关于这一页：怎么组织、怎么实现</span><span class="sm-plus">＋</span></summary>
    <div class="spec-body">
      <div class="spec-card"><h3><span class="num">01</span>两级索引</h3>
        <p>一级按<b>设备端</b>切（电脑 / 手机 / 两端），二级按<b>功能</b>分 10 类。选中一级时，二级的数字跟着变，不用在两个列表里猜。</p></div>
      <div class="spec-card"><h3><span class="num">02</span>一张表管全部</h3>
        <p>工具、分类、描述都在同一份注册表里。索引条目、两端计数、搜索结果全从这张表算出来，加一个工具只加一行。</p></div>
      <div class="spec-card"><h3><span class="num">03</span>没有空壳页</h3>
        <p>${TOOLS.length} 个工具各有独立网址，打开就能跑。<b>没有一条索引点进去只弹说明</b>；静态站承接不了的能力，会在工具页里写明边界。</p></div>
      <div class="spec-card"><h3><span class="num">04</span>数据不出本机</h3>
        <p>没有账号、没有上传接口、没有埋点。图片和文本只在当前标签页被读取，刷新或关掉就没了，唯一的成本是你自己浏览器的算力。</p></div>
    </div>
    <p class="spec-foot">实现档位　<b>纯本地</b> ${modeCount('local')} · <b>本地库</b> ${modeCount('vendor')} · <b>离线精简</b> ${modeCount('lite')}　|　${MODE_DESC.local}${MODE_DESC.vendor}${MODE_DESC.lite}三档合计 ${TOOLS.length} 个，全部可用。</p>
  </details>`;
}

export function homeHTML() {
  return `
<section class="hero">
  <div class="hero-kicker"><span class="hk-idx">INDEX / 001—${no(TOOLS.length)}</span><span class="hk-rule"></span><span class="hk-live"><i class="live"></i>全部可用</span></div>
  <h1>打开就用<span class="hl-dot">.</span><br><em>用完就走</em></h1>
  <div class="hero-bottom">
    <p class="hero-lede">${TOOLS.length} 个在线小工具，塞进一个页面。不注册、不上传，图片和文本只在你的浏览器里被读取，关掉就没了。</p>
    <div class="hero-metrics">
      <div class="metric"><b>${TOOLS.length}</b><span>TOOLS / 工具总数</span></div>
      <div class="metric"><b>0</b><span>UPLOADS / 上传次数</span></div>
      <div class="metric"><b>100<small>%</small></b><span>CLIENT-SIDE / 本机运行</span></div>
    </div>
  </div>
</section>

<section class="console" aria-label="查找工具">
  <div class="console-row search-row">
    <span class="console-label">01 / SEARCH</span>
    <div class="search">${svg('i-search')}
      <input id="q" type="search" placeholder="输入关键词，找工具…" autocomplete="off" aria-label="搜索工具">
      <kbd class="kbd">/</kbd>
      <button class="clear hidden" id="qClear" aria-label="清空">×</button>
    </div>
  </div>
  <div class="console-row">
    <span class="console-label">02 / DEVICE</span>
    ${devSeg()}
    <p class="dev-cap" id="devCap">标「两端」的工具在哪一边都能用。</p>
  </div>
  <div class="console-row last">
    <span class="console-label">03 / CATEGORY</span>
    ${catRail()}
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
  <p>没有匹配的条目</p><p class="empty-sub">换个词，或清空筛选看全部索引</p>
  <button type="button" data-reset="1">清空筛选</button>
</div>

${catLinks()}
${spec()}
`;
}
