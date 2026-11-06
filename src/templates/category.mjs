// 分类落地页：10 类各一个真实 URL，纯静态输出工具清单与链接，爬虫不执行 JS 也能读全。
import { CATS, TOOLS, MODE_NAME, DEV_NAME } from '../data/catalog.mjs';
import { svg, esc } from './layout.mjs';
import { CAT_SEO, cleanDesc } from './seo.mjs';

const OTHER_CATS = CATS.filter((c) => c.id !== 'all');

export function categoryHTML(cat, tools) {
  const seo = CAT_SEO[cat.id] || { intro: '一组打开就能用的小工具。', line: '' };
  const rows = tools.map((t) =>
    `<a class="idx-row" href="/tools/${t.id}/">
       <span class="ir-ic" aria-hidden="true">${esc(t.icon)}</span>
       <span class="ir-main"><b>${esc(t.name)}</b><span>${esc(cleanDesc(t.desc))}</span></span>
       <span class="ir-meta"><span class="dev-mark ${t.dev}">${DEV_NAME[t.dev]}</span><span class="badge m-${t.mode === 'local' ? 'local' : t.mode === 'vendor' ? 'vendor' : 'lite'}">${MODE_NAME[t.mode]}</span></span>
       <span class="ir-arw">${svg('i-arw')}</span>
     </a>`
  ).join('\n');

  const others = OTHER_CATS.filter((c) => c.id !== cat.id).map((c) =>
    `<a href="/cat/${c.id}/"><span class="co-ic" aria-hidden="true">${esc(c.icon)}</span>${esc(c.name)}<small>${TOOLS.filter((t) => t.cat === c.id).length}</small></a>`
  ).join('');

  return `
<nav class="crumb"><a href="/">首页</a><span class="sep">/</span><span>${esc(cat.name)}</span></nav>

<header class="cat-head">
  <div class="th-kicker"><span>工具分类</span><span class="tk-dot">·</span><span>共 ${tools.length} 个工具</span></div>
  <h1><span class="h-emoji" aria-hidden="true">${esc(cat.icon)}</span>${esc(cat.name)}</h1>
  <p>${esc(cat.name)}共 ${tools.length} 个工具，打开就能用，不用注册，文件也不会上传到服务器。</p>
</header>

<section class="cat-intro">
  <div class="sec-head"><h2>这一类是做什么的</h2></div>
  <p>${esc(seo.intro)}</p>
  <p>${esc(seo.line)}这里每个工具都有独立网址，全部计算与渲染都在浏览器里完成，关掉页面数据就没了。</p>
</section>

<section class="cat-list">
  <div class="sec-head"><h2>全部 ${tools.length} 个工具</h2></div>
  <div class="idx-list">${rows}</div>
</section>

<section class="cat-other">
  <div class="sec-head"><h2>其它分类</h2></div>
  <nav class="cat-other-links" aria-label="其它分类">${others}</nav>
  <p><a href="/">← 返回全部 ${TOOLS.length} 个工具</a></p>
</section>
`;
}
