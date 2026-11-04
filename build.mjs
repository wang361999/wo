// 单页工具站构建：把 src/ 复制成 dist/，并生成 sitemap / robots。
// 零依赖、纯静态，Vercel 直接托管（见 vercel.json）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// 域名优先级：显式 SITE_URL > Vercel 注入的生产域名 > 本次部署 URL > 占位
const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'https://example.com'
).replace(/\/$/, '');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// 关键：Git 不跟踪空目录，Vercel 浅克隆后 public/ 可能不存在，必须容错
for (const dir of [SRC, path.join(ROOT, 'public')]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('.')) continue; // .gitkeep 等占位文件不进产物
    fs.copyFileSync(path.join(dir, f), path.join(DIST, f));
  }
}

// 替换页面里的域名占位（canonical / 结构化数据）
const htmlPath = path.join(DIST, 'index.html');
fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, 'utf8').replaceAll('__SITE_URL__', SITE_URL));

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n` +
  `</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`\n构建完成：1 个页面 → dist/`);
console.log(`  SITE_URL = ${SITE_URL}${SITE_URL === 'https://example.com' ? '（占位，请在 Vercel 设置 SITE_URL 为你的域名）' : ''}`);
console.log(`  产物：${fs.readdirSync(DIST).length} 个文件`);
