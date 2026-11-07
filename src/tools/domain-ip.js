/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>域名</h2><span class="hint">一行一个，最多 10 个</span></div>
    <textarea class="t-textarea" id="dom" rows="6" placeholder="example.com&#10;www.baidu.com">example.com</textarea>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">解析</button></div>
    <p class="t-hint">真实 DNS 查询（A / AAAA / CNAME），经本站同源接口向公共 DoH 取数并短期缓存。只有域名会送到服务端，文件与页面里其它输入不上传。</p>
  </section><section class="t-panel">
    <div class="t-head"><h2><span class="step">2</span>解析结果</h2><span class="hint">A / AAAA / CNAME</span></div>
    <div class="t-out" id="res">等待解析。</div>
    <div class="t-actions"><button class="t-btn" type="button" id="csv">导出 CSV</button></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const esc = L.esc;
  const BOM = String.fromCharCode(0xFEFF);
  let last = [['域名', '类型', '值', 'TTL(秒)']];
  const api = async (host) => {
    const r = await fetch('/api/net?mode=host&q=' + encodeURIComponent(host));
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.detail || j.error || ('HTTP ' + r.status));
    return j;
  };
  const label = (t) => t === 'A' ? 'A / IPv4' : t === 'AAAA' ? 'AAAA / IPv6' : 'CNAME';
  $('#go').onclick = async () => {
    const names = L.nonEmptyLines($('#dom').value).slice(0, 10);
    const el = $('#res');
    if (!names.length) { el.textContent = '先填域名'; return; }
    el.className = 't-out'; el.textContent = '解析中…';
    last = [['域名', '类型', '值', 'TTL(秒)']];
    const cdns = [], sources = [];
    let stale = false;
    for (const n of names) {
      try {
        const j = await api(n);
        if (!j.answers || !j.answers.length) last.push([n, '—', '没有解析记录', '']);
        for (const a of j.answers) last.push([n, label(a.type), a.value, String(a.ttl || '')]);
        if (j.cdn) cdns.push(esc(n) + ' → ' + esc(j.cdn));
        if (j.source && sources.indexOf(j.source) < 0) sources.push(j.source);
        stale = stale || !!j.stale;
      } catch (e) { last.push([n, '查询失败', e.message, '']); }
    }
    const rows = last.slice(1).map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('');
    el.className = 't-out html';
    el.innerHTML = '<table class="t-table"><thead><tr><th>域名</th><th>类型</th><th>值</th><th>TTL</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (cdns.length ? '<p class="t-hint">识别到 CDN：' + cdns.join('；') + '。CNAME 指向这些厂商通常说明域名接了 CDN。</p>' : '') +
      '<p class="t-hint">' + (stale ? '实时查询暂不可用，部分是上一次成功的结果。' : '真实 DNS 解析结果，服务端缓存 10 分钟。') +
      (sources.length ? '来源：' + esc(sources.join(' / ')) : '') + '</p>';
  };
  $('#csv').onclick = () => { K.download('域名解析.csv', BOM + L.toCSV(last), 'text/csv;charset=utf-8'); };
});
