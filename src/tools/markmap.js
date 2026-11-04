/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Markdown",
  "titleOut": "思维导图",
  "wide": false,
  "fields": [
    {
      "id": "md",
      "label": "标题 / 列表",
      "type": "textarea",
      "rows": 10,
      "default": "# 我的工具箱\n\n## 图片类\n- 九宫格切图\n- 图片压缩\n- 占位图\n\n## 文本类\n- Base64\n- 正则测试\n- Markdown 编辑器\n\n## 计算类\n- 房贷计算\n- 复利计算"
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "把 Markdown 的 # 标题与 - 列表转成树，画成左右展开的思维导图；支持任意层级，可导出 SVG。",
  "compute": (v) => {
    const root = { t: 'root', c: [] }; const stack = [{ level: 0, node: root }];
    for (const l of L.lines(v.md || '')) {
      const h = l.match(/^(#{1,6})\s+(.+)$/); const li = l.match(/^\s*[-*+]\s+(.+)$/);
      if (h) { const level = h[1].length, node = { t: h[2].trim(), c: [] }; while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop(); stack[stack.length - 1].node.c.push(node); stack.push({ level, node }); }
      else if (li) { const node = { t: li[1].trim(), c: [] }; stack[stack.length - 1].node.c.push(node); }
    }
    const flat = []; let leaf = 0;
    const walk = (n, d) => { flat.push({ ...n, d, y: n.c.length ? 0 : leaf++ }); n.c.forEach((x) => walk(x, d + 1)); };
    root.c.forEach((x) => walk(x, 0));
    if (!flat.length) return { error: '没读到标题或列表' };
    const DX = 190, DY = 34;
    const maxD = Math.max(...flat.map((x) => x.d));
    const W = (maxD + 1) * DX + 220, H = Math.max(120, leaf * DY + 40);
    const pos = {};
    const place = (n, d) => { n.c.forEach((c) => place(c, d + 1)); const kids = n.c; n._y = kids.length ? kids.reduce((s, c) => s + c._y, 0) / kids.length : leafY++; };
    let leafY = 0; root.c.forEach((c) => place(c, 0));
    root._y = root.c.length ? root.c.reduce((s, c) => s + c._y, 0) / root.c.length : 0;
    const collect = (n, d, parent) => { if (parent) pos[`${d}-${n.t}-${n._y}`] = { x: 20 + d * DX, y: 24 + n._y * DY, parent: { x: 20 + (d - 1) * DX, y: 24 + parent._y * DY }, t: n.t }; n.c.forEach((c) => collect(c, d + 1, n)); };
    root.c.forEach((c) => collect(c, 0, root));
    const items = Object.values(pos);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;min-width:${Math.min(W, 900)}px;background:#fff">
      ${items.map((p) => `<path d="M${p.parent.x + 150},${p.parent.y + 12} C${p.parent.x + 175},${p.parent.y + 12} ${p.x - 15},${p.y + 12} ${p.x},${p.y + 12}" fill="none" stroke="#cbbba4" stroke-width="1.5"/>`).join('')}
      ${items.map((p) => `<g><rect x="${p.x}" y="${p.y}" width="150" height="25" rx="6" fill="#f2eee5" stroke="#d6cbb8"/><text x="${p.x + 8}" y="${p.y + 17}" font-size="12" fill="#3d3328">${L.esc(p.t.slice(0, 18))}</text></g>`).join('')}
      <text x="20" y="${H - 8}" font-size="11" fill="#8a7c68">共 ${flat.length} 个节点</text></svg>`;
    return { preview: svg, copy: svg, text: `${flat.length} 个节点。`, stats: [{ label: '节点', value: flat.length }, { label: '层级', value: maxD + 1 }] };
  }
});
