// 新增工具的离线自检：注册表、算子覆盖、数据集、公式、单位换算、SEO 唯一性。
// 不依赖浏览器，可在构建前单独跑 `node scripts/extra-selftest.mjs`。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA } from '../src/data/extra.mjs';
import { TOOLS, CATS, CAT_MAP, MODE_NAME } from '../src/data/catalog.mjs';
import { DATASETS } from '../src/static/x-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const errors = [];
const fail = (m) => errors.push(m);
const KINDS = new Set(['calc', 'unit', 'text', 'codec', 'rand', 'color', 'table', 'custom']);

/* 从源码里抠出算子名，避免在 Node 里 import 带 /kit.js 绝对路径的浏览器模块。
   算子既可能是对象字面量，也可能是箭头函数，所以只匹配「行首两个空格 + 键 + 冒号」。 */
const OP_KEY = /^  ([A-Za-z0-9_'""-]+):/gm;
function keysOf(text, marker, endMarker) {
  const a = text.indexOf(marker);
  if (a < 0) { fail(`找不到 ${marker}`); return new Set(); }
  const b = endMarker ? text.indexOf(endMarker, a) : -1;
  const body = text.slice(a + marker.length, b < 0 ? text.length : b);
  return new Set([...body.matchAll(OP_KEY)].map((m) => m[1].replace(/['"]/g, '')));
}
const MORE = read('src/static/x-ops2.js');
const TEXT = keysOf(read('src/static/x-ops.js'), 'export const TEXT = {');
const CODEC = keysOf(MORE, 'export const CODEC = {', '/* Punycode 解码');
const RAND = keysOf(MORE, 'export const RAND = {', 'function choose');
const COLOR = keysOf(MORE, 'export const COLOR = {');
const CUSTOM = keysOf(read('src/static/x-custom.js'), 'export const CUSTOM = {', '/* 从 PDF 字节里');
const OPS = { text: TEXT, codec: CODEC, rand: RAND, color: COLOR, table: new Set(Object.keys(DATASETS)), custom: CUSTOM };

console.log(`自检 → 新增 ${EXTRA.length} 个工具 / 全站 ${TOOLS.length} 个 / ${CATS.length} 个分类（含 all）`);
console.log(`算子：text ${TEXT.size} · codec ${CODEC.size} · rand ${RAND.size} · color ${COLOR.size} · custom ${CUSTOM.size} · table ${Object.keys(DATASETS).length}`);

/* 注册表基本约束 */
const ids = new Set(), names = new Set(), titles = new Map();
for (const t of TOOLS) {
  if (ids.has(t.id)) fail(`重复 id：${t.id}`);
  ids.add(t.id);
  if (names.has(t.name)) fail(`重复工具名（会让 title 撞车）：${t.name}`);
  names.add(t.name);
  if (!CAT_MAP[t.cat]) fail(`${t.id} 的分类 ${t.cat} 不存在`);
  if (!MODE_NAME[t.mode]) fail(`${t.id} 的档位 ${t.mode} 不存在`);
  if (!t.desc || [...t.desc].length < 8) fail(`${t.id} 描述过短`);
  if (/example\.com|xxx\.vercel\.app|localhost/.test(t.desc + t.name)) fail(`${t.id} 含占位域名`);
  if (!Array.isArray(t.tags)) fail(`${t.id} 缺 tags 数组`);
}
for (const t of EXTRA) {
  if (!KINDS.has(t.kind)) fail(`${t.id} 未知引擎 ${t.kind}`);
  if (t.kind === 'calc') {
    if (!t.p1 || !t.p2) fail(`${t.id} 缺字段或公式`);
    const fields = t.p1.split(';').filter(Boolean).map((s) => s.split('~'));
    if (fields.some((f) => f.length !== 4 || !f[0] || isNaN(Number(f[3])))) fail(`${t.id} 字段定义不合法`);
    const keys = fields.map((f) => f[0]);
    for (const e of t.p2.split(';').filter(Boolean)) {
      const i = e.indexOf(':');
      if (i < 1) { fail(`${t.id} 公式缺标签：${e}`); continue; }
      const expr = e.slice(i + 1).trim();
      if (/[\[\]{}"'`;=]|=>/.test(expr)) { fail(`${t.id} 公式含非法字符：${expr}`); continue; }
      try {
        const r = new Function(...keys, 'return (' + expr + ');')(...fields.map((f) => Number(f[3])));
        if (typeof r !== 'number' || Number.isNaN(r)) fail(`${t.id} 公式用默认值算不出数：${expr}`);
      } catch (err) { fail(`${t.id} 公式求值失败：${expr} · ${err.message}`); }
    }
  }
  if (t.kind === 'unit') {
    const u = t.p1.split(';').filter(Boolean).map((s) => s.split('~'));
    if (u.length < 2 || u.some((x) => x.length !== 3 || !Number.isFinite(Number(x[2])) || Number(x[2]) <= 0)) fail(`${t.id} 单位表不合法`);
  }
  if (OPS[t.kind] && !OPS[t.kind].has(t.p1)) fail(`${t.id} 的算子 ${t.kind}/${t.p1} 未实现`);
}

/* 每个工具都必须有模块文件 */
const missing = TOOLS.filter((t) => !fs.existsSync(path.join(ROOT, 'src', 'tools', `${t.id}.js`))).map((t) => t.id);
if (missing.length) fail(`缺模块 ${missing.length} 个：${missing.slice(0, 8).join(', ')}`);

/* 数据集列数一致 */
for (const [k, v] of Object.entries(DATASETS)) {
  if (!v.rows.length) fail(`数据集 ${k} 是空的`);
  const w = v.rows[0].length;
  const bad = v.rows.filter((r) => r.length !== w).length;
  if (bad) fail(`数据集 ${k} 有 ${bad} 行列数不一致`);
  if (w !== v.cols.length) fail(`数据集 ${k} 列名 ${v.cols.length} 个，数据 ${w} 列`);
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} 项未通过：`);
  for (const e of errors.slice(0, 40)) console.error('  ' + e);
  if (errors.length > 40) console.error(`  … 另有 ${errors.length - 40} 项`);
  process.exit(1);
}
console.log('✓ 注册表 / 算子覆盖 / 数据集 / 公式 / 单位表 / 模块文件 全部通过\n');
