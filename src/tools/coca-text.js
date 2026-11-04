/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "英文文章",
  "titleOut": "难度分析",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "粘贴英文",
      "type": "textarea",
      "rows": 10,
      "default": "The quick brown fox jumps over the lazy dog. A good tool should be simple and useful."
    },
    {
      "id": "band",
      "label": "对标档位",
      "type": "select",
      "options": [
        "高考",
        "四六级",
        "雅思托福",
        "母语者"
      ]
    }
  ],
  "primary": "复制报告",
  "hintOut": "按内置高频词表估算覆盖率，超纲词会在原文里标出来；不是官方 COCA 覆盖率。",
  "compute": (v) => {
    const words = (String(v.txt || '').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []);
    const set = new Set(L.D.coca.map((x) => x.toLowerCase()));
    const cutoff = { '高考': 1200, '四六级': 2000, '雅思托福': 3000, '母语者': 99999 }[v.band] || 1200;
    const core = new Set(L.D.coca.slice(0, cutoff).map((x) => x.toLowerCase()));
    const uniqW = [...new Set(words)];
    const covered = uniqW.filter((w) => core.has(w)).length;
    const outOfBand = uniqW.filter((w) => !core.has(w) && set.has(w));
    const unknown = uniqW.filter((w) => !set.has(w));
    const rate = uniqW.length ? covered / uniqW.length * 100 : 0;
    const level = rate > 92 ? '偏易' : rate > 80 ? '适中' : rate > 65 ? '偏难' : '很难';
    const hi = (t) => t.replace(/[a-z]+(?:'[a-z]+)?/gi, (m) => {
      const w = m.toLowerCase();
      return core.has(w) ? L.esc(m) : `<mark style="background:#f6e2b8;padding:0 2px;border-radius:3px" title="${set.has(w) ? '超出对标档位' : '内置词表未收录'}">${L.esc(m)}</mark>`;
    });
    return {
      html: `<div style="line-height:2;font-size:13.5px">${hi(String(v.txt || ''))}</div>`,
      copy: `总词数 ${words.length} / 去重 ${uniqW.length}\n对标「${v.band}」覆盖率 ${rate.toFixed(1)}%（${level}）\n超纲词：${outOfBand.join(', ') || '无'}\n未收录：${unknown.join(', ') || '无'}`,
      stats: [{ label: '总词数', value: words.length }, { label: '去重词', value: uniqW.length }, { label: '覆盖率', value: rate.toFixed(1) + '%' }, { label: '难度', value: level }],
    };
  }
});
