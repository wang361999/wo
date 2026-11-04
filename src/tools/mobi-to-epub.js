/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "MOBI / AZW3",
  "titleOut": "提取结果",
  "accept": ".mobi,.azw,.azw3,.prc",
  "multiple": true,
  "primary": "转换",
  "auto": false,
  "dropTitle": "拖 Kindle 电子书进来",
  "fields": [
    {
      "id": "title",
      "label": "书名（留空用文件名）",
      "type": "text",
      "default": ""
    }
  ],
  "note": "解析无 DRM 的 MOBI PalmDOC 文本（LZ77 + Huff 简易路径），按常见章节标题切章后生成 EPUB；带 DRM 或 KF8 复杂排版只能提取到纯文本。",
  "process": async (files, v, ctx) => {
    const outs = [], rows = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      let text = '';
      const palmHeader = 78;
      if (b.length > palmHeader + 10) {
        const recCount = dv.getUint16(76, false);
        const records = [];
        for (let i = 0; i < Math.min(recCount, 2000); i++) {
          const off = 78 + i * 8;
          if (off + 8 > b.length) break;
          records.push({ off: dv.getUint32(off, false), len: dv.getUint16(off + 4, false) });
        }
        const chunks = [];
        for (const r of records.slice(1)) {
          if (!r.off || r.off + r.len > b.length) continue;
          const seg = b.slice(r.off, r.off + r.len);
          let out = '';
          for (let i = 0; i < seg.length; i++) {
            const c = seg[i];
            if (c === 0) out += '\x00';
            else if (c <= 8) { const n = c; for (let j = 0; j < n && i + 1 < seg.length; j++) out += String.fromCharCode(seg[++i]); }
            else if (c < 0x80) out += String.fromCharCode(c);
            else if (c >= 0xc0) out += ' ' + String.fromCharCode(c & 0x7f);
            else { const dist = ((c << 8) | seg[++i]) & 0x3fff; const len = (dist >> 10) + 3; const start = out.length - (dist & 0x3ff) - 1; if (start >= 0) for (let j = 0; j < len; j++) out += out[start + j]; }
          }
          chunks.push(out);
        }
        text = chunks.join('').replace(/\x00/g, '').replace(/<[^>]{1,200}>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]{2,}/g, ' ');
      }
      if (text.length < 50) { rows.push([f.name, '未能提取（可能是 DRM / KF8）', 0]); continue; }
      const parts = text.split(/(?=第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇])/).filter((x) => x.trim()).slice(0, 300);
      const chapters = parts.map((p, i) => ({ title: (p.match(/^第[^\n]{0,30}[章节回卷篇][^\n]{0,30}/) || [`第 ${i + 1} 章`])[0], text: p.trim() }));
      const data = await makeEpub(epubBase(v.title || f.name.replace(/\.(mobi|azw3?|prc)$/i, ''), '佚名', chapters));
      outs.push({ name: f.name.replace(/\.(mobi|azw3?|prc)$/i, '') + '.epub', data, mime: 'application/epub+zip' });
      rows.push([f.name, '成功', text.length]);
    }
    return { text: rows.map((r) => r.join('\t')).join('\n') || '没有可提取的内容',
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部 EPUB.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '成功', value: outs.length }] };
  }
});
