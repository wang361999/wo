/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "号码",
  "titleOut": "查询结果",
  "wide": true,
  "fields": [
    {
      "id": "txt",
      "label": "手机号（可多行批量）",
      "type": "textarea",
      "rows": 4,
      "default": "13800138000"
    }
  ],
  "primary": "复制结果",
  "hintOut": "离线精简库：能按前 3 位判断运营商、校验号段格式、给出区号对照。精确到省市需要完整号段库，静态站不内置，也不联网查（查了就会留下记录）。",
  "compute": (v) => {
    const ops = D.phoneOp || {};
    const region = Object.fromEntries((D.idRegion || []).map((x) => [x[0], x[1]]));
    const one = (raw) => {
      const s = String(raw).replace(/[\s-]/g, '');
      if (!/^1\d{10}$/.test(s)) return `${s}：不是 11 位手机号`;
      const p3 = s.slice(0, 3), p7 = s.slice(0, 7);
      const op = ops[p3.slice(0, 2)] || ops[p3] || '未知运营商（可能是虚拟运营商/新号段）';
      return `${s}：${op}｜号段 ${p7}****｜${L.esc(v.txt && p3 === '138' ? '138 为早期中国移动号段' : '前 3 位 ' + p3)}｜脱敏 ${s.slice(0, 3)}****${s.slice(7)}`;
    };
    const list = L.nonEmptyLines(v.txt); if (!list.length) return { error: '至少填一个号码' };
    const text = list.map(one).join('\n');
    return { text, copy: text, stats: [{ label: '条数', value: list.length + ' 条' }],
      preview: `<p class="t-hint">省市归属需要「号段→地区」完整库（几十万条），本地不含。这里给的是区号↔省级对照：${Object.entries(region).slice(0, 8).map(([k, x]) => k + ' ' + L.esc(x)).join('、')} …</p>` };
  }
});
