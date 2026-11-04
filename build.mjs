// 工具箱构建：读注册表 → 生成门面 + 每个「已接入」工具的独立页 + 静态资源 + sitemap。
// 关键约定：只为已实现工具生成独立 URL，不批量铺没有功能的空壳页。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from './src/data/catalog.mjs';
import { layout, SITE_NAME, SITE_TAGLINE } from './src/templates/layout.mjs';
import { homeHTML } from './src/templates/home.mjs';
import { toolHTML } from './src/templates/tool.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'https://example.com'
).replace(/\/$/, '');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

function copyDir(from, to, filter = () => true) {
  if (!fs.existsSync(from)) return 0;   // Vercel 浅克隆后空目录可能不存在
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(from)) {
    if (f.startsWith('.') || !filter(f)) continue;
    const src = path.join(from, f);
    if (!fs.statSync(src).isFile()) continue;
    fs.copyFileSync(src, path.join(to, f)); n++;
  }
  return n;
}

copyDir(path.join(ROOT, 'src/static'), DIST);
copyDir(path.join(ROOT, 'src/lib'), path.join(DIST, 'lib'));
const toolCount = copyDir(path.join(ROOT, 'src/tools'), path.join(DIST, 't'), (f) => f.endsWith('.js'));
copyDir(path.join(ROOT, 'public'), DIST);

// 首页
fs.writeFileSync(path.join(DIST, 'index.html'), layout({
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  desc: '免费在线小工具集，打开就能用。图片、文本、计算、CSS、速查表等工具都在浏览器本地运行，文件不上传，无需登录。',
  body: homeHTML(), canonical: SITE_URL + '/', siteUrl: SITE_URL,
}));

// 已接入工具：一个工具一个独立页
const ready = TOOLS.filter((t) => t.status === 'ready');
for (const t of ready) {
  const dir = path.join(DIST, 'tools', t.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), layout({
    title: `${t.name} · ${SITE_NAME}`, desc: t.desc,
    body: toolHTML(t, SITE_URL), isTool: true,
    canonical: `${SITE_URL}/tools/${t.id}/`, siteUrl: SITE_URL,
  }));
}

// sitemap 只收录真实页面；robots
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...ready.map((t) => `  <url><loc>${SITE_URL}/tools/${t.id}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
];
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// 防线：注册表里标成 ready 的工具必须有对应模块
const missing = ready.filter((t) => !fs.existsSync(path.join(DIST, 't', `${t.id}.js`)));
if (missing.length) {
  console.error('✗ 以下工具标记为已接入但缺少模块:', missing.map((t) => t.id).join(', '));
  process.exit(1);
}

console.log(`\n构建完成 → dist/`);
console.log(`  注册表工具: ${TOOLS.length} 个 · 已接入 ${ready.length} 个 · 独立页 ${ready.length + 1} 个`);
console.log(`  工具模块: ${toolCount} 个 · sitemap: ${urls.length} 条`);
console.log(`  SITE_URL = ${SITE_URL}${SITE_URL === 'https://example.com' ? '（占位；Vercel 会自动注入生产域名，也可显式设 SITE_URL）' : ''}`);
