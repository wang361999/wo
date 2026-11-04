/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "食品标签",
  "titleOut": "热量换算",
  "fields": [
    {
      "id": "v",
      "label": "数值",
      "type": "number",
      "default": 2000
    },
    {
      "id": "u",
      "label": "单位",
      "type": "select",
      "options": [
        "kJ 千焦",
        "kcal 大卡"
      ]
    },
    {
      "id": "per",
      "label": "标签标注的是每",
      "type": "number",
      "default": 100,
      "unit": "克/毫升"
    },
    {
      "id": "eat",
      "label": "实际吃了",
      "type": "number",
      "default": 50,
      "unit": "克/毫升"
    },
    {
      "id": "kcalRef",
      "label": "每日参考摄入",
      "type": "number",
      "default": 2000,
      "unit": "kcal"
    }
  ],
  "primary": "复制结果",
  "hintOut": "1 kcal ≈ 4.184 kJ。NRV% 按 8400 kJ / 2000 kcal 的通用参考值算；运动消耗按 60kg 成年人粗略估算。",
  "compute": (v) => {
    const F = (n, d = 1) => L.fmt(L.round(n, d), d);
    const kcal = v.u.startsWith('kJ') ? v.v / 4.184 : v.v, kj = kcal * 4.184;
    const per = v.per > 0 ? v.eat / v.per : 0, eatKcal = kcal * per, eatKj = kj * per;
    const nrv = eatKcal / Math.max(1, v.kcalRef) * 100;
    const mins = { '散步': 3.5, '快走': 5, '慢跑': 9, '骑车': 7, '游泳': 10 };
    const text = [`${F(v.v)} ${L.esc(v.u)} = ${F(kj)} kJ = ${F(kcal)} kcal`, `标签每 ${F(v.per)} g，实际吃 ${F(v.eat)} g（${F(per * 100)} 份）`, `这一份实际摄入：${F(eatKj)} kJ / ${F(eatKcal)} kcal`, `占每日参考（${F(v.kcalRef)} kcal）的 NRV ${F(nrv)}%`, '', '大概要动多久才能消耗掉（60kg 成年人粗估）：', ...Object.entries(mins).map(([k, x]) => `　${k}约 ${F(eatKcal / x)} 分钟`)].join('\n');
    return { text, copy: text, stats: [{ label: '这一份', value: F(eatKcal) + ' kcal' }, { label: 'NRV', value: F(nrv) + '%' }, { label: '慢跑', value: F(eatKcal / 9) + ' 分钟' }] };
  }
});
