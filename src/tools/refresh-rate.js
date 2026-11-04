/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>屏幕刷新率测试</h2><span class="hint">打开即测 · 5 秒出结果</span></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="rr-start">开始 5 秒测试</button><button type="button" class="t-btn" id="rr-full">全屏测峰值</button></div>
    <div class="t-stat-row" id="rr-stat" style="margin-top:14px"></div>
    <canvas id="rr-cv" width="600" height="120" style="width:100%;background:#161412;border-radius:8px;margin-top:12px"></canvas>
    <div id="rr-tracks" style="margin-top:14px"><div class="t-hint">三跑道拖影对比（30 / 60 / 原生帧）</div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="1.6" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#b4552d"></div></div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="3.2" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#6b8fa8"></div></div><div style="height:44px;position:relative;background:#f7f3ea;border-radius:6px;overflow:hidden;margin:6px 0"><div class="rr-ball" data-sp="6.4" style="position:absolute;top:8px;width:28px;height:28px;border-radius:50%;background:#7d9a76"></div></div></div>
    <p class="t-hint">用 requestAnimationFrame 的帧间隔统计实际刷新率。浏览器省电模式、多显示器不同 Hz、标签页在后台都会拉低读数，测的时候别切走。</p>
  </section></div>`;
  const cv = root.querySelector('#rr-cv'), g = cv.getContext('2d'), stat = root.querySelector('#rr-stat');
  let raf = null, times = [], running = false;
  const balls = Array.from(root.querySelectorAll('.rr-ball')); let bx = 0;
  const track = () => { bx += 2; if (bx > 620) bx = -30; balls.forEach((b) => { b.style.left = (bx * Number(b.dataset.sp) / 3) % 640 + 'px'; }); if (!running) requestAnimationFrame(track); };
  const frame = (t) => {
    times.push(t);
    if (times.length > 1) {
      const d = times.slice(1).map((x, i) => x - times[i]).filter((x) => x > 0 && x < 500);
      const avg = d.reduce((a, b) => a + b, 0) / Math.max(1, d.length), hz = 1000 / avg;
      const sorted = d.slice().sort((a, b) => a - b), low1 = sorted[Math.floor(sorted.length * 0.01)] || avg;
      const jitter = Math.sqrt(d.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, d.length));
      stat.innerHTML = `<div class="t-stat"><b>${L.round(hz, 1)}</b><span>实测 Hz</span></div><div class="t-stat"><b>${L.round(avg, 2)}</b><span>平均帧时 ms</span></div><div class="t-stat"><b>${L.round(jitter, 2)}</b><span>抖动 ms</span></div><div class="t-stat"><b>${L.round(1000 / low1, 1)}</b><span>1% low 等效 Hz</span></div><div class="t-stat"><b>${d.filter((x) => x > avg * 1.5).length}</b><span>掉帧</span></div>`;
      g.fillStyle = '#161412'; g.fillRect(0, 0, 600, 120); g.strokeStyle = '#7d9a76'; g.beginPath();
      d.slice(-200).forEach((x, i, a) => { const px = i / 199 * 600, py = 120 - L.clamp(x / 40 * 120, 0, 120); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
    }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { cancelAnimationFrame(raf); times = []; running = true; raf = requestAnimationFrame(frame); setTimeout(() => { running = false; cancelAnimationFrame(raf); requestAnimationFrame(track); stat.innerHTML += '<div class="t-stat"><b>完成</b><span>5 秒采样</span></div>'; }, 5000); };
  root.querySelector('#rr-start').onclick = start;
  root.querySelector('#rr-full').onclick = () => { const el = root.querySelector('#rr-tracks'); if (el.requestFullscreen) el.requestFullscreen(); start(); };
  K.setAction('开始 5 秒测试', start);
  requestAnimationFrame(track);
});
