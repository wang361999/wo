/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "周期信息",
  "titleOut": "易孕窗口",
  "fields": [
    {
      "id": "start",
      "label": "上次月经首日",
      "type": "text",
      "default": "2026-06-01",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "cycle",
      "label": "周期长度",
      "type": "number",
      "default": 28,
      "unit": "天"
    },
    {
      "id": "period",
      "label": "经期长度",
      "type": "number",
      "default": 5,
      "unit": "天"
    }
  ],
  "primary": "复制日历",
  "hintOut": "排卵日约为下次月经前 14 天，易孕窗口取排卵日前 5 天到后 1 天。这是日历法估算，不用于避孕判断。",
  "compute": (v) => {
    const s = L.parseDate(v.start); if (isNaN(s)) return { error: '日期填成 YYYY-MM-DD' };
    const ov = L.addDays(s, v.cycle - 14), winA = L.addDays(ov, -5), winB = L.addDays(ov, 1), next = L.addDays(s, v.cycle);
    let cal = '';
    for (let k = 0; k < 3; k++) {
      const a = L.addDays(s, k * v.cycle), o = L.addDays(a, v.cycle - 14);
      cal += `<tr><td>第 ${k + 1} 周期</td><td>${L.fmtDate(a)}</td><td>${L.fmtDate(L.addDays(a, v.period - 1))}</td><td>${L.fmtDate(o)}</td><td>${L.fmtDate(L.addDays(o, -5))} ~ ${L.fmtDate(L.addDays(o, 1))}</td></tr>`;
    }
    const text = [`上次月经：${L.fmtDate(s)}，周期 ${v.cycle} 天`, `预计排卵日：${L.fmtDate(ov)}（周${L.weekdayCN(ov)}）`, `易孕窗口：${L.fmtDate(winA)} ~ ${L.fmtDate(winB)}`, `下次月经预计：${L.fmtDate(next)}`, '', '未来三个周期：', ...[0, 1, 2].map((k) => { const a = L.addDays(s, k * v.cycle), o = L.addDays(a, v.cycle - 14); return `${L.fmtDate(a)} 月经 → ${L.fmtDate(o)} 排卵`; })].join('\n');
    return { text, copy: text, stats: [{ label: '排卵日', value: L.fmtDate(ov) }, { label: '距今天', value: L.diffDays(new Date(), ov) + ' 天' }, { label: '下次经期', value: L.fmtDate(next) }],
      preview: `<p class="t-hint">三个月周期表</p><table class="t-table"><thead><tr><th>周期</th><th>月经首日</th><th>经期结束</th><th>排卵日</th><th>易孕窗口</th></tr></thead><tbody>${cal}</tbody></table>` };
  }
});
