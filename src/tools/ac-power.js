/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "输入",
  "titleOut": "匹数与制冷量",
  "fields": [
    {
      "id": "v",
      "label": "数值",
      "type": "number",
      "default": 1.5
    },
    {
      "id": "u",
      "label": "按什么填",
      "type": "select",
      "options": [
        "匹",
        "制冷量 W",
        "型号数字(如 35)",
        "房间面积 ㎡"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "1 匹（正匹）≈ 2500 W 制冷量；型号 KFR-35GW 里的 35 就是 3500 W = 1.5 匹。按面积选只是粗估，顶层/西晒/大玻璃要往上加。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let w;
    if (v.u === '匹') w = v.v * 2500;
    else if (v.u.startsWith('制冷量')) w = v.v;
    else if (v.u.startsWith('型号')) w = v.v * 100;
    else w = v.v * 150;
    const hp = w / 2500, model = Math.round(w / 100), area = w / 150;
    const text = [`制冷量约 ${F(w, 0)} W，约 ${F(hp, 1)} 匹`, `对应型号数字：KFR-${model}GW / KFR-${model}LW`, `按 150 W/㎡ 估算适用面积：${F(area)} ㎡`, `常见档位：23(小1匹) / 26(大1匹) / 35(1.5匹) / 50(2匹) / 72(3匹)`, `型号解读：K=空调 F=分体 R=热泵 35=3500W G=挂机 / L=柜机 W=室外机`].join('\n');
    return { text, copy: text, stats: [{ label: '制冷量', value: F(w, 0) + ' W' }, { label: '匹数', value: F(hp, 1) + ' 匹' }, { label: '适用面积', value: F(area) + ' ㎡' }],
      preview: `<p class="t-hint">按面积估算未计层高、朝向、隔热与人数；西晒或顶楼建议在结果上加 10–20%。</p>` };
  }
});
