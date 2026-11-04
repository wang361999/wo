/* 工具引擎：速查表 / 文件处理 / 引库加载 / 画布与游戏辅助。 */
import { esc, $, $$, download as dlFile, copy as copyText, toast as toastMsg, canvasDownload, setAction } from '/kit.js';
import * as L from '/core.js';
import { buildZip } from '/lib/zip.js';

export { L };
export { D } from '/core.js';

/* ---------- 引库：多 CDN 兜底，失败时明确提示，不静默降级 ---------- */
const CDN = [
  (p) => `https://cdn.jsdelivr.net/npm/${p}/+esm`,
  (p) => `https://esm.sh/${p}`,
];
const libCache = new Map();
export async function loadLib(pkg) {
  if (libCache.has(pkg)) return libCache.get(pkg);
  let lastErr;
  for (const make of CDN) {
    try {
      const mod = await import(/* @vite-ignore */ make(pkg));
      libCache.set(pkg, mod);
      return mod;
    } catch (e) { lastErr = e; }
  }
  throw new Error(`加载处理库 ${pkg} 失败，通常是网络拦住了 CDN。可换网络重试：${lastErr?.message || ''}`);
}
export const LIB_NOTE = '处理库已随站点一起打包到本地（/vendor/），首次使用只是加载脚本，不联网、不上传文件。';

/* ---------- 本地 vendor 库：UMD 脚本按需注入，不依赖外部 CDN ---------- */
const VENDOR = {
  pdf: ['pdf-lib.min.js', 'PDFLib'],
  pdfjs: ['pdf.min.js', 'pdfjsLib'],
  qr: ['qrcode.js', 'qrcode'],
  barcode: ['JsBarcode.all.min.js', 'JsBarcode'],
  zip: ['jszip.min.js', 'JSZip'],
  xlsx: ['xlsx.full.min.js', 'XLSX'],
  marked: ['marked.min.js', 'marked'],
  katex: ['katex.min.js', 'katex'],
  sql: ['sql-wasm.js', 'initSqlJs'],
  opentype: ['opentype.min.js', 'opentype'],
  alasql: ['alasql.min.js', 'alasql'],
  gif: ['gif.js', 'GIF'],
  tesseract: ['tesseract.min.js', 'Tesseract'],
};
const vendorCache = new Map();
function inject(file, tag) {
  return new Promise((res, rej) => {
    const sel = tag === 'link' ? `link[data-v="${file}"]` : `script[data-v="${file}"]`;
    if (document.querySelector(sel)) return res();
    const el = document.createElement(tag);
    el.dataset.v = file;
    if (tag === 'link') { el.rel = 'stylesheet'; el.href = '/vendor/' + file; }
    else { el.src = '/vendor/' + file; el.async = true; }
    el.onload = () => res();
    el.onerror = () => rej(new Error('本地处理库加载失败：' + file));
    document.head.appendChild(el);
  });
}
export async function vendor(name) {
  if (vendorCache.has(name)) return vendorCache.get(name);
  const [file, global] = VENDOR[name] || [];
  if (!file) throw new Error('未知的本地处理库：' + name);
  await inject(file, 'script');
  let obj = window[global];
  if (!obj) throw new Error('处理库未就绪：' + global);
  if (name === 'pdfjs') obj.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.js';
  if (name === 'katex') await inject('katex.min.css', 'link');
  if (name === 'sql') obj = await obj({ locateFile: () => '/vendor/sql-wasm.wasm' });
  vendorCache.set(name, obj);
  return obj;
}

