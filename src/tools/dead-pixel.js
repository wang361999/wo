/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>坏点检测</h2><span class="hint">纯色 / 线条 / 网格 · 全屏逐张看</span></div>
    <div class="t-row"><select class="t-select" id="dp-mode"><option value="solid">纯色</option><option value="lines">线条</option><option value="grid">网格</option></select><select class="t-select" id="dp-color"><option value="#000000">黑</option><option value="#ffffff">白</option><option value="#ff0000">红</option><option value="#00ff00">绿</option><option value="#0000ff">蓝</option><option value="#808080">灰</option></select><button type="button" class="t-btn" id="dp-next">下一张 →</button><button type="button" class="t-btn primary" id="dp-full">全屏检测</button><button type="button" class="t-btn" id="dp-report">导出报告</button></div>
    <div id="dp-stage" style="height:300px;border-radius:8px;margin-top:14px;position:relative;overflow:hidden;background:#000"></div>
    <div class="t-hint" id="dp-msg">全屏后逐张切换纯色，亮点/暗点会很明显。点击画面可以标记可疑坐标。</div>
  </section></div>`;
  const stage = root.querySelector('#dp-stage'), mode = root.querySelector('#dp-mode'), color = root.querySelector('#dp-color'), msg = root.querySelector('#dp-msg');
  const COLORS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#808080']; let ci = 0, marks = [];
  const draw = () => {
    const c = COLORS[ci % COLORS.length]; color.value = c;
    let bg = c;
    if (mode.value === 'lines') bg = `repeating-linear-gradient(0deg,${c} 0,${c} 2px,${c === '#000000' ? '#333' : '#bbb'} 2px,${c === '#000000' ? '#333' : '#bbb'} 4px)`;
    if (mode.value === 'grid') bg = `repeating-linear-gradient(0deg,${c} 0,${c} 19px,#888 20px),repeating-linear-gradient(90deg,${c} 0,${c} 19px,#888 20px)`;
    stage.style.background = bg;
    stage.innerHTML = marks.map((m) => `<div style="position:absolute;left:${m.x}px;top:${m.y}px;width:16px;height:16px;border:2px solid #ff0;border-radius:50%;transform:translate(-50%,-50%)"></div>`).join('');
    msg.textContent = `当前：${({ '#000000': '黑', '#ffffff': '白', '#ff0000': '红', '#00ff00': '绿', '#0000ff': '蓝', '#808080': '灰' })[c]} · ${mode.value === 'solid' ? '纯色' : mode.value === 'lines' ? '线条' : '网格'}　已标记 ${marks.length} 处可疑点`;
  };
  stage.onclick = (e) => { const b = stage.getBoundingClientRect(); marks.push({ x: Math.round(e.clientX - b.left), y: Math.round(e.clientY - b.top), color: COLORS[ci % COLORS.length] }); draw(); };
  root.querySelector('#dp-next').onclick = () => { ci++; draw(); };
  color.onchange = () => { ci = Math.max(0, COLORS.indexOf(color.value)); draw(); };
  mode.onchange = draw;
  root.querySelector('#dp-full').onclick = () => { if (stage.requestFullscreen) stage.requestFullscreen(); };
  root.querySelector('#dp-report').onclick = () => { const txt = ['坏点检测报告', '时间：' + new Date().toLocaleString('zh-CN'), '标记数：' + marks.length, ...marks.map((m, i) => `${i + 1}. (${m.x}, ${m.y}) 在 ${m.color} 底色下`)].join('\n'); K.copy(txt); K.toast('报告已复制，可粘贴保存'); };
  K.setAction('下一张', () => root.querySelector('#dp-next').click());
  draw();
});
