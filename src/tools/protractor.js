/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数字量角器</h2><span class="hint">陀螺仪测倾角 · 也能手动拖</span></div>
    <div class="t-row"><button type="button" class="t-btn primary" id="pr-gyro">开启陀螺仪</button><button type="button" class="t-btn" id="pr-zero">归零</button><button type="button" class="t-btn" id="pr-lock">锁定读数</button><button type="button" class="t-btn" id="pr-ab">记为 A → B 差角</button></div>
    <div class="t-out" id="pr-val" style="font-size:40px;font-weight:700;text-align:center;margin:14px 0">0.0°</div>
    <div class="t-hint" id="pr-msg" style="text-align:center">没开陀螺仪时，可以直接拖下面的圆盘量角（A→B 差角）。</div>
    <canvas id="pr-cv" width="320" height="180" style="display:block;margin:10px auto;touch-action:none;background:#f7f3ea;border-radius:8px"></canvas>
    <p class="t-hint">陀螺仪需要设备支持并在 HTTPS 下授权；手机贴着屋顶斜面 / 墙面读数更稳。屋顶坡度 = tan(倾角) × 100%。仅供参考，精密测量请用实物量角器。</p>
  </section></div>`;
  const cv = root.querySelector('#pr-cv'), g = cv.getContext('2d'), val = root.querySelector('#pr-val'), msg = root.querySelector('#pr-msg');
  let deg = 0, zero = 0, locked = false, A = null, gyro = false;
  const draw = () => {
    g.clearRect(0, 0, 320, 180); const cx = 160, cy = 160, R = 130;
    g.strokeStyle = '#b9b0a2'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.stroke();
    for (let a = 0; a <= 180; a += 10) { const r = a * Math.PI / 180, x1 = cx - Math.cos(r) * R, y1 = cy - Math.sin(r) * R, x2 = cx - Math.cos(r) * (R - (a % 30 === 0 ? 16 : 8)), y2 = cy - Math.sin(r) * (R - (a % 30 === 0 ? 16 : 8)); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    const r = deg * Math.PI / 180; g.strokeStyle = '#b4552d'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.cos(r) * R, cy - Math.sin(r) * R); g.stroke();
    g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fillStyle = '#b4552d'; g.fill();
  };
  const set = (d) => { if (locked) return; deg = L.clamp(d, 0, 180); val.textContent = L.round(deg - zero, 1) + '°'; draw(); };
  const pos = (e) => { const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * 320 / b.width - 160, y = (e.clientY - b.top) * 180 / b.height - 160; return (Math.atan2(-y, -x) * 180 / Math.PI + 180) % 180; };
  let dragging = false;
  cv.addEventListener('pointerdown', (e) => { dragging = true; set(pos(e)); });
  cv.addEventListener('pointermove', (e) => { if (dragging) set(pos(e)); });
  cv.addEventListener('pointerup', () => { dragging = false; });
  root.querySelector('#pr-zero').onclick = () => { zero = deg; val.textContent = '0.0°'; msg.textContent = '已把当前角度设为零位'; };
  root.querySelector('#pr-lock').onclick = () => { locked = !locked; msg.textContent = locked ? '读数已锁定，再点一次解锁' : '已解锁'; };
  root.querySelector('#pr-ab').onclick = () => { if (A === null) { A = deg; msg.textContent = `已记 A = ${L.round(A, 1)}°，再摆一次点这里出差角`; } else { msg.textContent = `A → B 差角 = ${L.round(Math.abs(deg - A), 1)}°`; A = null; } };
  root.querySelector('#pr-gyro').onclick = async () => {
    if (gyro) return;
    const DO = window.DeviceOrientationEvent;
    if (!DO) { msg.textContent = '这个设备/浏览器没有陀螺仪接口，用拖圆盘的方式量角吧'; return; }
    try { if (typeof DO.requestPermission === 'function') { const p = await DO.requestPermission(); if (p !== 'granted') { msg.textContent = '陀螺仪权限没给，改用手动拖动'; return; } } } catch (e) { msg.textContent = '陀螺仪授权失败，改用手动拖动'; return; }
    gyro = true; msg.textContent = '陀螺仪已开启，把手机贴住要测的面（beta 为相对水平面的倾角）';
    window.addEventListener('deviceorientation', (e) => { if (e.beta == null) return; const tilt = Math.abs(Number(e.beta) || 0); set(L.clamp(tilt > 90 ? 180 - tilt : tilt, 0, 180)); });
  };
  K.setAction('开启陀螺仪', () => root.querySelector('#pr-gyro').click());
  draw();
});
