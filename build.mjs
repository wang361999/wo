// 工具箱构建：读注册表 → 生成首页 + 10 个分类页 + 286 个工具页 + 静态资源 + sitemap/robots/og。
// 两道防线：① 注册表里任一工具缺模块，构建失败；② 产物 SEO 体检不过，构建失败。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS, CATS } from './src/data/catalog.mjs';
import { layout, SITE_NAME, SITE_TAGLINE } from './src/templates/layout.mjs';
import { homeHTML } from './src/templates/home.mjs';
import { toolHTML } from './src/templates/tool.mjs';
import { categoryHTML } from './src/templates/category.mjs';
import {
  homeMeta, categoryMeta, toolMeta,
  homeJsonLd, categoryJsonLd, toolJsonLd,
} from './src/templates/seo.mjs';
import { writeOgPng } from './gen/og.mjs';
import { audit } from './scripts/seo-check.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

/* canonical / sitemap / og:url / JSON-LD 全部只认这一个来源。
   旧版兜底是 https://example.com，环境变量一漏，287 个页面的 canonical 就全指向了别人的域名。
   现在改成：本地才允许 localhost，Vercel 上落到占位地址直接构建失败。 */
// 正式域名钉在这里，Vercel 构建不依赖平台注入的 VERCEL_PROJECT_PRODUCTION_URL。
// 根域 gitd.cn 在 Vercel 上 308 跳到 www，规范域名始终是 www.gitd.cn。
// 换域名改这一行，或在 Vercel / 本地设 SITE_URL 覆盖。
const PRODUCTION_SITE_URL = 'https://www.gitd.cn';

function resolveSiteUrl() {
  const raw = process.env.SITE_URL
    || (process.env.VERCEL ? PRODUCTION_SITE_URL : null)
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL
    || 'http://localhost:3000';
  let s = String(raw).trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/\/+$/, '');
  let u;
  try { u = new URL(s); } catch { throw new Error(`SITE_URL 不是合法网址：${raw}`); }
  if (u.pathname !== '/' || u.search || u.hash) throw new Error('SITE_URL 只能是域名根，不能带路径、查询或锚点');
  const url = `${u.protocol}//${u.host}`;
  if (process.env.VERCEL && /localhost|example\.com/.test(url)) {
    throw new Error('Vercel 构建拿不到生产域名：请在项目设置里显式配置 SITE_URL（例如 https://你的域名）');
  }
  return url;
}
const SITE_URL = resolveSiteUrl();

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

function copyDir(from, to, filter = () => true) {
  if (!fs.existsSync(from)) return 0;   // Vercel 浅克隆后空目录可能不存在
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(from)) {
    if (f.startsWith('.')) continue;
    const src = path.join(from, f);
    const st = fs.statSync(src);
    // 处理库在 public/vendor/ 子目录里（含 wasm / worker），必须递归复制
    if (st.isDirectory()) { n += copyDir(src, path.join(to, f), filter); continue; }
    if (!filter(f)) continue;
    fs.copyFileSync(src, path.join(to, f)); n++;
  }
  return n;
}

function writePage(relDir, opts) {
  const dir = path.join(DIST, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), layout({ siteUrl: SITE_URL, ...opts }));
}

copyDir(path.join(ROOT, 'src/static'), DIST);
copyDir(path.join(ROOT, 'src/lib'), path.join(DIST, 'lib'));
const toolCount = copyDir(path.join(ROOT, 'src/tools'), path.join(DIST, 't'), (f) => f.endsWith('.js'));
copyDir(path.join(ROOT, 'public'), DIST);

// 首页
const hm = homeMeta(SITE_URL);
writePage('', {
  ...hm, body: homeHTML(), jsonld: homeJsonLd(SITE_URL, hm.desc),
});

// 10 个分类落地页（长尾词 + 内链枢纽）
const cats = CATS.filter((c) => c.id !== 'all');
for (const c of cats) {
  const tools = TOOLS.filter((t) => t.cat === c.id);
  const cm = categoryMeta(c, tools, SITE_URL);
  writePage(path.join('cat', c.id), {
    ...cm, body: categoryHTML(c, tools),
    jsonld: categoryJsonLd(c, tools, SITE_URL, cm.desc),
  });
}

