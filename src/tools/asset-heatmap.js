/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "持仓明细",
  "titleOut": "资产结构",
  "wide": true,
  "fields": [
    {
      "id": "rows",
      "label": "每行：名称,金额,类别",
      "type": "textarea",
      "rows": 8,
      "default": "招商银行活期,120000,现金\n沪深300ETF,350000,权益\n国债,200000,固收\n自住房,2000000,房产\n黄金ETF,80000,商品"
    },
    {
      "id": "unit",
      "label": "金额单位",
      "type": "select",
      "options": [
        "元",
        "万元"
      ]
    }
  ],
  "primary": "复制汇总",
  "hintOut": "按金额占比画方块（treemap 近似），并给分类汇总。纯本地解析，不上传任何持仓信息。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const k = v.unit === '万元' ? 10000 : 1;
    const items = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', amt: Number(p[1]) * k || 0, cat: p[2] || '未分类' }; }).filter((x) => x.amt > 0);
    if (!items.length) return { error: '至少填一行，格式：名称,金额,类别' };
    const total = items.reduce((a, x) => a + x.amt, 0);
    const byCat = {}; items.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amt; });
    const colors = ['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062', '#8c8c8c', '#a35d5d'];
    const cats = Object.keys(byCat);
    const blocks = items.slice().sort((a, b) => b.amt - a.amt).map((x, i) => `<div style="flex:${Math.max(0.6, x.amt / total * 100)};min-width:74px;background:${colors[cats.indexOf(x.cat) % colors.length]};color:#fff;border-radius:8px;padding:12px;margin:3px;overflow:hidden"><div style="font-size:12px;opacity:.9">${L.esc(x.name)}</div><div style="font-weight:700;margin-top:4px">${F(x.amt / total * 100, 1)}%</div><div style="font-size:11px;opacity:.85">${L.esc(x.cat)} · ${F(x.amt)}</div></div>`).join('');
    const text = [`总资产：${F(total)} 元（${items.length} 项）`, ...Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, a]) => `${c}：${F(a)} 元（${F(a / total * 100, 1)}%）`), `最大单项：${items.slice().sort((a, b) => b.amt - a.amt)[0].name}（${F(Math.max(...items.map((x) => x.amt)) / total * 100, 1)}%）`].join('\n');
    return { text, copy: text, stats: [{ label: '总资产', value: F(total) + ' 元' }, { label: '类别数', value: cats.length + ' 类' }], preview: `<div style="display:flex;flex-wrap:wrap">${blocks}</div>` };
  }
});
