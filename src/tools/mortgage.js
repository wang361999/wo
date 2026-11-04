/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "贷款信息",
  "titleOut": "还款测算",
  "wide": false,
  "fields": [
    {
      "id": "amount",
      "label": "贷款总额",
      "type": "number",
      "default": 100,
      "unit": "万元"
    },
    {
      "id": "rate",
      "label": "商贷年利率",
      "type": "number",
      "default": 3.1,
      "unit": "%"
    },
    {
      "id": "years",
      "label": "贷款年限",
      "type": "number",
      "default": 30,
      "unit": "年"
    },
    {
      "id": "mode",
      "label": "还款方式",
      "type": "select",
      "options": [
        "等额本息",
        "等额本金"
      ]
    },
    {
      "id": "type",
      "label": "贷款类型",
      "type": "select",
      "options": [
        "商贷",
        "公积金",
        "组合贷"
      ]
    },
    {
      "id": "fund",
      "label": "其中公积金部分",
      "type": "number",
      "default": 40,
      "unit": "万元（组合贷时填）"
    },
    {
      "id": "fundRate",
      "label": "公积金年利率",
      "type": "number",
      "default": 2.85,
      "unit": "%"
    }
  ],
  "primary": "复制测算结果",
  "sample": {
    "amount": 100,
    "rate": 3.1,
    "years": 30,
    "fund": 40
  },
  "hintOut": "等额本金首月月供最高、逐月递减。组合贷按两笔贷款分别摊销后相加。利率请按你手上合同填，结果只作估算。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const n = Math.max(1, Math.round(v.years * 12)), mode = v.mode === '等额本金' ? 'principal' : 'equal';
    const parts = [];
    if (v.type === '组合贷') {
      const f = Math.min(v.amount, Math.max(0, v.fund));
      parts.push({ tag: '公积金', P: f * 10000, r: v.fundRate });
      parts.push({ tag: '商贷', P: (v.amount - f) * 10000, r: v.rate });
    } else parts.push({ tag: v.type, P: v.amount * 10000, r: v.type === '公积金' ? v.fundRate : v.rate });
    let first = 0, last = 0, totalI = 0, totalP = 0;
    const rows = [];
    for (const p of parts) {
      if (p.P <= 0) continue;
      const s = L.loanSchedule(p.P, p.r, n, mode);
      totalI += s.totalInterest; totalP += s.totalPay;
      first += s.rows[0].pay; last += s.rows[n - 1].pay;
      s.rows.slice(0, 12).forEach((x, i) => {
        if (!rows[i]) rows[i] = { i: i + 1, pay: 0, interest: 0, principalPart: 0, rest: 0 };
        rows[i].pay += x.pay; rows[i].interest += x.interest; rows[i].principalPart += x.principalPart; rows[i].rest += x.rest;
      });
    }
    const tbl = `<table class="t-table"><thead><tr><th>期数</th><th>月供</th><th>利息</th><th>本金</th><th>剩余本金</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.i}</td><td>${F(x.pay)}</td><td>${F(x.interest)}</td><td>${F(x.principalPart)}</td><td>${F(x.rest)}</td></tr>`).join('')}</tbody></table>`;
    const text = [
      `贷款总额：${F(v.amount * 10000)} 元（${L.esc(v.type)}）`,
      `首月月供：${F(first)} 元`,
      mode === 'principal' ? `末月月供：${F(last)} 元（等额本金逐月递减约 ${F((first - last) / Math.max(1, n - 1))} 元）` : `每月月供：${F(first)} 元（等额本息固定）`,
      `总利息：${F(totalI)} 元`,
      `总还款：${F(totalP)} 元`,
      `利息占本金：${F(totalI / Math.max(1, v.amount * 10000) * 100)}%`,
    ].join('\n');
    return { text, copy: text, stats: [{ label: '首月月供', value: F(first) + ' 元' }, { label: '总利息', value: F(totalI) + ' 元' }, { label: '总还款', value: F(totalP) + ' 元' }], preview: '<p class="t-hint">前 12 期明细（元）</p>' + tbl };
  }
});
