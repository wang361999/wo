/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "房子与买卖双方",
  "titleOut": "税费清单",
  "fields": [
    {
      "id": "price",
      "label": "成交价（网签价）",
      "type": "number",
      "default": 3000000,
      "unit": "元"
    },
    {
      "id": "origin",
      "label": "卖方当年购入价",
      "type": "number",
      "default": 1800000,
      "unit": "元"
    },
    {
      "id": "years",
      "label": "房产证满几年",
      "type": "number",
      "default": 3,
      "unit": "年"
    },
    {
      "id": "only",
      "label": "满五唯一",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "area",
      "label": "建筑面积",
      "type": "number",
      "default": 89,
      "unit": "㎡"
    },
    {
      "id": "first",
      "label": "买方套数",
      "type": "select",
      "options": [
        "首套",
        "二套",
        "三套及以上"
      ]
    }
  ],
  "primary": "复制税费清单",
  "hintOut": "内置精简口径：满 2 年免增值税；个税按差额 20% 或全额 1% 二选一（这里取较低）；契税按 140㎡ 分档。2026 起增值税率按 3% 简化。各地细则不同，过户前以当地税务与中介核算为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const net = v.price / 1.05;
    const vat = v.years >= 2 ? 0 : net * 0.03;
    const sur = vat * 0.12;
    const diff = Math.max(0, v.price - v.origin);
    const pit = v.only && v.years >= 5 ? 0 : Math.min(diff * 0.2, v.price * 0.01);
    const cr = v.first === '首套' ? (v.area <= 140 ? 0.01 : 0.015) : v.first === '二套' ? (v.area <= 140 ? 0.01 : 0.02) : 0.03;
    const deed = v.price * cr;
    const seller = vat + sur + pit, buyer = deed;
    const text = [`卖方：`, `　增值税（${v.years >= 2 ? '满 2 年免征' : '3%'}）：${F(vat)} 元`, `　附加税（增值税 ×12%）：${F(sur)} 元`, `　个人所得税${v.only && v.years >= 5 ? '（满五唯一免征）' : ''}：${F(pit)} 元（差额 ${F(diff)} 元）`, `　卖方合计：${F(seller)} 元`, `买方：`, `　契税（${F(cr * 100, 2)}%）：${F(deed)} 元`, `双方税费合计：${F(seller + buyer)} 元`, `占成交价 ${F((seller + buyer) / Math.max(1, v.price) * 100)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '卖方税费', value: F(seller) + ' 元' }, { label: '买方契税', value: F(deed) + ' 元' }, { label: '合计', value: F(seller + buyer) + ' 元' }],
      preview: `<p class="t-hint">个税按「差额 20% 与全额 1% 取低」估算；满五唯一需同时满足「满 5 年」且「家庭唯一住房」。</p>` };
  }
});
