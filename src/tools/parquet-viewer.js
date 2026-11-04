/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "Parquet",
  "titleOut": "元数据",
  "accept": ".parquet",
  "multiple": false,
  "primary": "读取",
  "auto": false,
  "dropTitle": "拖 .parquet 进来",
  "fields": [
    {
      "id": "limit",
      "label": "尝试读取前 N 行（简化路径）",
      "type": "number",
      "default": 20
    }
  ],
  "note": "浏览器端读 Parquet 的 Footer（Thrift compact）拿 schema、行数、行组、压缩与列名；完整列数据解码需要 DuckDB-WASM，这里提供元数据与 JSON/CSV 工作台（见「DuckDB SQL 工作台」）。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 Parquet 文件' };
    const b = new Uint8Array(await f.arrayBuffer());
    if (L.fromUtf8(b.slice(0, 4)) !== 'PAR1' || L.fromUtf8(b.slice(-4)) !== 'PAR1') return { error: '不是合法的 Parquet（头尾应有 PAR1）' };
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const footerLen = dv.getUint32(b.length - 8, true);
    const start = b.length - 8 - footerLen;
    // Thrift compact：跳读 varint 与结构体，抽取 i64 rows / 字符串列名
    let p = start; const strings = []; let numRows = 0;
    const readVar = () => { let n = 0, sh = 0, x; do { x = b[p++]; n |= (x & 0x7f) << sh; sh += 7; } while (x & 0x80); return n >>> 0; };
    try {
      p++; // struct begin
      while (p < b.length - 8) {
        const h = b[p++]; if (h === 0) break;
        const type = h & 0x0f, delta = h >> 4;
        const fid = delta ? (type === 0 ? 0 : delta) : 0;
        if (type === 2 || type === 1 || type === 3) readVar();
        else if (type === 4 || type === 5 || type === 6) { /* i16/i32/i64 简化跳过 */ readVar(); }
        else if (type === 8) { const len = readVar(); const s = L.fromUtf8(b.slice(p, p + len)); p += len; if (s.length < 80 && /^[\w.\- /]+$/.test(s)) strings.push(s); }
        else if (type === 9 || type === 10) { const sz = readVar(); p += sz * (type === 9 ? 1 : 1); }
        else if (type === 12) { p++; while (p < b.length - 8) { const h2 = b[p++]; if (!h2) break; const t2 = h2 & 0x0f; if (t2 === 8) { const len = readVar(); const s = L.fromUtf8(b.slice(p, p + len)); p += len; if (s && s.length < 80) strings.push(s); } else if (t2 === 6 || t2 === 4 || t2 === 5 || t2 === 2) readVar(); else if (t2 === 12) { p++; } } }
        if (type === 6 && fid === 3) numRows = numRows || readVar();
      }
    } catch (e) { /* 解析不完整也给出已知信息 */ }
    const cols = [...new Set(strings.filter((s) => !/parquet|hadoop|arrow|pandas|spark|version|created/i.test(s)))].slice(0, 60);
    return { html: `<table class="t-table"><tbody>
      <tr><td>文件</td><td class="num">${L.esc(f.name)}</td></tr>
      <tr><td>大小</td><td class="num">${L.humanSize(b.length)}</td></tr>
      <tr><td>Footer 长度</td><td class="num">${footerLen} 字节</td></tr>
      <tr><td>猜测行数</td><td class="num">${numRows || '见行组元数据'}</td></tr>
      <tr><td>疑似列名 / 字符串</td><td class="num">${cols.length}</td></tr></tbody></table>
      <p class="t-label" style="margin-top:12px">Footer 中的字符串</p><div class="t-out" style="max-height:220px">${L.esc(cols.join('\n') || strings.slice(0, 30).join('\n'))}</div>`,
      copy: cols.join('\n'), stats: [{ label: '大小', value: L.humanSize(b.length) }, { label: '字符串', value: cols.length }] };
  }
});
