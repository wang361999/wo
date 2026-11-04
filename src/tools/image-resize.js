import { customTool, download, toast } from '/kit.js';
import { canvasToBytes, triggerDownload } from '/lib/slice.js';
import { buildZip } from '/lib/zip.js';

const PRESETS = [
  { label: '头像 200', w: 200, h: 200 }, { label: '缩略图 480', w: 480, h: 480 },
  { label: '方图 1080', w: 1080, h: 1080 }, { label: '竖图 1080×1440', w: 1080, h: 1440 },
  { label: '横图 1200×630', w: 1200, h: 630 }, { label: 'A4 150dpi', w: 1240, h: 1754 },
];
export default customTool((root, K) => {
  root.innerHTML = `<div class="t-work">
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">1</span>放一张图</h2><span class="hint">拖入 / 粘贴 / 点选</span></div>
      <div class="t-drop" id="irDrop"><span class="t">点这里选图，或拖进来</span><span class="s">也可以直接 Ctrl/⌘ + V 粘贴截图</span></div>
      <input type="file" id="irFile" accept="image/*" hidden>
      <p class="t-hint" id="irInfo">还没选图</p>
      <div class="t-row" style="margin-top:14px">
        <div class="t-field grow"><label class="t-label" for="irW">宽 <span class="unit">px</span></label><input id="irW" class="t-input" type="number" value="1080"></div>
        <div class="t-field grow"><label class="t-label" for="irH">高 <span class="unit">px</span></label><input id="irH" class="t-input" type="number" value="1080"></div>
      </div>
      <div class="t-row"><label class="t-check"><input id="irKeep" type="checkbox" checked>保持原图比例（在目标尺寸内缩放）</label></div>
      <div class="t-field" style="margin-top:12px"><span class="t-label">常用尺寸（可多选，一起打包）</span>
        <div class="t-chips" id="irPresets"></div></div>
      <div class="t-actions"><button type="button" class="t-btn primary" id="irOne">下载当前尺寸</button>
        <button type="button" class="t-btn" id="irZip">打包所选尺寸</button></div>
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>预览</h2><span class="hint" id="irOutInfo">—</span></div>
      <div class="t-preview" id="irPrev" style="min-height:220px"><span style="color:var(--ink-3);font-size:12.5px">选图后这里显示结果</span></div>
      <p class="t-hint">图片只在浏览器 canvas 里缩放，不上传。想要不变形就勾「保持原图比例」。</p>
    </section>
  </div>`;
  const $ = (s) => K.$(s, root);
  const drop = $('#irDrop'), file = $('#irFile');
  let img = null, name = 'image', selected = new Set();

  $('#irPresets').innerHTML = PRESETS.map((p, i) =>
    `<button type="button" class="t-chip" data-i="${i}">${p.label}</button>`).join('');

  function draw(w, h) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    const keep = $('#irKeep').checked;
    if (keep) {
      const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else c.drawImage(img, 0, 0, w, h);
    return cv;
  }
  function preview() {
    if (!img) return;
    const w = Math.max(1, Math.min(6000, Number($('#irW').value) || 1080));
    const h = Math.max(1, Math.min(6000, Number($('#irH').value) || 1080));
    const cv = draw(w, h);
    cv.style.maxHeight = '360px'; cv.style.width = 'auto';
    $('#irPrev').replaceChildren(cv);
    $('#irOutInfo').textContent = `${w} × ${h} px`;
    return cv;
  }
  function load(f) {
    if (!f || !f.type.startsWith('image/')) { toast('请选择图片文件'); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { img = im; name = (f.name || 'image').replace(/\.[^.]+$/, '');
      $('#irInfo').textContent = `原图 ${im.naturalWidth} × ${im.naturalHeight} px · ${(f.size / 1024).toFixed(0)} KB`;
      drop.querySelector('.t').textContent = '已载入，点这里换一张';
      preview(); URL.revokeObjectURL(url); };
    im.onerror = () => { toast('图片读不出来'); URL.revokeObjectURL(url); };
    im.src = url;
  }
  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', () => { if (file.files[0]) load(file.files[0]); file.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.[0]) load(e.dataTransfer.files[0]); });
  document.addEventListener('paste', (e) => {
    const it = [...(e.clipboardData?.items || [])].find((x) => x.type.startsWith('image/'));
    if (it) load(it.getAsFile());
  });
  root.addEventListener('input', preview);
  root.addEventListener('change', preview);
  root.addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-i]');
    if (chip) { const i = Number(chip.dataset.i);
      if (selected.has(i)) { selected.delete(i); chip.classList.remove('on'); }
      else { selected.add(i); chip.classList.add('on'); }
      return; }
    if (!img) { toast('先放一张图进来'); return; }
    if (e.target.closest('#irOne')) {
      const cv = preview();
      cv.toBlob((b) => { if (b) download(`${name}_${cv.width}x${cv.height}.png`, b); }, 'image/png');
      return;
    }
    if (e.target.closest('#irZip')) {
      const targets = selected.size ? [...selected].map((i) => PRESETS[i]) :
        [{ w: Number($('#irW').value) || 1080, h: Number($('#irH').value) || 1080 }];
      const btn = $('#irZip'); btn.disabled = true;
      try {
        const entries = [];
        for (const t of targets) {
          const cv = draw(t.w, t.h);
          const bytes = await canvasToBytes(cv, 'image/png', 0.92);
          entries.push({ name: `${name}_${t.w}x${t.h}.png`, data: bytes });
        }
        triggerDownload(buildZip(entries), `${name}_${entries.length}个尺寸.zip`);
        toast(`打包好了 ${entries.length} 张`);
      } catch (err) { toast('打包失败：' + err.message); }
      finally { btn.disabled = false; }
    }
  });
  K.setAction('下载当前尺寸', () => { if (!img) { toast('先放一张图进来'); return; }
    const cv = preview(); cv.toBlob((b) => { if (b) download(`${name}_${cv.width}x${cv.height}.png`, b); }, 'image/png'); });
});
