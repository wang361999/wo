/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "搜诗词",
  "titleOut": "匹配结果",
  "wide": false,
  "fields": [
    {
      "id": "q",
      "label": "关键词",
      "type": "text",
      "default": "明月",
      "placeholder": "诗题 / 作者 / 诗句都行"
    },
    {
      "id": "mode",
      "label": "范围",
      "type": "select",
      "options": [
        "全部",
        "唐诗",
        "宋词",
        "先秦/其它"
      ]
    }
  ],
  "primary": "复制结果",
  "sample": {
    "q": "明月",
    "mode": "全部"
  },
  "hintOut": "离线精选版：内置 90 余首常见篇目，按诗题、作者、诗句检索，不联网。完整 34 万首需要外部语料库。",
  "compute": (v) => {
    const k = String(v.q || '').trim();
    const rows = L.D.poetry.filter((r) => {
      if (k && !r.join(' ').includes(k)) return false;
      if (v.mode === '唐诗' && r[2] !== '唐') return false;
      if (v.mode === '宋词' && r[2] !== '宋') return false;
      if (v.mode === '先秦/其它' && ['唐', '宋'].includes(r[2])) return false;
      return true;
    });
    if (!rows.length) return { text: '没有匹配的篇目，换个词试试。', stats: [{ label: '命中', value: 0 }] };
    const html = rows.slice(0, 40).map((r) => `<div style="padding:11px 0;border-bottom:1px solid var(--line-2)">
      <b>${L.esc(r[0])}</b> <span style="color:var(--ink-3);font-size:12px">${L.esc(r[2])}·${L.esc(r[1])}</span>
      <p style="margin:6px 0 0;line-height:1.9;color:var(--ink-2)">${L.esc(r[3])}</p></div>`).join('');
    return { html, copy: rows.slice(0, 40).map((r) => `${r[0]}｜${r[2]}·${r[1]}\n${r[3]}`).join('\n\n'), stats: [{ label: '命中篇目', value: rows.length }, { label: '内置总数', value: L.D.poetry.length }] };
  }
});
