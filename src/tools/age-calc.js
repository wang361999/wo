/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "生日",
  "titleOut": "年龄与倒计时",
  "fields": [
    {
      "id": "birth",
      "label": "出生日期",
      "type": "text",
      "default": "1995-08-20",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "at",
      "label": "算到哪天",
      "type": "text",
      "default": "",
      "placeholder": "留空 = 今天"
    }
  ],
  "primary": "复制结果",
  "hintOut": "周岁按生日是否已过算，虚岁按出生即 1 岁、过春节加 1 的民间口径。星座按公历，生肖按农历年近似（立春前后可能差一年）。",
  "compute": (v) => {
    const b = L.parseDate(v.birth), at = v.at ? L.parseDate(v.at) : new Date();
    if (isNaN(b) || isNaN(at)) return { error: '日期填成 YYYY-MM-DD' };
    const a = L.ageDetail(b, at);
    let next = new Date(at.getFullYear(), b.getMonth(), b.getDate());
    if (next <= at) next = new Date(at.getFullYear() + 1, b.getMonth(), b.getDate());
    const left = L.diffDays(at, next);
    const text = [`出生 ${L.fmtDate(b)}（周${L.weekdayCN(b)}）`, `算到 ${L.fmtDate(at)}`, `周岁：${a.years} 岁 ${a.months} 个月 ${a.days} 天`, `虚岁：${at.getFullYear() - b.getFullYear() + 1} 岁`, `已经活了 ${L.diffDays(b, at)} 天（约 ${L.round(L.diffDays(b, at) / 365.2425, 2)} 年）`, `下次生日：${L.fmtDate(next)}（周${L.weekdayCN(next)}），还有 ${left} 天`, `星座：${L.constellation(b.getMonth() + 1, b.getDate())}　生肖：${L.zodiac(b.getFullYear())}`].join('\n');
    return { text, copy: text, stats: [{ label: '周岁', value: a.years + ' 岁' }, { label: '下次生日', value: left + ' 天' }, { label: '已活', value: L.diffDays(b, at) + ' 天' }] };
  }
});
