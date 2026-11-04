/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>本机公网 IP</h2><span class="hint">查询需联网，图片文件不会上传</span></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">查一下</button></div>
    <div class="t-out html" id="res" style="margin-top:14px">点「查一下」读取当前出口 IP。</div>
    <p class="t-hint">归属地来自公开 IP 库，仅作参考。这个页面不会保存或记录你的 IP；也可以在下面粘任意 IP 批量查。</p>
  </section>
  <section class="t-panel wide">
    <div class="t-head"><h2><span class="step">2</span>批量查 IP</h2><span class="hint">一行一个</span></div>
    <textarea class="t-textarea" id="ips" rows="4" placeholder="8.8.8.8&#10;1.1.1.1"></textarea>
    <div class="t-actions"><button class="t-btn" type="button" id="batch">查询并导出 CSV</button><button class="t-btn" type="button" id="local">看本机内网地址</button></div>
    <div class="t-out" id="bres" style="margin-top:12px"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const out = (el, s) => { el.textContent = s; };
  const ask = async (ip) => {
    const r = await fetch('https://ipwho.is/' + encodeURIComponent(ip));
    if (!r.ok) throw new Error('查询被拒绝');
    return r.json();
  };
  $('#go').onclick = async () => {
    out($('#res'), '正在查询…');
    try {
      let ip = '';
      try { const t = await (await fetch('https://www.cloudflare.com/cdn-cgi/trace')).text(); ip = (t.match(/^ip=(.*)$/m) || [])[1] || ''; } catch (e) {}
      if (!ip) ip = (await (await fetch('https://api.ipify.org?format=json')).json()).ip;
      let j = null;
      try { j = await ask(ip); } catch (e) {}
      $('#res').className = 't-out html';
      $('#res').innerHTML = `<div class="t-stat-row"><div class="t-stat"><b>${L.esc(ip)}</b><span>公网 IP</span></div>
        <div class="t-stat"><b>${L.esc(j?.country || '—')}</b><span>国家/地区</span></div>
        <div class="t-stat"><b>${L.esc(j?.region || '—')}</b><span>省份</span></div>
        <div class="t-stat"><b>${L.esc(j?.city || '—')}</b><span>城市</span></div>
        <div class="t-stat"><b>${L.esc(j?.connection?.isp || j?.connection?.org || '—')}</b><span>运营商</span></div></div>
        <p class="t-hint">经纬度：${L.esc(j ? `${j.latitude}, ${j.longitude}` : '—')}　时区：${L.esc(j?.timezone?.id || '—')}</p>`;
    } catch (e) { out($('#res'), '查询失败：' + e.message + '。可能是网络限制，换个网络再试。'); }
  };
  $('#batch').onclick = async () => {
    const list = L.nonEmptyLines($('#ips').value).slice(0, 50);
    if (!list.length) { out($('#bres'), '先粘几个 IP'); return; }
    out($('#bres'), `正在查询 ${list.length} 个…`);
    const rows = [['IP', '国家', '省份', '城市', '运营商']];
    for (const ip of list) {
      try { const j = await ask(ip); rows.push([ip, j.country || '', j.region || '', j.city || '', j.connection?.isp || '']); }
      catch (e) { rows.push([ip, '查询失败', '', '', '']); }
    }
    out($('#bres'), L.toCSV(rows));
    K.download('ip-查询.csv', '\\ufeff' + L.toCSV(rows), 'text/csv;charset=utf-8');
  };
  $('#local').onclick = async () => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel(''); const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const found = new Set();
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); out($('#bres'), [...found].join('\n') || '浏览器未暴露内网地址'); return; }
        const m = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
        if (m) found.add(m[1]);
      };
      out($('#bres'), '正在读取…');
    } catch (e) { out($('#bres'), '读取失败：' + e.message); }
  };
  K.setAction && K.setAction;
});
