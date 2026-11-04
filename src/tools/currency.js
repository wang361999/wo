/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "金额与币种",
  "titleOut": "换算结果",
  "fields": [
    {
      "id": "amount",
      "label": "金额",
      "type": "number",
      "default": 100
    },
    {
      "id": "from",
      "label": "从",
      "type": "select",
      "options": [
        "CNY 人民币",
        "USD 美元",
        "EUR 欧元",
        "JPY 日元",
        "HKD 港币",
        "GBP 英镑",
        "KRW 韩元",
        "THB 泰铢",
        "SGD 新元",
        "AUD 澳元"
      ]
    },
    {
      "id": "to",
      "label": "到",
      "type": "select",
      "options": [
        "CNY 人民币",
        "USD 美元",
        "EUR 欧元",
        "JPY 日元",
        "HKD 港币",
        "GBP 英镑",
        "KRW 韩元",
        "THB 泰铢",
        "SGD 新元",
        "AUD 澳元"
      ]
    }
  ],
  "primary": "复制换算",
  "hintOut": "离线参考汇率（内置精简表，约 2024 年量级），不是实时牌价，不能用于实际换汇。纯静态站不联网取数，也不记录你查了什么。",
  "compute": (v) => {
    const F = (n, d = 4) => L.fmt(L.round(n, d), d);
    const R = { CNY: 1, USD: 7.25, EUR: 7.85, JPY: 0.048, HKD: 0.93, GBP: 9.2, KRW: 0.0053, THB: 0.21, SGD: 5.4, AUD: 4.75 };
    const f = String(v.from).split(' ')[0], t = String(v.to).split(' ')[0];
    const cny = v.amount * (R[f] || 1), out = cny / (R[t] || 1);
    const text = [`${F(v.amount, 2)} ${f} → ${F(out)} ${t}`, `参考中间价：1 ${f} = ${F(R[f] / (R[t] || 1), 6)} ${t}`, `折合人民币 ${F(cny, 2)} 元`, '这是内置离线参考值，实际以银行/换汇平台牌价为准'].join('\n');
    const rows = Object.entries(R).map(([k, x]) => `<tr><td>${k}</td><td>${F(x, 6)}</td><td>${F(cny / x, 2)}</td></tr>`).join('');
    return { text, copy: text, stats: [{ label: '换算结果', value: F(out) + ' ' + t }, { label: '折人民币', value: F(cny, 2) + ' 元' }],
      preview: `<p class="t-hint">1 单位外币 ≈ 人民币；第三列是把当前金额换成该币种</p><table class="t-table"><thead><tr><th>币种</th><th>≈ CNY</th><th>可换</th></tr></thead><tbody>${rows}</tbody></table>` };
  }
});
