/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "价格与优惠",
  "titleOut": "到手价明细",
  "fields": [
    {
      "id": "price",
      "label": "原价",
      "type": "number",
      "default": 399,
      "unit": "元"
    },
    {
      "id": "discount",
      "label": "折扣",
      "type": "number",
      "default": 8.5,
      "unit": "折（10 = 不打折）"
    },
    {
      "id": "full",
      "label": "满减（门槛-减，多行）",
      "type": "textarea",
      "rows": 3,
      "default": "300-40"
    },
    {
      "id": "coupon",
      "label": "优惠券面额",
      "type": "number",
      "default": 20,
      "unit": "元"
    },
    {
      "id": "red",
      "label": "红包",
      "type": "number",
      "default": 8,
      "unit": "元"
    }
  ],
  "primary": "复制明细",
  "hintOut": "按「先打折 → 再满减 → 再券 → 再红包」的常见顺序逐步算。平台实际叠加顺序可能不同，以结算页为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const steps = []; let x = v.price;
    const afterDisc = x * v.discount / 10; steps.push(['打折', `${v.discount} 折`, -L.round(x - afterDisc)]); x = afterDisc;
    const rules = L.nonEmptyLines(v.full).map((l) => l.split(/[-\-—]/).map((y) => Number(String(y).trim()))).filter((y) => isFinite(y[0]) && isFinite(y[1])).sort((a, b) => b[0] - a[0]);
    const hit = rules.find((r) => x >= r[0]);
    if (hit) { steps.push([`满 ${F(hit[0])} 减 ${F(hit[1])}`, '', -hit[1]]); x -= hit[1]; }
    const c = Math.min(v.coupon, x); if (c > 0) { steps.push(['优惠券', '', -c]); x -= c; }
    const r = Math.min(v.red, x); if (r > 0) { steps.push(['红包', '', -r]); x -= r; }
    x = Math.max(0, x);
    const saved = v.price - x;
    const text = [`原价 ${F(v.price)} 元`, ...steps.map((s) => `${s[0]} ${s[1]}：${s[2] > 0 ? '+' : ''}${F(s[2])} 元`), `到手价：${F(x)} 元`, `共优惠 ${F(saved)} 元，等效 ${F(x / Math.max(1, v.price) * 10, 2)} 折`].join('\n');
    const tbl = `<table class="t-table"><thead><tr><th>步骤</th><th>变动</th><th>累计</th></tr></thead><tbody>${steps.map((s, i) => `<tr><td>${L.esc(s[0] + ' ' + s[1])}</td><td>${F(s[2])}</td><td>${F(v.price + steps.slice(0, i + 1).reduce((a, z) => a + z[2], 0))}</td></tr>`).join('')}</tbody></table>`;
    return { text, copy: text, stats: [{ label: '到手价', value: F(x) + ' 元' }, { label: '共省', value: F(saved) + ' 元' }, { label: '等效', value: F(x / Math.max(1, v.price) * 10, 2) + ' 折' }], preview: '<p class="t-hint">分步明细（元）</p>' + tbl };
  }
});
