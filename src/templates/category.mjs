// 分类落地页：「第 N 卷」卷首 + 编号词条清单。静态输出，爬虫不执行 JS 也能读全。
import { CATS, TOOLS, MODE_NAME, DEV_NAME } from '../data/catalog.mjs';
import { catTheme } from '../data/theme.mjs';
import { svg, esc } from './layout.mjs';
import { CAT_SEO, cleanDesc } from './seo.mjs';

const OTHER_CATS = CATS.filter((c) => c.id !== 'all');

/* 卷号用中文数字，与首页扉页口径一致。 */
const CN_D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
function cnVol(n) { return CN_D[n] || String(n); }

export function categoryHTML(cat, tools) {
  const seo = CAT_SEO[cat.id] || { intro: '一组打开就能用的小工具。', line: '' };
  const th = catTheme(cat.id);
  const vol = CATS.filter((c) => c.id !== 'all').findIndex((c) => c.id === cat.id) + 1;
  const rows = tools.map((t, i) =>
    `<a class="idx-row" href="/tools/${t.id}/" style="--cs:${th.soft}">
       <span class="ir-no">${String(i + 1).padStart(4, '0')}</span>
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
<nav class="crumb"><a href="/">总目</a><span class="sep">/</span><span>第${cnVol(vol)}卷 · ${esc(cat.name)}</span></nav>

<header class="cat-head" style="--cc:${th.color};--cs:${th.soft}">
  <span class="ch-ic" aria-hidden="true">${esc(cat.icon)}</span>
  <div>
    <div class="th-kicker"><span>第${cnVol(vol)}卷</span><span class="tk-dot">·</span><span>共 ${tools.length} 器</span></div>
    <h1>${esc(cat.name)}</h1>
    <p>${esc(cat.name)}共 ${tools.length} 个工具，打开就能用，不用注册；绝大多数在浏览器本地运行，实时数据类工具经本站接口取数。</p>
  </div>
</header>

<div class="cat-stat">
  <div><span>当前在线</span><b><span data-stat="online">…</span> <small>人</small></b></div>
  <div><span>历史访问人次</span><b><span data-stat="visits">…</span></b></div>
  <div><span>累计使用次数</span><b><span data-stat="uses">…</span></b></div>
</div>

<section class="cat-intro">
  <div class="sec-head"><h2>本卷解题</h2></div>
  <p>${esc(seo.intro)}</p>
  <p>${esc(seo.line)}这里每个工具都有独立网址，全部计算与渲染都在浏览器里完成，关掉页面数据就没了。</p>
</section>

<div class="cat-below">
  <section class="cat-list">
    <div class="sec-head"><h2>本卷词条 · ${tools.length} 条</h2></div>
    <div class="idx-list">${rows}</div>
  </section>
  <aside class="side-col">
    <section class="side-rank" id="rank"><div class="sec-head"><h2>使用热度</h2><span>实时</span></div>
      <div class="rank-list" data-rank><p class="rank-empty">正在读取真实使用数据…</p></div>
    </section>
    <section class="cat-other">
      <div class="sec-head"><h2>其它各卷</h2></div>
      <nav class="cat-other-links" aria-label="其它分类">${others}</nav>
      <p><a href="/">← 回总目看全部 ${TOOLS.length} 个工具</a></p>
    </section>
  </aside>
</div>
`;
}
