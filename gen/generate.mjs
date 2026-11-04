// 把 specs/*.mjs 里的工具定义编译成 src/tools/<id>.js（浏览器 ESM 模块）。
// 规则：compute / process / run 一律用箭头函数；函数体内只能引用 v / ctx / L / D / 浏览器全局。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../src/data/catalog.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GEN = path.join(ROOT, 'gen');
const OUT = path.join(ROOT, 'src', 'tools');
const ids = new Set(TOOLS.map((t) => t.id));

function ser(v, ind = 0) {
  const sp = '  '.repeat(ind);
  if (typeof v === 'function') return v.toString();
  if (v === undefined) return 'undefined';
  if (v && typeof v === 'object' && typeof v.$ref === 'string') return v.$ref; // 引用运行时数据
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[\n' + v.map((x) => sp + '  ' + ser(x, ind + 1)).join(',\n') + '\n' + sp + ']';
  return '{\n' + Object.entries(v).map(([k, x]) => sp + '  ' + JSON.stringify(k) + ': ' + ser(x, ind + 1)).join(',\n') + '\n' + sp + '}';
}

const S = {};
const files = fs.readdirSync(GEN).filter((f) => /^spec-.*\.mjs$/.test(f)).sort();
for (const f of files) {
  const mod = await import(path.join(GEN, f));
  if (!mod.S) throw new Error(`${f} 没有导出 S`);
  for (const [id, spec] of Object.entries(mod.S)) {
    if (!ids.has(id)) throw new Error(`${f} 里的 ${id} 不在注册表`);
    if (S[id] && !spec.overwrite) throw new Error(`${id} 重复定义`);
    S[id] = spec;
  }
}

const HEAD = `/* 由 gen/generate.mjs 生成，勿手改。 */\nimport { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';\nimport { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';\n\n`;
let written = 0, skipped = 0;
for (const [id, spec] of Object.entries(S)) {
  const file = path.join(OUT, `${id}.js`);
  if (spec.kind === 'code') {
    fs.writeFileSync(file, spec.code.trim() + '\n');
    written++; continue;
  }
  const { kind, ...rest } = spec;
  const mount = kind === 'ref' ? 'refTool' : kind === 'file' ? 'fileTool' : kind === 'custom' ? 'customTool' : 'formTool';
  const body = kind === 'custom' ? ser(rest.render) : ser(rest);
  fs.writeFileSync(file, HEAD + `export default ${mount}(${body});\n`);
  written++;
}

// 防线：注册表里的每个工具都必须有模块（已手写或新生成）
const missing = TOOLS.filter((t) => !fs.existsSync(path.join(OUT, `${t.id}.js`))).map((t) => t.id);
if (missing.length) {
  console.error('✗ 仍缺模块的工具 (' + missing.length + '):', missing.join(', '));
  process.exit(1);
}
for (const id of Object.keys(S)) if (!fs.existsSync(path.join(OUT, `${id}.js`))) throw new Error('写入失败 ' + id);
console.log(`生成完成：spec 文件 ${files.length} 个，写入 ${written} 个模块，注册表 ${TOOLS.length} 个工具全部有模块。`);
