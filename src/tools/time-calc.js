/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "日期",
  "titleOut": "计算结果",
  "fields": [
    {
      "id": "a",
      "label": "起始日期",
      "type": "text",
      "default": "2026-01-01",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "b",
      "label": "结束日期（差值模式）",
      "type": "text",
      "default": "2026-12-31",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "add",
      "label": "加减天数（推算模式）",
      "type": "number",
      "default": 100,
      "unit": "天，可负"
    }
  ],
  "primary": "复制结果",
  "hintOut": "工作日按周一至周五计，不含法定节假日与调休（内置精简口径）。",
  "compute": (v) => {
    const a = L.parseDate(v.a), b = L.parseDate(v.b);
    if (isNaN(a) || isNaN(b)) return { error: '日期填成 YYYY-MM-DD' };
    const d = L.diffDays(a, b), w = L.workdays(a, b), later = L.addDays(a, v.add);
    const text = [`${L.fmtDate(a)}（周${L.weekdayCN(a)}）→ ${L.fmtDate(b)}（周${L.weekdayCN(b)}）`, `相差 ${Math.abs(d)} 天（${d >= 0 ? '结束在之后' : '结束在之前'}）`, `约 ${L.round(Math.abs(d) / 7, 1)} 周 / ${L.round(Math.abs(d) / 30.44, 1)} 个月`, `其间工作日约 ${w} 天`, `起始日 ${v.add >= 0 ? '+' : ''}${v.add} 天 → ${L.fmtDate(later)}（周${L.weekdayCN(later)}）`, `起始日 ${v.add >= 0 ? '+' : ''}${v.add} 个月后 → ${L.fmtDate(L.addMonths(a, Math.round(v.add / 30)))}`].join('\n');
    return { text, copy: text, stats: [{ label: '相差', value: Math.abs(d) + ' 天' }, { label: '工作日', value: w + ' 天' }, { label: '推算日', value: L.fmtDate(later) }] };
  }
});
