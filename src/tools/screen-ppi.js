/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "屏幕参数",
  "titleOut": "尺寸与清晰度",
  "fields": [
    {
      "id": "inch",
      "label": "对角线",
      "type": "number",
      "default": 27,
      "unit": "英寸"
    },
    {
      "id": "w",
      "label": "水平分辨率",
      "type": "number",
      "default": 3840,
      "unit": "px"
    },
    {
      "id": "h",
      "label": "垂直分辨率",
      "type": "number",
      "default": 2160,
      "unit": "px"
    },
    {
      "id": "scale",
      "label": "系统缩放",
      "type": "select",
      "options": [
        "100%",
        "125%",
        "150%",
        "200%"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "PPI = √(宽²+高²) ÷ 对角线英寸。点距是相邻像素的物理间距，缩放建议按常见操作系统档位给。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const diag = Math.sqrt(v.w * v.w + v.h * v.h), ppi = diag / Math.max(0.1, v.inch);
    const ratio = v.w / Math.max(1, v.h), wcm = v.inch * 2.54 * ratio / Math.sqrt(1 + ratio * ratio), hcm = wcm / ratio;
    const pitch = 25.4 / ppi, sc = Number(String(v.scale).replace('%', '')) / 100;
    const rec = ppi > 200 ? '150%–200%' : ppi > 140 ? '125%–150%' : '100%';
    const text = [`${v.w} × ${v.h}，${v.inch} 英寸，比例 ${F(ratio, 3)}:1`, `PPI：${F(ppi)}（每英寸像素）`, `点距：${F(pitch, 3)} mm`, `实际宽 ${F(wcm)} cm × 高 ${F(hcm)} cm`, `逻辑分辨率（${L.esc(v.scale)} 缩放）：${F(v.w / sc, 0)} × ${F(v.h / sc, 0)}`, `按 PPI 建议缩放：${rec}`, `观看距离 60cm 时，超过约 ${F(60 * 0.01745 * 2 * 3438 / 60, 0)} PPI 肉眼难分辨单个像素（视网膜阈值粗估）`].join('\n');
    return { text, copy: text, stats: [{ label: 'PPI', value: F(ppi) }, { label: '点距', value: F(pitch, 3) + ' mm' }, { label: '宽度', value: F(wcm) + ' cm' }] };
  }
});
