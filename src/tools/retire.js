/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "个人信息",
  "titleOut": "退休时间推算",
  "fields": [
    {
      "id": "birth",
      "label": "出生年月",
      "type": "text",
      "default": "1985-06",
      "placeholder": "YYYY-MM"
    },
    {
      "id": "kind",
      "label": "身份口径",
      "type": "select",
      "options": [
        "男职工",
        "女职工（原 55 岁）",
        "女工人（原 50 岁）"
      ]
    },
    {
      "id": "start",
      "label": "参加工作年月",
      "type": "text",
      "default": "2008-07",
      "placeholder": "YYYY-MM"
    },
    {
      "id": "paid",
      "label": "已缴费年限",
      "type": "number",
      "default": 17,
      "unit": "年"
    }
  ],
  "primary": "复制推算",
  "hintOut": "按 2024-09《关于实施渐进式延迟法定退休年龄的决定》口径做简化推算：男 60→63、女 55→58 每 4 个月延 1 个月，女 50→55 每 2 个月延 1 个月；最低缴费年限 2030 年起由 15 年逐步提到 20 年。实际以社保经办机构核定为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const m = String(v.birth || '').match(/(\d{4})-(\d{1,2})/);
    if (!m) return { error: '出生年月填成 YYYY-MM，比如 1985-06' };
    const by = Number(m[1]), bm = Number(m[2]);
    const male = v.kind === '男职工', w55 = v.kind.includes('55'), base = male ? 60 : w55 ? 55 : 50;
    const startY = male ? 1965 : w55 ? 1970 : 1975, step = (male || w55) ? 4 : 2, cap = male ? 36 : w55 ? 36 : 60;
    const elapsed = (by - startY) * 12 + (bm - 1);
    const delay = L.clamp(Math.ceil(Math.max(0, elapsed) / step), 0, cap);
    const age = base + delay / 12;
    const retireY = by + Math.floor(age), retireM = bm + Math.round((age - Math.floor(age)) * 12);
    const ry = retireY + (retireM > 12 ? 1 : 0), rm = retireM > 12 ? retireM - 12 : retireM;
    const minYears = ry < 2030 ? 15 : L.clamp(15 + (ry - 2029) * 0.5, 15, 20);
    const sm = String(v.start || '').match(/(\d{4})-(\d{1,2})/);
    const workedTotal = sm ? (ry - Number(sm[1])) + (rm - Number(sm[2])) / 12 : v.paid;
    const need = Math.max(0, minYears - workedTotal);
    const text = [`出生 ${by}-${L.pad(bm)}，身份：${L.esc(v.kind)}`, `原法定退休年龄 ${base} 岁，按新规延迟 ${delay} 个月`, `推算退休年龄：${F(age, 1)} 岁（约 ${ry}-${L.pad(rm)}）`, `届时最低缴费年限：${F(minYears, 1)} 年`, need > 0 ? `按当前参保节奏还差约 ${F(need, 1)} 年，需延长缴费或补缴` : '按当前节奏缴费年限已够', '弹性提前/延后最多 3 年，但不得低于原法定年龄，也不得低于当年最低缴费年限'].join('\n');
    return { text, copy: text, stats: [{ label: '退休年龄', value: F(age, 1) + ' 岁' }, { label: '延迟', value: delay + ' 个月' }, { label: '最低缴费', value: F(minYears, 1) + ' 年' }] };
  }
});
