/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "选词频段",
  "titleOut": "单词表",
  "fields": [
    {
      "id": "band",
      "label": "难度段",
      "type": "select",
      "options": [
        "核心高频 1–500",
        "中学/高考 501–1200",
        "四六级/雅思 1201–2000",
        "进阶/学术 2001+",
        "全部"
      ]
    },
    {
      "id": "n",
      "label": "最多取多少个",
      "type": "number",
      "default": 100
    },
    {
      "id": "fmt",
      "label": "输出格式",
      "type": "select",
      "options": [
        "一行一个",
        "逗号分隔",
        "CSV（序号,单词,档位）"
      ]
    }
  ],
  "primary": "复制词表",
  "hintOut": "离线精简版词表，导出的是内置序号而非 COCA 官方排名，适合拿来做背诵清单。",
  "compute": (v) => {
    const bands = { '核心高频 1–500': [0, 500], '中学/高考 501–1200': [500, 1200], '四六级/雅思 1201–2000': [1200, 2000], '进阶/学术 2001+': [2000, 99999], '全部': [0, 99999] };
    const [a, b] = bands[v.band] || [0, 99999];
    const rows = L.D.coca.slice(a, b).slice(0, Math.max(1, Math.min(2000, Number(v.n) || 100))).map((w, i) => [a + i + 1, w, a + i < 500 ? '核心高频' : a + i < 1200 ? '中学/高考' : a + i < 2000 ? '四六级/雅思' : '进阶/学术']);
    const text = v.fmt === '逗号分隔' ? rows.map((r) => r[1]).join(', ') : v.fmt === 'CSV（序号,单词,档位）' ? L.toCSV([['序号', '单词', '档位'], ...rows]) : rows.map((r) => r[1]).join('\n');
    return { text, stats: [{ label: '词条', value: rows.length }, { label: '词表规模', value: L.D.coca.length }] };
  }
});
