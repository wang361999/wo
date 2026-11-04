/* 工具运行时：所有工具共用的表单引擎与辅助函数。零依赖，浏览器 ESM。 */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let toastEl = null;
export function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 't-toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

export async function copy(text) {
  const s = String(text ?? '');
  if (!s) { toast('没有可复制的内容'); return; }
  try {
    await navigator.clipboard.writeText(s);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    ta.remove();
  }
  toast('已复制');
}

export function download(filename, data, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canvasDownload(canvas, filename, type = 'image/png', quality) {
  canvas.toBlob((b) => { if (b) download(filename, b); }, type, quality);
}

/* 手机端吸底操作条：工具调用一次即可，宽屏自动隐藏 */
let actionBar = null;
export function setAction(label, fn) {
  if (!actionBar) {
    actionBar = document.createElement('div');
    actionBar.className = 'm-actionbar';
    actionBar.innerHTML = '<div class="wrap"><button type="button" class="t-btn primary"></button></div>';
    document.body.appendChild(actionBar);
    document.body.classList.add('m-tool-open');
  }
  const btn = actionBar.querySelector('button');
  btn.textContent = label;
  btn.onclick = fn;
  return btn;
}

/* ---------- 字段渲染 ---------- */
function fieldHTML(f) {
  const label = `<label class="t-label" for="f-${f.id}">${esc(f.label)}${f.unit ? ` <span class="unit">${esc(f.unit)}</span>` : ''}</label>`;
  const common = `id="f-${f.id}" data-fid="${esc(f.id)}"`;
  let ctrl = '';
  switch (f.type) {
    case 'textarea':
      ctrl = `<textarea class="t-textarea" ${common} rows="${f.rows || 7}" placeholder="${esc(f.placeholder || '')}">${esc(f.default ?? '')}</textarea>`; break;
    case 'select':
      ctrl = `<select class="t-select" ${common}>${(f.options || []).map((o) => {
        const v = typeof o === 'string' ? o : o.value, n = typeof o === 'string' ? o : o.label;
        return `<option value="${esc(v)}" ${String(v) === String(f.default ?? '') ? 'selected' : ''}>${esc(n)}</option>`;
      }).join('')}</select>`; break;
    case 'range':
      ctrl = `<input class="t-range" type="range" ${common} min="${f.min ?? 0}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${f.default ?? 0}">`; break;
    case 'color':
      ctrl = `<input class="t-input" type="color" ${common} value="${esc(f.default || '#b4552d')}" style="height:40px;padding:3px;cursor:pointer">`; break;
    case 'checkbox':
      return `<div class="t-field"><label class="t-check"><input type="checkbox" ${common} ${f.default ? 'checked' : ''}>${esc(f.label)}</label>${f.hint ? `<p class="t-hint">${esc(f.hint)}</p>` : ''}</div>`;
    case 'chips':
      return `<div class="t-field"><span class="t-label">${esc(f.label)}</span><div class="t-chips" data-chips="${esc(f.id)}">${(f.options || []).map((o) => {
        const v = typeof o === 'string' ? o : o.value, n = typeof o === 'string' ? o : o.label;
        return `<button type="button" class="t-chip ${String(v) === String(f.default ?? '') ? 'on' : ''}" data-val="${esc(v)}">${esc(n)}</button>`;
      }).join('')}</div>${f.hint ? `<p class="t-hint">${esc(f.hint)}</p>` : ''}</div>`;
    default:
      ctrl = `<input class="t-input" type="${f.type === 'number' ? 'number' : 'text'}" ${common} value="${esc(f.default ?? '')}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'number' ? `step="${f.step ?? 'any'}"` : ''}>`;
  }
  return `<div class="t-field">${label}${ctrl}${f.hint ? `<p class="t-hint">${esc(f.hint)}</p>` : ''}</div>`;
}

/**
 * 通用表单工具：spec = { fields, compute(v, ctx), actions, sample, primary, wide, titleIn, titleOut, hintOut }
 * compute 返回 { text, html, stats:[{label,value}], preview, copy, error }
 */
export function formTool(spec) {
  return function mount(root) {
    const wide = spec.wide === true;
    root.innerHTML = `<div class="t-work">
      <section class="t-panel ${wide ? 'wide' : ''}">
        <div class="t-head"><h2><span class="step">1</span>${esc(spec.titleIn || '输入')}</h2><span class="hint">内容只在本机处理</span></div>
        ${(spec.fields || []).map(fieldHTML).join('')}
        ${spec.sample ? '<div class="t-actions"><button type="button" class="t-btn" data-sample="1">填个示例</button><button type="button" class="t-btn" data-clear="1">清空</button></div>' : ''}
        ${spec.extraHTML || ''}
      </section>
      <section class="t-panel">
        <div class="t-head"><h2><span class="step">2</span>${esc(spec.titleOut || '结果')}</h2><span class="hint">实时更新</span></div>
        <div class="t-stat-row" data-stats></div>
        <div class="t-preview" data-preview style="display:none"></div>
        <div class="t-out" data-out></div>
        <p class="t-err" data-err style="display:none"></p>
        <div class="t-actions">
          <button type="button" class="t-btn primary" data-copy="1">${esc(spec.primary || '复制结果')}</button>
          ${(spec.actions || []).map((a, i) => `<button type="button" class="t-btn" data-action="${i}">${esc(a.label)}</button>`).join('')}
        </div>
        ${spec.hintOut ? `<p class="t-hint">${esc(spec.hintOut)}</p>` : ''}
      </section>
    </div>`;

    const outEl = $('[data-out]', root), statsEl = $('[data-stats]', root);
    const previewEl = $('[data-preview]', root), errEl = $('[data-err]', root);

    const values = () => {
      const v = {};
      (spec.fields || []).forEach((f) => {
        const chips = $(`[data-chips="${f.id}"]`, root);
        if (chips) { const on = $('.t-chip.on', chips); v[f.id] = on ? on.dataset.val : (f.options[0]?.value ?? f.options[0]); return; }
        const el = $(`#f-${f.id}`, root);
        if (!el) return;
        if (f.type === 'checkbox') v[f.id] = el.checked;
        else if (f.type === 'number' || f.type === 'range') v[f.id] = Number(el.value);
        else v[f.id] = el.value;
      });
      return v;
    };

    let lastCopy = '';
    const ctx = {
      root, values, $, $$,
      setOut(x) { if (typeof x === 'string') { outEl.className = 't-out'; outEl.textContent = x; } else { outEl.className = 't-out html'; outEl.innerHTML = x.html || ''; } },
      setStats(arr) { statsEl.innerHTML = (arr || []).map((s) => `<div class="t-stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join(''); },
      setPreview(html) { if (html) { previewEl.style.display = ''; previewEl.innerHTML = html; } else { previewEl.style.display = 'none'; previewEl.innerHTML = ''; } },
      setError(msg) { errEl.textContent = msg || ''; errEl.style.display = msg ? '' : 'none'; },
      toast, copy, download, canvasDownload,
      refresh: () => run(),
    };

    async function run() {
      const v = values();
      ctx.setError('');
      let r = {};
      try { r = spec.compute ? (await spec.compute(v, ctx)) || {} : {}; }
      catch (e) { ctx.setError('计算出错：' + e.message); return; }
      if (r.error) { ctx.setError(r.error); return; }
      ctx.setStats(r.stats || []);
      if (r.html != null) { outEl.className = 't-out html'; outEl.innerHTML = r.html; }
      else { outEl.className = 't-out'; outEl.textContent = r.text ?? ''; }
      ctx.setPreview(r.preview || '');
      lastCopy = r.copy ?? (r.text ?? '');
    }

    root.addEventListener('input', run);
    root.addEventListener('change', run);
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.t-chip');
      if (chip) {
        $$('.t-chip', chip.parentElement).forEach((x) => x.classList.toggle('on', x === chip));
        run(); return;
      }
      if (e.target.closest('[data-copy]')) { copy(lastCopy); return; }
      if (e.target.closest('[data-sample]')) {
        Object.entries(spec.sample || {}).forEach(([k, val]) => {
          const el = $(`#f-${k}`, root);
          if (el) { if (el.type === 'checkbox') el.checked = !!val; else el.value = val; }
          const chips = $(`[data-chips="${k}"]`, root);
          if (chips) $$('.t-chip', chips).forEach((x) => x.classList.toggle('on', x.dataset.val === String(val)));
        });
        run(); return;
      }
      if (e.target.closest('[data-clear]')) {
        $$('.t-textarea,.t-input[type=text],.t-input[type=number]', root).forEach((x) => { x.value = ''; });
        run(); return;
      }
      const act = e.target.closest('[data-action]');
      if (act) { const a = spec.actions[Number(act.dataset.action)]; if (a && a.run) a.run(values(), ctx); }
    });

    root.addEventListener('regenerate', run);
    if (spec.setAction) setAction(spec.setAction.label, () => spec.setAction.run(values(), ctx));
    else setAction(spec.primary || '复制结果', () => copy(lastCopy));  // 手机端统一吸底操作
    run();
    return ctx;
  };
}

/* 自定义工具：直接拿到容器自己画（canvas / 游戏 / 复杂交互用） */
export function customTool(render) {
  return async (root) => {
    await render(root, { esc, $, $$, toast, copy, download, canvasDownload, setAction });
    // 没有自定义吸底条的交互工具，补一个通用入口，保证手机端也能操作
    if (!document.querySelector('.m-actionbar')) {
      const btn = root.querySelector('.t-btn.primary, [data-gaction], [data-run], .t-btn');
      if (btn) setAction(btn.textContent.trim() || '开始', () => btn.click());
    }
  };
}
