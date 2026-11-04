import { customTool, esc, copy, toast } from '/kit.js';
const parse = (hex) => {
  const h = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
  const s = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const hex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0; const l = (max + min) / 2;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
const lum = (r, g, b) => {
  const a = [r, g, b].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work">
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">1</span>选颜色</h2><span class="hint">点色块或直接填 HEX</span></div>
      <div class="t-field"><label class="t-label" for="cp">取色</label>
        <input id="cp" type="color" value="#B4552D" style="width:100%;height:52px;padding:3px;border:1.5px solid var(--line);border-radius:8px;background:#fff;cursor:pointer"></div>
      <div class="t-field"><label class="t-label" for="cpHex">HEX</label><input id="cpHex" class="t-input" value="#B4552D" placeholder="#RRGGBB"></div>
      <div class="t-chips" id="cpPresets"></div>
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>各格式与配色</h2><span class="hint">点任一行复制</span></div>
      <div id="cpPreview" style="height:96px;border-radius:9px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600">示例文字 Aa 中文</div>
      <div id="cpRows"></div>
      <div class="t-head" style="margin-top:18px"><h2>配色建议</h2></div>
      <div id="cpPalette" style="display:flex;gap:8px;flex-wrap:wrap"></div>
    </section>
  </div>`;
  const presets = ['#B4552D', '#3D7A4E', '#4A6B8A', '#23221F', '#F6E9E1', '#8A5A3A', '#5C7048', '#D16BA5'];
  K.$('#cpPresets', root).innerHTML = presets.map((c) =>
    `<button type="button" class="t-chip" data-c="${c}"><span class="t-swatch" style="background:${c}"></span>${c}</button>`).join('');

  function render(value) {
    const rgb = parse(value);
    if (!rgb) { K.$('#cpRows', root).innerHTML = '<p class="t-err">HEX 格式不对，试试 #B4552D 或 #B45。</p>'; return; }
    const [r, g, b] = rgb, H = hex(r, g, b), [h, s, l] = rgb2hsl(r, g, b);
    const cmyk = (() => { const k = 1 - Math.max(r, g, b) / 255;
      if (k === 1) return [0, 0, 0, 100];
      return [Math.round((1 - r / 255 - k) / (1 - k) * 100), Math.round((1 - g / 255 - k) / (1 - k) * 100),
        Math.round((1 - b / 255 - k) / (1 - k) * 100), Math.round(k * 100)]; })();
    const L = lum(r, g, b);
    const contrast = (x) => ((Math.max(L, x) + 0.05) / (Math.min(L, x) + 0.05)).toFixed(2);
    const rows = [
      ['HEX', H], ['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
      ['CMYK', `cmyk(${cmyk.join('%, ')}%)`],
      ['与白字对比度', `${contrast(1)} : 1（${contrast(1) >= 4.5 ? '正文可读' : '仅适合大字'}）`],
      ['与黑字对比度', `${contrast(0)} : 1（${contrast(0) >= 4.5 ? '正文可读' : '仅适合大字'}）`],
    ];
    K.$('#cpPreview', root).style.background = H;
    K.$('#cpPreview', root).style.color = contrast(0) > contrast(1) ? '#23221f' : '#fff';
    K.$('#cpRows', root).innerHTML = rows.map(([k, v]) =>
      `<div class="cp-row" data-v="${esc(v)}" style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line-2);font-size:12.5px;cursor:pointer">
        <span style="color:var(--ink-3);flex:0 0 auto">${esc(k)}</span><code style="word-break:break-all">${esc(v)}</code></div>`).join('');
    const pal = [hex(r, g, b), hex((r + 255) / 2, (g + 255) / 2, (b + 255) / 2),
      hex(r * 0.7, g * 0.7, b * 0.7), hex((g + b) / 2, (r + b) / 2, (r + g) / 2),
      hex(255 - r, 255 - g, 255 - b)];
    K.$('#cpPalette', root).innerHTML = pal.map((c, i) =>
      `<button type="button" class="cp-sw" data-c="${c}" title="点击复制 ${esc(c)}" style="width:52px;height:52px;border-radius:9px;border:1px solid var(--line);background:${c};cursor:pointer"></button>`).join('');
    K.$('#cp', root).value = H; K.$('#cpHex', root).value = H;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'cp' || e.target.id === 'cpHex') render(e.target.value); });
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-c]');
    if (chip) { render(chip.dataset.c); return; }
    const row = e.target.closest('.cp-row');
    if (row) { copy(row.dataset.v); }
  });
  render('#B4552D');
  K.setAction('复制 HEX', () => copy(K.$('#cpHex', root).value));
});
