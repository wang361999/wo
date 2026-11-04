/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>域名</h2><span class="hint">一行一个</span></div>
    <textarea class="t-textarea" id="dom" rows="6" placeholder="example.com&#10;www.baidu.com">example.com</textarea>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">解析</button></div>
    <p class="t-hint">用公共 DoH（DNS over HTTPS）查询，需要联网；域名本身会发给 DNS 服务商，文件不会上传。</p>
  </section><section class="t-panel">
    <div class="t-head"><h2><span class="step">2</span>解析结果</h2><span class="hint">A / AAAA / CNAME</span></div>
    <div class="t-out" id="res">等待解析。</div>
    <div class="t-actions"><button class="t-btn" type="button" id="csv">导出 CSV</button></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let last = [['域名', '类型', '值', 'TTL']];
  const doh = async (name, type) => {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { Accept: 'application/dns-json' } });
    if (!r.ok) throw new Error('DoH 请求失败');
    return (await r.json()).Answer || [];
  };
  $('#go').onclick = async () => {
    const names = L.nonEmptyLines($('#dom').value).slice(0, 20);
    if (!names.length) { $('#res').textContent = '先填域名'; return; }
    $('#res').textContent = '解析中…';
    last = [['域名', '类型', '值', 'TTL']];
    for (const n of names) {
      for (const t of ['A', 'AAAA', 'CNAME']) {
        try { for (const a of await doh(n, t)) last.push([n, t === 'A' ? 'A / IPv4' : t === 'AAAA' ? 'AAAA / IPv6' : 'CNAME', a.data, String(a.TTL)]); }
        catch (e) { last.push([n, t, '查询失败', '']); }
      }
    }
    const cn = last.filter((r) => r[1] === 'CNAME');
    $('#res').textContent = last.map((r) => r.join('\t')).join('\n') +
      (cn.length ? '\n\n出现 CNAME 通常说明该域名接了 CDN。' : '');
  };
  $('#csv').onclick = () => { K.download('域名解析.csv', '\\ufeff' + L.toCSV(last), 'text/csv;charset=utf-8'); };
});
