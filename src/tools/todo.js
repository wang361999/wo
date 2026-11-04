/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const KEY = 'yiyegongju.todo.v1';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
  const save = () => localStorage.setItem(KEY, JSON.stringify(items));
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>待办清单</h2><span class="hint">只存在这台设备的浏览器里</span></div>
    <div class="t-row"><input class="t-input grow" id="td-text" placeholder="要做什么？回车添加"><select class="t-select" id="td-pri"><option value="普通">普通</option><option value="重要">重要</option><option value="紧急">紧急</option></select><input class="t-input" id="td-due" type="date"><button type="button" class="t-btn primary" id="td-add">添加</button></div>
    <div class="t-chips" style="margin:12px 0"><button type="button" class="t-chip on" data-tdf="全部">全部</button><button type="button" class="t-chip" data-tdf="未完成">未完成</button><button type="button" class="t-chip" data-tdf="已完成">已完成</button><button type="button" class="t-chip" data-tdf="紧急">紧急</button></div>
    <div class="t-refwrap" id="td-list"></div>
    <div class="t-hint" id="td-stat"></div>
  </section></div>`;
  const text = root.querySelector('#td-text'), pri = root.querySelector('#td-pri'), due = root.querySelector('#td-due'), list = root.querySelector('#td-list'), stat = root.querySelector('#td-stat');
  let filter = '全部';
  const draw = () => {
    const now = new Date().toISOString().slice(0, 10);
    const show = items.filter((x) => filter === '全部' || (filter === '未完成' && !x.done) || (filter === '已完成' && x.done) || (filter === '紧急' && x.pri === '紧急'));
    list.innerHTML = show.length ? `<table class="t-table"><thead><tr><th>完成</th><th>事项</th><th>优先级</th><th>截止</th><th></th></tr></thead><tbody>${show.map((x) => `<tr style="${x.done ? 'opacity:.5;text-decoration:line-through' : ''}"><td><input type="checkbox" data-tdcheck="${x.id}" ${x.done ? 'checked' : ''}></td><td>${L.esc(x.text)}</td><td>${L.esc(x.pri)}${x.pri === '紧急' ? ' 🔴' : x.pri === '重要' ? ' 🟠' : ''}</td><td>${L.esc(x.due || '—')}${!x.done && x.due && x.due < now ? ' <b style="color:#a35d5d">已逾期</b>' : ''}</td><td><button type="button" class="t-btn" data-tddel="${x.id}">删</button></td></tr>`).join('')}</tbody></table>` : '<p class="t-hint">还没有事项，上面填一条试试。</p>';
    stat.textContent = `共 ${items.length} 条，已完成 ${items.filter((x) => x.done).length} 条，逾期 ${items.filter((x) => !x.done && x.due && x.due < now).length} 条`;
  };
  const add = () => { const t = text.value.trim(); if (!t) return; items.unshift({ id: Date.now() + Math.random(), text: t, pri: pri.value, due: due.value, done: false }); text.value = ''; due.value = ''; save(); draw(); };
  root.querySelector('#td-add').onclick = add;
  text.onkeydown = (e) => { if (e.key === 'Enter') add(); };
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-tdcheck]'); if (c) { const x = items.find((y) => String(y.id) === c.dataset.tdcheck); if (x) { x.done = c.checked; save(); draw(); } return; }
    const d = e.target.closest('[data-tddel]'); if (d) { items = items.filter((y) => String(y.id) !== d.dataset.tddel); save(); draw(); return; }
    const f = e.target.closest('[data-tdf]'); if (f) { root.querySelectorAll('[data-tdf]').forEach((b) => b.classList.toggle('on', b === f)); filter = f.dataset.tdf; draw(); }
  });
  K.setAction('添加待办', add);
  draw();
});
