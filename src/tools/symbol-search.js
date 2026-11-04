/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const SYM = ['◆', '●', '▲', '■', '★', '✚', '◇', '○', '△', '□', '✦', '⬟', '⬢', '✱', '◈'];
  const api = gamePanel(root, { title: '符号搜索', hint: '左边两个目标，右边五个里有没有出现？（→ 有 / ← 没有）', html: '<div id="ss-row" style="display:flex;gap:20px;justify-content:center;align-items:center;font-size:34px;min-height:80px"></div><div style="display:flex;gap:10px;justify-content:center;margin-top:10px"><button type="button" class="t-btn primary" data-ss="yes">→ 有</button><button type="button" class="t-btn" data-ss="no">← 没有</button></div>', actionLabel: '开始 / 下一题', onAction: (a) => { next(a); } });
  let cur = null, n = 0, right = 0;
  const next = (a) => {
    const tg = L.shuffle(SYM).slice(0, 2), has = Math.random() < 0.6;
    const five = L.shuffle(SYM.filter((s) => !tg.includes(s))).slice(0, 5);
    if (has) five[L.randInt(0, 4)] = L.pick(tg);
    cur = { has: five.some((s) => tg.includes(s)) };
    a.stage.querySelector('#ss-row').innerHTML = `<div style="padding:10px 16px;background:#f3eee6;border-radius:8px">${tg.join(' ')}</div><div style="opacity:.4">｜</div><div style="padding:10px 16px;background:#f3eee6;border-radius:8px">${five.join(' ')}</div>`;
    a.say(`第 ${n + 1} 题：左边两个符号，有没有在右边出现？`); a.label('重出一道');
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ss]'); if (!b || !cur) return;
    n++; const correct = (b.dataset.ss === 'yes') === cur.has; if (correct) right++;
    api.setStats([{ label: '已答', value: n + ' 题' }, { label: '正确率', value: L.round(right / n * 100, 0) + '%' }]);
    api.say(correct ? '✓ 对了' : `✗ 错了，答案是有`); next(api);
  });
  api.setStats([{ label: '提示', value: '键盘 → / ← 也行' }]);
});
