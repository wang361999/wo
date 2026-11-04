// 全站布局：纸张质感 + 顶部信任条 + 端预览切换 + header / footer。
// 电脑端与手机端是两套结构，由 CSS（媒体查询或 body.force-*）切换，内容 DOM 共用一份。
import { TOOLS } from '../data/catalog.mjs';

export const SITE_NAME = '一页工具';
export const SITE_TAGLINE = '打开就能用 · 文件不上传';

const SYMBOLS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="i-arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></symbol>
  <symbol id="i-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M8 11h6"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></symbol>
</svg>`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function layout({ title, desc = '', body, isTool = false, canonical, siteUrl }) {
  const head = isTool
    ? `<a class="brand" href="/">${svg('i-logo', 'logo')}${SITE_NAME}<span class="brand-sub">${SITE_TAGLINE}</span></a>
       <a class="back-link" href="/">${svg('i-left')}返回工具箱</a>`
    : `<a class="brand" href="/">${svg('i-logo', 'logo')}${SITE_NAME}<span class="brand-sub">${SITE_TAGLINE}</span></a>
       <nav class="top-nav"><a href="/">全部工具</a><span class="count">${TOOLS.length} 个 · 全部可用</span></nav>`;

  const jsonld = isTool ? '' : `
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME,
    description: desc, url: siteUrl + '/', inLanguage: 'zh-CN',
  })}</script>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
${jsonld}
</head>
<body>
${SYMBOLS}
<div class="trust-bar">
  <div class="wrap trust-inner">
    <span class="trust-txt">${svg('i-shield')}全部工具在浏览器本地运行，文件不会上传到服务器</span>
    <span class="sp"></span>
    <div class="prev-seg" id="prevSeg" role="group" aria-label="切换布局预览">
      <button data-prev="pc">看电脑端</button>
      <button data-prev="mobile">看手机端</button>
      <button data-prev="auto" class="on">自动</button>
    </div>
  </div>
</div>
<header class="site-head"><div class="wrap head-inner">${head}</div></header>
<main class="wrap" id="main">${body}</main>
<footer class="site-foot"><div class="wrap site-foot-inner">
  <span>${SITE_NAME} · 每个工具只做一件事 · 数据留在你自己设备上</span>
  <span>纯前端 · 零依赖 · 无需登录</span>
</div></footer>
${isTool ? '<script type="module" src="/tool.js"></script>' : '<script src="/app.js"></script>'}
</body>
</html>`;
}

export const svg = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
export { esc };
