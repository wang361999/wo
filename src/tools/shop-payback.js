/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "开店参数",
  "titleOut": "回本测算",
  "fields": [
    {
      "id": "once",
      "label": "一次性投入（装修/设备/押金）",
      "type": "number",
      "default": 200000,
      "unit": "元"
    },
    {
      "id": "fixed",
      "label": "月固定成本（房租/人工）",
      "type": "number",
      "default": 30000,
      "unit": "元"
    },
    {
      "id": "aov",
      "label": "客单价",
      "type": "number",
      "default": 35,
      "unit": "元"
    },
    {
      "id": "orders",
      "label": "日均单量",
      "type": "number",
      "default": 120,
      "unit": "单"
    },
    {
      "id": "var",
      "label": "变动成本率",
      "type": "number",
      "default": 40,
      "unit": "%"
    },
    {
      "id": "days",
      "label": "月营业天数",
      "type": "number",
      "default": 30,
      "unit": "天"
    }
  ],
  "primary": "复制测算",
  "hintOut": "月净利 = 客单价×日单量×天数×(1−变动成本率) − 月固定成本。回本月数 = 一次性投入 ÷ 月净利。未计淡旺季与爬坡期。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const rev = v.aov * v.orders * v.days, gross = rev * (1 - v.var / 100), net = gross - v.fixed;
    const back = net > 0 ? v.once / net : null;
    const rows = []; let cum = -v.once;
    for (let m = 1; m <= 36; m++) { cum += net; rows.push({ m, cum }); }
    const tbl = `<table class="t-table"><thead><tr><th>月</th><th>累计现金流</th></tr></thead><tbody>${rows.filter((x) => x.m % 3 === 0 || x.m === 1 || (back !== null && Math.abs(x.m - back) < 1)).map((x) => `<tr><td>${x.m}</td><td style="color:${x.cum >= 0 ? '#7d9a76' : '#a35d5d'}">${F(x.cum)}</td></tr>`).join('')}</tbody></table>`;
    const sens = [0.7, 1, 1.3].map((k) => { const n2 = rev * k * (1 - v.var / 100) - v.fixed; return `${F(k * 100, 0)}% 单量：月净利 ${F(n2)}，${n2 > 0 ? '回本 ' + F(v.once / n2, 1) + ' 个月' : '不回本'}`; });
    const text = [`月营收 ${F(rev)} 元，毛利 ${F(gross)} 元`, `月净利：${F(net)} 元`, net <= 0 ? '当前参数下每月亏损，先降固定成本或提单量' : `回本：约 ${F(back, 1)} 个月`, '敏感度：', ...sens].join('\n');
    return { text, copy: text, stats: [{ label: '月净利', value: F(net) + ' 元' }, { label: '回本', value: back === null ? '不回本' : F(back, 1) + ' 个月' }, { label: '36 月累计', value: F(cum) + ' 元' }], preview: '<p class="t-hint">累计现金流（元，每 3 个月一行）</p>' + tbl };
  }
});
