/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "买房与租房参数",
  "titleOut": "N 年成本对比",
  "fields": [
    {
      "id": "price",
      "label": "房价",
      "type": "number",
      "default": 3000000,
      "unit": "元"
    },
    {
      "id": "down",
      "label": "首付比例",
      "type": "number",
      "default": 30,
      "unit": "%"
    },
    {
      "id": "rate",
      "label": "贷款年利率",
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
      "id": "rent",
      "label": "现在月租金",
      "type": "number",
      "default": 5000,
      "unit": "元"
    },
    {
      "id": "rentUp",
      "label": "租金年涨幅",
      "type": "number",
      "default": 2,
      "unit": "%"
    },
    {
      "id": "growth",
      "label": "房价年涨幅",
      "type": "number",
      "default": 0,
      "unit": "%"
    },
    {
      "id": "invest",
      "label": "闲钱投资年化",
      "type": "number",
      "default": 3,
      "unit": "%"
    },
    {
      "id": "hold",
      "label": "打算持有",
      "type": "number",
      "default": 10,
      "unit": "年"
    }
  ],
  "primary": "复制对比结论",
  "hintOut": "简化模型：买房 = 首付机会成本 + 累计月供 − 期末房产净值；租房 = 累计租金 + （首付+月供差额）拿去投资的收益。不含税费、维修、搬家成本。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const H = Math.max(1, Math.round(v.hold)), n = Math.round(v.years * 12);
    const down = v.price * v.down / 100, M = L.pmt(v.price - down, v.rate, n);
    const rows = []; let rentCum = 0, buyCum = 0, rentInv = down, buyPaid = down, cross = null;
    for (let y = 1; y <= H; y++) {
      const r = v.rent * Math.pow(1 + v.rentUp / 100, y - 1) * 12;
      rentCum += r;
      rentInv = rentInv * (1 + v.invest / 100) + Math.max(0, M * 12 - r);
      buyPaid += M * 12;
      const loanRest = (() => { const rr = v.rate / 1200; const k = Math.min(n, y * 12); return rr === 0 ? (v.price - down) * (1 - k / n) : (v.price - down) * (Math.pow(1 + rr, n) - Math.pow(1 + rr, k)) / (Math.pow(1 + rr, n) - 1); })();
      const home = v.price * Math.pow(1 + v.growth / 100, y) - loanRest;
      const buyNet = buyPaid + down * Math.pow(1 + v.invest / 100, y) - home;
      const rentNet = rentCum - (rentInv - down * Math.pow(1 + v.invest / 100, y));
      buyCum = buyNet; rows.push({ y, buy: buyNet, rent: rentNet, home: home });
      if (cross === null && buyNet <= rentNet) cross = y;
    }
    const tbl = `<table class="t-table"><thead><tr><th>年</th><th>买房净成本</th><th>租房净成本</th><th>房产净值</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.y}</td><td>${F(x.buy)}</td><td>${F(x.rent)}</td><td>${F(x.home)}</td></tr>`).join('')}</tbody></table>`;
    const text = [`月供 ${F(M)} 元，首付 ${F(down)} 元`, `持有 ${H} 年：买房净成本 ${F(buyCum)} 元`, `同口径租房净成本 ${F(rows[H - 1].rent)} 元`, cross === null ? `${H} 年内买房始终更贵（按这组假设）` : `约第 ${cross} 年起买房累计成本反超更划算`, `结论强依赖房价涨幅与投资年化，改一个数字可能翻转`].join('\n');
    return { text, copy: text, stats: [{ label: '月供', value: F(M) + ' 元' }, { label: `${H} 年买房`, value: F(buyCum) + ' 元' }, { label: `${H} 年租房`, value: F(rows[H - 1].rent) + ' 元' }], preview: '<p class="t-hint">净成本越小越划算（元）</p>' + tbl };
  }
});
