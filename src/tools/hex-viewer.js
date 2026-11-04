/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "任意文件",
  "titleOut": "Hex 视图",
  "multiple": false,
  "primary": "读取",
  "auto": false,
  "dropTitle": "拖任意文件进来",
  "fields": [
    {
      "id": "off",
      "label": "起始偏移（字节）",
      "type": "number",
      "default": 0
    },
    {
      "id": "n",
      "label": "显示行数（每行 16 字节）",
      "type": "number",
      "default": 64
    }
  ],
  "note": "十六进制 + ASCII 三栏视图，自动识别 PNG / JPEG / GIF / PDF / ZIP / GZIP / ELF / SQLite 等魔数；点击 chunk 提示可跳到偏移。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选文件' };
    const b = new Uint8Array(await f.arrayBuffer());
    const magic = [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 'PNG'], [0xff, 0xd8, 0xff, 'JPEG'], [0x47, 0x49, 0x46, 'GIF'], [0x25, 0x50, 0x44, 0x46, 'PDF'], [0x50, 0x4b, 0x03, 0x04, 'ZIP / DOCX / XLSX / EPUB'], [0x1f, 0x8b, 'GZIP'], [0x7f, 0x45, 0x4c, 0x46, 'ELF'], [0x53, 0x51, 0x4c, 0x69, 'SQLite'], [0x00, 0x00, 0x01, 0x00, 'ICO']];
    const found = magic.find((m) => m.slice(0, -1).every((x, i) => b[i] === x))?.at(-1) || '未识别';
    const start = L.clamp(Number(v.off) || 0, 0, Math.max(0, b.length - 1));
    const n = L.clamp(Number(v.n) || 64, 1, 512);
    const rows = [];
    for (let r = 0; r < n && start + r * 16 < b.length; r++) {
      const o = start + r * 16, seg = b.slice(o, o + 16);
      rows.push(`<tr><td class="num">${o.toString(16).toUpperCase().padStart(8, '0')}</td><td style="font-family:ui-monospace,Menlo,monospace;white-space:pre">${L.bytesToHex(seg, ' ').padEnd(47)}</td><td style="font-family:ui-monospace,Menlo,monospace;white-space:pre">${Array.from(seg, (x) => x >= 32 && x < 127 ? L.esc(String.fromCharCode(x)) : '.').join('')}</td></tr>`);
    }
    return { html: `<p class="t-hint">魔数识别：<b>${L.esc(found)}</b>　大小 ${L.humanSize(b.length)}　显示 ${start}–${Math.min(b.length, start + n * 16)} 字节</p>
      <div style="max-height:420px;overflow:auto"><table class="t-table"><thead><tr><th>偏移</th><th>十六进制</th><th>ASCII</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`,
      copy: rows.join('').replace(/<[^>]+>/g, ' '),
      stats: [{ label: '类型', value: found }, { label: '大小', value: L.humanSize(b.length) }, { label: '行数', value: rows.length }] };
  }
});
