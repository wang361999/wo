/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>在线尺子</h2><span class="hint">CSS 像素按 96 DPI 估算，建议先校准</span></div>
    <div class="t-row"><button type="button" class="t-btn" id="ru-dir">横 / 竖切换</button><label class="t-label">刻度 <select class="t-select" id="ru-unit"><option value="cm">厘米 cm</option><option value="in">英寸 inch</option></select></label><label class="t-label">校准：银行卡宽 85.6mm = <input class="t-input" id="ru-cal" type="number" value="323" style="width:90px"> px</label></div>
    <div id="ru-stage" style="margin-top:14px;overflow:auto;background:#f7f3ea;border:1px solid #ddd;border-radius:6px"></div>
    <p class="t-hint">屏幕的 CSS 像素和物理毫米不是一回事。拿一张银行卡（宽 85.6mm）贴在屏幕上，量出它占多少像素填进「校准」，刻度才准。手机浏览器缩放会影响结果。</p>
  </section></div>`;
  const stage = root.querySelector('#ru-stage'), unit = root.querySelector('#ru-unit'), cal = root.querySelector('#ru-cal');
  let vertical = false;
  const draw = () => {
    const ppmm = Number(cal.value) / 85.6, pxc = unit.value === 'cm' ? ppmm * 10 : ppmm * 25.4;
    const len = vertical ? 1400 : 1600, thick = vertical ? 90 : 74;
    stage.style.height = vertical ? '420px' : (thick + 16) + 'px';
    const cv = L.canvasOf(vertical ? thick : len, vertical ? len : thick), g = cv.getContext('2d');
    g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#8a8073'; g.fillStyle = '#3a352e'; g.font = '11px monospace'; g.lineWidth = 1;
    const minor = pxc / 10;
    for (let i = 0; i * minor < (vertical ? cv.height : cv.width); i++) {
      const p = Math.round(i * minor) + 0.5, big = i % 10 === 0, mid = i % 5 === 0;
      const h = big ? (vertical ? 34 : 34) : mid ? 22 : 12;
      g.beginPath();
      if (vertical) { g.moveTo(0, p); g.lineTo(h, p); } else { g.moveTo(p, 0); g.lineTo(p, h); }
      g.stroke();
      if (big && i > 0) { const label = String(i / 10); g.save(); if (vertical) { g.translate(40, p + 4); } else { g.translate(p + 3, 48); } g.fillText(label, 0, 0); g.restore(); }
    }
    stage.innerHTML = ''; cv.style.display = 'block'; cv.style.maxWidth = vertical ? '90px' : 'none'; stage.appendChild(cv);
  };
  unit.onchange = draw; cal.oninput = draw;
  root.querySelector('#ru-dir').onclick = () => { vertical = !vertical; draw(); };
  K.setAction('横 / 竖切换', () => root.querySelector('#ru-dir').click());
  draw();
});