// 工具页
for (const t of TOOLS) {
  const tm = toolMeta(t, SITE_URL);
  writePage(path.join('tools', t.id), {
    ...tm, body: toolHTML(t), isTool: true,
    jsonld: toolJsonLd(t, SITE_URL, tm.desc),
  });
}

// 404：不允许索引，别让错误路径进 sitemap
fs.writeFileSync(path.join(DIST, '404.html'), `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
<title>页面没找到 · ${SITE_NAME}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css"></head>
<body>
<header class="site-head"><div class="wrap head-in">
  <a class="brand" href="/"><span class="brand-mark"><svg><use href="#i-logo"/></svg></span>
  <span class="brand-txt">${SITE_NAME}<small>${SITE_TAGLINE}</small></span></a>
</div></header>
<main class="wrap"><section class="hero">
  <div class="hero-eyebrow"><span class="eyebrow-dot"></span>404 · 页面不存在</div>
  <h1>这个页面<br><span>不在这里</span></h1>
  <p class="hero-lede">链接可能已经失效。回首页看看全部 ${TOOLS.length} 个工具，或者直接用搜索找。</p>
  <p style="margin-top:26px"><a class="foot-top" href="/">回到首页</a></p>
</section></main>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 10.5h18M10.5 10.5v10.5"/><rect x="6" y="6" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/></symbol></svg>
</body></html>`);

// sitemap：只写 loc。旧版 287 条 lastmod 全用构建当天，等于每次发版都宣称全站改过，
// 这个信号不可靠时会被直接忽略，索性不写。changefreq / priority 搜索引擎同样忽略。
const urls = [
  hm.canonical,
  ...cats.map((c) => `${SITE_URL}/cat/${c.id}/`),
  ...TOOLS.map((t) => `${SITE_URL}/tools/${t.id}/`),
];
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<!-- 只列真实存在的页面；不带 lastmod，避免全站同日更新的失真信号 -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n# 工具模块与本地处理库必须允许抓取，否则爬虫渲染不出页面\nAllow: /t/\nAllow: /vendor/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

writeOgPng(path.join(DIST, 'og.png'));

// 防线 ①：注册表里任意一个工具缺模块，直接构建失败
const missing = TOOLS.filter((t) => !fs.existsSync(path.join(DIST, 't', `${t.id}.js`)));
if (missing.length) {
  console.error('✗ 以下工具缺少模块:', missing.map((t) => t.id).join(', '));
  process.exit(1);
}

// 防线 ②：产物 SEO 体检
const check = audit(DIST);

console.log(`\n构建完成 → dist/`);
console.log(`  页面: 1 首页 + ${cats.length} 分类 + ${TOOLS.length} 工具 = ${1 + cats.length + TOOLS.length} 页 · 工具模块 ${toolCount} 个 · sitemap ${urls.length} 条`);
console.log(`  SITE_URL = ${SITE_URL}`);
if (/\.vercel\.app$/.test(SITE_URL) && !process.env.SITE_URL) {
  console.warn('  ⚠ 当前 canonical 落在 *.vercel.app。若已绑定自定义域名，务必在项目设置里显式配置 SITE_URL。');
}
for (const w of check.warns.slice(0, 5)) console.warn(`  ⚠ ${w}`);
if (!check.ok) {
  for (const e of check.errors.slice(0, 20)) console.error(`  ✗ ${e}`);
  if (check.errors.length > 20) console.error(`  … 另有 ${check.errors.length - 20} 条`);
  console.error(`\n✗ SEO 体检未通过（${check.errors.length} 项），构建判定为失败\n`);
  process.exit(1);
}
console.log(`  SEO 体检 ✓ ${check.stats.pages} 页 · 唯一 title ${check.stats.uniqueTitles} · 唯一 description ${check.stats.uniqueDescriptions} · 内链 ${check.stats.internalLinks} · 孤岛页 ${check.stats.orphanTools}\n`);
