/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "JSON Schema",
  "titleOut": "TypeScript",
  "fields": [
    {
      "id": "txt",
      "label": "Schema 或样本 JSON",
      "type": "textarea",
      "rows": 8,
      "default": "{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"age\":{\"type\":\"integer\"}},\"required\":[\"name\"]}"
    },
    {
      "id": "name",
      "label": "根类型名",
      "type": "text",
      "default": "Root"
    }
  ],
  "primary": "复制类型",
  "hintOut": "支持 $ref 的本地解析（#/$defs/... 与 #/definitions/...），数组、枚举与联合类型。",
  "compute": (v) => {
    let s; try { s = JSON.parse(v.txt); } catch (e) { return { error: '解析失败：' + e.message }; }
    if (!s.type) s = L.inferSchema(s);
    const defs = { ...(s.$defs || {}), ...(s.definitions || {}) };
    const go = (x, depth = 0) => {
      if (depth > 12) return 'any';
      if (x.$ref) { const k = x.$ref.split('/').pop(); return defs[k] ? (v.name && k === v.name ? k : go(defs[k], depth + 1)) : k; }
      if (x.enum) return x.enum.map((e) => JSON.stringify(e)).join(' | ');
      if (x.anyOf || x.oneOf) return (x.anyOf || x.oneOf).map((y) => go(y, depth + 1)).join(' | ');
      if (x.type === 'array') return `${go(x.items || {}, depth + 1)}[]`;
      if (x.type === 'object' || x.properties) {
        const req = x.required || [];
        const parts = Object.entries(x.properties || {}).map(([k, y]) => `  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}${req.includes(k) ? '' : '?'}: ${go(y, depth + 1)};`);
        return `{\n${parts.join('\n')}\n}`;
      }
      return ({ integer: 'number', number: 'number', boolean: 'boolean', null: 'null', string: 'string' })[x.type] || 'any';
    };
    const extra = Object.entries(defs).filter(([k]) => k !== v.name).map(([k, d]) => `export interface ${k} ${go(d)}`).join('\n\n');
    const out = `export interface ${v.name || 'Root'} ${go(s)}\n${extra ? '\n' + extra : ''}`;
    return { text: out, stats: [{ label: '行数', value: out.split('\n').length }] };
  }
});
