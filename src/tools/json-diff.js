/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "两份 JSON",
  "titleOut": "语义差异",
  "wide": false,
  "fields": [
    {
      "id": "a",
      "label": "JSON A",
      "type": "textarea",
      "rows": 6,
      "default": "{\"a\":1,\"b\":{\"c\":2}}"
    },
    {
      "id": "b",
      "label": "JSON B",
      "type": "textarea",
      "rows": 6,
      "default": "{\"a\":1,\"b\":{\"c\":3},\"d\":4}"
    }
  ],
  "primary": "复制差异",
  "hintOut": "按路径比较，忽略对象里 key 的书写顺序；数组按下标比。",
  "compute": (v) => {
    let a, b; try { a = JSON.parse(v.a); b = JSON.parse(v.b); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const d = L.diffJSON(a, b);
    if (!d.length) return { text: '两份 JSON 语义上完全一致。', stats: [{ label: '差异', value: 0 }] };
    const show = (x) => x === undefined ? '（不存在）' : JSON.stringify(x);
    return { html: `<table class="t-table"><thead><tr><th>路径</th><th>A</th><th>B</th></tr></thead><tbody>${d.slice(0, 200).map((r) => `<tr><td class="num">${L.esc(r[0])}</td><td>${L.esc(show(r[1]))}</td><td>${L.esc(show(r[2]))}</td></tr>`).join('')}</tbody></table>`,
      copy: d.map((r) => `${r[0]}\tA=${show(r[1])}\tB=${show(r[2])}`).join('\n'), stats: [{ label: '差异点', value: d.length }] };
  }
});
