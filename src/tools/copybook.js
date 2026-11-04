import { customTool, canvasDownload, toast } from '/kit.js';
export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work">
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">1</span>字帖设置</h2><span class="hint">A4 直接打印</span></div>
      <div class="t-field"><label class="t-label" for="cbText">生字（连续输入，会自动填满整页）</label>
        <textarea id="cbText" class="t-textarea" rows="3" placeholder="天地人和山川日月">天地人和山川日月</textarea></div>
      <div class="t-field"><span class="t-label">格子样式</span><div class="t-chips" id="cbType">
        <button type="button" class="t-chip on" data-t="tian">田字格</button>
        <button type="button" class="t-chip" data-t="mi">米字格</button>
        <button type="button" class="t-chip" data-t="kong">空白格</button>
      </div></div>
      <div class="t-row">
        <div class="t-field grow"><label class="t-label" for="cbCols">每行格数</label>
          <input id="cbCols" class="t-range" type="range" min="4" max="12" step="1" value="8"></div>
        <div class="t-field grow"><label class="t-label" for="cbAlpha">范字深浅</label>
          <input id="cbAlpha" class="t-range" type="range" min="10" max="80" step="5" value="35"></div>
      </div>
      <div class="t-field"><label class="t-check"><input id="cbPinyin" type="checkbox">顶部留一行拼音格</label></div>
      <div class="t-actions"><button type="button" class="t-btn primary" id="cbPng">下载 PNG</button>
        <button type="button" class="t-btn" id="cbPrint">打印 / 存为 PDF</button></div>
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>预览</h2><span class="hint" id="cbInfo">A4 · 150dpi</span></div>
      <div class="t-preview" id="cbPrev" style="min-height:300px;align-items:flex-start"></div>
      <p class="t-hint">范字用系统楷体/宋体渲染，浅灰便于描红。打印时会自动隐藏设置区，只留这一页字帖。</p>
    </section>
  </div>`;
  const $ = (s) => K.$(s, root);
  let type = 'tian', cv = null;

  function build() {
    const W = 1240, H = 1754, M = 76;
    const cols = Number($('#cbCols').value) || 8;
    const cell = (W - M * 2) / cols;
    const top = $('#cbPinyin').checked ? M + 42 : M;
    const rows = Math.floor((H - M - top) / cell);
    cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    const chars = [...new Set([...$('#cbText').value.replace(/\s/g, '')])];
    const alpha = Number($('#cbAlpha').value) / 100;
    const font = `600 ${Math.round(cell * 0.68)}px "KaiTi", "STKaiti", "Kaiti SC", "Songti SC", serif`;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const x = M + col * cell, y = top + r * cell;
      const ch = chars.length ? chars[(r * cols + col) % chars.length] : '';
      // 外框
      c.strokeStyle = '#b9a98d'; c.lineWidth = 2; c.strokeRect(x, y, cell, cell);
      // 内部辅助线
      c.strokeStyle = '#dccdb0'; c.lineWidth = 1.4; c.setLineDash([6, 6]);
      c.beginPath();
      if (type !== 'kong') {
        c.moveTo(x, y + cell / 2); c.lineTo(x + cell, y + cell / 2);
        c.moveTo(x + cell / 2, y); c.lineTo(x + cell / 2, y + cell);
      }
      if (type === 'mi') {
        c.moveTo(x, y); c.lineTo(x + cell, y + cell);
        c.moveTo(x + cell, y); c.lineTo(x, y + cell);
      }
      c.stroke(); c.setLineDash([]);
      // 范字
      if (ch) {
        c.globalAlpha = alpha; c.fillStyle = '#2b2a26'; c.font = font;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(ch, x + cell / 2, y + cell / 2 + cell * 0.02);
        c.globalAlpha = 1;
      }
      // 拼音格
      if ($('#cbPinyin').checked && r === 0) {
        c.strokeStyle = '#e2d7c2'; c.lineWidth = 1; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(x, M); c.lineTo(x + cell, M); c.moveTo(x, M + 20); c.lineTo(x + cell, M + 20);
        c.moveTo(x + cell / 2, M); c.lineTo(x + cell / 2, M + 20); c.stroke(); c.setLineDash([]);
      }
    }
    // 页脚
    c.fillStyle = '#8a867c'; c.font = '22px -apple-system, "PingFang SC", sans-serif';
    c.textAlign = 'center'; c.fillText(`字帖 · ${type === 'tian' ? '田字格' : type === 'mi' ? '米字格' : '空白格'} · ${cols} × ${rows} 格`, W / 2, H - 34);
    const show = document.createElement('canvas');
    show.width = W; show.height = H;
    show.getContext('2d').drawImage(cv, 0, 0);
    show.style.width = '100%'; show.style.height = 'auto';
    $('#cbPrev').replaceChildren(show);
    $('#cbInfo').textContent = `${cols} × ${rows} 格 · ${chars.length} 个范字`;
  }
  root.addEventListener('input', build);
  root.addEventListener('change', build);
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-t]');
    if (chip) { type = chip.dataset.t; K.$$('#cbType .t-chip', root).forEach((x) => x.classList.toggle('on', x === chip)); build(); return; }
    if (e.target.closest('#cbPng')) { build(); K.canvasDownload(cv, `字帖_${type}.png`); return; }
    if (e.target.closest('#cbPrint')) { build(); window.print(); }
  });
  build();
  K.setAction('下载 PNG', () => { build(); K.canvasDownload(cv, `字帖_${type}.png`); });
});
