/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>本机公网 IP</h2><span class="hint">经本站同源接口查询</span></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">查一下</button></div>
    <div class="t-out html" id="res" style="margin-top:14px">点「查一下」读取当前出口 IP 与归属地。</div>
    <p class="t-hint">IP 与归属地来自 CDN 边缘节点信息和公开 IP 库，仅作参考。本站不保存、不记录你的 IP；查询词只用于这一次取数。</p>
  </section>
  <section class="t-panel wide">
    <div class="t-head"><h2><span class="step">2</span>批量查 IP</h2><span class="hint">一行一个，最多 20 个</span></div>
    <textarea class="t-textarea" id="ips" rows="4" placeholder="8.8.8.8&#10;1.1.1.1"></textarea>
    <div class="t-actions"><button class="t-btn" type="button" id="batch">查询并导出 CSV</button><button class="t-btn" type="button" id="local">看本机内网地址</button></div>
    <div class="t-out" id="bres" style="margin-top:12px"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const out = (el, s) => { el.textContent = s; };
  const esc = L.esc;
  const BOM = String.fromCharCode(0xFEFF);
  const api = async (mode, q) => {
    const u = '/api/net?mode=' + encodeURIComponent(mode) + (q ? '&q=' + encodeURIComponent(q) : '');
    const r = await fetch(u);
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.detail || j.error || ('HTTP ' + r.status));
    return j;
  };
  const stamp = (j) => '<p class="t-hint">' +
    (j.stale ? '实时查询暂不可用，以下是上一次成功的结果。' : '数据实时查询，服务端短期缓存。') +
    '来源：' + esc(j.source || '公开数据源') + (j.cached ? ' · 命中缓存' : '') +
    (j.note ? '<br>' + esc(j.note) : '') + '</p>';
  const card = (j) => {
    const v = (x) => esc(x === '' || x === null || x === undefined ? '—' : x);
    const ll = (j.latitude !== null && j.latitude !== undefined && j.longitude !== null && j.longitude !== undefined)
      ? j.latitude + ', ' + j.longitude : '—';
    return `<div class="t-stat-row">
      <div class="t-stat"><b>${v(j.ip)}</b><span>公网 IP · ${v(j.version)}</span></div>
      <div class="t-stat"><b>${v(j.country)}</b><span>国家/地区 ${j.country_code ? '(' + v(j.country_code) + ')' : ''}</span></div>
      <div class="t-stat"><b>${v(j.region)}</b><span>省份 / 州</span></div>
      <div class="t-stat"><b>${v(j.city)}</b><span>城市</span></div>
      <div class="t-stat"><b>${v(j.isp)}</b><span>运营商${j.asn ? ' · ' + v(j.asn) : ''}</span></div>
    </div><p class="t-hint">经纬度：${v(ll)}　时区：${v(j.timezone)}</p>` + stamp(j);
  };
  $('#go').onclick = async () => {
    const el = $('#res');
    el.className = 't-out'; el.textContent = '正在查询…';
    try {
      const j = await api('self');
      el.className = 't-out html';
      el.innerHTML = card(j);
    } catch (e) { out(el, '查询失败：' + e.message + '。稍后再试。'); }
  };
  $('#batch').onclick = async () => {
    const list = L.nonEmptyLines($('#ips').value).slice(0, 20);
    const el = $('#bres');
    if (!list.length) { out(el, '先粘几个 IP'); return; }
    out(el, '正在查询 ' + list.length + ' 个…');
    const rows = [['IP', '国家', '省份', '城市', '运营商', 'ASN', '时区']];
    for (const ip of list) {
      try {
        const j = await api('ip', ip);
        rows.push([ip, j.country || '', j.region || '', j.city || '', j.isp || '', j.asn || '', j.timezone || '']);
      } catch (e) { rows.push([ip, '查询失败：' + e.message, '', '', '', '', '']); }
    }
    out(el, L.toCSV(rows));
    K.download('ip-查询.csv', BOM + L.toCSV(rows), 'text/csv;charset=utf-8');
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
});
