// 工具箱构建：读注册表 → 生成首页、各分类页与每个工具的独立页 + 静态资源 + sitemap/robots/og。
// 两道防线：① 注册表里任一工具缺模块，构建失败；② 产物 SEO 体检不过，构建失败。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS, CATS } from './src/data/catalog.mjs';
import { catTheme } from './src/data/theme.mjs';
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

/* 工具 id → 名称 / 分类色 / 图标，供热度榜与「最近用过」在浏览器里查表。
   只写公开元数据，不含任何凭据。 */
const toolsMap = {};
for (const t of TOOLS) {
  const th = catTheme(t.cat);
  toolsMap[t.id] = { n: t.name, c: th.color, s: th.soft, e: t.icon || th.emoji };
}
fs.writeFileSync(path.join(DIST, 'tools-map.js'),
  `window.__TOOLS_MAP__=${JSON.stringify(toolsMap).replace(/</g, '\\u003c')};\n`);

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
    ...tm, body: toolHTML(t), isTool: true, mode: t.mode,
    jsonld: toolJsonLd(t, SITE_URL, tm.desc),
  });
}

// 404：不允许索引，别让错误路径进 sitemap
fs.writeFileSync(path.join(DIST, '404.html'), `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta name="theme-color" content="#f4efe1">
<meta name="color-scheme" content="light">
<title>查无此页 · ${SITE_NAME}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css"></head>
<body>
<header class="site-head"><div class="wrap head-in">
  <a class="brand" href="/"><span class="brand-mark"><svg><use href="#i-seal"/></svg></span>
  <span class="brand-txt">${SITE_NAME}<small>${SITE_TAGLINE}</small></span></a>
</div></header>
<main class="wrap"><section class="hero">
  <div class="hero-copy">
  <div class="hero-eyebrow">404 · 查无此页</div>
  <h1><span class="red">查无</span>此页</h1>
  <p class="hero-lede">本辞典未收录这一页，链接可能已经失效。回总目看全部 ${TOOLS.length} 个工具，或换个词条检索。</p>
  <p style="margin-top:26px"><a class="home-cta" href="/">回到总目</a></p>
  </div>
  <div class="hero-side" aria-hidden="true">
    <span class="hero-vert"><b>查無此頁</b>　另檢他條</span>
    <span class="hero-seal"><svg><use href="#i-seal"/></svg></span>
  </div>
</section></main>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-seal" viewBox="0 0 24 24"><rect width="24" height="24" fill="#b03528"/><path d="M12 0v24M0 12h24" stroke="#fdf8ec" stroke-width="1.3"/><rect x="3.5" y="3.5" width="5" height="5" fill="#fdf8ec"/><rect x="15.5" y="3.5" width="5" height="5" fill="#fdf8ec"/><rect x="3.5" y="15.5" width="5" height="5" fill="#fdf8ec"/></symbol></svg>
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
  `User-agent: *\nAllow: /\n# 工具模块与本地处理库必须允许抓取，否则爬虫渲染不出页面\nAllow: /t/\nAllow: /vendor/\n# 数据接口不是内容页，被爬只会白耗数据库命令配额\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

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
console.log(`  SEO 体检 ✓ ${check.stats.pages} 页 · 唯一 title ${check.stats.uniqueTitles} · 唯一 description ${check.stats.uniqueDescriptions} · 内链 ${check.stats.internalLinks} · 孤岛页 ${check.stats.orphanTools}`);

/* 本地 canonical 是 localhost，seo-check 会跳过「占位域名」检查（localhost 在本地是合法的），
   于是「页面里写了 example.com / xxx.vercel.app」这类问题本地全绿、上了 Vercel 才 297 页全红。
   这里用生产视角补扫这两个永远不该出现的字符串，把问题挡在本地构建阶段。 */
const placeholders = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && /example\.com|xxx\.vercel\.app/.test(fs.readFileSync(p, 'utf8'))) {
      placeholders.push(path.relative(DIST, p));
    }
  }
})(DIST);
if (placeholders.length) {
  console.error(`\n✗ ${placeholders.length} 个页面残留占位域名（生产构建会失败）: ${placeholders.slice(0, 8).join(', ')}`);
  process.exit(1);
}
console.log('  生产域名视角占位扫描 ✓\n');
