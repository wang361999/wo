// 分类落地页：给 10 类长尾词各一个真实 URL，而不是让面包屑一律指回 /#cat-xxx。
// 页面内容全部静态输出，爬虫不执行 JS 也能读到工具清单与链接。
import { CATS, TOOLS, MODE_NAME, DEV_NAME } from '../data/catalog.mjs';
import { svg, esc } from './layout.mjs';
import { CAT_SEO, cleanDesc } from './seo.mjs';

const OTHER_CATS = CATS.filter((c) => c.id !== 'all');

export function categoryHTML(cat, tools) {
  const seo = CAT_SEO[cat.id] || { intro: '一组打开就能用的小工具。', line: '' };
  const cards = tools.map((t) =>
    `<a class="mini" href="/tools/${t.id}/">
       <div class="mt"><span>${esc(t.icon)}</span>${esc(t.name)}</div>
       <p class="md">${esc(cleanDesc(t.desc))}</p>
       <p class="mini-meta">${DEV_NAME[t.dev]}端 · ${MODE_NAME[t.mode]}</p>
     </a>`
  ).join('\n');

  const others = OTHER_CATS.filter((c) => c.id !== cat.id).map((c) =>
    `<a href="/cat/${c.id}/">${esc(c.icon)} ${esc(c.name)}</a>`
  ).join('');

  return `
<nav class="crumb"><a href="/">工具箱</a><span class="sep">/</span><span>${esc(cat.name)}</span></nav>

<div class="tool-head">
  <h1><span class="h-emoji">${esc(cat.icon)}</span>${esc(cat.name)}
    <span class="pill">${svg('i-shield')}本地处理 · 不上传</span></h1>
  <p>${esc(cat.name)}共 ${tools.length} 个工具，点开就能用，不用注册，也不用把文件传到服务器。</p>
</div>

<section class="cat-intro">
  <h2>这一类是做什么的</h2>
  <p>${esc(seo.intro)}</p>
  <p>${esc(seo.line)}这里每个工具都有独立网址，全部计算与渲染都在浏览器里完成，关掉页面数据就没了。</p>
</section>

<section class="cat-list">
  <h2>本分类全部 ${tools.length} 个工具</h2>
  <div class="related-grid">${cards}</div>
</section>

<section class="cat-other">
  <h2>换个分类看看</h2>
  <nav class="cat-other-links" aria-label="其它分类">${others}</nav>
  <p><a href="/">← 回到全部 ${TOOLS.length} 个工具</a></p>
</section>
`;
}
