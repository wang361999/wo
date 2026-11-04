/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "朝代与银两",
  "titleOut": "折合成今天",
  "fields": [
    {
      "id": "dyn",
      "label": "朝代",
      "type": "select",
      "options": [
        "汉",
        "唐",
        "宋",
        "明",
        "清（康乾）",
        "清末"
      ]
    },
    {
      "id": "silver",
      "label": "银两",
      "type": "number",
      "default": 1,
      "unit": "两"
    }
  ],
  "primary": "复制折算",
  "hintOut": "用米价做锚：内置各朝「一两银子能买多少石米」的精简学术口径，再按今日米价折人民币。不同学者差好几倍，这里只给体感量级，不是严谨考据结论。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const T = { '汉': 2.5, '唐': 6, '宋': 3, '明': 4, '清（康乾）': 2, '清末': 1.2 };
    const shi = T[v.dyn] || 2, jin = shi * 0.0005;
    const kg = shi * 60, rmb = kg * 5.5, days = rmb / 200, goldCNY = jin * 1000 * 550;
    const text = [`${L.esc(v.dyn)} · ${F(v.silver, 2)} 两银子`, `可买米约 ${F(shi * v.silver, 1)} 石（${F(kg * v.silver, 0)} 公斤）`, `按今日米价约折人民币 ${F(rmb * v.silver, 0)} 元`, `约合工匠 ${F(days * v.silver, 1)} 天工钱`, `按银价本身只值 ${F(v.silver * 37.3 * 8, 0)} 元（1 两≈37.3 克，银料价约 8 元/克）`, '「一两银子值多少钱」没有标准答案：按米价、按工资、按银料会差出十倍'].join('\n');
    const rows = Object.entries(T).map(([d, s]) => `<tr><td>${L.esc(d)}</td><td>${F(s, 1)} 石</td><td>${F(s * 60 * 5.5, 0)} 元</td></tr>`).join('');
    return { text, copy: text, stats: [{ label: '折米', value: F(shi * v.silver, 1) + ' 石' }, { label: '折人民币', value: F(rmb * v.silver, 0) + ' 元' }, { label: '工匠工钱', value: F(days * v.silver, 1) + ' 天' }],
      preview: `<p class="t-hint">各朝 1 两银子的米价口径（离线精简）</p><table class="t-table"><thead><tr><th>朝</th><th>可买米</th><th>折今</th></tr></thead><tbody>${rows}</tbody></table>` };
  }
});
