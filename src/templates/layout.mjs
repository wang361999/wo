// 全站骨架：克制的浅色工具目录 —— 单层顶栏 / 内容主区 / 页脚。
// <head> 的 SEO 元信息由调用方算好传入，模板只负责视觉与静态链接。
import { TOOLS } from '../data/catalog.mjs';
import { SITE_NAME, SITE_TAGLINE, esc, jsonLdSafe } from './seo.mjs';

export { SITE_NAME, SITE_TAGLINE, esc };

const SYMBOLS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M3 10.5h18M10.5 10.5v10.5"/>
    <rect x="6" y="6" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.7"/><path d="M15.8 15.8L21 21"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="i-arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8 6h10v10"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.5l8.5 3.7v5.6c0 4.8-3.6 8.4-8.5 9.7-4.9-1.3-8.5-4.9-8.5-9.7V6.2L12 2.5z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/></symbol>
  <symbol id="i-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M8 11h6"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></symbol>
</svg>`;

export function layout({ title, desc = '', body, isTool = false, canonical, siteUrl, jsonld, ogType = 'website', script = '/app.js' }) {
  const head = isTool
    ? `<nav class="top-nav" aria-label="主导航">
         <a href="/" class="nav-back">${svg('i-left')}全部工具</a>
         <a href="/cat/dev/">文本与开发</a>
         <a href="/cat/image/">图片</a>
       </nav>
       <span class="head-stat">本地运行 · 文件不上传</span>`
    : `<nav class="top-nav" aria-label="主导航">
         <a href="/" class="on">全部工具</a>
         <a href="/cat/pdf/">PDF 工具</a>
         <a href="/cat/image/">图片</a>
         <a href="/cat/dev/">文本与开发</a>
         <a href="/cat/life/">生活与杂务</a>
       </nav>
       <span class="head-stat">${TOOLS.length} 个工具 · 免费使用</span>`;

  const ld = jsonld ? `\n<script type="application/ld+json">${jsonLdSafe(jsonld)}</script>` : '';
  const og = `
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="zh_CN">
<meta property="og:type" content="${esc(ogType)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(siteUrl)}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(SITE_NAME)} · ${esc(SITE_TAGLINE)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(siteUrl)}/og.png">`;
  const js = isTool ? '<script type="module" src="/tool.js"></script>' : script ? `<script src="${esc(script)}"></script>` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">${og}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">${ld}
</head>
<body>
${SYMBOLS}
<header class="site-head"><div class="wrap head-in">
  <a class="brand" href="/" aria-label="${esc(SITE_NAME)}首页">
    <span class="brand-mark">${svg('i-logo')}</span>
    <span class="brand-txt">${SITE_NAME}<small>${SITE_TAGLINE}</small></span>
  </a>
  ${head}
</div></header>
<main class="wrap" id="main">${body}</main>
<footer class="site-foot"><div class="wrap foot-in">
  <div class="foot-brand">
    <span class="brand-mark sm">${svg('i-logo')}</span>
    <span><b>${SITE_NAME}</b><small>${TOOLS.length} 个免费在线工具 · 全部在浏览器本地运行</small></span>
  </div>
  <span class="foot-meta">无需注册 · 无文件上传 · 无使用追踪</span>
  <a href="/" class="foot-top">回到首页 ${svg('i-up')}</a>
</div></footer>
${js}
</body>
</html>`;
}

export const svg = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
