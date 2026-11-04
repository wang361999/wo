/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "宠物信息",
  "titleOut": "换算人类岁数",
  "fields": [
    {
      "id": "pet",
      "label": "猫还是狗",
      "type": "select",
      "options": [
        "猫",
        "小型犬",
        "中型犬",
        "大型犬"
      ]
    },
    {
      "id": "years",
      "label": "实际年龄",
      "type": "number",
      "default": 3,
      "unit": "岁"
    }
  ],
  "primary": "复制结果",
  "hintOut": "狗常用「第 1 年≈15、第 2 年≈+9，之后每年按体型 4–8 岁」的简化曲线；猫前两年折算更快。不同品种差异大，只作体感参考。",
  "compute": (v) => {
    const F = (n, d = 1) => L.fmt(L.round(n, d), d);
    const y = Math.max(0, v.years);
    let human;
    if (v.pet === '猫') human = y <= 1 ? 15 : y <= 2 ? 24 : 24 + (y - 2) * 4;
    else { const k = v.pet === '小型犬' ? 4 : v.pet === '中型犬' ? 5.5 : 7; human = y <= 1 ? 15 : y <= 2 ? 24 : 24 + (y - 2) * k; }
    const stage = human < 18 ? '幼年/少年' : human < 45 ? '青壮年' : human < 65 ? '中年' : '老年';
    const tips = human >= 65 ? ['建议每半年体检一次', '关注关节、牙齿与肾功能', '换易消化、控磷的老年粮'] : human < 18 ? ['按时完成疫苗与驱虫', '社会化训练窗口期', '注意别过量补钙'] : ['保持规律运动与体重', '每年一次体检与口腔检查', '控制零食占比'];
    const text = [`${L.esc(v.pet)} ${F(y)} 岁 ≈ 人类 ${F(human)} 岁`, `生命阶段：${stage}`, '', '护理提示：', ...tips.map((x) => '　· ' + x), '', '换算口径：第 1 年≈15 岁、第 2 年≈24 岁，之后狗按体型每年 +4~7 岁、猫每年 +4 岁'].join('\n');
    const rows = [1, 2, 3, 5, 8, 10, 12, 15].map((a) => { let h; if (v.pet === '猫') h = a <= 1 ? 15 : a <= 2 ? 24 : 24 + (a - 2) * 4; else { const k = v.pet === '小型犬' ? 4 : v.pet === '中型犬' ? 5.5 : 7; h = a <= 1 ? 15 : a <= 2 ? 24 : 24 + (a - 2) * k; } return `<tr><td>${a}</td><td>${F(h)}</td></tr>`; }).join('');
    return { text, copy: text, stats: [{ label: '人类岁数', value: F(human) + ' 岁' }, { label: '阶段', value: stage }],
      preview: `<p class="t-hint">常见年龄对照（岁）</p><table class="t-table"><thead><tr><th>实际</th><th>≈人类</th></tr></thead><tbody>${rows}</tbody></table>` };
  }
});
