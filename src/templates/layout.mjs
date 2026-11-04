import { esc } from './util.mjs';

export const SITE_NAME = '一页纸';
export const SITE_TAGLINE = '学生用的可打印工具页';

// 站点域名：本地构建缺省占位，部署时在 Vercel 配 SITE_URL 环境变量
export const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');

export function layout({ title, description, canonical = '', body, jsonld = '', extraHead = '', scripts = [] }) {
  const canonicalTag = canonical ? `\n  <link rel="canonical" href="${esc(SITE_URL + canonical)}">` : '';
  const jsonldTag = jsonld ? `\n  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : '';
  const scriptTags = scripts.map((s) => `\n  <script type="module" src="${esc(s)}"></script>`).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">${canonicalTag}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta name="theme-color" content="#faf8f3">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">${extraHead}${jsonldTag}${scriptTags}
</head>
<body>
  <header class="site-head">
    <div class="wrap">
      <a class="brand" href="/">${SITE_NAME}<span class="brand-sub">${SITE_TAGLINE}</span></a>
      <nav class="top-nav" aria-label="主导航">
        <a href="/#tools">工具</a>
        <a href="/#hanzi">生字</a>
        <a href="/#about">说明</a>
      </nav>
    </div>
  </header>
${body}
  <footer class="site-foot">
    <div class="wrap"><p>${SITE_NAME} · ${SITE_TAGLINE}　|　所有题目与字帖均可免费打印使用</p></div>
  </footer>
</body>
</html>`;
}

export function breadcrumb(items) {
  // items: [{name, href}]，最后一项为当前页
  const lis = items.map((it, i) => {
    const last = i === items.length - 1;
    return last
      ? `<li aria-current="page">${esc(it.name)}</li>`
      : `<li><a href="${esc(it.href)}">${esc(it.name)}</a></li>`;
  }).join('\n      ');
  return `<nav class="crumb" aria-label="面包屑"><ol>\n      ${lis}\n    </ol></nav>`;
}
