/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "SQLite 文件",
  "titleOut": "查询",
  "accept": ".db,.sqlite,.sqlite3",
  "multiple": false,
  "primary": "执行 SQL",
  "auto": false,
  "dropTitle": "拖 .db / .sqlite 进来",
  "fields": [
    {
      "id": "sql",
      "label": "SQL",
      "type": "textarea",
      "rows": 5,
      "default": "SELECT name FROM sqlite_master WHERE type='table';"
    },
    {
      "id": "fmt",
      "label": "导出格式",
      "type": "select",
      "options": [
        "CSV",
        "JSON"
      ]
    }
  ],
  "note": "sql.js（SQLite 编译成 WebAssembly）在浏览器里跑，文件不上传。留空不选文件可打开一个空白库，直接 CREATE TABLE 体验。",
  "process": async (files, v, ctx) => {
    const SQL = await vendor('sql');
    const db = files.length ? new SQL.Database(new Uint8Array(await files[0].arrayBuffer())) : new SQL.Database();
    let res;
    try { res = db.exec(String(v.sql || '').trim() || "SELECT sqlite_version() AS version;"); }
    catch (e) { return { error: 'SQL 错误：' + e.message }; }
    if (!res.length) return { text: '执行成功，没有返回结果集。\n（建表 / 插入语句已生效，但本页不会把改动写回原文件；需要保存请用「导出 .db」）', stats: [{ label: '结果集', value: 0 }] };
    const { columns, values } = res[0];
    const rows = [columns, ...values.map((r) => r.map((x) => x == null ? '' : x instanceof Uint8Array ? L.bytesToHex(x) : String(x)))];
    const csv = L.toCSV(rows), json = JSON.stringify(values.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]]))), null, 2);
    return { html: `<table class="t-table"><thead><tr>${columns.map((c) => `<th>${L.esc(c)}</th>`).join('')}</tr></thead><tbody>${values.slice(0, 100).map((r) => `<tr>${r.map((x) => `<td>${L.esc(x == null ? 'NULL' : String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>${values.length > 100 ? `<p class="t-hint">只显示前 100 行，共 ${values.length} 行。</p>` : ''}`,
      copy: v.fmt === 'JSON' ? json : csv,
      files: [{ name: '查询结果.' + (v.fmt === 'JSON' ? 'json' : 'csv'), data: L.utf8(v.fmt === 'JSON' ? json : '\ufeff' + csv), mime: 'text/plain', label: '导出 ' + v.fmt },
        { name: 'database.db', data: new Uint8Array(db.export()), mime: 'application/x-sqlite3', label: '导出 .db（含改动）' }],
      stats: [{ label: '列', value: columns.length }, { label: '行', value: values.length }] };
  }
});
