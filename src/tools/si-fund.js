/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "缴费基数与比例",
  "titleOut": "五险一金明细",
  "fields": [
    {
      "id": "base",
      "label": "缴费基数",
      "type": "number",
      "default": 12000,
      "unit": "元/月"
    },
    {
      "id": "pension",
      "label": "养老 个人 / 单位",
      "type": "number",
      "default": 8,
      "unit": "% / 单位固定 16%"
    },
    {
      "id": "medical",
      "label": "医疗 个人 / 单位",
      "type": "number",
      "default": 2,
      "unit": "% / 单位固定 8%"
    },
    {
      "id": "unemp",
      "label": "失业 个人 / 单位",
      "type": "number",
      "default": 0.5,
      "unit": "% / 单位固定 0.5%"
    },
    {
      "id": "fund",
      "label": "公积金 个人 / 单位",
      "type": "number",
      "default": 12,
      "unit": "%（单位同比例）"
    },
    {
      "id": "salary",
      "label": "税前月薪",
      "type": "number",
      "default": 20000,
      "unit": "元"
    }
  ],
  "primary": "复制明细",
  "hintOut": "单位部分一般不进工资条，但属于用人成本。各地比例与基数上下限不同，这里按可改的通用值算。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const p = v.pension, m = v.medical, u = v.unemp, g = v.fund;
    const items = [['养老', v.base * p / 100, v.base * 16 / 100], ['医疗', v.base * m / 100, v.base * 8 / 100], ['失业', v.base * u / 100, v.base * 0.5 / 100], ['工伤', 0, v.base * 0.4 / 100], ['生育', 0, v.base * 0.8 / 100], ['公积金', v.base * g / 100, v.base * g / 100]];
    const mine = items.reduce((a, x) => a + x[1], 0), comp = items.reduce((a, x) => a + x[2], 0);
    const tbl = `<table class="t-table"><thead><tr><th>险种</th><th>个人</th><th>单位</th></tr></thead><tbody>${items.map((x) => `<tr><td>${x[0]}</td><td>${F(x[1])}</td><td>${F(x[2])}</td></tr>`).join('')}<tr><td><b>合计</b></td><td><b>${F(mine)}</b></td><td><b>${F(comp)}</b></td></tr></tbody></table>`;
    const text = [`个人每月合计：${F(mine)} 元（占月薪 ${F(mine / Math.max(1, v.salary) * 100)}%）`, `单位每月合计：${F(comp)} 元`, `单位用人总成本：${F(v.salary + comp)} 元/月`, `个人年度合计：${F(mine * 12)} 元`, `单位年度合计：${F(comp * 12)} 元`, `缴费基数：${F(v.base)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '个人/月', value: F(mine) + ' 元' }, { label: '单位/月', value: F(comp) + ' 元' }, { label: '单位总成本', value: F(v.salary + comp) + ' 元' }], preview: '<p class="t-hint">分项明细（元）</p>' + tbl };
  }
});
