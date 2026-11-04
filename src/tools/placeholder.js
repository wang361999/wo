import { customTool, download, canvasDownload, copy, toast } from '/kit.js';
export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work">
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">1</span>设置</h2><span class="hint">纯本地生成</span></div>
      <div class="t-row">
        <div class="t-field grow"><label class="t-label" for="phW">宽 <span class="unit">px</span></label><input id="phW" class="t-input" type="number" value="600"></div>
        <div class="t-field grow"><label class="t-label" for="phH">高 <span class="unit">px</span></label><input id="phH" class="t-input" type="number" value="400"></div>
      </div>
      <div class="t-row">
        <div class="t-field grow"><label class="t-label" for="phBg">背景色</label><input id="phBg" type="color" value="#E9E3D7" style="width:100%;height:40px;padding:3px;border:1.5px solid var(--line);border-radius:8px;background:#fff;cursor:pointer"></div>
        <div class="t-field grow"><label class="t-label" for="phFg">文字色</label><input id="phFg" type="color" value="#5C5952" style="width:100%;height:40px;padding:3px;border:1.5px solid var(--line);border-radius:8px;background:#fff;cursor:pointer"></div>
      </div>
      <div class="t-field"><label class="t-label" for="phText">图上文字</label><input id="phText" class="t-input" value="600 × 400" placeholder="留空则只显示尺寸"></div>
      <div class="t-field"><label class="t-label" for="phSize">字号比例</label><input id="phSize" class="t-range" type="range" min="4" max="20" step="1" value="9"></div>
      <div class="t-field"><label class="t-check"><input id="phCross" type="checkbox" checked>画对角线（占位图样式）</label></div>
      <div class="t-chips" id="phPresets">
        <button type="button" class="t-chip" data-w="600" data-h="400">600×400</button>
        <button type="button" class="t-chip" data-w="1080" data-h="1080">1080×1080</button>
        <button type="button" class="t-chip" data-w="750" data-h="1334">750×1334</button>
        <button type="button" class="t-chip" data-w="1200" data-h="630">1200×630</button>
      </div>
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>预览与导出</h2><span class="hint" id="phInfo"></span></div>
      <div class="t-preview" id="phPrev" style="min-height:210px"></div>
      <div class="t-actions" style="margin-top:14px">
        <button type="button" class="t-btn primary" id="phPng">下载 PNG</button>
        <button type="button" class="t-btn" id="phSvg">下载 SVG</button>
        <button type="button" class="t-btn" id="phCopy">复制 data URI</button>
      </div>
      <p class="t-hint">复制的 data URI 可直接塞进 <code>&lt;img src="…"&gt;</code> 或 CSS 里，不用再托管图片文件。</p>
    </section>
  </div>`;
  const $ = (s) => K.$(s, root);
  let cv = null;

  function build() {
    const w = Math.max(16, Math.min(4000, Number($('#phW').value) || 600));
    const h = Math.max(16, Math.min(4000, Number($('#phH').value) || 400));
    const bg = $('#phBg').value, fg = $('#phFg').value;
    const text = $('#phText').value.trim() || `${w} × ${h}`;
    const fs = Math.max(10, Math.round(Math.min(w, h) * Number($('#phSize').value) / 100));
    const cross = $('#phCross').checked;
    cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = fg; c.globalAlpha = 0.35; c.lineWidth = Math.max(1, Math.round(Math.min(w, h) / 300));
    c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    if (cross) { c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `600 ${fs}px -apple-system, "PingFang SC", sans-serif`;
    c.fillText(text, w / 2, h / 2, w * 0.86);
    $('#phPrev').replaceChildren(cv);
    $('#phInfo').textContent = `${w} × ${h} px`;
    return { w, h, bg, fg, text, fs, cross };
  }
  function svg() {
    const { w, h, bg, fg, text, fs, cross } = build();
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${bg}"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${fg}" stroke-opacity="0.35"/>
${cross ? `<path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="${fg}" stroke-opacity="0.35"/>` : ''}
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${fg}"
  font-family="-apple-system, PingFang SC, sans-serif" font-size="${fs}" font-weight="600">${esc(text)}</text></svg>`;
  }
  root.addEventListener('input', build);
  root.addEventListener('change', build);
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-w]');
    if (chip) { $('#phW').value = chip.dataset.w; $('#phH').value = chip.dataset.h; build(); return; }
    if (e.target.closest('#phPng')) { build(); K.canvasDownload(cv, `placeholder_${cv.width}x${cv.height}.png`); return; }
    if (e.target.closest('#phSvg')) { download(`placeholder_${$('#phW').value}x${$('#phH').value}.svg`, svg(), 'image/svg+xml'); return; }
    if (e.target.closest('#phCopy')) { build(); copy(cv.toDataURL('image/png')); }
  });
  build();
  K.setAction('下载 PNG', () => { build(); K.canvasDownload(cv, `placeholder_${cv.width}x${cv.height}.png`); });
});
