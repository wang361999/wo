/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>手柄测试</h2><span class="hint">插上手柄按任意键连接</span></div>
    <div class="t-hint" id="gp-msg">还没检测到手柄。用 USB / 蓝牙连上后按任意一个键。</div>
    <div id="gp-btns" style="display:flex;flex-wrap:wrap;gap:6px;margin:14px 0"></div>
    <div class="t-row"><canvas id="gp-l" width="160" height="160" style="background:#f7f3ea;border-radius:8px"></canvas><canvas id="gp-r" width="160" height="160" style="background:#f7f3ea;border-radius:8px"></canvas><div id="gp-trig" style="flex:1"></div></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="gp-drift">摇杆漂移检测（3 秒）</button></div>
    <div class="t-hint" id="gp-driftout"></div>
  </section></div>`;
  const btns = root.querySelector('#gp-btns'), msg = root.querySelector('#gp-msg'), l = root.querySelector('#gp-l'), r = root.querySelector('#gp-r'), trig = root.querySelector('#gp-trig'), driftout = root.querySelector('#gp-driftout');
  const NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Home'];
  let raf = null, samples = [[], []], drift = false;
  const stick = (cv, x, y) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 160, 160); g.strokeStyle = '#c9c0b2'; g.beginPath(); g.arc(80, 80, 66, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(80, 14); g.lineTo(80, 146); g.moveTo(14, 80); g.lineTo(146, 80); g.stroke(); g.fillStyle = '#b4552d'; g.beginPath(); g.arc(80 + L.clamp(x, -1, 1) * 60, 80 + L.clamp(y, -1, 1) * 60, 9, 0, Math.PI * 2); g.fill(); };
  const loop = () => {
    const pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
    if (!pads.length) { msg.textContent = '还没检测到手柄。用 USB / 蓝牙连上后按任意一个键。'; btns.innerHTML = ''; }
    else {
      const p = pads[0]; msg.textContent = `已连接：${L.esc(p.id)}　${p.buttons.length} 个按键 / ${p.axes.length} 个轴`;
      btns.innerHTML = p.buttons.map((b, i) => `<span class="t-chip ${b.pressed ? 'on' : ''}" style="${b.pressed ? 'background:#b4552d;color:#fff' : ''}">${L.esc(NAMES[i] || 'B' + i)}${b.value > 0 && b.value < 1 ? ' ' + L.round(b.value, 2) : ''}</span>`).join('');
      const ax = p.axes; stick(l, ax[0] || 0, ax[1] || 0); stick(r, ax[2] || 0, ax[3] || 0);
      trig.innerHTML = p.buttons.slice(6, 8).map((b, i) => `<div class="t-label">${i ? 'RT' : 'LT'} ${L.round(b.value * 100, 0)}%</div><div style="background:#e7e0d4;height:14px;border-radius:7px"><div style="background:#b4552d;height:100%;width:${L.round(b.value * 100, 0)}%;border-radius:7px"></div></div>`).join('');
      if (drift) { samples[0].push(Math.hypot(ax[0] || 0, ax[1] || 0)); samples[1].push(Math.hypot(ax[2] || 0, ax[3] || 0)); }
    }
    raf = requestAnimationFrame(loop);
  };
  root.querySelector('#gp-drift').onclick = () => { samples = [[], []]; drift = true; driftout.textContent = '采样中… 手别碰摇杆'; setTimeout(() => { drift = false; const m = samples.map((s) => s.length ? Math.max(...s) : 0); driftout.textContent = `左摇杆最大偏移 ${L.round(m[0], 3)}，右摇杆 ${L.round(m[1], 3)}。${Math.max(...m) > 0.08 ? `建议死区设到 ${L.round(Math.max(...m) * 1.5, 2)} 以上` : '没发现明显漂移'}（静止时偏移应接近 0）`; }, 3000); };
  K.setAction('摇杆漂移检测', () => root.querySelector('#gp-drift').click());
  raf = requestAnimationFrame(loop);
});
