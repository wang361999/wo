/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "HEX 帧与模板",
  "titleOut": "解析结果",
  "fields": [
    {
      "id": "hex",
      "label": "HEX 字节流",
      "type": "text",
      "default": "AA 55 01 00 00 00 2A 01 02 03 04"
    },
    {
      "id": "tpl",
      "label": "字段模板（每行 名称:类型:长度）",
      "type": "textarea",
      "rows": 5,
      "default": "head:uint16:2\ncmd:uint8:1\nlen:uint32:4\nvalue:uint8:1\npayload:ascii:4"
    },
    {
      "id": "endian",
      "label": "字节序",
      "type": "select",
      "options": [
        "大端 BE",
        "小端 LE"
      ]
    },
    {
      "id": "crc",
      "label": "校验",
      "type": "select",
      "options": [
        "无",
        "CRC16-Modbus（末 2 字节）",
        "累加和（末 1 字节）"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "类型支持 uint8/16/32、int8/16/32、float32/64、ascii、hex、bcd；长度按字节计。可反向拼帧。",
  "compute": (v) => {
    let b; try { b = L.hexToBytes(v.hex); } catch (e) { return { error: e.message }; }
    const le = v.endian === '小端 LE';
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let off = 0; const rows = [];
    for (const line of L.nonEmptyLines(v.tpl || '')) {
      const [name, typ, lenS] = line.split(':').map((x) => x.trim());
      const len = Number(lenS) || 1;
      if (off + len > b.length) { rows.push([name, '越界', off, '']); break; }
      let val = '';
      const sl = b.slice(off, off + len);
      try {
        if (typ === 'uint8') val = dv.getUint8(off);
        else if (typ === 'uint16') val = dv.getUint16(off, le);
        else if (typ === 'uint32') val = dv.getUint32(off, le);
        else if (typ === 'int8') val = dv.getInt8(off);
        else if (typ === 'int16') val = dv.getInt16(off, le);
        else if (typ === 'int32') val = dv.getInt32(off, le);
        else if (typ === 'float32') val = dv.getFloat32(off, le);
        else if (typ === 'float64') val = dv.getFloat64(off, le);
        else if (typ === 'ascii') val = JSON.stringify(L.fromUtf8(sl));
        else if (typ === 'hex') val = L.bytesToHex(sl, ' ');
        else if (typ === 'bcd') val = L.bytesToHex(sl, '').replace(/([0-9a-f])([0-9a-f])/g, '$1$2 ');
        else val = L.bytesToHex(sl, ' ');
      } catch (e) { val = '读取失败'; }
      rows.push([name || '?', typ, off, String(val)]); off += len;
    }
    let crcNote = '';
    if (v.crc === 'CRC16-Modbus（末 2 字节）' && b.length >= 2) {
      const body = b.slice(0, -2), expect = (body[body.length - 1] << 8) | body[body.length - 2];
      let c = 0xffff;
      for (const x of body) { c ^= x; for (let i = 0; i < 8; i++) c = (c & 1) ? (c >> 1) ^ 0xa001 : c >> 1; }
      crcNote = `CRC16 计算值 0x${(c & 0xffff).toString(16).toUpperCase().padStart(4, '0')}，帧尾 0x${(expect & 0xffff).toString(16).toUpperCase().padStart(4, '0')} → ${(c & 0xffff) === (expect & 0xffff) ? '一致 ✓' : '不一致'}`;
    }
    return { html: `<table class="t-table"><thead><tr><th>字段</th><th>类型</th><th>偏移</th><th>值</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td>${L.esc(r[1])}</td><td class="num">${r[2]}</td><td class="num">${L.esc(r[3])}</td></tr>`).join('')}</tbody></table>${crcNote ? `<p class="t-hint">${L.esc(crcNote)}</p>` : ''}`,
      copy: rows.map((r) => r.join('\t')).join('\n') + (crcNote ? '\n' + crcNote : ''), stats: [{ label: '字段', value: rows.length }, { label: '已解析', value: `${off}/${b.length} 字节` }] };
  }
});
