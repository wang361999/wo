/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "购物车与规则",
  "titleOut": "凑单建议",
  "fields": [
    {
      "id": "cur",
      "label": "当前商品金额",
      "type": "number",
      "default": 268,
      "unit": "元"
    },
    {
      "id": "rules",
      "label": "阶梯满减（每行 门槛-减）",
      "type": "textarea",
      "rows": 4,
      "default": "200-30\n300-50\n500-100"
    },
    {
      "id": "every",
      "label": "每满减（0 表示没有）",
      "type": "number",
      "default": 0,
      "unit": "元，如 每满 200 减 30 填 200"
    },
    {
      "id": "everyCut",
      "label": "每满减多少",
      "type": "number",
      "default": 30,
      "unit": "元"
    }
  ],
  "primary": "复制凑单方案",
  "hintOut": "阶梯满减与「每满减」通常二选一，这里按你填的规则分别算，并给出凑到下一档是否划算。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const rules = L.nonEmptyLines(v.rules).map((l) => l.split(/[-\-—]/).map((x) => Number(String(x).trim()))).filter((x) => x.length >= 2 && isFinite(x[0]) && isFinite(x[1])).sort((a, b) => a[0] - b[0]);
    const best = rules.filter((r) => v.cur >= r[0]).pop() || [0, 0];
    const ev = v.every > 0 ? Math.floor(v.cur / v.every) * v.everyCut : 0;
    const useEvery = ev > best[1];
    const cut = useEvery ? ev : best[1];
    const text0 = [`当前 ${F(v.cur)} 元`, `阶梯满减命中：满 ${F(best[0])} 减 ${F(best[1])}`, v.every > 0 ? `每满 ${F(v.every)} 减 ${F(v.everyCut)}：可减 ${F(ev)}` : '', `采用：${useEvery ? '每满减' : '阶梯满减'}，共减 ${F(cut)} 元`, `实付 ${F(v.cur - cut)} 元，等效 ${F((v.cur - cut) / Math.max(1, v.cur) * 10, 2)} 折`].filter(Boolean).join('\n');
    const next = rules.find((r) => r[0] > v.cur);
    let advice = '已经是最高档了';
    if (next) { const add = next[0] - v.cur, gain = next[1] - cut; advice = `再凑 ${F(add)} 元到 ${F(next[0])} 档，多减 ${F(gain)} 元 → ${gain > add ? '不划算（多花比多减多）' : gain === add ? '刚好持平' : '划算'}`; }
    const text = text0 + '\n' + advice;
    return { text, copy: text, stats: [{ label: '已减', value: F(cut) + ' 元' }, { label: '实付', value: F(v.cur - cut) + ' 元' }, { label: '等效', value: F((v.cur - cut) / Math.max(1, v.cur) * 10, 2) + ' 折' }],
      preview: `<p class="t-hint">${L.esc(advice)}。别为了凑单买用不上的东西。</p>` };
  }
});
