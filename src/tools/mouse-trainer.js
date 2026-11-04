/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const api = gamePanel(root, { title: '鼠标练习', hint: '点中出现的目标，看反应与精度', html: '<div id="mt-stage" style="position:relative;height:300px;background:#f7f3ea;border-radius:8px;overflow:hidden"></div>', actionLabel: '开始训练（10 个）', onAction: (a) => { begin(a); } });
  const stage = api.stage.querySelector('#mt-stage');
  let left = 0, times = [], t0 = 0, miss = 0;
  const spawn = (a) => { stage.innerHTML = ''; const d = document.createElement('button'); d.type = 'button'; d.className = 't-btn primary'; d.style.cssText = 'position:absolute;width:38px;height:38px;border-radius:50%;padding:0'; d.style.left = L.randInt(10, 360) + 'px'; d.style.top = L.randInt(10, 250) + 'px'; d.textContent = '●'; d.onclick = (e) => { e.stopPropagation(); times.push(Date.now() - t0); t0 = Date.now(); left--; if (left > 0) spawn(a); else finish(a); }; stage.appendChild(d); };
  const finish = (a) => { stage.innerHTML = ''; const avg = times.reduce((x, y) => x + y, 0) / Math.max(1, times.length); api.setStats([{ label: '平均反应', value: L.round(avg, 0) + ' ms' }, { label: '最快', value: Math.min(...times, 9999) + ' ms' }, { label: '误点', value: miss + ' 次' }]); api.say(`完成 ${times.length} 个目标，平均 ${L.round(avg, 0)} ms`); api.label('再来一轮'); };
  const begin = (a) => { left = 10; times = []; miss = 0; t0 = Date.now(); a.say('点掉出现的圆点，10 个一轮'); a.label('重新开始'); spawn(a); };
  stage.addEventListener('click', () => { if (left > 0) { miss++; api.say(`点空了，误点 ${miss} 次`); } });
  api.setStats([{ label: '目标', value: '10 个' }]);
});
