/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "持仓市值",
  "titleOut": "可申购额度",
  "fields": [
    {
      "id": "sh",
      "label": "沪市日均市值",
      "type": "number",
      "default": 50000,
      "unit": "元"
    },
    {
      "id": "sz",
      "label": "深市日均市值",
      "type": "number",
      "default": 30000,
      "unit": "元"
    },
    {
      "id": "board",
      "label": "板块",
      "type": "select",
      "options": [
        "沪市主板",
        "科创板",
        "深市主板/创业板",
        "北交所"
      ]
    },
    {
      "id": "price",
      "label": "发行价",
      "type": "number",
      "default": 15,
      "unit": "元/股"
    }
  ],
  "primary": "复制额度",
  "hintOut": "离线精简规则：沪市 1 万元市值 = 1000 股，深市 1 万元 = 1000 股（500 股起），科创板 1 万元 = 1000 股，北交所按比例配售不占市值。市值按 T-2 日前 20 个交易日日均算，实际以券商 App 显示为准。",
  "compute": (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let mkt = v.sh, unit = 10000, per = 1000, min = 1000, name = '沪市主板';
    if (v.board === '科创板') { mkt = v.sh; per = 1000; min = 500; name = '科创板'; }
    else if (v.board.startsWith('深市')) { mkt = v.sz; per = 1000; min = 500; name = '深市主板/创业板'; }
    else if (v.board === '北交所') { mkt = 0; name = '北交所（现金申购、比例配售，不占市值）'; }
    const quota = mkt > 0 ? Math.floor(mkt / unit) * per : 0;
    const nums = quota > 0 ? Math.floor(quota / 500) : 0;
    const text = [`${L.esc(name)}，按 ${F(mkt)} 元市值`, mkt === 0 ? '北交所为全额缴款、比例配售，没有市值额度' : `可申购额度：${F(quota, 0)} 股`, `配号数：约 ${nums} 个（沪市 1000 股/号，深市 500 股/号）`, `顶格申购需缴款：${F(quota * v.price)} 元`, `顶格所需市值：${mkt > 0 ? F(Math.ceil(10000 / per * unit), 0) : '—'}`].join('\n');
    return { text, copy: text, stats: [{ label: '可申购', value: (mkt > 0 ? F(quota, 0) : '—') + ' 股' }, { label: '顶格缴款', value: F(quota * v.price) + ' 元' }, { label: '配号', value: nums + ' 个' }],
      preview: `<p class="t-hint">市值是「日均」不是「某一天」，且沪深不互通。规则会调整，申购前以券商与交易所公告为准。</p>` };
  }
});
