/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "NDJSON / JSONL",
  "titleOut": "转换结果",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "每行一个 JSON（或 JSON 数组 / CSV）",
      "type": "textarea",
      "rows": 9,
      "default": "{\"id\":1,\"name\":\"小明\"}\n{\"id\":2,\"name\":\"小红\"}"
    },
    {
      "id": "mode",
      "label": "目标",
      "type": "select",
      "options": [
        "NDJSON → JSON 数组",
        "JSON 数组 → NDJSON",
        "NDJSON → CSV",
        "CSV → NDJSON"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "解析错误会精确报出第几行；字段集合统计会列出所有出现过的 key。",
  "compute": (v) => {
    const t = String(v.txt || '').trim();
    if (!t) return { text: '' };
    try {
      if (v.mode === 'NDJSON → JSON 数组' || v.mode === 'NDJSON → CSV') {
        const objs = L.lines(t).map((l, i) => { if (!l.trim()) return null; try { return JSON.parse(l); } catch (e) { throw new Error(`第 ${i + 1} 行解析失败：${e.message}`); } }).filter(Boolean);
        const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))];
        const out = v.mode === 'NDJSON → JSON 数组' ? JSON.stringify(objs, null, 2) : L.toCSV([keys, ...objs.map((o) => keys.map((k) => o[k] ?? ''))]);
        return { text: out, stats: [{ label: '行数', value: objs.length }, { label: '字段', value: keys.length }], preview: `<p class="t-hint">字段集合：${L.esc(keys.join(', '))}</p>` };
      }
      if (v.mode === 'JSON 数组 → NDJSON') {
        const arr = JSON.parse(t);
        if (!Array.isArray(arr)) return { error: '输入应是 JSON 数组' };
        return { text: arr.map((x) => JSON.stringify(x)).join('\n'), stats: [{ label: '条数', value: arr.length }] };
      }
      const rows = L.parseCSV(t); const h = rows[0];
      const objs = rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, /^-?\d+(\.\d+)?$/.test(r[i] || '') ? Number(r[i]) : r[i] ?? ''])));
      return { text: objs.map((x) => JSON.stringify(x)).join('\n'), stats: [{ label: '条数', value: objs.length }, { label: '字段', value: h.length }] };
    } catch (e) { return { error: e.message }; }
  }
});
