/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "源数据",
  "titleOut": "转换结果",
  "fields": [
    {
      "id": "txt",
      "label": "JSON / CSV / YAML / XML",
      "type": "textarea",
      "rows": 9,
      "default": "[{\"name\":\"小明\",\"age\":18},{\"name\":\"小红\",\"age\":20}]"
    },
    {
      "id": "from",
      "label": "源格式",
      "type": "select",
      "options": [
        "自动识别",
        "JSON",
        "CSV",
        "YAML",
        "XML"
      ]
    },
    {
      "id": "to",
      "label": "目标格式",
      "type": "select",
      "options": [
        "JSON",
        "CSV",
        "YAML",
        "XML",
        "TOML"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "YAML / TOML 用轻量解析器（支持缩进映射、列表、基本类型），复杂锚点与多行块请先在别处展开。",
  "compute": (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    let from = v.from;
    if (from === '自动识别') from = t.startsWith('[') || t.startsWith('{') ? 'JSON' : t.startsWith('<') ? 'XML' : /^[\w-]+\s*:/m.test(t) || t.includes('\n  ') ? 'YAML' : 'CSV';
    let obj;
    try {
      if (from === 'JSON') obj = JSON.parse(t);
      else if (from === 'CSV') obj = L.csvToObjects(t);
      else if (from === 'XML') {
        const doc = new DOMParser().parseFromString(t, 'text/xml');
        const node = (el) => { const kids = [...el.children]; if (!kids.length) return el.textContent; const o = {}; kids.forEach((k) => { const x = node(k); o[k.tagName] = o[k.tagName] === undefined ? x : [].concat(o[k.tagName], x); }); return o; };
        obj = node(doc.documentElement);
      } else {
        const parseYAML = (s) => {
          const ls = s.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
          const root = []; const stack = [{ ind: -1, val: root }];
          for (const l of ls) {
            const ind = l.match(/^\s*/)[0].length; const body = l.trim();
            while (stack.length > 1 && ind <= stack[stack.length - 1].ind) stack.pop();
            const cur = stack[stack.length - 1].val;
            if (body.startsWith('- ')) { const item = body.slice(2); const o = {}; if (Array.isArray(cur)) cur.push(o); stack.push({ ind, val: o }); if (item.includes(':')) { const [k, ...r] = item.split(':'); o[k.trim()] = cast(r.join(':').trim()); } }
            else { const i = body.indexOf(':'); if (i < 0) continue; const k = body.slice(0, i).trim(), raw = body.slice(i + 1).trim(); if (!raw) { const o = {}; cur[k] = o; stack.push({ ind, val: o }); } else cur[k] = cast(raw); }
          }
          return root.length ? root : (Object.keys(root).length ? root : {});
        };
        const cast = (x) => x === 'true' ? true : x === 'false' ? false : x === 'null' ? null : /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : /^["'].*["']$/.test(x) ? x.slice(1, -1) : x;
        obj = parseYAML(t);
      }
    } catch (e) { return { error: '解析失败：' + e.message }; }
    const toYAML = (o, ind = 0) => {
      const sp = ' '.repeat(ind);
      if (Array.isArray(o)) return o.map((x) => typeof x === 'object' && x ? sp + '- ' + toYAML(x, ind + 2).trimStart() : sp + '- ' + JSON.stringify(x)).join('\n');
      if (o && typeof o === 'object') return Object.entries(o).map(([k, x]) => x && typeof x === 'object' ? `${sp}${k}:\n${toYAML(x, ind + 2)}` : `${sp}${k}: ${typeof x === 'string' && /[:#\n]/.test(x) ? JSON.stringify(x) : String(x)}`).join('\n');
      return sp + String(o);
    };
    const toXML = (o, tag = 'root') => {
      if (Array.isArray(o)) return o.map((x) => toXML(x, 'item')).join('\n');
      if (o && typeof o === 'object') return `<${tag}>\n${Object.entries(o).map(([k, x]) => toXML(x, k)).join('\n')}\n</${tag}>`;
      return `<${tag}>${L.esc(String(o))}</${tag}>`;
    };
    const toTOML = (o, prefix = '') => {
      const simple = Object.entries(o).filter(([, x]) => x === null || typeof x !== 'object' || Array.isArray(x));
      const tables = Object.entries(o).filter(([, x]) => x && typeof x === 'object' && !Array.isArray(x));
      const line = ([k, x]) => `${k} = ${Array.isArray(x) ? '[' + x.map((y) => JSON.stringify(y)).join(', ') + ']' : JSON.stringify(x)}`;
      return simple.map(line).join('\n') + (tables.length ? '\n' + tables.map(([k, x]) => `[${prefix}${k}]\n${toTOML(x, prefix + k + '.')}`).join('\n') : '');
    };
    let out;
    try {
      out = v.to === 'JSON' ? JSON.stringify(obj, null, 2) : v.to === 'CSV' ? L.toCSV((() => { const arr = Array.isArray(obj) ? obj : [obj]; const keys = [...new Set(arr.flatMap((x) => Object.keys(x)))]; return [keys, ...arr.map((x) => keys.map((k) => x[k] ?? ''))]; })()) : v.to === 'YAML' ? toYAML(obj) : v.to === 'XML' ? toXML(obj) : toTOML(obj);
    } catch (e) { return { error: '转换失败：' + e.message }; }
    return { text: out, stats: [{ label: '源', value: from }, { label: '目标', value: v.to }, { label: '字符', value: out.length }] };
  }
});
