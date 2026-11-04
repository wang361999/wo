/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const api = gamePanel(root, { title: '数字记忆', hint: '记住数字，位数逐关增加', html: '<div id="nm-show" style="font-size:52px;font-weight:700;text-align:center;letter-spacing:6px;min-height:70px"></div><input class="t-input" id="nm-in" placeholder="把数字打在这里，回车提交" style="font-size:22px;text-align:center;margin-top:10px" disabled>', actionLabel: '开始 / 下一关', onAction: (a) => { next(a); } });
  let level = 1, cur = '', lives = 3;
  const next = (a) => {
    cur = Array.from({ length: level }, () => L.randInt(0, 9)).join('');
    const show = a.stage.querySelector('#nm-show'), inp = a.stage.querySelector('#nm-in');
    show.textContent = cur; inp.value = ''; inp.disabled = true; a.say(`第 ${level} 关：记住这 ${level} 位数`); a.label('记一下…');
    setTimeout(() => { show.textContent = '•'.repeat(level); inp.disabled = false; inp.focus(); a.say('把刚才的数字打出来，回车提交'); a.label('重来'); }, 1000 + level * 500);
  };
  api.stage.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.id !== 'nm-in') return;
    const inp = e.target, val = inp.value.trim(); if (!val) return;
    if (val === cur) { level++; lives = 3; api.setStats([{ label: '关卡', value: level }, { label: '位数', value: level }]); api.say('✓ 对了，下一位数更长'); api.label('下一关'); }
    else { lives--; api.say(`错了，刚才其实是 ${cur}。剩余 ${lives} 次机会`); if (lives <= 0) { level = 1; lives = 3; } }
  });
  api.setStats([{ label: '起始', value: '1 位' }]);
});
