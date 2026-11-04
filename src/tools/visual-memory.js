/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const api = gamePanel(root, { title: '视觉记忆', hint: '白块闪现后凭记忆点出来', html: '<div id="vm-grid" style="display:grid;gap:4px;max-width:420px;margin:0 auto"></div>', actionLabel: '开始 / 下一关', onAction: (a) => { next(a); } });
  let level = 3, targets = new Set(), picked = new Set(), lives = 3, showing = true;
  const next = (a) => {
    const side = Math.min(8, 2 + Math.floor(level / 2)), total = side * side, cnt = level;
    const cells = L.shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, cnt);
    targets = new Set(cells); picked = new Set(); showing = true;
    const g = a.stage.querySelector('#vm-grid'); g.style.gridTemplateColumns = `repeat(${side},1fr)`;
    g.innerHTML = Array.from({ length: total }, (_, i) => `<button type="button" class="t-btn" data-vm="${i}" style="aspect-ratio:1;background:${targets.has(i) ? '#fff' : '#ddd6cc'}"></button>`).join('');
    a.say(`第 ${level - 2} 关：记住 ${cnt} 个白块`); a.label('记一下…');
    setTimeout(() => { a.stage.querySelectorAll('[data-vm]').forEach((b) => { b.style.background = '#ddd6cc'; }); showing = false; a.say('把刚才的白块点出来'); a.label('重来'); }, 1000);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vm]'); if (!b || showing) return;
    const i = Number(b.dataset.vm); if (picked.has(i)) return;
    picked.add(i);
    if (targets.has(i)) { b.style.background = '#7d9a76'; if ([...targets].every((t) => picked.has(t))) { level++; api.setStats([{ label: '关卡', value: level - 2 }, { label: '剩余机会', value: lives }]); api.say('✓ 全对，下一关多一个白块'); api.label('下一关'); } }
    else { b.style.background = '#a35d5d'; lives--; api.setStats([{ label: '关卡', value: level - 2 }, { label: '剩余机会', value: lives }]); if (lives <= 0) { api.say('三条命用完了，点「开始 / 下一关」从头再来'); level = 3; lives = 3; } else api.say(`点错了，还剩 ${lives} 次机会`); }
  });
  api.setStats([{ label: '起始', value: '3 个' }]);
});
