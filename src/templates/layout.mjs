// 全站骨架：深色「本地工作台」——顶部状态条 / 品牌头 / 单栏主区 / 页脚。
// <head> 的 SEO 元信息由调用方算好传入，模板只负责视觉与静态链接。
import { TOOLS } from '../data/catalog.mjs';
import { SITE_NAME, SITE_TAGLINE, esc, jsonLdSafe } from './seo.mjs';

export { SITE_NAME, SITE_TAGLINE, esc };

const SYMBOLS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square">
    <path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="i-arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 18L18 6M8 6h10v10"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="miter"><path d="M12 2l9 4v6c0 5-3.8 8.8-9 10-5.2-1.2-9-5-9-10V6l9-4z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></symbol>
  <symbol id="i-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M8 11h6"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="miter"><rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></symbol>
</svg>`;

export function layout({ title, desc = '', body, isTool = false, canonical, siteUrl, jsonld, ogType = 'website', script = '/app.js' }) {
  const head = isTool
    ? `<nav class="top-nav" aria-label="主导航">
         <a href="/" class="nav-back">${svg('i-left')}全部工具</a>
         <a href="/cat/dev/">文本与开发</a>
         <a href="/cat/image/">图片</a>
       </nav>
       <span class="head-stat"><b>LOCAL</b> / 本机运行</span>`
    : `<nav class="top-nav" aria-label="主导航">
         <a href="/" class="on">索引</a>
         <a href="/cat/pdf/">PDF</a>
         <a href="/cat/image/">图片</a>
         <a href="/cat/dev/">开发</a>
         <a href="/cat/life/">生活</a>
       </nav>
       <span class="head-stat"><b>${TOOLS.length}</b> TOOLS / 0 UPLOAD</span>`;

  const ld = jsonld ? `\n<script type="application/ld+json">${jsonLdSafe(jsonld)}</script>` : '';
  const og = `
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#0b0e12">
<meta name="color-scheme" content="dark">
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
<div class="topbar"><div class="wrap topbar-in">
  <span class="tb-l"><i class="live"></i>ALL SYSTEMS LOCAL<span class="tb-div">/</span>文件不离开这台设备</span>
  <span class="tb-r">NO ACCOUNT<span class="tb-div">·</span>NO UPLOAD<span class="tb-div">·</span>NO TRACKING</span>
</div></div>
<header class="site-head"><div class="wrap head-in">
  <a class="brand" href="/" aria-label="${esc(SITE_NAME)}首页">
    <span class="brand-mark">${svg('i-logo')}</span>
    <span class="brand-txt">${SITE_NAME}<small>ONE PAGE TOOLS</small></span>
  </a>
  ${head}
</div></header>
<main class="wrap" id="main">${body}</main>
<footer class="site-foot"><div class="wrap foot-in">
  <span class="foot-brand">${SITE_NAME}<small>${SITE_TAGLINE}</small></span>
  <span class="foot-meta">${TOOLS.length} 个工具 · 纯前端 · 零依赖 · 打开即用</span>
  <a href="/" class="foot-top">回到索引 ↑</a>
</div></footer>
${js}
</body>
</html>`;
}

export const svg = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
