// 构建期 SEO 体检：直接扫 dist/ 的真实产物，不信任构建时的意图。
// 零依赖，既被 build.mjs 调用（不通过就构建失败），也可单独跑 `npm run check:seo`。
// 查：title/description 质量与唯一性、canonical 自洽、OG/JSON-LD 完整性、
//     占位域名残留、内部死链、孤岛页、sitemap 与页面集合是否一致。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pick = (html, re) => (html.match(re) || [])[1] || '';

function discover(distDir) {
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (e.name === 'index.html') files.push(path.join(d, e.name));
    }
  })(distDir);
  return files.sort();
}

function urlOf(distDir, file) {
  const rel = path.relative(distDir, path.dirname(file)).split(path.sep).join('/');
  return rel ? `/${rel}/` : '/';
}

export function audit(distDir = path.join(ROOT, 'dist')) {
  const errors = [], warns = [];
  const err = (m) => errors.push(m);
  if (!fs.existsSync(distDir)) return { ok: false, errors: [`找不到 ${distDir}`], warns, stats: {} };

  const files = discover(distDir);
  const home = path.join(distDir, 'index.html');
  const homeHTML = fs.existsSync(home) ? fs.readFileSync(home, 'utf8') : '';
  const siteUrl = pick(homeHTML, /<link rel="canonical" href="([^"]*)"/).replace(/\/$/, '');

  const seenTitle = new Map(), seenDesc = new Map();
  const canonicals = new Set(), inbound = new Map();
  let linkCount = 0, jsonLdCount = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(distDir, file);
    const tag = (m) => err(`${rel}: ${m}`);
    const title = pick(html, /<title>([\s\S]*?)<\/title>/);
    const desc = pick(html, /<meta name="description" content="([^"]*)"/);
    const canonical = pick(html, /<link rel="canonical" href="([^"]*)"/);
    const expected = siteUrl + urlOf(distDir, file);

    if (!title) tag('缺少 <title>');
    else if ([...title].length > 75) tag(`title 过长（${[...title].length} 字）：${title}`);
    if (seenTitle.has(title)) tag(`title 与 ${seenTitle.get(title)} 重复：${title}`);
    seenTitle.set(title, rel);

    if (!desc) tag('缺少 meta description');
    else {
      const n = [...desc].length;
      if (n < 35) tag(`description 过短（${n} 字）：${desc}`);
      if (n > 170) tag(`description 过长（${n} 字）`);
      if (/[、，\/]\s*$/.test(desc) || /…$/.test(desc)) warns.push(`${rel}: description 疑似截断：${desc}`);
      if (seenDesc.has(desc)) tag(`description 与 ${seenDesc.get(desc)} 重复`);
      seenDesc.set(desc, rel);
    }

    if (!canonical) tag('缺少 canonical');
    else {
      if (canonical !== expected) tag(`canonical 应为 ${expected}，实际 ${canonical}`);
      if (!/^https?:\/\//.test(canonical)) tag('canonical 不是绝对 URL');
      if (/\/index\.html$|\?|#/.test(canonical)) tag(`canonical 含多余路径或参数：${canonical}`);
      canonicals.add(canonical);
    }

    for (const [name, re] of [
      ['og:title', /<meta property="og:title"/], ['og:description', /<meta property="og:description"/],
      ['og:url', /<meta property="og:url"/], ['og:image', /<meta property="og:image" content="[^"]+\/og\.png"/],
      ['twitter:card', /<meta name="twitter:card"/],
    ]) if (!re.test(html)) tag(`缺少 ${name}`);

    const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (!lds.length) tag('缺少 JSON-LD');
    for (const m of lds) {
      try {
        const o = JSON.parse(m[1]);
        if (!o['@context'] || !(o['@type'] || o['@graph'])) tag('JSON-LD 缺少 @context / @type');
        jsonLdCount++;
      } catch (e) { tag(`JSON-LD 无法解析：${e.message}`); }
    }

    if (/example\.com|localhost|xxx\.vercel\.app/.test(html) && /vercel\.app|localhost/.test(siteUrl) === false) {
      tag('页面里残留占位域名');
    }

    for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
      let p = m[1].split('#')[0].split('?')[0];
      if (p.startsWith('//')) continue;
      linkCount++;
      const target = p.endsWith('/')
        ? path.join(distDir, p.slice(1), 'index.html')
        : path.join(distDir, p.slice(1));
      if (!fs.existsSync(target)) tag(`死内链 ${m[1]}`);
      if (/^\/tools\/[^/]+\/$/.test(p)) inbound.set(p, (inbound.get(p) || 0) + 1);
    }
  }

  // 孤岛页：没有任何其它页面链过来的工具页
  for (const u of canonicals) {
    const m = u.match(/\/tools\/[^/]+\/$/);
    if (m && !inbound.get(m[0])) err(`孤岛页，没有内链指向：${m[0]}`);
  }

  // sitemap / robots / og 图 / 404
  const sm = path.join(distDir, 'sitemap.xml');
  let locs = [];
  if (!fs.existsSync(sm)) err('缺少 sitemap.xml');
  else {
    locs = [...fs.readFileSync(sm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const set = new Set(locs);
    if (set.size !== locs.length) err('sitemap 有重复 URL');
    for (const u of canonicals) if (!set.has(u)) err(`sitemap 漏了 ${u}`);
    for (const u of set) if (!canonicals.has(u)) err(`sitemap 多了不存在的页面 ${u}`);
    if (/<lastmod>/.test(fs.readFileSync(sm, 'utf8'))) warns.push('sitemap 带 lastmod：只有能反映真实内容变更时才该保留');
  }
  const robots = path.join(distDir, 'robots.txt');
  if (!fs.existsSync(robots)) err('缺少 robots.txt');
  else if (!fs.readFileSync(robots, 'utf8').includes(`Sitemap: ${siteUrl}/sitemap.xml`)) err('robots.txt 的 Sitemap 与站点域名不一致');
  if (!fs.existsSync(path.join(distDir, 'og.png'))) err('缺少 og.png');
  if (!fs.existsSync(path.join(distDir, '404.html'))) err('缺少 404.html');

  return {
    ok: errors.length === 0,
    errors, warns,
    stats: {
      siteUrl, pages: files.length, internalLinks: linkCount, jsonLd: jsonLdCount,
      sitemapUrls: locs.length, uniqueTitles: seenTitle.size, uniqueDescriptions: seenDesc.size,
      orphanTools: [...canonicals].filter((u) => /\/tools\//.test(u) && !inbound.get(u.match(/\/tools\/[^/]+\/$/)?.[0])).length,
    },
  };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const r = audit();
  console.log('\nSEO 体检 → dist/');
  console.log(`  站点 ${r.stats.siteUrl || '(未知)'} · ${r.stats.pages} 页 · ${r.stats.internalLinks} 条内链 · sitemap ${r.stats.sitemapUrls} 条`);
  console.log(`  唯一 title ${r.stats.uniqueTitles} · 唯一 description ${r.stats.uniqueDescriptions} · JSON-LD ${r.stats.jsonLd} · 孤岛页 ${r.stats.orphanTools}`);
  for (const w of r.warns.slice(0, 8)) console.log(`  ! ${w}`);
  if (r.errors.length) {
    for (const e of r.errors.slice(0, 20)) console.error(`  ✗ ${e}`);
    if (r.errors.length > 20) console.error(`  … 另有 ${r.errors.length - 20} 条`);
    console.error(`\n✗ SEO 体检未通过（${r.errors.length} 项）\n`);
    process.exit(1);
  }
  console.log('  ✓ 全部通过\n');
}
