// 全站骨架：工具站式顶栏 / 内容主区 / 页脚 / 移动端底部导航。
// <head> 的 SEO 元信息由调用方算好传入，模板只负责视觉与静态链接。
import { TOOLS } from '../data/catalog.mjs';
import { SITE_NAME, SITE_TAGLINE, esc, jsonLdSafe } from './seo.mjs';

export { SITE_NAME, SITE_TAGLINE, esc };

const SYMBOLS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4"/>
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
  <symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3.5 10.5L12 3.5l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></symbol>
  <symbol id="i-cats" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></symbol>
  <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M7 3.5h10v6a5 5 0 0 1-10 0v-6z"/><path d="M7 5H4v2a4 4 0 0 0 4 4M17 5h3v2a4 4 0 0 1-4 4"/><path d="M12 14.5V18M8.5 20.5h7"/></symbol>
  <symbol id="i-top" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>
  <symbol id="i-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></symbol>
</svg>`;

export function layout({ title, desc = '', body, isTool = false, canonical, siteUrl, jsonld, ogType = 'website', script = '/app.js', mode = '' }) {
  const head = isTool
    ? `<nav class="head-nav" aria-label="主导航">
         <a href="/" class="nav-back">${svg('i-left')}全部工具</a>
         <a href="/cat/pdf/">PDF 工具</a>
         <a href="/cat/image/">图片</a>
         <a href="/cat/dev/">文本与开发</a>
       </nav>
       <span class="head-badge">${svg('i-shield')}${mode === 'api' ? '查询经本站接口' : '浏览器本地运行'}</span>`
    : `<nav class="head-nav" aria-label="主导航">
         <a href="/" class="on">全部工具</a>
         <a href="/cat/pdf/">PDF 工具</a>
         <a href="/cat/image/">图片</a>
         <a href="/cat/dev/">文本与开发</a>
         <a href="/cat/life/">生活与杂务</a>
       </nav>
       <span class="head-badge">${TOOLS.length} 个工具 · 免费</span>`;

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
<body${mode ? ` data-mode="${esc(mode)}"` : ''}>
${SYMBOLS}
<header class="site-head"><div class="wrap head-in">
  <a class="brand" href="/" aria-label="${esc(SITE_NAME)}首页">
    <span class="brand-mark">${svg('i-logo')}</span>
    <span class="brand-txt">${SITE_NAME}<small>${SITE_TAGLINE}</small></span>
  </a>
  ${head}
</div></header>
<main class="wrap" id="main">${body}</main>
<footer class="site-foot">
<div class="wrap">
  <section class="friend-sec" id="friend-links" aria-label="友情链接">
    <div class="friend-head">
      <div>
        <h2>友情链接</h2>
        <p>双向链接 · 系统自动检测对方首页回链，通过后上线，撤链自动移除</p>
      </div>
      <button type="button" class="friend-apply" data-links-open aria-expanded="false" aria-controls="links-panel">申请友链</button>
    </div>
    <div class="friend-list" data-links-list><span class="friend-loading">正在读取友链…</span></div>
    <div class="friend-panel" id="links-panel" data-links-panel hidden>
      <div class="friend-how">
        <p><b>第一步 · 先在你网站首页放上本站链接</b><br>
        链接要直接写在首页 HTML 里、正常显示，不要隐藏，也不能只靠脚本动态插入。下面这段可以直接复制：</p>
        <div class="friend-code">
          <code data-links-code>&lt;a href="https://www.gitd.cn/" target="_blank" title="一页工具"&gt;一页工具&lt;/a&gt;</code>
          <button type="button" class="friend-copy" data-links-copy>复制</button>
        </div>
        <p><b>第二步 · 填表提交，立刻自动检测</b><br>
        检测到回链就自动上线；此后每天复查一次，连续 3 次查不到回链会自动从本站移除，无需人工干预。</p>
      </div>
      <form class="friend-form" data-links-form novalidate>
        <label>站点名称<input type="text" name="name" maxlength="24" required placeholder="例：某某工具箱"></label>
        <label>首页地址<input type="url" name="url" maxlength="200" required placeholder="https://your-site.com/"></label>
        <label>一句话简介（选填）<input type="text" name="desc" maxlength="60" placeholder="这个站点是做什么的"></label>
        <button type="submit" class="friend-submit">提交并检测</button>
      </form>
      <p class="friend-msg" data-links-msg role="status" aria-live="polite"></p>
    </div>
  </section>
</div>
<div class="wrap foot-in">
  <div class="foot-brand">
    <span class="brand-mark sm">${svg('i-logo')}</span>
    <span><b>${SITE_NAME}</b><small>${TOOLS.length} 个免费在线工具 · 绝大多数纯本地运行</small></span>
  </div>
  <span class="foot-meta">文件不上传 · 输入内容不采集 · 统计匿名去重</span>
  <a href="/" class="foot-top">回到首页 ${svg('i-up')}</a>
</div></footer>

<nav class="tabbar" aria-label="快捷导航">
  <button type="button" class="tab" data-tab="home">${svg('i-home')}<span>首页</span></button>
  <button type="button" class="tab" data-tab="cats">${svg('i-cats')}<span>分类</span></button>
  <button type="button" class="tab" data-tab="rank">${svg('i-trophy')}<span>榜单</span></button>
  <button type="button" class="tab" data-tab="search">${svg('i-search')}<span>搜索</span></button>
</nav>

<script src="/tools-map.js"></script>
<script src="/stats.js"></script>
<script src="/sync.js"></script>
<script src="/links.js"></script>
<script src="/ui.js"></script>
${js}
</body>
</html>`;
}

export const svg = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
