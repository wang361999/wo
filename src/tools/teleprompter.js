/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>提词器</h2><span class="hint">自动滚屏 · 可镜像 · 全屏</span></div>
    <textarea class="t-textarea" id="tp-text" rows="6" placeholder="把稿子粘进来">各位好，欢迎来到今天的内容。\n\n这里可以写好几段，滚动速度、字号和镜像都能调。\n\n对着镜头读，视线尽量别左右飘。</textarea>
    <div class="t-row" style="margin:12px 0"><label class="t-label">速度 <input class="t-range" id="tp-speed" type="range" min="10" max="200" value="60"></label><span id="tp-speedv">60</span><label class="t-label">字号 <input class="t-input" id="tp-size" type="number" value="36" style="width:80px"></label><label class="t-check"><input type="checkbox" id="tp-mirror">镜像翻转</label><button type="button" class="t-btn" id="tp-full">全屏</button></div>
    <div class="t-actions"><button type="button" class="t-btn primary" id="tp-play">开始滚动</button><button type="button" class="t-btn" id="tp-stop">暂停</button><button type="button" class="t-btn" id="tp-top">回到开头</button></div>
    <div id="tp-stage" style="margin-top:14px;height:320px;overflow:hidden;background:#161412;border-radius:8px;position:relative;color:#f5efe4"><div id="tp-inner" style="padding:60px 30px;line-height:1.8;white-space:pre-wrap;font-size:36px"></div></div>
    <p class="t-hint">镜像翻转用于透过分光玻璃拍摄；全屏按钮让提词器铺满屏幕。滚动全程在本机，不上传稿件。</p>
  </section></div>`;
  const text = root.querySelector('#tp-text'), inner = root.querySelector('#tp-inner'), stage = root.querySelector('#tp-stage'), speed = root.querySelector('#tp-speed'), size = root.querySelector('#tp-size'), mirror = root.querySelector('#tp-mirror');
  let raf = null, last = 0, pos = 0;
  const sync = () => { inner.textContent = text.value; inner.style.fontSize = size.value + 'px'; inner.style.transform = mirror.checked ? 'scaleX(-1)' : ''; root.querySelector('#tp-speedv').textContent = speed.value; };
  const step = (t) => { if (!last) last = t; const dt = t - last; last = t; pos += Number(speed.value) * dt / 1000 * 0.6; const max = Math.max(0, inner.scrollHeight - stage.clientHeight + 120); if (pos > max) pos = max; stage.scrollTop = pos; inner.style.transform = (mirror.checked ? 'scaleX(-1) ' : '') + `translateY(${-pos}px)`; raf = requestAnimationFrame(step); };
  const play = () => { if (raf) return; last = 0; raf = requestAnimationFrame(step); };
  const stop = () => { cancelAnimationFrame(raf); raf = null; };
  [text, size, mirror, speed].forEach((x) => x.addEventListener('input', sync));
  root.querySelector('#tp-play').onclick = play;
  root.querySelector('#tp-stop').onclick = stop;
  root.querySelector('#tp-top').onclick = () => { pos = 0; stage.scrollTop = 0; inner.style.transform = mirror.checked ? 'scaleX(-1)' : ''; };
  root.querySelector('#tp-full').onclick = () => { if (stage.requestFullscreen) stage.requestFullscreen(); else K.toast('这个浏览器不支持全屏'); };
  K.setAction('开始 / 暂停滚动', () => { if (raf) stop(); else play(); });
  sync();
});
