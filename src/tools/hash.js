/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>文本或文件</h2><span class="hint">本地计算</span></div>
    <textarea class="t-textarea" id="txt" rows="6" placeholder="要算摘要的文本…">hello world</textarea>
    <div class="t-drop" id="drop" style="margin-top:11px;min-height:86px"><div class="t">或拖一个文件算校验值</div><div class="s">点这里选文件，也可以 Ctrl+V</div><input type="file" id="file" hidden></div>
    <div class="t-field"><label class="t-label">算法</label><select class="t-select" id="algo"><option>md5</option><option>sha1</option><option>sha256</option></select></div>
    <div class="t-field"><label class="t-label">HMAC 密钥（留空则只算摘要）</label><input class="t-input" id="key" placeholder="可选"></div>
  </section><section class="t-panel">
    <div class="t-head"><h2><span class="step">2</span>摘要</h2><span class="hint">实时更新</span></div>
    <div class="t-out" id="out"></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="cp">复制摘要</button></div>
    <p class="t-hint" id="fileinfo"></p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let fileBuf = null, fileName = '';
  const calc = async () => {
    const algo = $('#algo').value, key = $('#key').value;
    const src = fileBuf || $('#txt').value;
    if (key) {
      const enc = new TextEncoder();
      const ckey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algo === 'md5' ? 'SHA-256' : algo.toUpperCase() }, false, ['sign']);
      const data = typeof src === 'string' ? enc.encode(src) : src;
      const sig = await crypto.subtle.sign('HMAC', ckey, data);
      $('#out').textContent = 'HMAC-' + (algo === 'md5' ? 'SHA-256' : algo.toUpperCase()) + '\n' + L.bytesToHex(sig);
    } else if (fileBuf) {
      // 文件：用 SubtleCrypto 算 SHA，MD5 走纯 JS
      if (algo === 'md5') $('#out').textContent = 'MD5（文件）\n' + L.hash(L.fromUtf8(fileBuf), 'md5');
      else { const d = await crypto.subtle.digest(algo.toUpperCase(), fileBuf); $('#out').textContent = algo.toUpperCase() + '\n' + L.bytesToHex(d); }
    } else $('#out').textContent = algo.toUpperCase() + '\n' + L.hash(String(src), algo);
    $('#fileinfo').textContent = fileName ? `当前对文件 ${fileName}（${L.humanSize(fileBuf.length)}）计算` : '当前对文本框内容计算';
  };
  ['#txt', '#algo', '#key'].forEach((s) => $(s).addEventListener('input', calc));
  const setFile = async (f) => { if (!f) return; fileBuf = new Uint8Array(await f.arrayBuffer()); fileName = f.name; $('#drop').querySelector('.t').textContent = f.name; await calc(); };
  $('#file').onchange = () => setFile($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { if (e.clipboardData?.files?.length) setFile(e.clipboardData.files[0]); });
  $('#cp').onclick = () => K.copy($('#out').textContent);
  K.setAction('复制摘要', () => K.copy($('#out').textContent));
  calc();
});
