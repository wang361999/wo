/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "墙面与壁纸",
  "titleOut": "卷数估算",
  "fields": [
    {
      "id": "len",
      "label": "房间长",
      "type": "number",
      "default": 5,
      "unit": "米"
    },
    {
      "id": "wid",
      "label": "房间宽",
      "type": "number",
      "default": 4,
      "unit": "米"
    },
    {
      "id": "height",
      "label": "铺贴高度",
      "type": "number",
      "default": 2.6,
      "unit": "米"
    },
    {
      "id": "hole",
      "label": "门窗扣减宽度",
      "type": "number",
      "default": 1.5,
      "unit": "米（按宽度扣）"
    },
    {
      "id": "rollW",
      "label": "卷宽",
      "type": "number",
      "default": 0.53,
      "unit": "米"
    },
    {
      "id": "rollL",
      "label": "卷长",
      "type": "number",
      "default": 10,
      "unit": "米"
    },
    {
      "id": "pattern",
      "label": "花型",
      "type": "select",
      "options": [
        "素色 / 竖条（不对花）",
        "平铺小花（对花 0.1m）",
        "大花（对花 0.3m）"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "按「周长 ÷ 卷宽 = 幅数」再乘每卷能裁几幅。对花越大越费，门窗按宽度减掉相应幅数（这里做简化）。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const peri = (v.len + v.wid) * 2 - v.hole;
    const panels = Math.ceil(peri / Math.max(0.01, v.rollW));
    const extra = v.pattern.startsWith('大花') ? 0.3 : v.pattern.startsWith('平铺') ? 0.1 : 0;
    const perPanel = v.height + extra + 0.1, perRoll = Math.floor(v.rollL / Math.max(0.01, perPanel));
    const rolls = Math.ceil(panels / Math.max(1, perRoll));
    const text = [`有效周长：${F(peri)} m（已扣门窗 ${F(v.hole)} m）`, `每幅宽 ${v.rollW} m → 需 ${panels} 幅`, `每幅需 ${F(perPanel)} m（含 ${F(extra)} m 对花 + 0.1 m 裁边）`, `每卷 ${v.rollL} m 可裁 ${perRoll} 幅`, `建议采购 ${rolls} 卷`, '提示：同批次号要一次买齐，不同批次会有色差；多买 1 卷备补'].join('\n');
    return { text, copy: text, stats: [{ label: '需幅数', value: panels + ' 幅' }, { label: '每卷可裁', value: perRoll + ' 幅' }, { label: '卷数', value: rolls + ' 卷' }] };
  }
});
