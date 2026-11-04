/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "劳动关系",
  "titleOut": "补偿金测算",
  "fields": [
    {
      "id": "start",
      "label": "入职日期",
      "type": "text",
      "default": "2015-03-01",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "end",
      "label": "离职日期",
      "type": "text",
      "default": "2026-06-30",
      "placeholder": "YYYY-MM-DD"
    },
    {
      "id": "wage",
      "label": "离职前 12 个月平均月薪",
      "type": "number",
      "default": 20000,
      "unit": "元"
    },
    {
      "id": "avg",
      "label": "当地上年度职工月平均工资",
      "type": "number",
      "default": 12000,
      "unit": "元"
    },
    {
      "id": "way",
      "label": "解除情形",
      "type": "select",
      "options": [
        "协商/无过失解除 N",
        "未提前 30 天通知 N+1",
        "违法解除赔偿 2N",
        "仅看三种对比"
      ]
    }
  ],
  "primary": "复制测算",
  "hintOut": "N 按工作年限：每满 1 年给 1 个月工资，满 6 个月不满 1 年按 1 年，不满 6 个月按半个月。月工资高于当地社平 3 倍的按 3 倍封顶且年限最多 12 年。2008-01-01 前后分段是简化处理，个案以劳动法与当地口径为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const a = new Date(v.start), b = new Date(v.end);
    if (isNaN(a) || isNaN(b) || b <= a) return { error: '日期填成 YYYY-MM-DD，且离职要晚于入职' };
    const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);
    const yearsRaw = months / 12;
    let N = Math.floor(yearsRaw); const rem = yearsRaw - N;
    if (rem >= 0.5) N += 1; else if (rem > 0) N += 0.5;
    const cap = v.avg * 3, over = v.wage > cap;
    const base = over ? cap : v.wage, years = over ? Math.min(N, 12) : N;
    const n = base * years;
    const text = [`工作年限：${F(yearsRaw, 2)} 年 → 计 ${F(N, 1)} 个月工资`, over ? `月薪 ${F(v.wage)} 元超过社平 3 倍（${F(cap)} 元），按 ${F(cap)} 元封顶，年限封顶 12 年 → 实际 ${F(years, 1)} 个月` : `未触及社平 3 倍封顶`, `N（经济补偿）：${F(n)} 元`, `N+1（代通知金）：${F(n + v.wage)} 元`, `2N（违法解除赔偿）：${F(n * 2)} 元`, `2008 年前后分段：本工具按统一年限简化，涉及 2008 年前工龄的旧规封顶请咨询当地仲裁口径`].join('\n');
    const chosen = v.way.includes('2N') ? n * 2 : v.way.includes('N+1') ? n + v.wage : n;
    return { text, copy: text, stats: [{ label: 'N', value: F(n) + ' 元' }, { label: 'N+1', value: F(n + v.wage) + ' 元' }, { label: '2N', value: F(n * 2) + ' 元' }],
      preview: `<p class="t-hint">当前选「${L.esc(v.way)}」，对应 ${F(chosen)} 元。</p>` };
  }
});
