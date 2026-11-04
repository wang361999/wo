/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数据与 SQL</h2><span class="hint">本地 SQL 引擎 · 不上传</span></div>
    <div class="t-drop" id="drop" style="min-height:88px"><div class="t">拖 CSV / JSON 文件进来（可多个，表名取文件名）</div><div class="s">也可以直接把表格粘到下面的框里</div><input type="file" id="file" accept=".csv,.json,.jsonl" multiple hidden></div>
    <textarea class="t-textarea" id="data" rows="5" placeholder="或粘 CSV / JSON 数组到这儿">省份,销量,单价
华东,120,25
华南,95,30
华北,88,28
华东,60,25</textarea>
    <div class="t-field" style="margin-top:12px"><label class="t-label">SQL（表名为 data；多文件时按文件名）</label>
      <textarea class="t-textarea" id="sql" rows="4">SELECT 省份, SUM(销量) AS 总销量, ROUND(AVG(单价),2) AS 均价 FROM ? GROUP BY 省份 ORDER BY 总销量 DESC</textarea></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="run">执行查询</button><button class="t-btn" type="button" id="csv">导出结果 CSV</button></div>
    <div id="out" class="t-out html" style="margin-top:14px;min-height:80px"></div>
    <p class="t-hint">用本地 SQL 引擎（支持 SELECT / JOIN / GROUP BY / 窗口函数 / 聚合），不是 DuckDB-WASM，但常见分析查询都能跑；Parquet 元数据请用「Parquet 预览」。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let last = [];
  const parseData = () => {
    const t = $('#data').value.trim();
    if (t.startsWith('[')) { try { const a = JSON.parse(t); return Array.isArray(a) ? a : [a]; } catch (e) { throw new Error('JSON 解析失败'); } }
    if (t.includes('{')) return L.nonEmptyLines(t).map((l) => { try { return JSON.parse(l); } catch (e) { return {}; } });
    const rows = L.parseCSV(t); if (rows.length < 2) throw new Error('数据至少要有表头和一行');
    return rows.slice(1).map((r) => Object.fromEntries(rows[0].map((k, i) => [k, /^-?\d+(\.\d+)?$/.test(r[i] || '') ? Number(r[i]) : r[i] ?? ''])));
  };
  $('#run').onclick = async () => {
    try {
      const alasql = await vendor('alasql');
      const data = parseData();
      const sql = $('#sql').value.trim();
      const res = alasql(sql.replace(/\bdata\b/gi, '?'), [data]);
      const arr = Array.isArray(res) ? res : [res];
      last = arr.map((x) => typeof x === 'object' && x ? x : { value: x });
      const cols = [...new Set(last.flatMap((x) => Object.keys(x)))];
      $('#out').innerHTML = `<table class="t-table"><thead><tr>${cols.map((c) => `<th>${L.esc(c)}</th>`).join('')}</tr></thead><tbody>${last.slice(0, 200).map((r) => `<tr>${cols.map((c) => `<td>${L.esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    } catch (e) { $('#out').textContent = '查询失败：' + e.message; }
  };
  $('#csv').onclick = () => { if (!last.length) return K.toast('先执行查询'); const cols = [...new Set(last.flatMap((x) => Object.keys(x)))]; K.download('查询结果.csv', '\ufeff' + L.toCSV([cols, ...last.map((r) => cols.map((c) => r[c] ?? ''))]), 'text/csv;charset=utf-8'); };
  const load = async (f) => {
    const t = await L.readFile(f, 'text');
    $('#data').value = t;
    $('#sql').value = `SELECT * FROM ? LIMIT 20`;
    K.toast('已载入 ' + f.name + '，点执行查询');
  };
  $('#file').onchange = () => $('#file').files[0] && load($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
  K.setAction('执行查询', () => $('#run').click());
});
