/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "投放数据",
  "titleOut": "回报测算",
  "fields": [
    {
      "id": "cost",
      "label": "广告花费",
      "type": "number",
      "default": 10000,
      "unit": "元"
    },
    {
      "id": "revenue",
      "label": "带来的收入",
      "type": "number",
      "default": 30000,
      "unit": "元"
    },
    {
      "id": "margin",
      "label": "毛利率",
      "type": "number",
      "default": 50,
      "unit": "%"
    },
    {
      "id": "impr",
      "label": "曝光量",
      "type": "number",
      "default": 200000,
      "unit": "次"
    },
    {
      "id": "clicks",
      "label": "点击量",
      "type": "number",
      "default": 4000,
      "unit": "次"
    },
    {
      "id": "orders",
      "label": "订单数",
      "type": "number",
      "default": 120,
      "unit": "单"
    }
  ],
  "primary": "复制测算",
  "hintOut": "ROAS = 收入 ÷ 花费；净 ROI = (毛利 − 花费) ÷ 花费。保本 ROAS = 1 ÷ 毛利率，低于它就是在亏钱。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const roas = v.revenue / Math.max(1, v.cost), gross = v.revenue * v.margin / 100;
    const roi = (gross - v.cost) / Math.max(1, v.cost) * 100, be = v.margin > 0 ? 100 / v.margin : 0;
    const cpm = v.impr > 0 ? v.cost / v.impr * 1000 : 0, cpc = v.clicks > 0 ? v.cost / v.clicks : 0, cpa = v.orders > 0 ? v.cost / v.orders : 0;
    const aov = v.orders > 0 ? v.revenue / v.orders : 0;
    const text = [`ROAS：${F(roas)}（收入 ${F(v.revenue)} ÷ 花费 ${F(v.cost)}）`, `毛利：${F(gross)} 元`, `净 ROI：${F(roi)}%`, `保本 ROAS：${F(be)}，当前 ${roas >= be ? '高于' : '低于'}保本线`, `CPM ${F(cpm)} 元 / CPC ${F(cpc)} 元 / CPA ${F(cpa)} 元`, `客单价 ${F(aov)} 元，转化率 ${F(v.clicks > 0 ? v.orders / v.clicks * 100 : 0)}%`].join('\n');
    return { text, copy: text, stats: [{ label: 'ROAS', value: F(roas) }, { label: '净 ROI', value: F(roi) + '%' }, { label: '保本 ROAS', value: F(be) }],
      preview: `<p class="t-hint">漏斗：曝光 ${F(v.impr, 0)} → 点击 ${F(v.clicks, 0)}（CTR ${F(v.impr > 0 ? v.clicks / v.impr * 100 : 0)}%）→ 成交 ${F(v.orders, 0)}（CVR ${F(v.clicks > 0 ? v.orders / v.clicks * 100 : 0)}%）</p>` };
  }
});
