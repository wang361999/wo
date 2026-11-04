/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>账号密钥</h2><span class="hint">本地保存，不上传</span></div>
    <div class="t-field"><label class="t-label">账号名</label><input class="t-input" id="name" placeholder="例如 GitHub"></div>
    <div class="t-field"><label class="t-label">Base32 密钥</label><input class="t-input" id="key" placeholder="JBSWY3DPEHPK3PXP"></div>
    <div class="t-actions"><button class="t-btn" type="button" id="add">添加 / 更新</button></div>
    <p class="t-hint">兼容 Google Authenticator 的 SHA-1 / 30 秒 / 6 位默认参数。密钥保存在这个浏览器的 localStorage 里。</p>
  </section><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">2</span>动态口令</h2><span class="hint" id="clock">—</span></div>
    <div id="list" class="t-out html"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const KEY = 'toolbox-totp';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (a) => localStorage.setItem(KEY, JSON.stringify(a));
  const draw = async () => {
    const items = load(); const now = Date.now();
    $('#clock').textContent = new Date().toLocaleTimeString('zh-CN');
    if (!items.length) { $('#list').innerHTML = '<p class="t-hint">还没有账号。左边填一个 Base32 密钥试试，或者用「示例密钥」按钮。</p>'; return; }
    const rows = [];
    for (const it of items) {
      try { const r = await totpNow(b32(it.key)); rows.push(`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line-2);flex-wrap:wrap">
        <div style="flex:1;min-width:120px"><b>${L.esc(it.name)}</b><div class="t-hint" style="margin:2px 0 0">每 30 秒更新 · 还剩 ${r.left}s</div></div>
        <div style="font-size:25px;font-weight:700;letter-spacing:.12em;font-variant-numeric:tabular-nums">${L.esc(r.code)}</div>
        <button class="t-btn" type="button" data-cp="${L.esc(r.code)}">复制</button><button class="t-btn" type="button" data-rm="${L.esc(it.name)}">删除</button>
        <div style="width:100%;height:4px;background:var(--paper);border-radius:3px"><div style="height:100%;width:${r.left / 30 * 100}%;background:var(--accent);border-radius:3px"></div></div></div>`); }
      catch (e) { rows.push(`<p class="t-hint" style="color:#a63d34">${L.esc(it.name)}：${L.esc(e.message)}</p>`); }
    }
    $('#list').innerHTML = rows.join('');
  };
  $('#add').onclick = () => { const n = $('#name').value.trim(), k = $('#key').value.trim(); if (!n || !k) return K.toast('账号名和密钥都要填'); try { b32(k); } catch (e) { return K.toast(e.message); } const a = load().filter((x) => x.name !== n); a.push({ name: n, key: k }); save(a); $('#key').value = ''; draw(); };
  $('#list').onclick = (e) => { const cp = e.target.closest('[data-cp]'); if (cp) return K.copy(cp.dataset.cp); const rm = e.target.closest('[data-rm]'); if (rm) { save(load().filter((x) => x.name !== rm.dataset.rm)); draw(); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) draw(); });
  K.setAction('刷新口令', draw);
  draw(); setInterval(draw, 1000);
});
