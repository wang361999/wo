/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default customTool((root, K) => {
  const ALG = [
    ['底层十字', 'F R U R\' U\' F\'', '先做白色小花，再对齐中心翻下去'],
    ['F2L 第一组', 'U R U\' R\'', '把角块和棱块配对一起塞进槽'],
    ['OLL 点→十字', 'F R U R\' U\' F\'', '顶面只求同色，不管侧面'],
    ['OLL 小鱼', 'R U R\' U R U2 R\'', '经典 Sune，识别鱼头朝向'],
    ['PLL 三棱换(Ua)', 'R U\' R U R U R U\' R\' U\' R2', '顶层棱块循环'],
    ['PLL 三角换(Aa)', 'x R\' U R\' D2 R U\' R\' D2 R2', '顶角循环，x 是整体转体'],
    ['T-perm', 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'', '换两角两棱，最常用的 PLL 之一'],
  ];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>魔方 CFOP 公式速查</h2><span class="hint">2D 六面展开图 · 非 3D 引擎</span></div>
    <div class="t-hint" style="padding:10px;background:#f6efe3;border-radius:8px;margin-bottom:10px">这里给的是<b>公式速查与六面展开图演示</b>，不是 3D 魔方模拟器：没有逐块物理旋转与任意打乱求解。符号 U/D/L/R/F/B 是面转，带 <code>'</code> 是逆时针、带 2 是转两次，x/y/z 是整体转体。</div>
    <div class="t-row"><select class="t-select" id="rb-alg">${ALG.map((a, i) => `<option value="${i}">${L.esc(a[0])}</option>`).join('')}</select><button type="button" class="t-btn primary" id="rb-play">▶ 播放公式</button><button type="button" class="t-btn" id="rb-copy">复制公式</button><button type="button" class="t-btn" id="rb-reset">复位六面</button></div>
    <div id="rb-net" style="display:grid;grid-template-columns:repeat(4,60px);grid-template-rows:repeat(3,60px);gap:3px;justify-content:center;margin:16px 0"></div>
    <div class="t-hint" id="rb-info" style="text-align:center"></div>
    <p class="t-hint">展开图按「上 / 左前右后 / 下」排布，播放公式时会依次高亮当前转动的面，帮你把符号和空间对应起来。想真练手请用实体魔方或 3D 模拟器。</p>
  </section></div>`;
  const net = root.querySelector('#rb-net'), info = root.querySelector('#rb-info'), sel = root.querySelector('#rb-alg');
  const C = ['#b4552d', '#f5efe4', '#7d9a76', '#e8c34a', '#6b8fa8', '#e88a3c'];
  const CELL = { U: { r: 0, c: 1 }, L: { r: 1, c: 0 }, F: { r: 1, c: 1 }, R: { r: 1, c: 2 }, B: { r: 1, c: 3 }, D: { r: 2, c: 1 } };
  let colors = Array.from({ length: 6 }, (_, i) => Array(9).fill(i));
  const draw = (hi) => { net.innerHTML = ''; Object.entries(CELL).forEach(([face, pos]) => { const d = document.createElement('div'); d.style.cssText = `grid-row:${pos.r + 1};grid-column:${pos.c + 1};display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#2f2b26;border-radius:3px;padding:2px;${hi === face ? 'outline:3px solid #b4552d' : ''}`; d.innerHTML = colors[Object.keys(CELL).indexOf(face)].map((x) => `<div style="background:${C[x]};border-radius:2px"></div>`).join(''); d.title = face + ' 面'; net.appendChild(d); }); };
  const rotate = (face) => { const i = Object.keys(CELL).indexOf(face); if (i >= 0) { const a = colors[i]; colors[i] = [a[6], a[3], a[0], a[7], a[4], a[1], a[8], a[5], a[2]]; } };
  sel.onchange = () => { info.textContent = ALG[Number(sel.value)][2]; };
  root.querySelector('#rb-copy').onclick = () => K.copy(ALG[Number(sel.value)][1]);
  root.querySelector('#rb-reset').onclick = () => { colors = Array.from({ length: 6 }, (_, i) => Array(9).fill(i)); draw(); info.textContent = '六面已复位'; };
  root.querySelector('#rb-play').onclick = async () => { const toks = ALG[Number(sel.value)][1].replace(/[xyz2']/g, '').split(/\s+/).filter(Boolean); for (const t of toks) { const f = t[0]; rotate(f); draw(f); info.textContent = `正在转 ${t} 面`; await new Promise((r) => setTimeout(r, 420)); } draw(); info.textContent = '公式播放完毕：' + ALG[Number(sel.value)][2]; };
  K.setAction('▶ 播放公式', () => root.querySelector('#rb-play').click());
  draw(); info.textContent = ALG[0][2];
});
