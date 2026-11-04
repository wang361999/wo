/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "面积数值",
  "titleOut": "各口径换算",
  "fields": [
    {
      "id": "v",
      "label": "数值",
      "type": "number",
      "default": 1
    },
    {
      "id": "u",
      "label": "单位",
      "type": "select",
      "options": [
        "亩",
        "平方米",
        "分",
        "厘",
        "公顷",
        "英亩",
        "平方公里"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "市制 1 亩 = 666.6667 ㎡ = 60 平方丈；1 公顷 = 15 亩。注意「大亩/小亩」「东北垧」等地方口径不同，见下方辨析。",
  "compute": (v) => {
    const F = (n, d = 4) => L.fmt(L.round(n, d), d);
    const toM2 = { '亩': 666.6666667, '平方米': 1, '分': 66.66666667, '厘': 6.666666667, '公顷': 10000, '英亩': 4046.8564224, '平方公里': 1000000 };
    const m2 = v.v * toM2[v.u];
    const text = [`${F(v.v)} ${L.esc(v.u)} =`, `　${F(m2)} 平方米`, `　${F(m2 / 666.6666667)} 亩（市亩）`, `　${F(m2 / 66.66666667)} 分`, `　${F(m2 / 6.666666667)} 厘`, `　${F(m2 / 10000)} 公顷`, `　${F(m2 / 4046.8564224)} 英亩`, `　${F(m2 / 1000000)} 平方公里`, `　${F(m2 / 0.6666666667)} 平方丈`].join('\n');
    return { text, copy: text, stats: [{ label: '亩', value: F(m2 / 666.6666667) }, { label: '公顷', value: F(m2 / 10000) }, { label: '平方米', value: F(m2) }],
      preview: `<p class="t-hint">五种「亩」辨析：市亩 666.67㎡（通用）；东北「垧」约 15 亩 = 1 公顷；部分地区「大亩」1000㎡、「小亩」666.67㎡；台湾「甲」约 9699㎡；日本「反」约 991.7㎡。签合同务必写明平方米。</p>` };
  }
});
