/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "增值税与地区",
  "titleOut": "附加税费",
  "fields": [
    {
      "id": "vat",
      "label": "本期实缴增值税",
      "type": "number",
      "default": 10000,
      "unit": "元"
    },
    {
      "id": "city",
      "label": "城建税率",
      "type": "select",
      "options": [
        "市区 7%",
        "县城/镇 5%",
        "其他 1%"
      ]
    },
    {
      "id": "small",
      "label": "小微企业六税两费减半",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "include",
      "label": "价税分离反推（填含税销售额）",
      "type": "number",
      "default": 0,
      "unit": "元，0 = 不反推"
    }
  ],
  "primary": "复制明细",
  "hintOut": "城建税 7/5/1% + 教育费附加 3% + 地方教育附加 2%，计税依据都是实缴增值税/消费税。小微「六税两费」减半按 50% 计。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let vat = v.vat;
    if (v.include > 0) vat = v.include / 1.13 * 0.13;
    const cr = v.city.startsWith('市区') ? 0.07 : v.city.startsWith('县城') ? 0.05 : 0.01;
    const half = v.small ? 0.5 : 1;
    const a = vat * cr * half, b = vat * 0.03 * half, c = vat * 0.02 * half;
    const text = [`计税依据（实缴增值税）：${F(vat)} 元${v.include > 0 ? `（由含税销售额 ${F(v.include)} 元按 13% 反推）` : ''}`, `城建税（${F(cr * 100, 0)}%）：${F(a)} 元`, `教育费附加（3%）：${F(b)} 元`, `地方教育附加（2%）：${F(c)} 元`, `合计：${F(a + b + c)} 元${v.small ? '（已按小微减半）' : ''}`, `综合附加率：${F((a + b + c) / Math.max(1, vat) * 100)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '附加合计', value: F(a + b + c) + ' 元' }, { label: '城建税', value: F(a) + ' 元' }, { label: '综合率', value: F((a + b + c) / Math.max(1, vat) * 100) + '%' }],
      preview: `<p class="t-hint">减免政策有适用期间与主体条件，报税以税务机关口径为准。</p>` };
  }
});