/* ---------- 速查表引擎 ---------- */
function refFieldHTML(f) {
  if (f.type === 'select') return `<select class="t-select" data-rf="${esc(f.id)}">${(f.options || []).map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
  return `<input class="t-input" data-rf="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}">`;
}
export function refTool(spec) {
  return function mount(root) {
    const cols = spec.columns || [];
    const rows = spec.rows || [];
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>${esc(spec.title || '速查表')}</h2><span class="hint">共 ${rows.length} 条 · 点行可复制</span></div>
      <div class="t-row" style="margin-bottom:13px">
        <input class="t-input grow" type="search" data-refq placeholder="${esc(spec.placeholder || '搜关键词，支持中英文')}">
        ${(spec.fields || []).map(refFieldHTML).join('')}
      </div>
      ${(spec.filters || []).length ? `<div class="t-chips" data-reffilters>${spec.filters.map((f, i) => `<span class="t-label" style="align-self:center;margin:0 4px 0 0">${esc(f.label)}</span>${f.values.map((v, j) => `<button type="button" class="t-chip ${j === 0 ? 'on' : ''}" data-rfilter="${i}" data-val="${esc(v)}">${esc(v)}</button>`).join('')}`).join('')}</div>` : ''}
      <div class="t-refwrap" data-refwrap></div>
      <div class="t-actions">
        <button type="button" class="t-btn primary" data-refcopy>${esc(spec.primary || '复制整表')}</button>
        ${(spec.actions || []).map((a, i) => `<button type="button" class="t-btn" data-refact="${i}">${esc(a.label)}</button>`).join('')}
      </div>
      ${spec.note ? `<p class="t-hint">${esc(spec.note)}</p>` : ''}
    </section></div>`;

    const wrap = $('[data-refwrap]', root), q = $('[data-refq]', root);
    const cell = (v, c, row) => {
      if (c.render) return c.render(v, row);
      const s = String(v ?? '');
      if (c.num) return `<td class="num">${esc(s)}</td>`;
      if (c.swatch && /^#[0-9a-f]{3,8}$/i.test(s)) return `<td><i class="t-swatch" style="background:${esc(s)}"></i>${esc(s)}</td>`;
      return `<td>${esc(s)}</td>`;
    };
    const rowArr = (r) => Array.isArray(r) ? r : cols.map((c) => r[c.key]);
    const render = () => {
      const k = (q?.value || '').trim().toLowerCase();
      const fv = {};
      $$('[data-rf]', root).forEach((el) => { fv[el.dataset.rf] = el.value.trim().toLowerCase(); });
      const onFilters = {};
      $$('.t-chip.on[data-rfilter]', root).forEach((b) => { onFilters[b.dataset.rfilter] = b.dataset.val; });
      const list = rows.filter((r) => {
        const a = rowArr(r);
        if (k && !a.join(' ').toLowerCase().includes(k)) return false;
        for (const [key, val] of Object.entries(fv)) {
          const idx = (spec.fields || []).findIndex((f) => f.id === key);
          if (val && idx >= 0 && !String(a[idx] ?? '').toLowerCase().includes(val)) return false;
        }
        for (const [fi, val] of Object.entries(onFilters)) {
          const f = spec.filters[Number(fi)];
          if (f && val !== f.values[0] && String(a[f.col] ?? '') !== val) return false;
        }
        return true;
      });
      wrap.innerHTML = `<table class="t-table"><thead><tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>${list.slice(0, spec.limit || 400).map((r) => {
          const a = rowArr(r);
          return `<tr data-copyrow="${esc(a.join('\t'))}">${cols.map((c, i) => cell(a[i], c, r)).join('')}</tr>`;
        }).join('')}</tbody></table>${list.length > (spec.limit || 400) ? `<p class="t-hint">只显示前 ${spec.limit || 400} 条，共 ${list.length} 条，用搜索缩小范围。</p>` : ''}${list.length === 0 ? '<p class="t-hint">没有匹配项。</p>' : ''}`;
      root._list = list;
    };
    root.addEventListener('input', render);
    root.addEventListener('change', render);
    root.addEventListener('click', async (e) => {
      const chip = e.target.closest('[data-rfilter]');
      if (chip) { $$(`[data-rfilter="${chip.dataset.rfilter}"]`, root).forEach((b) => b.classList.toggle('on', b === chip)); render(); return; }
      const tr = e.target.closest('[data-copyrow]');
      if (tr) { await copyText(tr.dataset.copyrow); return; }
      if (e.target.closest('[data-refcopy]')) {
        await copyText([cols.map((c) => c.label).join('\t'), ...(root._list || []).map((r) => rowArr(r).join('\t'))].join('\n'));
        return;
      }
      const act = e.target.closest('[data-refact]');
      if (act) { const a = spec.actions[Number(act.dataset.refact)]; if (a && a.run) a.run(root._list || [], root); }
    });
    render();
    return { render };
  };
}

