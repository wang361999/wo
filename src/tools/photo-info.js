/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "JPG 照片",
  "titleOut": "EXIF 信息",
  "accept": "image/jpeg,.jpg,.jpeg",
  "multiple": false,
  "primary": "读取信息",
  "auto": false,
  "dropTitle": "拖一张 JPG 照片进来",
  "fields": [
    {
      "id": "map",
      "label": "GPS 输出",
      "type": "select",
      "options": [
        "度分秒 + 十进制",
        "只给十进制"
      ]
    }
  ],
  "note": "手写解析 JPEG APP1 里的 TIFF/EXIF：相机型号、镜头、光圈快门 ISO、拍摄时间、GPS。PNG / WebP 的 EXIF 需要另外的容器解析。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 JPG' };
    const b = new Uint8Array(await f.arrayBuffer());
    if (b[0] !== 0xff || b[1] !== 0xd8) return { error: '不是 JPEG' };
    let p = 2, exif = null, orientation = 1;
    while (p + 4 < b.length && b[p] === 0xff) {
      const marker = b[p + 1]; if (marker === 0xda) break;
      const len = (b[p + 2] << 8) | b[p + 3];
      if (marker === 0xe1 && L.fromUtf8(b.slice(p + 4, p + 10)) === 'Exif\0\0') { exif = b.slice(p + 10, p + 2 + len); break; }
      p += 2 + len;
    }
    if (!exif) return { text: `${f.name}（${L.humanSize(f.size)}）\n没有 EXIF 段：可能被「图片信息清理」处理过，或本来就是截图/网络图。`, stats: [{ label: 'EXIF', value: '无' }] };
    const dv = new DataView(exif.buffer, exif.byteOffset, exif.byteLength);
    const le = L.fromUtf8(exif.slice(0, 2)) === 'II';
    const u16 = (o) => dv.getUint16(o, le), u32 = (o) => dv.getUint32(o, le);
    const tags = {};
    const TAGS = { 0x010f: '厂商', 0x0110: '相机型号', 0x0112: '方向', 0x0132: '拍摄时间', 0x829a: '曝光时间', 0x829d: '光圈 F 值', 0x8827: 'ISO', 0x9003: '原始时间', 0x920a: '焦距', 0xa434: '镜头型号', 0xa002: '像素宽', 0xa003: '像素高', 0x011a: 'X 分辨率', 0x0131: '软件' };
    const readIFD = (off) => {
      if (off + 2 > exif.length) return;
      const n = u16(off);
      for (let i = 0; i < n; i++) {
        const o = off + 2 + i * 12; if (o + 12 > exif.length) break;
        const tag = u16(o), type = u16(o + 2), count = u32(o + 4), valOff = o + 8;
        let val = '';
        const size = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 })[type] || 1;
        const at = count * size <= 4 ? valOff : u32(valOff);
        if (type === 2) val = L.fromUtf8(exif.slice(at, at + count)).replace(/\0/g, '').trim();
        else if (type === 3) val = String(u16(at));
        else if (type === 4) val = String(u32(at));
        else if (type === 5) val = count ? `${u32(at)}/${u32(at + 4)}` : '';
        else val = L.bytesToHex(exif.slice(at, at + Math.min(16, count * size)), ' ');
        if (TAGS[tag]) tags[TAGS[tag]] = val;
        if (tag === 0x0112) orientation = Number(val) || 1;
        if (tag === 0x8769 || tag === 0x8825) { const sub = u32(valOff); if (sub && sub < exif.length) readIFD(sub); }
      }
    };
    try { readIFD(u32(4)); } catch (e) { return { error: 'EXIF 解析出错：' + e.message }; }
    if (tags['曝光时间'] && tags['曝光时间'].includes('/')) { const [a, bb] = tags['曝光时间'].split('/').map(Number); tags['曝光时间'] = bb / a >= 1 ? `1/${Math.round(bb / a)} s` : `${(a / bb).toFixed(1)} s`; }
    if (tags['光圈 F 值']?.includes('/')) { const [a, bb] = tags['光圈 F 值'].split('/').map(Number); tags['光圈 F 值'] = 'f/' + (a / bb).toFixed(1); }
    if (tags['焦距']?.includes('/')) { const [a, bb] = tags['焦距'].split('/').map(Number); tags['焦距'] = (a / bb).toFixed(0) + ' mm'; }
    const rows = [['文件', f.name], ['大小', L.humanSize(f.size)], ['方向', String(orientation)], ...Object.entries(tags)];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '字段', value: Object.keys(tags).length }, { label: 'EXIF', value: L.humanSize(exif.length) }] };
  }
});
