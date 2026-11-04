/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "现状与目标",
  "titleOut": "自由时间表",
  "fields": [
    {
      "id": "asset",
      "label": "当前可投资资产",
      "type": "number",
      "default": 500000,
      "unit": "元"
    },
    {
      "id": "spend",
      "label": "年支出",
      "type": "number",
      "default": 120000,
      "unit": "元"
    },
    {
      "id": "save",
      "label": "每年可存",
      "type": "number",
      "default": 150000,
      "unit": "元"
    },
    {
      "id": "rate",
      "label": "投资年化",
      "type": "number",
      "default": 5,
      "unit": "%"
    },
    {
      "id": "infl",
      "label": "通胀",
      "type": "number",
      "default": 2.5,
      "unit": "%"
    },
    {
      "id": "swr",
      "label": "安全提取率",
      "type": "number",
      "default": 4,
      "unit": "%"
    }
  ],
  "primary": "复制测算",
  "hintOut": "4% 法则：目标资产 ≈ 年支出 ÷ 提取率。逐年按「资产×收益 + 新增存款」推演，支出随通胀涨。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const target = v.spend / (v.swr / 100);
    let a = v.asset, hit = null; const rows = [];
    for (let y = 1; y <= 60; y++) {
      a = a * (1 + v.rate / 100) + v.save;
      const need = v.spend * Math.pow(1 + v.infl / 100, y) / (v.swr / 100);
      rows.push({ y, a, need });
      if (hit === null && a >= need) hit = y;
    }
    const tbl = `<table class="t-table"><thead><tr><th>年</th><th>资产</th><th>当年目标</th><th>达成</th></tr></thead><tbody>${rows.filter((x) => x.y <= 20 || x.y === hit).map((x) => `<tr><td>${x.y}</td><td>${F(x.a)}</td><td>${F(x.need)}</td><td>${x.a >= x.need ? '✓' : '—'}</td></tr>`).join('')}</tbody></table>`;
    const text = [`今天的目标资产：${F(target)} 元（${F(v.spend)} ÷ ${v.swr}%）`, hit === null ? '按这组参数 60 年内达不到，试着提高存款或降低支出' : `大约第 ${hit} 年达成，届时资产约 ${F(rows[hit - 1].a)} 元`, `20 年后预计资产：${F(rows[19].a)} 元`, `提示：通胀会让目标逐年变高，别只盯今天的数字`].join('\n');
    return { text, copy: text, stats: [{ label: '目标资产', value: F(target) + ' 元' }, { label: '达成年份', value: hit === null ? '60+ 年' : hit + ' 年' }, { label: '20 年资产', value: F(rows[19].a) + ' 元' }], preview: '<p class="t-hint">资产推演（元）</p>' + tbl };
  }
});
