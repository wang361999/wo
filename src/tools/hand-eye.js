/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const api = gamePanel(root, { title: '手眼协调', hint: '先点停水平球，再点停垂直球，交点到圈里得分', html: '<div id="he-stage" style="position:relative;width:300px;height:300px;margin:0 auto;background:#f7f3ea;border-radius:8px;overflow:hidden"><div id="he-h" style="position:absolute;left:0;top:50%;width:16px;height:16px;border-radius:50%;background:#b4552d;transform:translateY(-50%)"></div><div id="he-v" style="position:absolute;top:0;left:50%;width:16px;height:16px;border-radius:50%;background:#6b8fa8;transform:translateX(-50%)"></div><div id="he-target" style="position:absolute;left:50%;top:50%;width:60px;height:60px;border:2px dashed #7d9a76;border-radius:50%;transform:translate(-50%,-50%)"></div><div id="he-dot" style="position:absolute;width:12px;height:12px;border-radius:50%;background:#2f2b26;display:none;transform:translate(-50%,-50%)"></div></div>', actionLabel: '开始一轮', onAction: (a) => { begin(a); } });
  let phase = 0, hx = 0, vy = 0, raf = null, t = 0, score = 0, rounds = 0;
  const stage = api.stage.querySelector('#he-stage'), bh = api.stage.querySelector('#he-h'), bv = api.stage.querySelector('#he-v'), dot = api.stage.querySelector('#he-dot');
  const loop = () => { t += 0.016; hx = (Math.sin(t * 2.1) * 0.5 + 0.5) * 284; vy = (Math.sin(t * 1.7 + 1) * 0.5 + 0.5) * 284; bh.style.left = hx + 'px'; bv.style.top = vy + 'px'; raf = requestAnimationFrame(loop); };
  const begin = (a) => { phase = 1; t = 0; dot.style.display = 'none'; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); a.say('先点一下停住水平方向那颗红球'); a.label('点停水平球'); };
  stage.addEventListener('click', () => {
    if (phase === 1) { cancelAnimationFrame(raf); phase = 2; api.say(`水平停在 ${L.round(hx, 0)}px。现在点一下停住垂直那颗蓝球`); api.label('点停垂直球'); raf = requestAnimationFrame(loop); return; }
    if (phase === 2) { cancelAnimationFrame(raf); phase = 0; const dx = hx + 8 - 150, dy = vy + 8 - 150, d = Math.hypot(dx, dy); const pts = d < 12 ? 100 : d < 30 ? 60 : d < 60 ? 20 : 0; score += pts; rounds++; dot.style.left = hx + 8 + 'px'; dot.style.top = vy + 8 + 'px'; dot.style.display = 'block'; api.setStats([{ label: '本轮', value: pts + ' 分' }, { label: '累计', value: score + ' 分' }, { label: '轮数', value: rounds }]); api.say(`落点离圆心 ${L.round(d, 0)}px，得 ${pts} 分。${pts >= 60 ? '不错' : '再练提前量'}`); api.label('再来一轮'); }
  });
  api.setStats([{ label: '提示', value: '练的是提前量' }]);
});
