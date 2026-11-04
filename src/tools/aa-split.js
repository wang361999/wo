/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "账单与参与人",
  "titleOut": "结算清单",
  "wide": true,
  "fields": [
    {
      "id": "rows",
      "label": "每行：姓名,垫付金额",
      "type": "textarea",
      "rows": 7,
      "default": "小明,480\n小红,120\n小刚,0\n小丽,0"
    },
    {
      "id": "people",
      "label": "参与人均摊（留空=全部人）",
      "type": "text",
      "default": "",
      "placeholder": "逗号分隔，如 小明,小红,小刚,小丽"
    }
  ],
  "primary": "复制结算清单",
  "hintOut": "按参与人数均摊总账，算出谁该收、谁该付，再用贪心合并出尽量少的转账笔数。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const rows = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0], paid: Number(p[1]) || 0 }; });
    if (!rows.length) return { error: '至少填一行：姓名,垫付金额' };
    const names = String(v.people || '').trim() ? String(v.people).split(/[,，\s]+/).filter(Boolean) : rows.map((x) => x.name);
    const total = rows.reduce((a, x) => a + x.paid, 0), share = total / Math.max(1, names.length);
    const bal = {}; names.forEach((n) => { bal[n] = -share; }); rows.forEach((x) => { bal[x.name] = (bal[x.name] || 0) + x.paid; });
    const creditors = Object.entries(bal).filter(([, b]) => b > 0.005).map(([n, b]) => ({ n, b })).sort((a, b) => b.b - a.b);
    const debtors = Object.entries(bal).filter(([, b]) => b < -0.005).map(([n, b]) => ({ n, b: -b })).sort((a, b) => b.b - a.b);
    const transfers = []; let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) { const x = Math.min(debtors[i].b, creditors[j].b); transfers.push(`${L.esc(debtors[i].n)} → ${L.esc(creditors[j].n)}　${F(x)} 元`); debtors[i].b -= x; creditors[j].b -= x; if (debtors[i].b < 0.005) i++; if (creditors[j].b < 0.005) j++; }
    const text = [`总账 ${F(total)} 元，${names.length} 人均摊，每人 ${F(share)} 元`, ...Object.entries(bal).map(([n, b]) => `${L.esc(n)}：垫付 ${F(rows.find((x) => x.name === n)?.paid || 0)}，应担 ${F(share)}，${b >= 0 ? '应收回' : '应付出'} ${F(Math.abs(b))}`), '', '最少转账：', ...(transfers.length ? transfers : ['（已平，不用转）'])].join('\n');
    return { text, copy: text, stats: [{ label: '总账', value: F(total) + ' 元' }, { label: '人均', value: F(share) + ' 元' }, { label: '转账笔数', value: transfers.length + ' 笔' }],
      preview: `<p class="t-hint">${L.esc('金额大写：')}${L.numCN(total)}</p>` };
  }
});
