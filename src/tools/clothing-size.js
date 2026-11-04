/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "身材数据",
  "titleOut": "号型对照",
  "fields": [
    {
      "id": "h",
      "label": "身高",
      "unit": "cm",
      "type": "number",
      "default": 170
    },
    {
      "id": "b",
      "label": "胸围",
      "unit": "cm",
      "type": "number",
      "default": 92
    },
    {
      "id": "w",
      "label": "腰围",
      "unit": "cm",
      "type": "number",
      "default": 78
    },
    {
      "id": "sex",
      "label": "性别版型",
      "type": "select",
      "options": [
        "男",
        "女"
      ]
    },
    {
      "id": "kind",
      "label": "品类",
      "type": "select",
      "options": [
        "上装",
        "裤装"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "国标号型写法是「身高/胸围(腰围) + 体型代号」；Y 偏瘦、A 标准、B 微胖、C 偏胖。实际以品牌尺码表为准。",
  "compute": (v) => {
    const h = Number(v.h), b = Number(v.b), w = Number(v.w);
    if (!h || !b || !w) return { error: '三项都要填' };
    const diff = v.kind === '上装' ? b - w : 0;
    const type = v.sex === '男' ? (diff > 16 ? 'Y' : diff > 11 ? 'A' : diff > 6 ? 'B' : 'C') : (diff > 19 ? 'Y' : diff > 14 ? 'A' : diff > 9 ? 'B' : 'C');
    const gb = `${Math.round(h / 5) * 5}/${v.kind === '上装' ? Math.round(b / 4) * 4 : Math.round(w / 4) * 4}${type}`;
    const intl = b < 88 ? 'S' : b < 96 ? 'M' : b < 104 ? 'L' : b < 112 ? 'XL' : 'XXL';
    const rows = [['国标号型', gb], ['国际码', intl], ['体型代号', type + '（' + ({ Y: '偏瘦', A: '标准', B: '微胖', C: '偏胖' })[type] + '）'], ['身高段', `${Math.round(h / 5) * 5} cm`], [v.kind === '上装' ? '胸围档' : '腰围档', `${v.kind === '上装' ? Math.round(b / 4) * 4 : Math.round(w / 4) * 4} cm`]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '国标', value: gb }, { label: '国际', value: intl }] };
  }
});
