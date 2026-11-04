/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "查单词",
  "titleOut": "词频与难度",
  "fields": [
    {
      "id": "w",
      "label": "英文单词",
      "type": "text",
      "default": "important",
      "placeholder": "一次查一个，或用空格分隔多个"
    }
  ],
  "primary": "复制结果",
  "sample": {
    "w": "important"
  },
  "hintOut": "离线精简版：内置约 1600 个按常用度排序的词，未收录的词会标注「超出内置词表」。真实 COCA 排名需完整语料库。",
  "compute": (v) => {
    const ws = String(v.w || '').toLowerCase().split(/[\s,;]+/).filter(Boolean).slice(0, 30);
    if (!ws.length) return { text: '输入一个英文单词。' };
    const list = L.D.coca.map((x) => x.toLowerCase());
    const rows = ws.map((w) => { const i = list.indexOf(w); return [w, i < 0 ? '—' : i + 1, i < 0 ? '超出内置词表' : i < 500 ? '核心高频' : i < 1200 ? '中学/高考' : i < 2000 ? '四六级/雅思' : '进阶/学术']; });
    const html = `<table class="t-table"><thead><tr><th>单词</th><th>内置序号</th><th>难度档</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td>${L.esc(r[2])}</td></tr>`).join('')}</tbody></table>`;
    return { html, copy: rows.map((r) => r.join('\t')).join('\n'), stats: [{ label: '已查', value: rows.length }, { label: '词表规模', value: L.D.coca.length }] };
  }
});
