/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const WORDS = '苹果 天空 河水 书本 灯火 山海 春风 石头 云朵 星辰 道路 窗台 咖啡 纸张 铃铛 羽毛 森林 沙漏 雨伞 镜子 钥匙 桥梁 麦田 铅笔 钟声 岛屿 棉花 帆船 陶罐 井水 松树 棋盘 信封 蜡烛 溪流 城墙 甘草 铜锁 竹帘 渔网'.split(' ');
  const api = gamePanel(root, { title: '语言记忆', hint: '判断这个词这局里见过没有', html: '<div id="vb-w" style="font-size:38px;font-weight:700;text-align:center;min-height:60px">准备</div><div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button type="button" class="t-btn primary" data-vb="seen">见过</button><button type="button" class="t-btn" data-vb="new">没见过</button></div>', actionLabel: '开始一局', onAction: (a) => { start(a); } });
  let seen = new Set(), pool = [], cur = '', curWasOld = false, lives = 3, score = 0;
  const start = (a) => { seen = new Set(); pool = L.shuffle(WORDS); lives = 3; score = 0; curWasOld = false; pick(a); a.setStats([{ label: '得分', value: 0 }, { label: '生命', value: 3 }]); };
  const pick = (a) => {
    const isOld = seen.size > 0 && Math.random() < 0.5;
    curWasOld = isOld;
    cur = isOld ? L.pick([...seen]) : (pool.find((w) => !seen.has(w)) || L.pick(WORDS));
    if (!isOld) seen.add(cur);
    a.stage.querySelector('#vb-w').textContent = cur;
    a.say(`这局已经出现过 ${seen.size} 个词`);
  };
  api.stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vb]'); if (!b || !cur) return;
    const answerOld = b.dataset.vb === 'seen', correct = answerOld === curWasOld;
    if (correct) { score++; api.say('✓ 对了'); } else { lives--; api.say(`✗ 错了，这个词${curWasOld ? '之前出现过' : '是新的'}。剩余 ${lives} 条命`); }
    api.setStats([{ label: '得分', value: score }, { label: '生命', value: lives }]);
    if (lives <= 0) { api.say(`本局结束，得分 ${score}。点「开始一局」重来`); cur = ''; api.stage.querySelector('#vb-w').textContent = '—'; }
    else pick(api);
  });
  api.setStats([{ label: '提示', value: '3 条命' }]);
});
