/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work" style="grid-template-columns:1fr 1fr">
    <section class="t-panel"><div class="t-head"><h2><span class="step">1</span>Markdown</h2><span class="hint">本地渲染</span></div>
      <textarea class="t-textarea" id="md" rows="16" style="min-height:340px"># 一篇小文章

写点什么，**重点**加粗，顺手来个列表：

- 第一件事
- 第二件事

> 引用一句喜欢的话

\`\`\`js
console.log('hello');
\`\`\`
</textarea>
      <div class="t-field" style="margin-top:12px"><label class="t-label">主题</label><select class="t-select" id="theme"><option>素墨</option><option>暖纸</option><option>青蓝</option><option>暗夜</option></select></div>
    </section>
    <section class="t-panel"><div class="t-head"><h2><span class="step">2</span>公众号预览</h2><span class="hint">一键复制带样式</span></div>
      <div id="prev" class="t-out html" style="max-height:400px;overflow:auto;background:#fff"></div>
      <div class="t-actions"><button class="t-btn primary" type="button" id="cp">复制到公众号（带格式）</button></div>
      <p class="t-hint">复制的是带内联样式的富文本；粘进公众号编辑器后段落、标题、引用、代码块样式都会保留。微信会过滤部分 CSS，预览与最终效果可能有细微差别。</p>
    </section></div>`;
  const $ = (s) => root.querySelector(s);
  const TH = {
    '素墨': { c: '#333', a: '#b4552d', bg: '#fff', q: '#f7f2e8', code: '#f5f3ef', b: '#b4552d' },
    '暖纸': { c: '#4a3b2a', a: '#c07a3e', bg: '#fffaf2', q: '#f6ecdb', code: '#f3ead9', b: '#c07a3e' },
    '青蓝': { c: '#2c3e50', a: '#2b7a9b', bg: '#fff', q: '#eaf4f7', code: '#eef3f5', b: '#2b7a9b' },
    '暗夜': { c: '#e8e4da', a: '#e0a56a', bg: '#242220', q: '#332f2b', code: '#2e2a27', b: '#e0a56a' },
  };
  let rich = '';
  const render = async () => {
    const t = TH[$('#theme').value];
    let h = (await vendor('marked')).parse($('#md').value);
    h = h.replace(/<h1>/g, `<h1 style="font-size:21px;font-weight:700;color:${t.c};border-bottom:2px solid ${t.b};padding-bottom:9px;margin:22px 0 16px">`)
      .replace(/<h2>/g, `<h2 style="font-size:18px;font-weight:700;color:${t.c};margin:20px 0 12px;padding-left:10px;border-left:4px solid ${t.b}">`)
      .replace(/<h3>/g, `<h3 style="font-size:16px;font-weight:700;color:${t.c};margin:16px 0 10px">`)
      .replace(/<p>/g, `<p style="font-size:15px;line-height:1.9;color:${t.c};margin:12px 0;letter-spacing:.3px">`)
      .replace(/<li>/g, `<li style="font-size:15px;line-height:1.9;color:${t.c};margin:4px 0">`)
      .replace(/<ul>/g, `<ul style="padding-left:22px;margin:10px 0">`)
      .replace(/<ol>/g, `<ol style="padding-left:22px;margin:10px 0">`)
      .replace(/<strong>/g, `<strong style="color:${t.a}">`)
      .replace(/<blockquote>/g, `<blockquote style="background:${t.q};border-left:3px solid ${t.b};padding:10px 14px;margin:14px 0;color:${t.c}">`)
      .replace(/<pre><code/g, `<pre style="background:${t.code};padding:13px;border-radius:7px;overflow:auto;font-size:13px;line-height:1.7"><code`)
      .replace(/<code>/g, `<code style="background:${t.code};padding:2px 5px;border-radius:4px;font-size:13px;color:${t.a}">`)
      .replace(/<table>/g, `<table style="border-collapse:collapse;width:100%;margin:14px 0">`)
      .replace(/<th>/g, `<th style="border:1px solid #ddd;padding:7px 10px;background:${t.q}">`)
      .replace(/<td>/g, `<td style="border:1px solid #ddd;padding:7px 10px">`)
      .replace(/<img /g, `<img style="max-width:100%;border-radius:6px" `);
    rich = `<section style="background:${t.bg};padding:16px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif">${h}</section>`;
    $('#prev').innerHTML = rich;
  };
  $('#md').oninput = render; $('#theme').onchange = render;
  $('#cp').onclick = async () => {
    const el = $('#prev');
    const r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    try { document.execCommand('copy'); K.toast('已复制带格式内容，去公众号粘贴'); } catch (e) { K.copy($('#md').value); }
    sel.removeAllRanges();
  };
  K.setAction('复制到公众号', () => $('#cp').click());
  render();
});