/* ---------- 文件处理引擎 ---------- */
const fieldHTML2 = (f) => {
  const common = `data-ff="${esc(f.id)}" id="ff-${esc(f.id)}"`;
  let ctrl;
  switch (f.type) {
    case 'select': ctrl = `<select class="t-select" ${common}>${(f.options || []).map((o) => { const v = typeof o === 'string' ? o : o.value, n = typeof o === 'string' ? o : o.label; return `<option value="${esc(v)}" ${String(v) === String(f.default ?? '') ? 'selected' : ''}>${esc(n)}</option>`; }).join('')}</select>`; break;
    case 'textarea': ctrl = `<textarea class="t-textarea" ${common} rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}">${esc(f.default ?? '')}</textarea>`; break;
    case 'range': ctrl = `<input class="t-range" type="range" ${common} min="${f.min ?? 0}" max="${f.max ?? 100}" step="${f.step ?? 1}" value="${f.default ?? 0}"><span data-rangeval="${esc(f.id)}">${esc(f.default ?? 0)}</span>`; break;
    case 'color': ctrl = `<input class="t-input" type="color" ${common} value="${esc(f.default || '#b4552d')}" style="height:40px;padding:3px;cursor:pointer">`; break;
    case 'checkbox': return `<div class="t-field"><label class="t-check"><input type="checkbox" ${common} ${f.default ? 'checked' : ''}>${esc(f.label)}</label></div>`;
    default: ctrl = `<input class="t-input" type="${f.type === 'number' ? 'number' : 'text'}" ${common} value="${esc(f.default ?? '')}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'number' ? `step="${f.step ?? 'any'}"` : ''}>`;
  }
  return `<div class="t-field"><label class="t-label" for="ff-${esc(f.id)}">${esc(f.label)}${f.unit ? ` <span class="unit">${esc(f.unit)}</span>` : ''}</label>${ctrl}${f.hint ? `<p class="t-hint">${esc(f.hint)}</p>` : ''}</div>`;
};
export function fileTool(spec) {
  return function mount(root) {
    root.innerHTML = `<div class="t-work">
      <section class="t-panel">
        <div class="t-head"><h2><span class="step">1</span>${esc(spec.titleIn || '选文件')}</h2><span class="hint">只在本机处理</span></div>
        <div class="t-drop" data-drop tabindex="0">
          <div class="t">${esc(spec.dropTitle || '拖文件到这里，或点一下选择')}</div>
          <div class="s">${esc(spec.dropHint || (spec.multiple ? '可以一次选多个文件' : '一次一个文件'))} · 也可以直接 Ctrl+V 粘贴</div>
          <input type="file" data-file hidden ${spec.multiple ? 'multiple' : ''} ${spec.accept ? `accept="${esc(spec.accept)}"` : ''}>
        </div>
        <div class="t-filelist" data-filelist></div>
        ${(spec.fields || []).map(fieldHTML2).join('')}
        <div class="t-actions">
          <button type="button" class="t-btn primary" data-run>${esc(spec.primary || '开始处理')}</button>
          ${spec.sample ? '<button type="button" class="t-btn" data-clearfiles>清空</button>' : ''}
        </div>
        ${spec.note ? `<p class="t-hint">${esc(spec.note)}</p>` : ''}
      </section>
      <section class="t-panel">
        <div class="t-head"><h2><span class="step">2</span>${esc(spec.titleOut || '结果')}</h2><span class="hint" data-busy>等待文件</span></div>
        <div class="t-stat-row" data-stats></div>
        <div class="t-preview" data-preview style="display:none"></div>
        <div class="t-out" data-out></div>
        <p class="t-err" data-err style="display:none"></p>
        <div class="t-actions" data-downloads></div>
        ${spec.hintOut ? `<p class="t-hint">${esc(spec.hintOut)}</p>` : ''}
      </section>
    </div>`;

    const fileInput = $('[data-file]', root), drop = $('[data-drop]', root), listEl = $('[data-filelist]', root);
    const busy = $('[data-busy]', root), outEl = $('[data-out]', root), errEl = $('[data-err]', root);
    const statsEl = $('[data-stats]', root), previewEl = $('[data-preview]', root), dlEl = $('[data-downloads]', root);
    let files = [], lastCopy = '';

    const values = () => {
      const v = {};
      (spec.fields || []).forEach((f) => {
        const el = $(`#ff-${f.id}`, root); if (!el) return;
        v[f.id] = f.type === 'checkbox' ? el.checked : (f.type === 'number' || f.type === 'range') ? Number(el.value) : el.value;
      });
      return v;
    };
    const showFiles = () => {
      listEl.innerHTML = files.length ? `<p class="t-hint">已选 ${files.length} 个文件：</p>` + files.map((f, i) => `<div class="t-filerow"><span>${esc(f.name)}</span><span>${L.humanSize(f.size)}</span><button type="button" data-rm="${i}" aria-label="移除">×</button></div>`).join('') : '';
    };
    const setFiles = (arr) => {
      files = spec.multiple ? arr : arr.slice(0, 1);
      showFiles();
      busy.textContent = files.length ? '已就绪' : '等待文件';
      if (spec.auto !== false) run();
    };
    const ctx = {
      root, files: () => files, values, $, $$, L,
      setBusy: (m) => { busy.textContent = m; },
      setOut: (x) => { if (typeof x === 'string') { outEl.className = 't-out'; outEl.textContent = x; } else { outEl.className = 't-out html'; outEl.innerHTML = x.html || ''; } lastCopy = typeof x === 'string' ? x : (x.copy || ''); },
      setStats: (arr) => { statsEl.innerHTML = (arr || []).map((s) => `<div class="t-stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join(''); },
      setPreview: (html) => { if (html) { previewEl.style.display = ''; previewEl.innerHTML = html; } else { previewEl.style.display = 'none'; previewEl.innerHTML = ''; } },
      setError: (m) => { errEl.textContent = m || ''; errEl.style.display = m ? '' : 'none'; },
      setCopy: (s) => { lastCopy = s; },
      setDownloads: (items) => {
        dlEl.innerHTML = (items || []).map((it, i) => `<button type="button" class="t-btn" data-dl="${i}">${esc(it.label || it.name)}</button>`).join('');
        dlEl._items = items || [];
      },
      download: dlFile, copyText, toast: toastMsg, canvasDownload, setAction,
      refresh: run,
    };
    if (spec.setAction) setAction(spec.setAction.label, () => spec.setAction.run(files, values(), ctx));
    else setAction(spec.primary || '开始处理', () => run());

    async function run() {
      if (!files.length) return;
      ctx.setError(''); busy.textContent = '处理中…';
      try {
        const r = await (spec.process ? spec.process(files, values(), ctx) : {}) || {};
        if (r.error) { ctx.setError(r.error); busy.textContent = '出错了'; return; }
        ctx.setStats(r.stats || []);
        ctx.setOut(r.text != null ? r.text : { html: r.html || '', copy: r.copy || '' });
        if (r.copy != null) lastCopy = r.copy;
        ctx.setPreview(r.preview || '');
        ctx.setDownloads(r.files || []);
        busy.textContent = r.busy || '完成';
      } catch (e) {
        ctx.setError('处理失败：' + (e.message || e));
        busy.textContent = '出错了';
      }
    }

    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => setFiles(Array.from(fileInput.files || [])));
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => setFiles(Array.from(e.dataTransfer?.files || [])));
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => { if (!e.target.closest?.('[data-drop]')) e.preventDefault(); });
    document.addEventListener('paste', (e) => { const f = Array.from(e.clipboardData?.files || []); if (f.length) { setFiles(f); e.preventDefault(); } });
    root.addEventListener('input', (e) => {
      const r = e.target.closest('[data-rangeval]');
      if (e.target.matches('.t-range')) { const s = $(`[data-rangeval="${e.target.dataset.ff}"]`, root); if (s) s.textContent = e.target.value; }
      if (spec.auto !== false && files.length) run();
    });
    root.addEventListener('change', (e) => {
      if (root.onNavClick) { root.onNavClick(e); return; }
      if (spec.auto !== false && files.length) run();
    });
    root.addEventListener('click', async (e) => {
      if (root.onNavClick && (e.target.closest('[data-ch]') || e.target.id === 'jump')) { root.onNavClick(e); return; }
      if (e.target.closest('[data-run]')) { run(); return; }
      if (e.target.closest('[data-clearfiles]')) { files = []; fileInput.value = ''; showFiles(); ctx.setOut(''); ctx.setDownloads([]); busy.textContent = '等待文件'; return; }
      const rm = e.target.closest('[data-rm]');
      if (rm) { files.splice(Number(rm.dataset.rm), 1); showFiles(); return; }
      const dl = e.target.closest('[data-dl]');
      if (dl) {
        const it = (dlEl._items || [])[Number(dl.dataset.dl)];
        if (!it) return;
        if (it.zip) {
          const entries = [];
          for (const f of it.zip) entries.push({ name: f.name, data: f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data) });
          ctx.download(it.name || '打包.zip', buildZip(entries), 'application/zip');
        } else ctx.download(it.name || 'output', it.data, it.mime);
      }
    });
    root.addEventListener('regenerate', run);
    showFiles();
    return ctx;
  };
}

/* ---------- 小游戏 / 交互通用件 ---------- */
export function gamePanel(root, { title, hint, html, actionLabel, onAction }) {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>${esc(title)}</h2><span class="hint">${esc(hint || '')}</span></div>
    <div class="t-gamestage" data-stage>${html || ''}</div>
    <div class="t-actions"><button type="button" class="t-btn primary" data-gaction>${esc(actionLabel || '开始')}</button></div>
    <div class="t-stat-row" data-gstats style="margin-top:14px"></div>
    <p class="t-hint" data-gmsg></p>
  </section></div>`;
  const stage = $('[data-stage]', root), stats = $('[data-gstats]', root), msg = $('[data-gmsg]', root);
  const btn = $('[data-gaction]', root);
  const api = {
    stage, stats, msg, btn, $, $$, esc, L,
    setStats: (arr) => { stats.innerHTML = arr.map((s) => `<div class="t-stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join(''); },
    say: (s) => { msg.textContent = s; },
    label: (s) => { btn.textContent = s; },
    onAction: (fn) => { btn.onclick = fn; },
  };
  btn.onclick = () => onAction && onAction(api);
  setAction(actionLabel || '开始', () => btn.click());
  return api;
}

/* ---------- TOTP / Authenticator 共用件 ---------- */
export function b32(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const t = String(s).toUpperCase().replace(/[\s=-]/g, '');
  let bits = '', out = [];
  for (const c of t) { const i = A.indexOf(c); if (i < 0) throw new Error('Base32 密钥里有非法字符：' + c); bits += i.toString(2).padStart(5, '0'); }
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(out);
}
export async function hotp(key, counter, digits = 6) {
  const buf = new ArrayBuffer(8); new DataView(buf).setBigUint64(0, BigInt(counter), false);
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, buf));
  const o = sig[19] & 15;
  const code = (((sig[o] & 0x7f) << 24) | (sig[o + 1] << 16) | (sig[o + 2] << 8) | sig[o + 3]) >>> 0;
  return String(code % (10 ** digits)).padStart(digits, '0');
}
export const totpNow = async (key, step = 30, digits = 6, at = Date.now()) => {
  const c = Math.floor(at / 1000 / step);
  const code = await hotp(key, c, digits);
  return { code, c, left: step - Math.floor(at / 1000) % step };
};
export const pbVar = (n) => { const out = []; let x = BigInt(n); do { let b = Number(x & 0x7fn); x >>= 7n; if (x) b |= 0x80; out.push(b); } while (x); return out; };
export const pbLen = (f, bytes) => [f << 3 | 2, ...pbVar(bytes.length), ...bytes];
export const pbNum = (f, n) => [f << 3 | 0, ...pbVar(n)];
export const otpUri = (secret, name, issuer, digits = 6, period = 30) => `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(name)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=${digits}&period=${period}&algorithm=SHA1`;

/* ---------- Protobuf wire format 解码（无 schema 也能拆 tag / 类型） ---------- */
export function pbDecode(bytes) {
  const b = new Uint8Array(bytes);
  const readVar = (p) => { let n = 0n, sh = 0n, x; do { x = b[p++]; n |= BigInt(x & 0x7f) << sh; sh += 7n; } while (x & 0x80 && p < b.length); return [n, p]; };
  const parse = (start, end, depth = 0) => {
    const out = []; let p = start;
    while (p < end && out.length < 400) {
      let tag; [tag, p] = readVar(p);
      const field = Number(tag >> 3n), wt = Number(tag & 7n);
      if (!field) break;
      let val, hex = '';
      if (wt === 0) { let n; [n, p] = readVar(p); val = n.toString(); hex = n.toString(16); }
      else if (wt === 2) { let l; [l, p] = readVar(p); const len = Number(l); const seg = b.slice(p, p + len); p += len;
        const txt = (() => { try { return new TextDecoder('utf-8', { fatal: true }).decode(seg); } catch (e) { return ''; } })();
        if (/^[\x20-\x7e\u4e00-\u9fff\n\t]*$/.test(txt) && txt.length) { val = JSON.stringify(txt); hex = L.bytesToHex(seg.slice(0, 24), ' '); }
        else { try { const nested = parse(0, seg.length, depth + 1); if (nested.length && depth < 4) { val = nested; } else { val = 'bytes(' + len + ')'; hex = L.bytesToHex(seg.slice(0, 24), ' '); } } catch (e) { val = 'bytes(' + len + ')'; hex = L.bytesToHex(seg.slice(0, 24), ' '); } }
      }
      else if (wt === 5) { const d = new DataView(b.buffer, b.byteOffset + p, 4); val = 'float32 ' + d.getFloat32(0, true); hex = L.bytesToHex(b.slice(p, p + 4), ' '); p += 4; }
      else if (wt === 1) { const d = new DataView(b.buffer, b.byteOffset + p, 8); val = 'double ' + d.getFloat64(0, true); hex = L.bytesToHex(b.slice(p, p + 8), ' '); p += 8; }
      else { val = '不支持的 wire type ' + wt; break; }
      out.push({ field, wt, val, hex });
    }
    return out;
  };
  return parse(0, b.length);
}

/* ---------- EPUB 构造（供 TXT/MOBI 转换共用） ---------- */
export function epubBase(title, author, chapters) {
  const escXML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = chapters.map((_, i) => `    <item id="c${i}" href="chapter${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
  const spines = chapters.map((_, i) => `    <itemref idref="c${i}"/>`).join('\n');
  const uuid = (() => { const b = new Uint8Array(16); crypto.getRandomValues(b); const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(''); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; })();
  return {
    'mimetype': 'application/epub+zip',
    'META-INF/container.xml': `<?xml version="1.0"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
    'OEBPS/content.opf': `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">urn:uuid:${uuid}</dc:identifier><dc:title>${escXML(title)}</dc:title><dc:creator>${escXML(author)}</dc:creator><dc:language>zh-CN</dc:language><meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta></metadata><manifest>\n    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n${items}\n</manifest><spine>\n${spines}\n</spine></package>`,
    'OEBPS/nav.xhtml': `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目录</title></head><body><nav epub:type="toc"><h1>目录</h1><ol>${chapters.map((c, i) => `<li><a href="chapter${i}.xhtml">${escXML(c.title)}</a></li>`).join('')}</ol></nav></body></html>`,
    ...Object.fromEntries(chapters.map((c, i) => [`OEBPS/chapter${i}.xhtml`, `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escXML(c.title)}</title></head><body><h2>${escXML(c.title)}</h2>${String(c.text).split(/\r?\n/).map((l) => `<p>${escXML(l)}</p>`).join('\n')}</body></html>`])),
  };
}
export async function makeEpub(filesMap) {
  const JSZip = await vendor('zip');
  const zip = new JSZip();
  for (const [k, val] of Object.entries(filesMap)) zip.file(k, val, k === 'mimetype' ? { compression: 'STORE' } : {});
  return new Uint8Array(await zip.generateAsync({ type: 'uint8array', mimeType: 'application/epub+zip' }));
}

/* ---------- PDF 共用件（pdf-lib / pdf.js 均已本地化） ---------- */
export async function pdfOpen(buf, ignoreEncryption = false) {
  const pdfjs = await vendor('pdfjs');
  return pdfjs.getDocument({ data: new Uint8Array(buf), ignoreEncryption }).promise;
}
export async function pdfRenderPage(pdf, n, scale = 1.5) {
  const page = await pdf.getPage(L.clamp(n, 1, pdf.numPages));
  const vp = page.getViewport({ scale });
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
  await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  return { canvas: cv, viewport: vp, page };
}
export async function pdfText(pdf, max = 200) {
  const out = [];
  for (let i = 1; i <= Math.min(pdf.numPages, max); i++) {
    const tc = await (await pdf.getPage(i)).getTextContent();
    const lines = []; let lastY = null, cur = '';
    for (const it of tc.items) {
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 4) { lines.push(cur.trim()); cur = ''; }
      cur += it.str; lastY = y;
    }
    if (cur.trim()) lines.push(cur.trim());
    out.push({ page: i, lines });
  }
  return out;
}

/* ---------- 音频解码 / WAV 编码（浏览器原生 WebAudio） ---------- */
export async function decodeAudio(file) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  ctx.close();
  return buf;
}
export function audioToWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, rate = buf.sampleRate;
  const out = new ArrayBuffer(44 + n * ch * 2), dv = new DataView(out);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const chan = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chan[c][i])); dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Uint8Array(out);
}
export async function bufferToWav(ctxAudio, channels, rate, n, fill) {
  const b = ctxAudio.createBuffer(channels, n, rate);
  for (let c = 0; c < channels; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = fill(c, i); }
  return audioToWav(b);
}

/* ---------- 二维码 / 条形码绘制（本地库） ---------- */
export async function qrCanvas(text, { ec = 'M', scale = 8, pad = 4, dark = '#2f2b26', light = '#ffffff', dot = '方形' } = {}) {
  const qrgen = await vendor('qr');
  const q = qrgen(0, ec); q.addData(String(text)); q.make();
  const n = q.getModuleCount(), size = (n + pad * 2) * scale;
  const cv = L.canvasOf(size, size), g = cv.getContext('2d');
  g.fillStyle = light; g.fillRect(0, 0, size, size); g.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) {
    const x = (c + pad) * scale, y = (r + pad) * scale;
    if (dot === '圆点') { g.beginPath(); g.arc(x + scale / 2, y + scale / 2, scale * 0.42, 0, Math.PI * 2); g.fill(); }
    else if (dot === '圆角') { g.beginPath(); g.roundRect ? g.roundRect(x + 1, y + 1, scale - 2, scale - 2, scale * 0.3) : g.rect(x + 1, y + 1, scale - 2, scale - 2); g.fill(); }
    else g.fillRect(x, y, scale, scale);
  }
  return { canvas: cv, count: n };
}
export async function barcodeSvg(text, { format = 'CODE128', color = '#2f2b26', bg = '#ffffff', w = 2, h = 90 } = {}) {
  const JsBarcode = await vendor('barcode');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, String(text), { format, lineColor: color, background: bg, width: w, height: h, displayValue: true, font: 'monospace', fontSize: 14, margin: 12 });
  return svg.outerHTML;
}
export async function svgToPng(svg, scale = 2) {
  const im = await L.loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const cv = L.canvasOf((im.naturalWidth || 400) * scale, (im.naturalHeight || 200) * scale);
  cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
  return L.canvasU8(cv, 'image/png');
}

/* ---------- 画布 / 常见导出 ---------- */
export async function pngFromCanvas(c, name = 'image.png') {
  const k = await import('/kit.js');
  return k.canvasDownload(c, name);
}
export function blobU8(blob) { return blob.arrayBuffer().then((b) => new Uint8Array(b)); }
export { buildZip };
