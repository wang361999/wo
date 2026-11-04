/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const HOLI = { '01-01': '元旦', '02-14': '情人节', '03-08': '妇女节', '03-12': '植树节', '04-01': '愚人节', '05-01': '劳动节', '05-04': '青年节', '06-01': '儿童节', '07-01': '建党节', '08-01': '建军节', '09-10': '教师节', '10-01': '国庆节', '12-24': '平安夜', '12-25': '圣诞节' };
  const JIE = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>万年历</h2><span class="hint">农历/节气为内置精简推算</span></div>
    <div class="t-row"><button type="button" class="t-btn" id="cal-prev">← 上月</button><select class="t-select" id="cal-y"></select><select class="t-select" id="cal-m"></select><button type="button" class="t-btn" id="cal-next">下月 →</button><button type="button" class="t-btn" id="cal-today">回到今天</button></div>
    <div class="t-refwrap" id="cal-grid" style="margin-top:14px"></div>
    <div class="t-hint" id="cal-info"></div>
  </section></div>`;
  const yS = root.querySelector('#cal-y'), mS = root.querySelector('#cal-m'), grid = root.querySelector('#cal-grid'), info = root.querySelector('#cal-info');
  const now = new Date(); let Y = now.getFullYear(), M = now.getMonth() + 1;
  yS.innerHTML = Array.from({ length: 121 }, (_, i) => 1900 + i).map((y) => `<option value="${y}" ${y === Y ? 'selected' : ''}>${y}</option>`).join('');
  mS.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => `<option value="${m}" ${m === M ? 'selected' : ''}>${m} 月</option>`).join('');
  const draw = () => {
    yS.value = Y; mS.value = M;
    const first = new Date(Y, M - 1, 1), days = new Date(Y, M, 0).getDate(), lead = first.getDay();
    let cells = '<table class="t-table"><thead><tr>' + ['日', '一', '二', '三', '四', '五', '六'].map((x) => `<th>${x}</th>`).join('') + '</tr></thead><tbody><tr>';
    for (let i = 0; i < lead; i++) cells += '<td></td>';
    let hol = [];
    for (let d = 1; d <= days; d++) {
      const dt = new Date(Y, M - 1, d), key = L.pad(M) + '-' + L.pad(d), h = HOLI[key];
      const today = dt.toDateString() === now.toDateString();
      const jie = d === 5 || d === 20 ? JIE[(M - 1) * 2 + (d === 20 ? 1 : 0)] : '';
      if (h) hol.push(`${M}月${d}日 ${h}`);
      cells += `<td style="text-align:center;${today ? 'background:#b4552d;color:#fff;border-radius:6px;font-weight:700' : (dt.getDay() === 0 || dt.getDay() === 6 ? 'color:#a35d5d' : '')}"><div>${d}</div><div style="font-size:10px;opacity:.8">${L.esc(h || jie || '')}</div></td>`;
      if ((lead + d) % 7 === 0) cells += '</tr><tr>';
    }
    cells += '</tr></tbody></table>';
    grid.innerHTML = cells;
    try { const lu = L.lunarLite(new Date(Y, M - 1, 15)); info.textContent = `${Y} 年 ${M} 月，共 ${days} 天；本月节日：${hol.length ? hol.join('、') : '无内置记录'}；农历（十五）参考：${lu}`; }
    catch (e) { info.textContent = `${Y} 年 ${M} 月，共 ${days} 天；本月节日：${hol.length ? hol.join('、') : '无内置记录'}`; }
  };
  root.querySelector('#cal-prev').onclick = () => { M--; if (M < 1) { M = 12; Y--; } draw(); };
  root.querySelector('#cal-next').onclick = () => { M++; if (M > 12) { M = 1; Y++; } draw(); };
  root.querySelector('#cal-today').onclick = () => { Y = now.getFullYear(); M = now.getMonth() + 1; draw(); };
  yS.onchange = () => { Y = Number(yS.value); draw(); };
  mS.onchange = () => { M = Number(mS.value); draw(); };
  K.setAction('回到今天', () => root.querySelector('#cal-today').click());
  draw();
});
