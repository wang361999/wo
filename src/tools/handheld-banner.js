/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>手持弹幕</h2><span class="hint">横屏滚动大字 · 防熄屏</span></div>
    <div class="t-row"><input class="t-input grow" id="hb-text" value="欢迎回家！"><input class="t-input" id="hb-color" type="color" value="#ff3b6b" style="width:60px;height:40px;padding:3px"><input class="t-input" id="hb-bg" type="color" value="#101014" style="width:60px;height:40px;padding:3px"></div>
    <div class="t-row" style="margin:12px 0"><label class="t-label">字号 <input class="t-range" id="hb-size" type="range" min="40" max="200" value="110"></label><label class="t-label">速度 <input class="t-range" id="hb-speed" type="range" min="20" max="300" value="120"></label><label class="t-check"><input type="checkbox" id="hb-mirror">镜像</label><button type="button" class="t-btn" id="hb-full">全屏</button></div>
    <div id="hb-stage" style="height:240px;border-radius:8px;overflow:hidden;position:relative;background:#101014;display:flex;align-items:center"><div id="hb-inner" style="white-space:nowrap;font-weight:900;font-size:110px;color:#ff3b6b;will-change:transform;padding-left:100%"></div></div>
    <div class="t-actions" style="margin-top:12px"><button type="button" class="t-btn primary" id="hb-play">开始滚动</button><button type="button" class="t-btn" id="hb-stop">暂停</button></div>
    <p class="t-hint">全屏后会尝试申请「屏幕常亮」（Wake Lock），部分浏览器不支持。镜像用于自拍时让字反向，别人看才是正的。</p>
  </section></div>`;
  const text = root.querySelector('#hb-text'), inner = root.querySelector('#hb-inner'), stage = root.querySelector('#hb-stage'), size = root.querySelector('#hb-size'), speed = root.querySelector('#hb-speed'), color = root.querySelector('#hb-color'), bg = root.querySelector('#hb-bg'), mirror = root.querySelector('#hb-mirror');
  let raf = null, x = 0, last = 0, wake = null;
  const sync = () => { inner.textContent = text.value; inner.style.fontSize = size.value + 'px'; inner.style.color = color.value; stage.style.background = bg.value; inner.style.transform = `scaleX(${mirror.checked ? -1 : 1}) translateX(${-x}px)`; };
  const frame = (t) => { if (!last) last = t; x += Number(speed.value) * (t - last) / 1000; last = t; if (x > inner.scrollWidth + stage.clientWidth) x = 0; inner.style.transform = `scaleX(${mirror.checked ? -1 : 1}) translateX(${-x}px)`; raf = requestAnimationFrame(frame); };
  const play = async () => { if (raf) return; last = 0; raf = requestAnimationFrame(frame); try { if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); } catch (e) {} };
  const stop = () => { cancelAnimationFrame(raf); raf = null; if (wake) { wake.release(); wake = null; } };
  [text, size, color, bg, mirror].forEach((e) => e.addEventListener('input', sync));
  root.querySelector('#hb-play').onclick = play;
  root.querySelector('#hb-stop').onclick = stop;
  root.querySelector('#hb-full').onclick = async () => { try { await stage.requestFullscreen(); } catch (e) { K.toast('全屏没被允许'); } };
  K.setAction('开始 / 暂停', () => { if (raf) stop(); else play(); });
  sync();
});
