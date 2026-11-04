/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "JPG / PNG",
  "titleOut": "清理结果",
  "accept": "image/jpeg,image/png,.jpg,.jpeg,.png",
  "multiple": true,
  "primary": "清理下载",
  "auto": false,
  "dropTitle": "拖 JPG / PNG 进来",
  "fields": [
    {
      "id": "keepRotate",
      "label": "保留旋转方向（把 Orientation 归一后重绘）",
      "type": "checkbox",
      "default": false
    }
  ],
  "note": "字节级处理：JPEG 移除 APP1(EXIF)、APP2、APP13(IPTC)、XMP 与 COM 注释段；PNG 移除 eXIf / tEXt / iTXt / zTXt / tIME 块。不改像素，压缩数据原样保留。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer()); let out = b, removed = 0;
      if (b[0] === 0xff && b[1] === 0xd8) {
        const chunks = [b.slice(0, 2)]; let p = 2;
        while (p + 4 < b.length) {
          if (b[p] !== 0xff) { chunks.push(b.slice(p)); break; }
          const marker = b[p + 1];
          if (marker === 0xda) { chunks.push(b.slice(p)); break; }
          const len = (b[p + 2] << 8) | b[p + 3];
          const seg = b.slice(p, p + 2 + len);
          if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) removed += seg.length;
          else chunks.push(seg);
          p += 2 + len;
        }
        out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0)); let o = 0; chunks.forEach((c) => { out.set(c, o); o += c.length; });
      } else if (L.bytesToHex(b.slice(0, 8)) === '89504e470d0a1a0a') {
        const chunks = [b.slice(0, 8)]; let p = 8;
        const drop = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
        while (p + 12 <= b.length) {
          const len = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
          const type = L.fromUtf8(b.slice(p + 4, p + 8));
          const seg = b.slice(p, p + 12 + len);
          if (drop.has(type)) removed += seg.length; else chunks.push(seg);
          p += 12 + len;
          if (type === 'IEND') break;
        }
        out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0)); let o = 0; chunks.forEach((c) => { out.set(c, o); o += c.length; });
      } else { logs.push(`${f.name}：不是 JPG/PNG，跳过`); continue; }
      outs.push({ name: f.name, data: out, mime: f.type || 'image/jpeg' });
      logs.push(`${f.name}：去掉 ${L.humanSize(removed)} 元数据，${L.humanSize(b.length)} → ${L.humanSize(out.length)}`);
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '清理结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: outs.length }] };
  }
});
