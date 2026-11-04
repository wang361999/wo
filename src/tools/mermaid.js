/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Mermaid DSL",
  "titleOut": "流程图",
  "wide": false,
  "fields": [
    {
      "id": "code",
      "label": "graph 语法（支持 TD / LR、节点标签、--> 与 --|文字|-->）",
      "type": "textarea",
      "rows": 9,
      "default": "graph TD\n  A[开始] --> B{判断}\n  B -- 是 --> C[处理]\n  B -- 否 --> D[结束]\n  C --> D"
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "TD 上下",
        "LR 左右"
      ]
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "轻量实现：解析 graph / flowchart 的节点、边与边标签，做分层布局画成 SVG。时序图、甘特图等 14 类完整语法需要 Mermaid 引擎，这里不假装支持。",
  "compute": (v) => {
    const lines = L.nonEmptyLines(v.code || '');
    const nodes = new Map(), edges = [];
    for (const l of lines) {
      if (/^(graph|flowchart)\b/i.test(l)) continue;
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\)|\[\[[^\]]*\]\])?\s*(--?>\s*|--\|[^|]*\|\s*-->|-->\s*|-\.->\s*)(.+)$/);
      if (!m) continue;
      const [, a, shapeA, , rest] = m;
      const label = (s) => (s || '').replace(/^[\[{(]+|[\]})]+$/g, '');
      if (!nodes.has(a)) nodes.set(a, label(shapeA) || a);
      const m2 = String(rest).trim().match(/^([A-Za-z0-9_]+)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))?\s*(.*)$/);
      if (m2) { const [, b, shapeB] = m2; if (!nodes.has(b)) nodes.set(b, label(shapeB) || b); const edgeLabel = (l.match(/--\|([^|]*)\|/) || [])[1] || ''; edges.push([a, b, edgeLabel]); }
    }
    if (!nodes.size) return { error: '没解析出节点，检查写法是否形如 A[开始] --> B[结束]' };
    const ids = [...nodes.keys()];
    const depth = new Map(ids.map((x) => [x, 0]));
    for (let i = 0; i < ids.length; i++) for (const [a, b] of edges) depth.set(b, Math.max(depth.get(b) || 0, (depth.get(a) || 0) + 1));
    const levels = {}; ids.forEach((x) => { const d = depth.get(x) || 0; (levels[d] ||= []).push(x); });
    const lr = v.dir.startsWith('LR'), W = 150, H = 54, GX = 80, GY = 78;
    const pos = {};
    Object.entries(levels).forEach(([d, arr]) => arr.forEach((id, i) => { pos[id] = lr ? { x: 30 + Number(d) * (W + GX), y: 30 + i * (H + GY) } : { x: 30 + i * (W + GX), y: 30 + Number(d) * (H + GY) }; }));
    const w = Math.max(...Object.values(pos).map((p) => p.x)) + W + 40, h = Math.max(...Object.values(pos).map((p) => p.y)) + H + 40;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:100%;min-width:${Math.min(w, 900)}px;background:#fff">
      <defs><marker id="ar" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8a7c68"/></marker></defs>
      ${edges.map(([a, b, lab]) => { const p1 = pos[a], p2 = pos[b]; if (!p1 || !p2) return ''; const x1 = p1.x + W / 2, y1 = p1.y + H / 2, x2 = p2.x + W / 2, y2 = p2.y + H / 2; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#a89a84" stroke-width="1.6" marker-end="url(#ar)"/>${lab ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-size="11" fill="#6b5a3f">${L.esc(lab)}</text>` : ''}`; }).join('')}
      ${ids.map((id) => { const p = pos[id], shape = nodes.get(id); return `<g><rect x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="${String(shape).startsWith('{') ? 6 : 8}" fill="#f7f2e8" stroke="#b4552d" stroke-width="1.6"/><text x="${p.x + W / 2}" y="${p.y + H / 2 + 5}" text-anchor="middle" font-size="13" fill="#3d3328">${L.esc(shape)}</text></g>`; }).join('')}</svg>`;
    return { preview: svg, copy: svg, text: `${nodes.size} 个节点，${edges.length} 条边。`, stats: [{ label: '节点', value: nodes.size }, { label: '边', value: edges.length }] };
  }
});
