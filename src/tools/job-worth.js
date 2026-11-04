/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "工作投入",
  "titleOut": "真实时薪",
  "fields": [
    {
      "id": "salary",
      "label": "税后月薪",
      "type": "number",
      "default": 15000,
      "unit": "元"
    },
    {
      "id": "days",
      "label": "每月工作日",
      "type": "number",
      "default": 21.75,
      "unit": "天"
    },
    {
      "id": "work",
      "label": "每天在岗",
      "type": "number",
      "default": 8,
      "unit": "小时"
    },
    {
      "id": "commute",
      "label": "每天通勤往返",
      "type": "number",
      "default": 1.5,
      "unit": "小时"
    },
    {
      "id": "ot",
      "label": "每天无偿加班",
      "type": "number",
      "default": 1,
      "unit": "小时"
    },
    {
      "id": "extra",
      "label": "每月通勤/置装等支出",
      "type": "number",
      "default": 600,
      "unit": "元"
    }
  ],
  "primary": "复制时薪",
  "hintOut": "把通勤、加班和为了上班多花的钱全算进去，得到「这份工作真正值多少钱一小时」。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const nominal = v.salary / (v.days * v.work), hours = v.days * (v.work + v.commute + v.ot);
    const real = (v.salary - v.extra) / Math.max(1, hours);
    const loss = v.salary - real * v.work * v.days;
    const text = [`名义时薪（只算在岗）：${F(nominal)} 元/小时`, `每月总投入：${F(hours, 1)} 小时（含通勤 ${F(v.commute * v.days, 1)}h、加班 ${F(v.ot * v.days, 1)}h）`, `真实时薪：${F(real)} 元/小时`, `通勤 + 加班 + 额外支出，每月折损约 ${F(loss)} 元`, `折损相当于月薪的 ${F(loss / Math.max(1, v.salary) * 100, 1)}%`, `每秒约 ${F(real / 3600, 4)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '名义时薪', value: F(nominal) + ' 元' }, { label: '真实时薪', value: F(real) + ' 元' }, { label: '月折损', value: F(loss) + ' 元' }],
      preview: `<p class="t-hint">真实时薪比名义时薪低 ${F((1 - real / Math.max(0.01, nominal)) * 100, 1)}%。涨薪 20% 与通勤少 1 小时，哪个更划算可以自己改数字比。</p>` };
  }
});
