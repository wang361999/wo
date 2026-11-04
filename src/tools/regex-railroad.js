/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "正则",
  "titleOut": "结构图",
  "fields": [
    {
      "id": "p",
      "label": "表达式",
      "type": "text",
      "default": "^\\d{3}-(?<name>\\w+)$"
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "把表达式按字符类 / 量词 / 分组 / 断言拆成节点，画成从左到右的流程图；可导出 SVG。",
  "compute": (v) => {
    const p = String(v.p || '');
    const nodes = []; let i = 0;
    while (i < p.length) {
      const c = p[i];
      if (p.startsWith('(?<', i)) { const j = p.indexOf('>', i); nodes.push(['命名组 ' + p.slice(i + 3, j), 'group']); i = j + 1; continue; }
      if (p.startsWith('(?', i)) { const j = p.indexOf(')', i); nodes.push(['断言 ' + p.slice(i, j + 1), 'assert']); i = j + 1; continue; }
      if (c === '[') { const j = p.indexOf(']', i); nodes.push(['字符类 ' + p.slice(i, j + 1), 'class']); i = j + 1; continue; }
      if (c === '\\') { nodes.push(['转义 ' + p.slice(i, i + 2), 'class']); i += 2; continue; }
      if (c === '{') { const j = p.indexOf('}', i); nodes.push(['量词 ' + p.slice(i, j + 1), 'quant']); i = j + 1; continue; }
      if ('*+?'.includes(c)) { nodes.push(['量词 ' + c, 'quant']); i++; continue; }
      if (c === '(' || c === ')') { nodes.push([c === '(' ? '分组开始' : '分组结束', 'group']); i++; continue; }
      if ('^$'.includes(c)) { nodes.push([c === '^' ? '行首' : '行尾', 'assert']); i++; continue; }
      if (c === '|') { nodes.push(['或', 'alt']); i++; continue; }
      nodes.push(['字面 ' + c, 'lit']); i++;
    }
    const colors = { lit: '#f2eee5', class: '#e7f0e4', quant: '#f8ecd5', group: '#e9eef6', assert: '#f5e6e3', alt: '#efe8f4' };
    const bw = 118, gap = 14, h = 46;
    const w = Math.max(560, 40 + nodes.length * (bw + gap));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 110" style="width:100%;min-width:${Math.min(w, 900)}px">
      <line x1="10" y1="55" x2="${w - 10}" y2="55" stroke="#c9c1b2" stroke-width="1.5"/>
      ${nodes.map((n, i) => { const x = 20 + i * (bw + gap); return `<g><rect x="${x}" y="32" width="${bw}" height="${h}" rx="7" fill="${colors[n[1]]}" stroke="#d6cbb8"/><text x="${x + bw / 2}" y="52" text-anchor="middle" font-size="11" fill="#4a4034">${L.esc(n[0].slice(0, 14))}</text><text x="${x + bw / 2}" y="68" text-anchor="middle" font-size="9" fill="#8a7c68">${n[1]}</text></g>`; }).join('')}
      <text x="10" y="20" font-size="11" fill="#8a7c68">起点</text><text x="${w - 34}" y="20" font-size="11" fill="#8a7c68">终点</text></svg>`;
    return { preview: svg, copy: svg, text: `${nodes.length} 个节点：\n${nodes.map((n) => n[1] + ' → ' + n[0]).join('\n')}`,
      stats: [{ label: '节点', value: nodes.length }], actions: [{ label: '下载 SVG', run: (v2, ctx) => { const el = ctx.root.querySelector('[data-preview] svg'); ctx.download('regex-railroad.svg', el ? el.outerHTML : '', 'image/svg+xml'); } }] };
  }
});
