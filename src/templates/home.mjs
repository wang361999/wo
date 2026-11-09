// 首页：「工具辞典」扉页 —— 卷次分区 / 检字表 / 词条式工具索引。
// 服务端一次性输出全部工具与各分类的静态链接，客户端只做筛选与计数。
// 所有 data-* 钩子与 .card/.cat-chip/.dev-seg 等选择器契约保持不变。
import { TOOLS, CATS, DEVS, CAT_MAP, DEV_NAME, MODE_NAME, MODE_DESC } from '../data/catalog.mjs';
import { catTheme } from '../data/theme.mjs';
import { svg, esc } from './layout.mjs';
import { cleanDesc } from './seo.mjs';

const inDev = (t, d) => d === 'all' || t.dev === d || t.dev === 'both';
const devCount = (d) => TOOLS.filter((t) => inDev(t, d)).length;
const catCount = (c, d) => TOOLS.filter((t) => inDev(t, d) && (c === 'all' || t.cat === c)).length;
const modeCount = (m) => TOOLS.filter((t) => t.mode === m).length;

const MODE_CLASS = { local: 'm-local', vendor: 'm-vendor', lite: 'm-lite', api: 'm-api' };

/* 阿拉伯数字转中文数字，只用到千位，扉页大字用。 */
const CN_D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function cnNum(n) {
  if (n <= 0) return '零';
  const units = [[1e3, '千'], [1e2, '百'], [10, '十']];
  let out = '', rest = n;
  for (const [u, name] of units) {
    const d = Math.floor(rest / u);
    if (d > 0) {
      out += (d > 1 || !out ? CN_D[d] : '') + name;
      rest %= u;
    } else if (out && rest >= u / 10) {
      out += '零';
    }
  }
  if (rest > 0) out += CN_D[rest];
  return out || '零';
}

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

/* 词条卡：编号 + 部首（分类图标）+ 【名称】 + 释义。 */
function card(t, i) {
  const th = catTheme(t.cat);
  const searchable = [t.name, t.desc, t.tags.join(' '), CAT_MAP[t.cat]?.name, DEV_NAME[t.dev], MODE_NAME[t.mode]]
    .join(' ').toLowerCase();
  return `<a class="card" href="/tools/${t.id}/" data-d="${t.dev}" data-c="${t.cat}" data-search="${esc(searchable)}" data-no="${String(i + 1).padStart(4, '0')}">
    <span class="card-ic" style="--ic:${th.soft}" aria-hidden="true">${esc(t.icon || th.emoji)}</span>
    <span class="card-main"><b class="card-name">${esc(t.name)}</b><span class="card-desc">${esc(cleanDesc(t.desc))}</span></span>
    <span class="card-foot"><span class="card-cat" style="color:${th.color}">${esc(CAT_MAP[t.cat]?.name || '工具')}</span><span class="badge ${MODE_CLASS[t.mode]}">${MODE_NAME[t.mode]}</span></span>
    <span class="card-arw">${svg('i-arw')}</span>
  </a>`;
}

/* 卷一：常用工具 —— 每个分类取一个代表工具。 */
function quickTiles() {
  return CATS.filter((c) => c.id !== 'all').slice(0, 8).map((c) => {
    const t = TOOLS.find((x) => x.cat === c.id);
    if (!t) return '';
    const th = catTheme(c.id);
    return `<a class="quick-tile" href="/tools/${t.id}/">
      <span class="qt-ic" style="--ic:${th.soft}" aria-hidden="true">${esc(t.icon || th.emoji)}</span>
      <b>${esc(t.name)}</b><small>${esc(c.name)}</small>
    </a>`;
  }).join('');
}

/* 卷四：分类检字表。 */
function categoryTiles() {
  return CATS.filter((c) => c.id !== 'all').map((c) => {
    const th = catTheme(c.id);
    const n = TOOLS.filter((t) => t.cat === c.id).length;
    return `<a class="cat-tile" href="/cat/${c.id}/" style="--cc:${th.color};--cs:${th.soft}">
      <span class="ct-ic" aria-hidden="true">${esc(c.icon)}</span>
      <span class="ct-txt"><b>${esc(c.name)}</b><small>${n} 器</small></span>
      <span class="ct-arw">${svg('i-arw')}</span>
    </a>`;
  }).join('');
}

