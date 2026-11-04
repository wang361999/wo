/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "mongosh / EJSON / BSON",
  "titleOut": "结果",
  "fields": [
    {
      "id": "txt",
      "label": "输入",
      "type": "textarea",
      "rows": 8,
      "default": "{ _id: ObjectId(\"507f1f77bcf86cd799439011\"), name: \"小明\", created: ISODate(\"2020-01-01T00:00:00Z\"), count: NumberLong(\"42\") }"
    },
    {
      "id": "mode",
      "label": "模式",
      "type": "select",
      "options": [
        "EJSON / mongosh → 标准 JSON",
        "JSON → EJSON",
        "ObjectId 提时间戳",
        "二进制 BSON HEX → 文档"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "解析 mongosh 打印格式（ObjectId / ISODate / NumberLong / NumberInt / Decimal128）与二进制 BSON；ObjectId 前 4 字节是秒级时间戳。",
  "compute": (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    if (v.mode === 'ObjectId 提时间戳') {
      const ids = t.match(/[0-9a-f]{24}/gi) || [];
      return { text: ids.map((id) => `${id} → ${new Date(parseInt(id.slice(0, 8), 16) * 1000).toLocaleString('zh-CN')}`).join('\n') || '没找到 24 位十六进制 ObjectId', stats: [{ label: 'ObjectId', value: ids.length }] };
    }
    if (v.mode === '二进制 BSON HEX → 文档') {
      let b; try { b = L.hexToBytes(t); } catch (e) { return { error: e.message }; }
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      const out = []; let p = 4;
      const rdCstr = () => { const e = b.indexOf(0, p); const s = L.fromUtf8(b.slice(p, e)); p = e + 1; return s; };
      while (p < b.length - 1) {
        const typ = b[p++]; const name = rdCstr(); let val;
        try {
          if (typ === 0x01) { val = dv.getFloat64(p, true); p += 8; }
          else if (typ === 0x02) { const n = dv.getInt32(p, true); p += 4; val = L.fromUtf8(b.slice(p, p + n - 1)); p += n; }
          else if (typ === 0x07) { val = 'ObjectId(' + L.bytesToHex(b.slice(p, p + 12)) + ')'; p += 12; }
          else if (typ === 0x08) { val = !!b[p++]; }
          else if (typ === 0x09 || typ === 0x11) { val = Number(dv.getBigInt64(p, true)); p += 8; }
          else if (typ === 0x10) { val = dv.getInt32(p, true); p += 4; }
          else if (typ === 0x12) { val = Number(dv.getBigInt64(p, true)); p += 8; }
          else if (typ === 0x0a) val = null;
          else { val = `(type 0x${typ.toString(16)} 未展开)`; break; }
        } catch (e) { break; }
        out.push([name, val]);
      }
      return { text: JSON.stringify(Object.fromEntries(out), null, 2), stats: [{ label: '字段', value: out.length }] };
    }
    if (v.mode === 'JSON → EJSON') {
      let o; try { o = JSON.parse(t); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
      const ejson = JSON.stringify(o, null, 2).replace(/"(\d{4}-\d{2}-\d{2}T[^"]+)"/g, 'ISODate("$1")').replace(/"([0-9a-f]{24})"/g, 'ObjectId("$1")');
      return { text: ejson, stats: [{ label: '字段', value: Object.keys(o).length }] };
    }
    let s = t.replace(/\bObjectId\(\s*["']([0-9a-f]{24})["']\s*\)/gi, '"$1"')
      .replace(/\bISODate\(\s*["']([^"']+)["']\s*\)/gi, '"$1"')
      .replace(/\b(NumberLong|NumberInt|Decimal128|NumberDecimal)\(\s*["']?([^"')]+)["']?\s*\)/gi, '"$2"')
      .replace(/\b(BinData|UUID|RegExp)\([^)]*\)/gi, 'null')
      .replace(/([{,:]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/,\s*([}\]])/g, '$1');
    try { return { text: JSON.stringify(JSON.parse(s), null, 2), stats: [{ label: '字段', value: Object.keys(JSON.parse(s)).length }] }; }
    catch (e) { return { text: s, error: '还不是严格 JSON（可能含 mongosh 特有语法），已尽量转成可复制形式：\n' + e.message }; }
  }
});
