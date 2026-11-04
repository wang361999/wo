/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "数据（第一行表头，之后每行一条）",
  "titleOut": "图表",
  "wide": false,
  "fields": [
    {
      "id": "data",
      "label": "CSV / 从 Excel 粘贴（Tab 分隔也行）",
      "type": "textarea",
      "rows": 8,
      "default": "月份,销售额,成本\n1月,120,60\n2月,150,72\n3月,180,80\n4月,140,70\n5月,210,96"
    },
    {
      "id": "type",
      "label": "图表类型",
      "type": "select",
      "options": [
        "柱状图",
        "折线图",
        "面积图",
        "饼图",
        "横向条形",
        "散点图"
      ]
    },
    {
      "id": "title",
      "label": "标题",
      "type": "text",
      "default": "月度销售"
    },
    {
      "id": "theme",
      "label": "配色",
      "type": "select",
      "options": [
        "暖纸",
        "青蓝",
        "多彩"
      ]
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "本地 canvas 绘制，导出 SVG / PNG；多列数值会画成多组系列。",
  "compute": (v) => {
    const rows = L.parseCSV(v.data || '', (v.data || '').includes('\t') ? '\t' : ',');
    if (rows.length < 2) return { error: '至少要有表头和一行数据' };
    const head = rows[0], data = rows.slice(1).map((r) => [r[0], ...r.slice(1).map((x) => Number(x) || 0)]);
    const themes = { '暖纸': ['#b4552d', '#d8a05f', '#8a9a6b'], '青蓝': ['#2b7a9b', '#5aa9b8', '#7c8fa8'], '多彩': ['#b4552d', '#4a7c59', '#3f6ea5', '#c08a3e', '#8a5a83'] }[v.theme] || ['#b4552d'];
    const W = 720, H = 400, P = 52, pw = W - P * 2, ph = H - P * 2;
    const max = Math.max(1, ...data.flatMap((r) => r.slice(1)));
    const n = data.length, series = head.length - 1;
    const bw = pw / n / (series + 0.4);
    const yOf = (val) => P + ph - val / max * ph;
    const parts = [`<rect width="${W}" height="${H}" fill="#fff"/>`, `<text x="${W / 2}" y="28" text-anchor="middle" font-size="17" font-weight="700" fill="#3d3328">${L.esc(v.title || '')}</text>`];
    for (let i = 0; i <= 4; i++) { const y = P + ph - i / 4 * ph; parts.push(`<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="#e6e0d4"/>`, `<text x="${P - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#8a7c68">${L.round(max * i / 4, 0)}</text>`); }
    data.forEach((r, i) => {
      const x0 = P + i * pw / n;
      parts.push(`<text x="${x0 + pw / n / 2}" y="${H - 18}" text-anchor="middle" font-size="11" fill="#6b5a3f">${L.esc(r[0])}</text>`);
      r.slice(1).forEach((val, s) => {
        const c = themes[s % themes.length], x = x0 + pw / n / 2 - (series * bw) / 2 + s * bw;
        if (v.type === '柱状图' || v.type === '横向条形') parts.push(`<rect x="${x}" y="${yOf(val)}" width="${bw - 2}" height="${P + ph - yOf(val)}" rx="2" fill="${c}"/>`);
        if (v.type === '饼图' && s === 0) { const total = data.reduce((a, d2) => a + d2[1], 0); let ang = -Math.PI / 2; const cx = W / 2, cy = H / 2, rad = Math.min(pw, ph) / 2.6; data.forEach((d2, j) => { const a2 = ang + d2[1] / total * Math.PI * 2; const p1 = [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)], p2 = [cx + rad * Math.cos(a2), cy + rad * Math.sin(a2)]; parts.push(`<path d="M${cx},${cy} L${p1[0]},${p1[1]} A${rad},${rad} 0 ${a2 - ang > Math.PI ? 1 : 0},1 ${p2[0]},${p2[1]} Z" fill="${themes[j % themes.length]}" stroke="#fff" stroke-width="2"/>`); ang = a2; }); }
      });
      if (['折线图', '面积图', '散点图'].includes(v.type)) for (let s = 0; s < series; s++) {
        const pts = data.map((d2, j) => [P + (j + .5) * pw / n, yOf(d2[s + 1])]);
        if (v.type === '面积图') parts.push(`<polygon points="${P + pw / n / 2},${P + ph} ${pts.map((p) => p.join(',')).join(' ')} ${P + (n - .5) * pw / n},${P + ph}" fill="${themes[s]}" opacity=".18"/>`);
        if (v.type !== '散点图') parts.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${themes[s]}" stroke-width="2.5"/>`);
        pts.forEach((p) => parts.push(`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${themes[s]}"/>`));
      }
    });
    const legend = head.slice(1).map((h, s) => `<rect x="${P + s * 110}" y="${H - 6}" width="10" height="10" fill="${themes[s]}"/><text x="${P + s * 110 + 15}" y="${H + 3}" font-size="11" fill="#6b5a3f">${L.esc(h)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 12}" style="width:100%">${parts.join('')}${legend}</svg>`;
    return { preview: svg, copy: svg, text: `${data.length} 行 × ${series} 个系列，最大 ${max}。`, stats: [{ label: '数据行', value: data.length }, { label: '系列', value: series }] };
  }
});
