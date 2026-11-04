/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "推算依据",
  "titleOut": "孕期时间表",
  "fields": [
    {
      "id": "way",
      "label": "按什么推",
      "type": "select",
      "options": [
        "末次月经首日",
        "受孕日",
        "B 超孕周"
      ]
    },
    {
      "id": "date",
      "label": "日期",
      "type": "text",
      "default": "2026-03-01",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "week",
      "label": "B 超显示孕周（该模式填）",
      "type": "number",
      "default": 12,
      "unit": "周"
    },
    {
      "id": "cycle",
      "label": "月经周期",
      "type": "number",
      "default": 28,
      "unit": "天"
    }
  ],
  "primary": "复制时间表",
  "hintOut": "Naegele 法则：末次月经首日 + 280 天（周期不是 28 天时按差值微调）。B 超模式按已孕周反推。仅为估算，产检以医生核定为准。",
  "compute": (v) => {
    const d = L.parseDate(v.date); if (isNaN(d)) return { error: '日期填成 YYYY-MM-DD' };
    let due;
    if (v.way === '受孕日') due = L.addDays(d, 266);
    else if (v.way.startsWith('B 超')) due = L.addDays(d, Math.round((40 - v.week) * 7));
    else due = L.addDays(d, 280 + (v.cycle - 28));
    const today = new Date();
    const passed = L.diffDays(L.addDays(due, -280), today), w = Math.floor(passed / 7), dd = ((passed % 7) + 7) % 7;
    const pct = L.clamp(passed / 280 * 100, 0, 100);
    const marks = [['NT 检查', 11], ['唐筛/无创', 16], ['大排畸', 22], ['糖耐', 24], ['胎心监护', 32], ['足月', 37]].map(([n, wk]) => `${n}：约孕 ${wk} 周（${L.fmtDate(L.addDays(L.addDays(due, -280), wk * 7))}）`);
    const text = [`推算依据：${L.esc(v.way)} ${L.fmtDate(d)}`, `预产期：${L.fmtDate(due)}（周${L.weekdayCN(due)}）`, passed >= 0 && passed <= 280 ? `今天约孕 ${w} 周 ${dd} 天，孕期进度 ${L.fmt(pct, 1)}%` : '今天不在推算的孕期内，改一下日期', '', '产检里程碑（按预产期反推）：', ...marks, '', '40 周只是平均值，37–42 周分娩都属于正常范围'].join('\n');
    return { text, copy: text, stats: [{ label: '预产期', value: L.fmtDate(due) }, { label: '当前孕周', value: w + ' 周' }, { label: '进度', value: L.fmt(pct, 1) + '%' }] };
  }
});
