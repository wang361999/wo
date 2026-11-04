/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "胎压",
  "titleOut": "换算与修正",
  "fields": [
    {
      "id": "v",
      "label": "数值",
      "type": "number",
      "default": 2.3
    },
    {
      "id": "u",
      "label": "单位",
      "type": "select",
      "options": [
        "bar",
        "psi",
        "kPa",
        "kg/cm²（公斤）"
      ]
    },
    {
      "id": "temp",
      "label": "测量时气温",
      "type": "number",
      "default": 20,
      "unit": "℃"
    },
    {
      "id": "cold",
      "label": "状态",
      "type": "select",
      "options": [
        "冷胎（停车 3h 以上）",
        "热胎（刚跑过）"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "1 bar = 100 kPa ≈ 14.5 psi ≈ 1.02 kg/cm²。气温每变 10℃，胎压约变 0.07 bar；热胎读数通常比冷胎高 0.2–0.3 bar。厂商标的是冷胎值。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const toBar = { 'bar': 1, 'psi': 0.0689476, 'kPa': 0.01, 'kg/cm²（公斤）': 0.980665 };
    const bar = v.v * toBar[v.u];
    const corr = (20 - v.temp) * 0.007, hot = v.cold.startsWith('热') ? -0.25 : 0;
    const coldEq = bar + corr + hot;
    const text = [`${F(v.v)} ${L.esc(v.u)} =`, `　${F(bar)} bar`, `　${F(bar * 14.5038)} psi`, `　${F(bar * 100)} kPa`, `　${F(bar * 1.01972)} kg/cm²`, `折算到 20℃ 冷胎参考值：${F(coldEq)} bar${hot ? '（已扣热胎虚高 0.25 bar）' : ''}`, `常见家用车冷胎建议 2.2–2.5 bar，具体看车门 B 柱标签`].join('\n');
    return { text, copy: text, stats: [{ label: 'bar', value: F(bar) }, { label: 'psi', value: F(bar * 14.5038) }, { label: 'kPa', value: F(bar * 100) }],
      preview: `<p class="t-hint">季节掉压：秋冬降温 10℃ 大约掉 0.07 bar，入冬补一次气很正常。报警先查慢撒气，别只补气了事。</p>` };
  }
});
