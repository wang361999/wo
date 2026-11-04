/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work" style="grid-template-columns:1fr 1fr">
    <section class="t-panel"><div class="t-head"><h2><span class="step">1</span>Markdown</h2><span class="hint">实时预览</span></div>
      <textarea class="t-textarea" id="md" rows="18" style="min-height:380px"># 标题

这是一段 **粗体** 和 *斜体*，还有 \`代码\`。

- 列表一
- 列表二

> 引用一句话

| 列 A | 列 B |
| --- | --- |
| 1 | 2 |
</textarea>
      <div class="t-actions"><button class="t-btn" type="button" id="ins">插入图片(Base64)</button><button class="t-btn" type="button" id="clr">清空</button></div>
    </section>
    <section class="t-panel"><div class="t-head"><h2><span class="step">2</span>预览 / HTML</h2><span class="hint" id="n">—</span></div>
      <div id="prev" class="t-out html" style="max-height:420px;overflow:auto"></div>
      <div class="t-actions"><button class="t-btn" type="button" id="cphtml">复制 HTML</button><button class="t-btn" type="button" id="dlm">下载 .md</button><button class="t-btn" type="button" id="dlh">下载 .html</button></div>
    </section></div><input type="file" id="img" accept="image/*" hidden>`;
  const $ = (s) => root.querySelector(s);
  let html = '';
  const render = async () => {
    const md = $('#md').value;
    try {
      const marked = await vendor('marked');
      html = marked.parse ? marked.parse(md) : marked(md);
      $('#prev').innerHTML = `<div class="md-body">${html}</div>`;
      $('#n').textContent = `${md.length} 字符`;
    } catch (e) { $('#prev').textContent = '预览失败：' + e.message; }
  };
  const style = `<style>.md-body{font-size:14px;line-height:1.8}.md-body h1,.md-body h2,.md-body h3{border-bottom:1px solid var(--line);padding-bottom:5px}.md-body code{background:var(--paper);padding:1px 5px;border-radius:4px}.md-body pre{background:var(--paper);padding:11px;overflow:auto;border-radius:8px}.md-body blockquote{border-left:3px solid var(--accent);margin:10px 0;padding:4px 12px;color:var(--ink-2)}.md-body table{border-collapse:collapse}.md-body td,.md-body th{border:1px solid var(--line);padding:5px 9px}.md-body img{max-width:100%}</style>`;
  const head = document.createElement('div'); head.innerHTML = style;
  document.head.appendChild(head.firstElementChild);
  $('#md').oninput = render;
  $('#cphtml').onclick = () => K.copy(html);
  $('#dlm').onclick = () => K.download('document.md', $('#md').value, 'text/markdown;charset=utf-8');
  $('#dlh').onclick = () => K.download('document.html', `<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8">${style}<body class="md-body">${html}</body></html>`, 'text/html;charset=utf-8');
  $('#clr').onclick = () => { $('#md').value = ''; render(); };
  $('#ins').onclick = () => $('#img').click();
  $('#img').onchange = async () => { const f = $('#img').files[0]; if (!f) return; const du = await L.readFile(f, 'dataurl'); const ta = $('#md'); ta.value += `\n![](${du})\n`; render(); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) L.readFile(f, 'dataurl').then((du) => { $('#md').value += `\n![](${du})\n`; render(); }); });
  K.setAction('复制 HTML', () => K.copy(html));
  render();
});
