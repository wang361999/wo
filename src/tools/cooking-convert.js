/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "量具与食材",
  "titleOut": "克 / 毫升",
  "fields": [
    {
      "id": "v",
      "label": "数量",
      "type": "number",
      "default": 1
    },
    {
      "id": "tool",
      "label": "量具",
      "type": "select",
      "options": [
        "杯 cup (美 240ml)",
        "汤匙 tbsp (15ml)",
        "茶匙 tsp (5ml)",
        "日式量杯 (200ml)",
        "毫升 ml",
        "克 g"
      ]
    },
    {
      "id": "food",
      "label": "食材密度",
      "type": "select",
      "options": [
        "水",
        "牛奶",
        "食用油",
        "蜂蜜",
        "白砂糖(细)",
        "面粉(中筋)",
        "米粉",
        "玉米淀粉",
        "可可粉",
        "盐(细)",
        "黄油",
        "糖粉",
        "燕麦片",
        "大米(生)",
        "酱油",
        "醋",
        "番茄酱",
        "花生酱",
        "酸奶"
      ]
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "量具 → 克",
        "克 → 量具"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "体积 × 密度(g/ml) = 重量。内置常见食材密度（离线精简值），不同品牌/压实程度会差不少，烘焙建议还是上秤。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const dens = Object.fromEntries((D.cooking || []).map((x) => [x[0], Number(x[1])]));
    const vol = { '杯 cup (美 240ml)': 240, '汤匙 tbsp (15ml)': 15, '茶匙 tsp (5ml)': 5, '日式量杯 (200ml)': 200, '毫升 ml': 1, '克 g': 1 };
    const ml = vol[v.tool] || 1, d = dens[v.food] || 1;
    const g = v.tool === '克 g' ? v.v : v.v * ml * d;
    const back = v.dir.startsWith('克') ? v.v / (ml * d) : g;
    const text = [`食材：${L.esc(v.food)}（密度约 ${F(d, 3)} g/ml）`, `量具：${L.esc(v.tool)}（1 单位 = ${F(ml)} ml）`, v.dir.startsWith('克') ? `${F(v.v)} 克 ≈ ${F(back)} 个${L.esc(v.tool.split(' ')[0])}` : `${F(v.v)} × ${L.esc(v.tool)} ≈ ${F(g)} 克 / ${F(v.v * ml)} 毫升`, `常见换算：1 杯面粉 ≈ 120 g，1 杯糖 ≈ 200 g，1 汤匙油 ≈ 14 g`].join('\n');
    const rows = Object.entries(dens).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${F(x, 3)}</td><td>${F(240 * x, 0)}</td></tr>`).join('');
    return { text, copy: text, stats: [{ label: '重量', value: F(g) + ' g' }, { label: '体积', value: F(v.v * ml) + ' ml' }, { label: '密度', value: F(d, 3) }],
      preview: `<p class="t-hint">内置食材密度（g/ml，第三列=1 美杯约多少克）</p><table class="t-table"><thead><tr><th>食材</th><th>密度</th><th>1 杯</th></tr></thead><tbody>${rows}</tbody></table>` };
  }
});
