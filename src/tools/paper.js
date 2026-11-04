/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const T = {
    '横线笔记': 'repeating-linear-gradient(#fff 0,#fff 27px,#c9d6e5 28px,#fff 29px)',
    '方格坐标': 'repeating-linear-gradient(0deg,#fff 0,#fff 19px,#d9e2ea 20px),repeating-linear-gradient(90deg,#fff 0,#fff 19px,#d9e2ea 20px)',
    '点阵': 'radial-gradient(#c4cfd9 1px,transparent 1.2px) 0 0/20px 20px',
    '米字格': 'repeating-linear-gradient(0deg,#e7cfc0 0 1px,transparent 1px 80px),repeating-linear-gradient(90deg,#e7cfc0 0 1px,transparent 1px 80px)',
    '康奈尔笔记': 'linear-gradient(90deg,transparent 0 28%,#d9c3b0 28% 28.4%,transparent 28.4%),linear-gradient(0deg,transparent 0 72%,#d9c3b0 72% 72.4%,transparent 72.4%),repeating-linear-gradient(#fff 0,#fff 27px,#c9d6e5 28px,#fff 29px)',
    '五线谱': 'repeating-linear-gradient(#fff 0,#fff 11px,#8a95a0 12px,#fff 13px,#fff 23px,#8a95a0 24px,#fff 25px,#fff 35px,#8a95a0 36px,#fff 37px,#fff 47px,#8a95a0 48px,#fff 49px,#fff 59px,#8a95a0 60px,#fff 61px,#fff 85px,#fff 86px)',
    '日程表': 'repeating-linear-gradient(0deg,#fff 0,#fff 59px,#c9d6e5 60px),repeating-linear-gradient(90deg,#fff 0,#fff 149px,#c9d6e5 150px)',
    '空白 A4': 'none',
  };
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>纸张模板</h2><span class="hint">选模板 → 打印或存 PDF</span></div>
    <div class="t-row"><select class="t-select" id="pp-tpl">${Object.keys(T).map((k) => `<option value="${L.esc(k)}">${L.esc(k)}</option>`).join('')}</select><select class="t-select" id="pp-size"><option value="A4">A4</option><option value="A5">A5</option></select><button type="button" class="t-btn primary" id="pp-print">打印 / 存为 PDF</button></div>
    <div id="pp-paper" style="background:#fff;margin:16px auto;width:100%;max-width:700px;aspect-ratio:210/297;box-shadow:0 2px 14px #0002;border-radius:2px"></div>
    <p class="t-hint">模板是纯 CSS 画的，打印时按比例铺满纸张。米字格 / 五线谱适合练字和记谱；想写内容可以打印后手写，或截图再标注。</p>
  </section></div>`;
  const tpl = root.querySelector('#pp-tpl'), paper = root.querySelector('#pp-paper'), size = root.querySelector('#pp-size');
  const draw = () => { paper.style.background = T[tpl.value]; paper.style.backgroundSize = 'auto'; paper.style.maxWidth = size.value === 'A5' ? '500px' : '700px'; };
  tpl.onchange = draw; size.onchange = draw;
  root.querySelector('#pp-print').onclick = () => {
    const src = root.querySelector('#pp-paper');
    const clone = src.cloneNode(true); clone.id = 'pp-print-paper';
    clone.style.cssText = 'background:' + src.style.background + ';background-size:auto;display:block!important;position:static!important;width:100%!important;height:100vh!important;max-width:none!important;aspect-ratio:auto!important;box-shadow:none!important;print-color-adjust:exact;-webkit-print-color-adjust:exact';
    document.body.appendChild(clone);
    const st = document.createElement('style');
    st.textContent = '@media print{body>*{display:none!important}#pp-print-paper{display:block!important}@page{size:A4;margin:0}}';
    document.head.appendChild(st);
    setTimeout(() => { window.print(); setTimeout(() => { clone.remove(); st.remove(); }, 800); }, 60);
  };
  K.setAction('打印 / 存为 PDF', () => root.querySelector('#pp-print').click());
  draw();
});
