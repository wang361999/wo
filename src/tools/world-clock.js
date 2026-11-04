/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const zones = [['北京', 'Asia/Shanghai'], ['东京', 'Asia/Tokyo'], ['首尔', 'Asia/Seoul'], ['伦敦', 'Europe/London'], ['柏林', 'Europe/Berlin'], ['巴黎', 'Europe/Paris'], ['纽约', 'America/New_York'], ['洛杉矶', 'America/Los_Angeles'], ['悉尼', 'Australia/Sydney'], ['迪拜', 'Asia/Dubai'], ['新加坡', 'Asia/Singapore'], ['UTC', 'UTC']];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>世界时钟</h2><span class="hint" id="now">—</span></div>
    <div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px"></div>
    <div class="t-field" style="margin-top:18px"><label class="t-label">跨时区会议规划：选一个北京时间</label>
      <div class="t-row"><input class="t-input grow" type="time" id="meet" value="09:00"><button class="t-btn" type="button" id="planBtn">看各地几点</button></div></div>
    <div class="t-out" id="planOut" style="margin-top:11px"></div>
    <p class="t-hint">用浏览器 Intl 时区数据库换算，含夏令时；不需要联网。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const tick = () => {
    const now = new Date();
    $('#now').textContent = '本机 ' + now.toLocaleString('zh-CN', { hour12: false });
    $('#grid').innerHTML = zones.map(([n, z]) => {
      const s = new Intl.DateTimeFormat('zh-CN', { timeZone: z, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
      const d = new Intl.DateTimeFormat('zh-CN', { timeZone: z, month: '2-digit', day: '2-digit', weekday: 'short' }).format(now);
      const hr = Number(s.slice(0, 2)); const day = hr >= 8 && hr < 19;
      return `<div style="border:1px solid var(--line);border-radius:9px;padding:11px;background:${day ? '#f7f2e8' : '#eeece6'}">
        <div style="font-size:12px;color:var(--ink-3)">${n} <span style="float:right">${day ? '☀' : '☾'}</span></div>
        <div style="font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin:4px 0">${s}</div>
        <div style="font-size:11px;color:var(--ink-3)">${d} · ${z.split('/').pop().replace(/_/g, ' ')}</div></div>`;
    }).join('');
  };
  $('#planBtn').onclick = () => {
    const [h, m] = $('#meet').value.split(':').map(Number);
    const base = new Date(); base.setHours(h || 9, m || 0, 0, 0);
    $('#planOut').textContent = zones.map(([n, z]) => `${n.padEnd(6, '　')} ${new Intl.DateTimeFormat('zh-CN', { timeZone: z, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).format(base)}`).join('\n');
  };
  K.setAction('看各地几点', () => $('#planBtn').click());
  tick(); setInterval(tick, 1000);
});
