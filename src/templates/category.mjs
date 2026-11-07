// 分类落地页：10 类各一个真实 URL，静态输出工具图标清单与链接，爬虫不执行 JS 也能读全。
import { CATS, TOOLS, MODE_NAME, DEV_NAME } from '../data/catalog.mjs';
import { catTheme } from '../data/theme.mjs';
import { svg, esc } from './layout.mjs';
import { CAT_SEO, cleanDesc } from './seo.mjs';

const OTHER_CATS = CATS.filter((c) => c.id !== 'all');

export function categoryHTML(cat, tools) {
  const seo = CAT_SEO[cat.id] || { intro: '一组打开就能用的小工具。', line: '' };
  const th = catTheme(cat.id);
  const rows = tools.map((t) =>
    `<a class="idx-row" href="/tools/${t.id}/" style="--cs:${th.soft}">
       <span class="ir-ic" aria-hidden="true">${esc(t.icon || th.emoji)}</span>
       <span class="ir-main"><b>${esc(t.name)}</b><span>${esc(cleanDesc(t.desc))}</span></span>
       <span class="ir-meta"><span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span><span class="badge m-${t.mode === 'local' ? 'local' : t.mode === 'vendor' ? 'vendor' : 'lite'}">${MODE_NAME[t.mode]}</span></span>
       <span class="ir-arw">${svg('i-arw')}</span>
     </a>`
  ).join('\n');

  const others = OTHER_CATS.filter((c) => c.id !== cat.id).map((c) => {
    const ct = catTheme(c.id);
    return `<a href="/cat/${c.id}/" style="--cc:${ct.color};--cs:${ct.soft}"><span class="co-ic" aria-hidden="true">${esc(c.icon)}</span>${esc(c.name)}<small>${TOOLS.filter((t) => t.cat === c.id).length}</small></a>`;
  }).join('');

  return `
<nav class="crumb"><a href="/">首页</a><span class="sep">/</span><span>${esc(cat.name)}</span></nav>

<header class="cat-head" style="--cc:${th.color};--cs:${th.soft}">
  <span class="ch-ic" aria-hidden="true">${esc(cat.icon)}</span>
  <div>
    <div class="th-kicker"><span>工具分类</span><span class="tk-dot">·</span><span>共 ${tools.length} 个工具</span></div>
    <h1>${esc(cat.name)}</h1>
    <p>${esc(cat.name)}共 ${tools.length} 个工具，打开就能用，不用注册，文件也不会上传到服务器。</p>
  </div>
</header>

<div class="cat-stat">
  <div><span>当前在线</span><b><span data-stat="online">…</span> <small>人</small></b></div>
  <div><span>历史访问人次</span><b><span data-stat="visits">…</span></b></div>
  <div><span>累计使用次数</span><b><span data-stat="uses">…</span></b></div>
</div>

<section class="cat-intro">
  <div class="sec-head"><h2>这一类是做什么的</h2></div>
  <p>${esc(seo.intro)}</p>
  <p>${esc(seo.line)}这里每个工具都有独立网址，全部计算与渲染都在浏览器里完成，关掉页面数据就没了。</p>
</section>

<div class="cat-below">
  <section class="cat-list">
    <div class="sec-head"><h2>全部 ${tools.length} 个工具</h2></div>
    <div class="idx-list">${rows}</div>
  </section>
  <aside class="side-col">
    <section class="side-rank" id="rank"><div class="sec-head"><h2>工具热度榜</h2><span>实时</span></div>
      <div class="rank-list" data-rank><p class="rank-empty">正在读取真实使用数据…</p></div>
    </section>
    <section class="cat-other">
      <div class="sec-head"><h2>其它分类</h2></div>
      <nav class="cat-other-links" aria-label="其它分类">${others}</nav>
      <p><a href="/">← 返回全部 ${TOOLS.length} 个工具</a></p>
    </section>
  </aside>
</div>
`;
}
