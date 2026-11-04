// 静态站点生成器：node build.mjs
// 数据驱动：加一个工具 = tools.mjs 加一条；加一个生字 = hanzi.mjs 加一行。
// 输出 dist/，Vercel 直接托管（见 vercel.json）。零 npm 依赖。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const BUILD_SEED = 20261104; // 固定种子：构建出的静态结果可复现

const { tools } = await import(pathToFileURL(path.join(SRC, 'data/tools.mjs')).href);
const { hanzi } = await import(pathToFileURL(path.join(SRC, 'data/hanzi.mjs')).href);
const { hanziSlug } = await import(pathToFileURL(path.join(SRC, 'tools/common.mjs')).href);
const { homePage, toolPage, hanziPage } = await import(pathToFileURL(path.join(SRC, 'templates/pages.mjs')).href);

// ---------- 1. 汉字：生成 slug（冲突自动加序号）并产出索引数据模块 ----------
const used = new Map();
const hanziItems = hanzi.map((h) => {
  const base = hanziSlug(h.p, h.n);
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  const slug = n === 1 ? base : `${base}-${n}`;
  return { ...h, slug };
});
const radicals = [...new Set(hanziItems.map((h) => h.r))].sort((a, b) => a.localeCompare(b, 'zh'));
const indexData = {
  items: hanziItems.map(({ c, p, n, r, s, seq, w, slug }) => ({ c, p, n, r, s, seq, w, slug })),
  radicals,
};
const indexModule = `// 自动生成，勿手改。数据源：src/data/hanzi.mjs\nexport const INDEX = ${JSON.stringify(indexData, null, 2)};\n`;
// 构建期给 Node import
fs.writeFileSync(path.join(SRC, 'tools/hanzi-chaxun/_data.mjs'), indexModule);

// ---------- 2. 准备输出目录，复制静态资源 ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'static'))) {
  fs.copyFileSync(path.join(SRC, 'static', f), path.join(DIST, f));
}
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  fs.copyFileSync(path.join(ROOT, 'public', f), path.join(DIST, f));
}

// ---------- 3. 生成工具页（静态结果 + 浏览器端 render 模块） ----------
const urls = ['/'];
for (const tool of tools) {
  const modPath = path.join(SRC, 'tools', tool.slug, 'render.mjs');
  const mod = await import(pathToFileURL(modPath).href);
  const initialResult = mod.render(BUILD_SEED, mod.defaultOpts || {});
  const controlsHtml = typeof mod.controls === 'function' ? mod.controls() : '';

  const dir = path.join(DIST, 'tools', tool.slug);
  fs.mkdirSync(dir, { recursive: true });
  // 让浏览器能 import：render.mjs + 共享 common.mjs（render 内用 ../common.mjs）
  fs.copyFileSync(modPath, path.join(dir, 'render.mjs'));
  fs.writeFileSync(path.join(dir, 'index.html'),
    toolPage(tool, tools, initialResult, controlsHtml).replace('<body>', `<body data-tool="${tool.slug}">`));
  urls.push(`/tools/${tool.slug}/`);
}
// 共享模块放到 /tools/common.mjs，使 render.mjs 里的 ../common.mjs 生效
fs.copyFileSync(path.join(SRC, 'tools/common.mjs'), path.join(DIST, 'tools/common.mjs'));
// 汉字查询页的数据模块
fs.copyFileSync(path.join(SRC, 'tools/hanzi-chaxun/_data.mjs'),
  path.join(DIST, 'tools/hanzi-chaxun/_data.mjs'));

// ---------- 4. 生成汉字单字页 ----------
for (const h of hanziItems) {
  const dir = path.join(DIST, 'hanzi', h.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), hanziPage(h, hanziItems));
  urls.push(`/hanzi/${h.slug}/`);
}

// ---------- 5. 首页 ----------
fs.writeFileSync(path.join(DIST, 'index.html'), homePage(tools, hanziItems));

// ---------- 6. sitemap / robots ----------
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n') +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`\n构建完成：${urls.length} 个页面 → dist/`);
console.log(`  工具页 ${tools.length} 个，汉字单字页 ${hanziItems.length} 个，首页 1 个`);
console.log(`  SITE_URL = ${SITE_URL}${process.env.SITE_URL ? '' : '（占位，部署时请在 Vercel 设置 SITE_URL 环境变量）'}`);