/* 分类按钮是 JS 筛选控件，爬虫点不了。这里给各分类页一份静态链接。 */
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
  return `<section class="dir" id="cat-dir" aria-label="按分类浏览工具">
    <div class="sec-head"><div><h2>分类总目</h2><p>${CATS.filter(c=>c.id!=='all').length} 个分类，每类都有独立页面，方便查找和收藏。</p></div></div>
    <div class="dir-grid">${items}</div>
  </section>`;
}

function spec() {
  return `<details class="spec">
    <summary><span>凡例 · 关于本站</span><span class="sm-plus">＋</span></summary>
    <div class="spec-body">
      <div class="spec-card"><h3>两级检索</h3>
        <p>先按<b>设备端</b>缩小范围，再按<b>功能分类</b>查找。选中设备端后，分类后面的数字会跟着变，不用在两个列表里来回试。</p></div>
      <div class="spec-card"><h3>一张注册表管全部</h3>
        <p>工具名称、分类、描述都写在同一份注册表里。首页索引、分类页、工具页和站点地图都从这张表生成，加一个工具只需要加一行。</p></div>
      <div class="spec-card"><h3>每个工具都有独立网址</h3>
        <p>${TOOLS.length} 个工具各有自己的页面，打开就能用。没有「卡片能点、点进去只有说明」的空壳页；静态站承接不了的能力，会在工具页里写明边界。</p></div>
      <div class="spec-card"><h3>统计只数次数，不碰内容</h3>
        <p>实时在线、访问量与热度榜是匿名计数，只记录「哪个工具被真正用过」和一个随机会话标识，不采集你在工具里填的任何文字、图片或文件，也没有账号系统。服务端对每个会话做去重，刷不出假数据。</p></div>
      <div class="spec-card"><h3>需要联网的那几个</h3>
        <p>IP 查询、域名解析、实时汇率这类工具经本站同源接口取数并短期缓存，档位标为「在线数据」。查询词会送到服务端，但不落库、不关联身份；其余 ${TOOLS.length - modeCount('api')} 个工具仍然完全在浏览器本地运行。</p></div>
    </div>
    <p class="spec-foot">实现方式　纯本地 ${modeCount('local')} 个 · 本地库 ${modeCount('vendor')} 个 · 离线精简 ${modeCount('lite')} 个 · 在线数据 ${modeCount('api')} 个　|　${MODE_DESC.local}${MODE_DESC.vendor}${MODE_DESC.lite}${MODE_DESC.api}合计 ${TOOLS.length} 个，全部可用。</p>
  </details>`;
}

