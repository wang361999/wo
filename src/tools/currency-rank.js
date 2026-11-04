/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "查看方式",
  "titleOut": "货币价值排行",
  "fields": [
    {
      "id": "way",
      "label": "榜单",
      "type": "select",
      "options": [
        "最值钱（1 单位折人民币最高）",
        "最不值钱（最低）",
        "全部对照"
      ]
    }
  ],
  "primary": "复制整表",
  "hintOut": "按「1 单位本币折多少人民币」排序的离线精简榜（约 2024 年量级）。币值高低不等于国力强弱，也不代表实时汇率。",
  "compute": (v) => {
    const F = (n, d = 4) => L.fmt(L.round(n, d), d);
    const list = [['KWD 科威特第纳尔', 23.6], ['BHD 巴林第纳尔', 19.2], ['OMR 阿曼里亚尔', 18.8], ['JOD 约旦第纳尔', 10.2], ['GBP 英镑', 9.2], ['GIP 直布罗陀镑', 9.2], ['CHF 瑞士法郎', 8.2], ['USD 美元', 7.25], ['EUR 欧元', 7.85], ['SGD 新元', 5.4], ['AUD 澳元', 4.75], ['CAD 加元', 5.3], ['CNY 人民币', 1], ['HKD 港币', 0.93], ['THB 泰铢', 0.21], ['JPY 日元', 0.048], ['KRW 韩元', 0.0053], ['VND 越南盾', 0.00029], ['IDR 印尼盾', 0.00046], ['IRR 伊朗里亚尔', 0.000017]];
    let arr = [...list].sort((a, b) => b[1] - a[1]);
    if (v.way.startsWith('最不值钱')) arr = arr.reverse();
    else if (v.way.startsWith('全部')) arr = [...list].sort((a, b) => b[1] - a[1]);
    const tbl = `<table class="t-table"><thead><tr><th>#</th><th>币种</th><th>1 单位 ≈ CNY</th></tr></thead><tbody>${arr.map((x, i) => `<tr><td>${i + 1}</td><td>${L.esc(x[0])}</td><td>${F(x[1], 6)}</td></tr>`).join('')}</tbody></table>`;
    const text = arr.map((x, i) => `${i + 1}. ${x[0]}　1 单位 ≈ ${F(x[1], 6)} 元`).join('\n');
    return { text, copy: text, stats: [{ label: '收录币种', value: list.length + ' 种' }, { label: '最强', value: 'KWD' }, { label: '最弱', value: 'IRR' }], preview: tbl };
  }
});
