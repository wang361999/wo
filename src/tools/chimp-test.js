/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const api = gamePanel(root, { title: '猩猩测试（Chimp Test）', hint: '点 1 后方块全遮，凭记忆按序点', html: '<div id="ch-grid" style="display:grid;gap:6px;max-width:420px;margin:0 auto"></div>', actionLabel: '开始 / 下一关',
    onAction: (a) => { next(a); } });
  let level = 4, seq = [], target = 1, showing = true, misses = 0;
  const next = (a) => {
    seq = L.shuffle(Array.from({ length: level }, (_, i) => i + 1));
    const cols = Math.ceil(Math.sqrt(level * 1.4));
    a.stage.querySelector('#ch-grid').style.gridTemplateColumns = `repeat(${cols},1fr)`;
    a.stage.querySelector('#ch-grid').innerHTML = seq.map((n) => `<button type="button" class="t-btn" data-ch="${n}" style="height:56px;font-size:20px">${n}</button>`).join('');
    showing = true; target = 1; a.label('记一下…'); a.say(`第 ${level - 3} 关：记住 1~${level} 的位置`);
    setTimeout(() => { a.stage.querySelectorAll('[data-ch]').forEach((b) => { b.textContent = '■'; b.style.background = '#b4552d'; }); showing = false; a.say('现在按 1 → ' + level + ' 的顺序点'); a.label('重来'); }, 1800 + level * 120);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ch]'); if (!b || showing) return;
    const n = Number(b.dataset.ch);
    if (n === target) { b.style.background = '#7d9a76'; b.style.color = '#fff'; target++; if (target > level) { level++; misses = 0; api.setStats([{ label: '当前关卡', value: level - 3 }, { label: '方块数', value: level }]); api.say('✓ 过关！下一关方块更多'); api.label('下一关'); } }
    else { misses++; b.style.background = '#a35d5d'; api.say(`点错了，应该点 ${target}。失误 ${misses} 次，点「开始 / 下一关」重试这一关`); }
  });
  api.setStats([{ label: '起始', value: '4 个' }]);
});
