/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "号码",
  "titleOut": "解析结果",
  "wide": true,
  "fields": [
    {
      "id": "txt",
      "label": "18 位身份证号（可多行批量）",
      "type": "textarea",
      "rows": 4,
      "default": "11010519491231002X"
    }
  ],
  "primary": "复制结果",
  "hintOut": "本地校验：结构、出生日期、性别、校验位（GB 11643-1999）、户籍地按前 6 位行政区划代码查内置精简表。不联网、不记录。",
  "compute": (v) => {
    const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2], C = '10X98765432';
    const region = Object.fromEntries((D.idRegion || []).map((x) => [x[0], x[1]]));
    const one = (s) => {
      s = s.trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(s)) return `${s}：格式不对（应为 18 位，末位可为 X）`;
      const y = Number(s.slice(6, 10)), m = Number(s.slice(10, 12)), d = Number(s.slice(12, 14));
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return `${s}：出生日期不合法`;
      let sum = 0; for (let i = 0; i < 17; i++) sum += Number(s[i]) * W[i];
      const ok = C[sum % 11] === s[17];
      const sex = Number(s[16]) % 2 ? '男' : '女';
      const prov = region[s.slice(0, 2)] || '未知';
      const age = L.ageDetail(dt).years;
      return `${s}：${ok ? '✓ 校验位正确' : '✗ 校验位不符（应为 ' + C[sum % 11] + '）'}｜${y}-${L.pad(m)}-${L.pad(d)}｜${sex}｜${age} 岁｜户籍地 ${prov}（${s.slice(0, 6)}）｜脱敏 ${s.slice(0, 6)}********${s.slice(14)}`;
    };
    const list = L.nonEmptyLines(v.txt);
    if (!list.length) return { error: '至少填一个号码' };
    return { text: list.map(one).join('\n'), copy: list.map(one).join('\n'), stats: [{ label: '条数', value: list.length + ' 条' }],
      preview: `<p class="t-hint">行政区划代码为内置精简表，只精确到省级（前 2 位）；旧代码、撤并地区可能查不到。</p>` };
  }
});
