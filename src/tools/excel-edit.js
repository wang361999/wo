/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>表格</h2><span class="hint">xlsx / csv 本地打开 · 单元格可编辑</span></div>
    <div class="t-drop" id="drop" style="min-height:92px"><div class="t">拖 xlsx / csv 进来，或点一下选择</div><div class="s">也可以从 Excel 直接复制一片区域粘到下面</div><input type="file" id="file" accept=".xlsx,.xls,.csv" hidden></div>
    <div class="t-actions"><button class="t-btn" type="button" id="paste">粘贴剪贴板表格</button><button class="t-btn" type="button" id="addrow">加一行</button><button class="t-btn" type="button" id="addcol">加一列</button>
      <button class="t-btn" type="button" id="xlsx">导出 xlsx</button><button class="t-btn" type="button" id="csv">导出 CSV</button></div>
    <div id="grid" style="overflow:auto;margin-top:14px;border:1px solid var(--line);border-radius:8px"></div>
    <p class="t-hint">公式列支持在单元格里写 =A1+B1 这类简单运算；改完直接导出，全程不上传。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let rows = [['姓名', '数量', '单价', '小计'], ['苹果', 3, 5, '=B2*C2'], ['香蕉', 2, 3, '=B3*C3']];
  const calc = (s, r, c) => {
    const t = String(s).trim();
    if (!t.startsWith('=')) return t;
    try {
      const expr = t.slice(1).replace(/([A-Z]+)(\d+)/gi, (_, col, row) => {
        let ci = 0; for (const ch of col.toUpperCase()) ci = ci * 26 + ch.charCodeAt(0) - 64;
        const val = rows[Number(row) - 1]?.[ci - 1];
        return Number(val) || 0;
      });
      if (!/^[\d+\-*/(). ]+$/.test(expr)) return s;
      return String(L.round(Function('"use strict";return (' + expr + ')')(), 4));
    } catch (e) { return s; }
  };
  const draw = () => {
    $('#grid').innerHTML = `<table class="t-table"><tbody>${rows.map((r, ri) => `<tr>${r.map((c, ci) => `<td contenteditable="true" data-r="${ri}" data-c="${ci}" style="min-width:92px;border-right:1px solid var(--line-2)">${L.esc(String(c).startsWith('=') ? calc(c, ri, ci) : c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  $('#grid').addEventListener('input', (e) => { const td = e.target.closest('td[data-r]'); if (td) { rows[Number(td.dataset.r)][Number(td.dataset.c)] = td.textContent; } });
  $('#grid').addEventListener('blur', (e) => { if (e.target.matches('td[data-r]')) draw(); }, true);
  $('#addrow').onclick = () => { rows.push(rows[0].map(() => '')); draw(); };
  $('#addcol').onclick = () => { rows.forEach((r) => r.push('')); draw(); };
  $('#paste').onclick = async () => { try { const t = await navigator.clipboard.readText(); const p = L.parseCSV(t, /\t/.test(t) ? '\t' : ','); if (p.length) { rows = p; draw(); } } catch (e) { K.toast('读不到剪贴板，直接按 Ctrl+V 粘到表格里'); } };
  document.addEventListener('paste', (e) => { const t = e.clipboardData?.getData('text/plain'); if (t && /\t|,/.test(t)) { const p = L.parseCSV(t, t.includes('\t') ? '\t' : ','); if (p.length > 1) { rows = p; draw(); e.preventDefault(); } } });
  const load = async (f) => {
    const XLSX = await vendor('xlsx');
    const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
    const sh = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
    draw(); K.toast('已打开 ' + f.name);
  };
  $('#file').onchange = () => $('#file').files[0] && load($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
  $('#csv').onclick = () => K.download('表格.csv', '\ufeff' + L.toCSV(rows.map((r) => r.map((c) => calc(c)))), 'text/csv;charset=utf-8');
  $('#xlsx').onclick = async () => { const XLSX = await vendor('xlsx'); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows.map((r) => r.map((c) => calc(c)))), 'Sheet1'); const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); K.download('表格.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); };
  K.setAction('导出 xlsx', () => $('#xlsx').click());
  draw();
});