export function homeHTML() {
  return `
<section class="hero">
  <div class="hero-copy">
    <div class="hero-eyebrow">免费在线 · 无需注册 · 文件不上传</div>
    <h1><span class="red">${cnNum(TOOLS.length)}</span>件工具<br>一页尽收，随手可用</h1>
    <p class="hero-lede">PDF、图片、文本、计算、CSS 生成器……${TOOLS.length} 个工具按类分卷编目，绝大多数在浏览器本地运行，实时数据类经本站接口取数。查工具，像查一部辞典。</p>
    <div class="hero-search">${svg('i-search')}
      <input id="q" type="search" placeholder="检索工具名称或功能" autocomplete="off" aria-label="搜索工具">
      <kbd class="kbd">/</kbd>
      <button class="clear hidden" id="qClear" aria-label="清空">×</button>
    </div>
    <div class="hero-tags"><span>常检：</span><a href="/tools/pdf-merge/">PDF 合并</a><a href="/tools/qrcode/">二维码</a><a href="/tools/timestamp/">时间戳</a><a href="/tools/mortgage/">房贷计算</a></div>
  </div>
  <div class="hero-side" aria-hidden="true">
    <span class="hero-vert"><b>一頁工具</b>　打開即用</span>
    <span class="hero-seal">${svg('i-seal')}</span>
  </div>
</section>

<section class="stat-strip" aria-label="站点实时数据">
  <div class="stat-grid">
    <div class="stat-card"><span class="stat-label"><i class="live-dot"></i>当前在线</span><b data-stat="online">…</b><small>人 · 45 秒内有活动</small></div>
    <div class="stat-card"><span class="stat-label">历史访问人次</span><b data-stat="visits">…</b><small>次打开</small></div>
    <div class="stat-card"><span class="stat-label">独立访客</span><b data-stat="visitors">…</b><small>个会话</small></div>
    <div class="stat-card"><span class="stat-label">工具使用人数</span><b data-stat="tool_users">…</b><small>人用过工具</small></div>
  </div>
  <p class="stat-hint" data-stats-hint>正在连接实时数据…</p>
</section>

<section class="quick" aria-label="常用工具快捷入口">
  <div class="sec-head"><h2><span class="sec-no">卷一</span>常用工具</h2><span>点部首直接翻到</span></div>
  <div class="quick-grid">${quickTiles()}</div>
</section>

<section class="recent-sec" aria-label="最近使用与收藏">
  <div class="sec-head"><h2><span class="sec-no">卷二</span>我的工具</h2><button type="button" class="sync-open" data-sync-open>跨设备同步</button></div>
  <div class="recent-label">我的收藏</div>
  <div class="recent-row" data-fav></div>
  <div class="recent-label">最近用过</div>
  <div class="recent-row" data-recent></div>
  <div class="sync-panel" data-sync-panel hidden>
    <p class="sync-cur" data-sync-current>还没有同步码</p>
    <div class="sync-row">
      <input class="t-input" data-sync-code maxlength="12" placeholder="输入同步码" aria-label="同步码" spellcheck="false" autocomplete="off">
      <button type="button" class="t-btn primary" data-sync-connect>连接</button>
      <button type="button" class="t-btn" data-sync-new>生成新码</button>
    </div>
    <div class="sync-row">
      <button type="button" class="t-btn" data-sync-push>上传本机</button>
      <button type="button" class="t-btn" data-sync-pull>从云端拉取</button>
      <button type="button" class="t-btn" data-sync-close>收起</button>
    </div>
    <p class="sync-msg" data-sync-msg>同步码是唯一凭据，只存工具编号，不存任何输入内容。数据 90 天不更新会自动过期。</p>
  </div>
</section>

<section class="rank-sec" id="rank">
  <div class="rank-main">
    <div class="sec-head"><h2><span class="sec-no">卷三</span>使用热度</h2><span>按真实使用次数朱批排名</span></div>
    <div class="rank-list" data-rank><p class="rank-empty">正在读取真实使用数据…</p></div>
  </div>
  <aside class="rank-side">
    <div class="side-card">
      <span class="side-label">累计使用次数</span>
      <b data-stat="uses">…</b>
      <p>用户真的操作过工具才算一次使用，同一会话对同一工具只计一次。榜单按累计次数实时排序。</p>
    </div>
    <div class="side-card soft">
      <span class="side-label">${svg('i-shield')}隐私说明</span>
      <p>统计只记录事件类型、工具编号和一个随机会话标识。你在工具里输入的内容不会被上传或保存。</p>
    </div>
  </aside>
</section>

<section class="cat-sec" id="categories" aria-label="工具分类">
  <div class="sec-head"><h2><span class="sec-no">卷四</span>分类检字表</h2><span>${CATS.filter(c=>c.id!=='all').length} 部 · ${TOOLS.length} 器</span></div>
  <div class="cat-grid">${categoryTiles()}</div>
</section>

<section class="all-sec" id="all" aria-label="全部工具">
  <div class="sec-head"><h2><span class="sec-no">卷五</span>全部工具</h2><span id="resultLabel"><b>共 ${TOOLS.length} 条</b></span></div>
  <section class="filters" aria-label="筛选工具">
    <div class="filter-row"><span class="filter-label">适用设备</span>
      <div class="filter-main">${devSeg()}<p class="dev-cap" id="devCap">标「两端」的工具在电脑和手机上都能用。</p></div>
    </div>
    <div class="filter-row last"><span class="filter-label">功能分类</span><div class="filter-main">${catRail()}</div></div>
  </section>
  <div class="result-bar">
    <span class="label" id="resultCount">显示 ${TOOLS.length} 条词条</span>
    <div class="legend"><span><i class="lg-local"></i>纯本地 ${modeCount('local')}</span><span><i class="lg-vendor"></i>本地库 ${modeCount('vendor')}</span><span><i class="lg-lite"></i>离线精简 ${modeCount('lite')}</span></div>
  </div>
  <div class="grid" id="grid">${TOOLS.map(card).join('\n')}</div>
  <div class="empty hidden" id="emptyState">${svg('i-empty')}
    <p>查无此条</p><p class="empty-sub">换个关键词，或清空筛选条件看看全部工具</p>
    <button type="button" data-reset="1">清空筛选</button>
  </div>
</section>

${catLinks()}
${spec()}
`;
}
