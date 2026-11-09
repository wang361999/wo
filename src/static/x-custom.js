/* 第二批工具的交互算子：CSS 生成器、网页工具、图片画布、小游戏与 PDF 处理。
   所有文件都在本地处理，不上传；用到处理库时走站内 /vendor/。 */
import { esc, $, $$, L } from '/x-core.js';
import { vendor, pdfOpen } from '/engines.js';

const E = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const pad2 = (n) => String(n).padStart(2, '0');
const fmtArg = (x) => {
  if (typeof x === 'string') return x;
  if (x instanceof Error) return x.message;
  try { return JSON.stringify(x); } catch (e) { return String(x); }
};

/* 对原始字节算 MD5。core.js 的 L.hash 入参是字符串，内部按 UTF-8 重新编码，
   直接喂二进制会把高位字节换成替换字符，文件校验值就错了。 */
function md5Bytes(bytes) {
  const len = bytes.length, buf = new Uint8Array(((len + 8) >> 6) + 1 << 6);
  buf.set(bytes); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, len * 8, true);
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const X = new Uint32Array(16);
  for (let off = 0; off < buf.length; off += 64) {
    for (let i = 0; i < 16; i++) X[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const t = (A + F + K[i] + X[g]) >>> 0;
      const tmp = D; D = C; C = B; B = (B + ((t << S[i]) | (t >>> (32 - S[i])))) >>> 0; A = tmp;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map((x) => {
    const v = new Uint8Array(4); new DataView(v.buffer).setUint32(0, x, true);
    return Array.from(v, (q) => q.toString(16).padStart(2, '0')).join('');
  }).join('');
}

/* ---------- 通用双栏面板：设置 → 结果 / 预览 ---------- */
function fieldHTML(f) {
  const id = `x-${f.id}`;
  const label = `<label class="t-label" for="${id}">${E(f.label)}${f.unit ? ` <span class="unit">${E(f.unit)}</span>` : ''}</label>`;
  let c = '';
  if (f.type === 'select') c = `<select class="t-select" id="${id}" data-x="${E(f.id)}">${f.options.map((o) => `<option value="${E(o)}" ${String(o) === String(f.default ?? f.options[0]) ? 'selected' : ''}>${E(o)}</option>`).join('')}</select>`;
  else if (f.type === 'textarea') c = `<textarea class="t-textarea" id="${id}" data-x="${E(f.id)}" rows="${f.rows || 5}" placeholder="${E(f.placeholder || '')}">${E(f.default ?? '')}</textarea>`;
  else if (f.type === 'checkbox') return `<div class="t-field"><label class="t-check"><input type="checkbox" id="${id}" data-x="${E(f.id)}" ${f.default ? 'checked' : ''}>${E(f.label)}</label></div>`;
  else if (f.type === 'color') c = `<input class="t-input" type="color" id="${id}" data-x="${E(f.id)}" value="${E(f.default || '#2f5bd7')}" style="height:40px;padding:3px;cursor:pointer">`;
  else if (f.type === 'file') c = `<input class="t-input" type="file" id="${id}" data-x="${E(f.id)}" ${f.accept ? `accept="${E(f.accept)}"` : ''} ${f.multiple ? 'multiple' : ''} style="padding:9px">`;
  else if (f.type === 'range') c = `<input class="t-range" type="range" id="${id}" data-x="${E(f.id)}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${f.default}"><span class="t-hint" data-xv="${E(f.id)}">${f.default}</span>`;
  else c = `<input class="t-input" type="${f.type === 'number' || f.type === 'date' || f.type === 'time' ? f.type : 'text'}" id="${id}" data-x="${E(f.id)}" value="${E(f.default ?? '')}" placeholder="${E(f.placeholder || '')}" ${f.type === 'number' ? 'step="any"' : ''}>`;
  return `<div class="t-field">${label}${c}${f.hint ? `<p class="t-hint">${E(f.hint)}</p>` : ''}</div>`;
}

function panel(root, K, cfg) {
  const fields = cfg.fields || [];
  root.innerHTML = `<div class="t-work">
    <section class="t-panel ${cfg.wide ? 'wide' : ''}">
      <div class="t-head"><h2><span class="step">1</span>${E(cfg.title || '设置')}</h2><span class="hint">本机处理</span></div>
      ${fields.map(fieldHTML).join('')}
      ${cfg.extraHTML || ''}
    </section>
    <section class="t-panel">
      <div class="t-head"><h2><span class="step">2</span>${E(cfg.outTitle || '结果')}</h2><span class="hint">实时更新</span></div>
      <div class="t-stat-row" data-x-stats></div>
      <div class="t-preview" data-x-preview style="display:none"></div>
      <div class="t-out" data-x-code style="white-space:pre-wrap;font-family:var(--mono);font-size:12px"></div>
      <p class="t-err" data-x-err style="display:none"></p>
      <div class="t-actions"><button type="button" class="t-btn primary" data-x-copy>${E(cfg.copyLabel || '复制结果')}</button>
        ${(cfg.actions || []).map((a, i) => `<button type="button" class="t-btn" data-x-act="${i}">${E(a.label)}</button>`).join('')}</div>
      ${cfg.note ? `<p class="t-hint">${E(cfg.note)}</p>` : ''}
    </section></div>`;
  const codeEl = $('[data-x-code]', root), preEl = $('[data-x-preview]', root), errEl = $('[data-x-err]', root), statEl = $('[data-x-stats]', root);
  const vals = () => {
    const v = {};
    for (const f of fields) {
      const el = $(`[data-x="${f.id}"]`, root);
      if (!el) continue;
      if (f.type === 'file') v[f.id] = el.files;
      else if (f.type === 'checkbox') v[f.id] = el.checked;
      else if (f.type === 'number' || f.type === 'range') v[f.id] = Number(el.value);
      else v[f.id] = el.value;
    }
    return v;
  };
  let last = '', lastV = null;
  const render = async () => {
    const v = vals(); lastV = v;
    for (const f of fields) if (f.type === 'range') { const s = $(`[data-xv="${f.id}"]`, root); if (s) s.textContent = v[f.id]; }
    try {
      const r = (await cfg.build(v, { root, K, preview: preEl })) || {};
      errEl.style.display = 'none';
      if (r.error) { errEl.textContent = r.error; errEl.style.display = ''; return; }
      last = r.copy ?? r.code ?? r.text ?? '';
      codeEl.textContent = r.code ?? r.text ?? '';
      statEl.innerHTML = (r.stats || []).map((s) => `<div class="t-stat"><b>${E(s.value)}</b><span>${E(s.label)}</span></div>`).join('');
      if (r.preview) { preEl.style.display = ''; preEl.innerHTML = r.preview; } else { preEl.style.display = 'none'; preEl.innerHTML = ''; }
    } catch (e) { errEl.textContent = e.message || String(e); errEl.style.display = ''; }
  };
  root.addEventListener('input', render);
  root.addEventListener('change', render);
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-x-copy]')) { K.copy(last); return; }
    const a = e.target.closest('[data-x-act]');
    if (a) { const act = cfg.actions[Number(a.dataset.xAct)]; if (act) act.run(vals(), { root, K, getResult: () => last, getValues: () => lastV }); }
    if (cfg.onClick) cfg.onClick(e, vals(), { root, K, render });
  });
  K.setAction(cfg.mobileLabel || cfg.copyLabel || '复制结果', () => K.copy(last));
  render();
  return { render, values: vals, setCode: (s) => { codeEl.textContent = s; last = s; }, setError: (s) => { errEl.textContent = s; errEl.style.display = ''; } };
}

/* CSS 生成器共用：build 返回 { css, demo } */
function cssTool(fields, build, note) {
  return (root, K) => panel(root, K, {
    title: '调参数', outTitle: '生成的 CSS', copyLabel: '复制 CSS',
    note,
    fields,
    build: (v) => {
      const r = build(v);
      return { code: r.css, copy: r.css, preview: `<div style="width:100%;display:flex;justify-content:center;padding:22px;background:${E(r.bg || '#f6f8fb')};border-radius:8px">${r.demo}</div>`, stats: r.stats };
    },
  });
}

/* 文件读取辅助 */
const readFile = (f, as = 'arrayBuffer') => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result); r.onerror = () => rej(new Error('文件读取失败'));
  if (as === 'text') r.readAsText(f); else if (as === 'dataurl') r.readAsDataURL(f); else r.readAsArrayBuffer(f);
});
const imgFrom = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('图片解码失败')); i.src = url; });
const canvasDL = (K, canvas, name) => canvas.toBlob((b) => { if (b) K.download(name, b); }, 'image/png');

/* 小游戏用的简单画布助手 */
function gameShell(root, K, title, hint, inner, actionLabel) {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>${E(title)}</h2><span class="hint">${E(hint)}</span></div>
    ${inner}</section></div>`;
  return { root };
}

export const CUSTOM = {
  /* ---------- 站长与网页 ---------- */
  browserinfo: (root, K) => panel(root, K, {
    title: '当前浏览器', fields: [], outTitle: '检测结果', copyLabel: '复制信息',
    build: () => {
      const n = navigator, s = screen, keys = [
        ['User-Agent', n.userAgent], ['平台', n.platform || '未公开'], ['语言', n.language],
        ['首选语言', (n.languages || []).join(', ')], ['Cookie 可用', String(n.cookieEnabled)],
        ['在线状态', String(n.onLine)], ['逻辑处理器', String(n.hardwareConcurrency || '未公开')],
        ['设备内存', n.deviceMemory ? n.deviceMemory + ' GB（近似）' : '未公开'],
        ['触屏点数', String(n.maxTouchPoints || 0)], ['屏幕', `${s.width} × ${s.height}`],
        ['可用区域', `${s.availWidth} × ${s.availHeight}`], ['像素比', String(window.devicePixelRatio)],
        ['色彩深度', s.colorDepth + ' bit'], ['视口', `${innerWidth} × ${innerHeight}`],
        ['时区', Intl.DateTimeFormat().resolvedOptions().timeZone], ['UTC 偏移', `UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)}`],
        ['暗色偏好', matchMedia('(prefers-color-scheme: dark)').matches ? '深色' : '浅色'],
        ['Web Crypto', String(!!crypto.subtle)], ['Wake Lock', String('wakeLock' in navigator)],
        ['Clipboard API', String(!!n.clipboard)], ['压缩流', String(typeof CompressionStream !== 'undefined')],
        ['条码识别', String('BarcodeDetector' in window)], ['屏幕取色', String('EyeDropper' in window)],
      ];
      return { text: keys.map((x) => `${x[0]}：${x[1]}`).join('\n'), copy: keys.map((x) => x.join('\t')).join('\n'),
        preview: `<div style="width:100%;max-height:320px;overflow:auto"><table class="t-table"><tbody>${keys.map((x) => `<tr><th>${E(x[0])}</th><td>${E(x[1])}</td></tr>`).join('')}</tbody></table></div>`,
        stats: [{ label: '检测项', value: String(keys.length) }] };
    },
  }),
  utm: (root, K) => panel(root, K, {
    title: 'UTM 参数', outTitle: '生成的网址', copyLabel: '复制网址',
    fields: [
      { id: 'url', label: '目标网址', type: 'text', default: 'https://www.gitd.cn/', placeholder: 'https://…' },
      { id: 'source', label: 'utm_source 来源', type: 'text', default: 'newsletter' },
      { id: 'medium', label: 'utm_medium 媒介', type: 'text', default: 'email' },
      { id: 'campaign', label: 'utm_campaign 活动', type: 'text', default: 'launch' },
      { id: 'term', label: 'utm_term 关键词', type: 'text', default: '' },
      { id: 'content', label: 'utm_content 内容', type: 'text', default: '' },
    ],
    build: (v) => {
      let u;
      try { u = new URL(String(v.url).trim()); } catch (e) { return { error: '请填完整网址，包含 https://' }; }
      const map = { utm_source: v.source, utm_medium: v.medium, utm_campaign: v.campaign, utm_term: v.term, utm_content: v.content };
      for (const [k, val] of Object.entries(map)) if (String(val).trim()) u.searchParams.set(k, String(val).trim());
      return { code: u.toString(), copy: u.toString(), stats: [{ label: '参数个数', value: String([...u.searchParams.keys()].length) }] };
    },
  }),
  robotsgen: (root, K) => panel(root, K, {
    title: '规则设置', outTitle: 'robots.txt', copyLabel: '复制 robots.txt',
    fields: [
      { id: 'site', label: '站点域名', type: 'text', default: 'https://www.gitd.cn/' },
      { id: 'allowall', label: '默认允许所有抓取', type: 'checkbox', default: true },
      { id: 'disallow', label: '禁止抓取的路径', type: 'textarea', rows: 4, default: '/api/\n/search?', placeholder: '一行一条' },
      { id: 'sitemap', label: 'Sitemap 地址', type: 'text', default: 'https://www.gitd.cn/sitemap.xml' },
      { id: 'delay', label: '抓取间隔 Crawl-delay', type: 'number', default: 0, unit: '秒，0 表示不写' },
    ],
    actions: [{ label: '下载 robots.txt', run: (v, c) => c.K.download('robots.txt', c.getResult(), 'text/plain;charset=utf-8') }],
    build: (v) => {
      const a = ['User-agent: *'];
      if (v.allowall) a.push('Allow: /');
      for (const l of String(v.disallow).split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) a.push(`Disallow: ${l}`);
      if (Number(v.delay) > 0) a.push(`Crawl-delay: ${Number(v.delay)}`);
      if (String(v.sitemap).trim()) a.push('', `Sitemap: ${String(v.sitemap).trim()}`);
      return { code: a.join('\n'), copy: a.join('\n'), stats: [{ label: '规则行数', value: String(a.filter((x) => x && !x.startsWith('Sitemap')).length) }] };
    },
  }),
  metagen: (root, K) => panel(root, K, {
    title: '页面信息', outTitle: 'head 标签', copyLabel: '复制标签',
    fields: [
      { id: 'title', label: '页面标题', type: 'text', default: '一页工具 - 打开就能用' },
      { id: 'desc', label: 'description', type: 'textarea', rows: 3, default: '一组打开就能用的免费在线工具。' },
      { id: 'keywords', label: 'keywords', type: 'text', default: '在线工具,工具箱' },
      { id: 'url', label: 'canonical / og:url', type: 'text', default: 'https://www.gitd.cn/' },
      { id: 'img', label: 'og:image', type: 'text', default: 'https://www.gitd.cn/og.png' },
      { id: 'name', label: '站点名', type: 'text', default: '一页工具' },
    ],
    build: (v) => {
      const h = (s) => E(s);
      const tags = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${h(v.title)}</title>`,
        `<meta name="description" content="${h(v.desc)}">`,
        `<meta name="keywords" content="${h(v.keywords)}">`,
        `<link rel="canonical" href="${h(v.url)}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${h(v.title)}">`,
        `<meta property="og:description" content="${h(v.desc)}">`,
        `<meta property="og:url" content="${h(v.url)}">`,
        `<meta property="og:site_name" content="${h(v.name)}">`,
        `<meta property="og:image" content="${h(v.img)}">`,
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${h(v.title)}">`,
        `<meta name="twitter:description" content="${h(v.desc)}">`,
        `<meta name="twitter:image" content="${h(v.img)}">`,
      ];
      return { code: tags.join('\n'), copy: tags.join('\n'), stats: [{ label: '标签数', value: String(tags.length) }] };
    },
  }),
  htmlpreview: (root, K) => panel(root, K, {
    title: 'HTML / CSS / JS', outTitle: '隔离预览', copyLabel: '复制源码', wide: true,
    fields: [
      { id: 'html', label: 'HTML', type: 'textarea', rows: 7, default: '<h1>你好，一页工具</h1>\n<p>写点什么，右边立刻能看到。</p>' },
      { id: 'css', label: 'CSS', type: 'textarea', rows: 4, default: 'body{font-family:system-ui;padding:24px;color:#1b2432}h1{color:#2f5bd7}' },
      { id: 'js', label: 'JS（可选）', type: 'textarea', rows: 3, default: '' },
    ],
    build: (v) => {
      const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${v.css}</style></head><body>${v.html}<script>try{${v.js}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:red">'+e.message+'</pre>')}<\/script></body></html>`;
      return { code: doc, copy: doc, preview: `<iframe sandbox="allow-scripts" style="width:100%;height:320px;border:1px solid #e3e8f0;border-radius:8px;background:#fff" srcdoc="${E(doc)}"></iframe>` };
    },
  }),
  jsrunner: (root, K) => {
    const p = panel(root, K, {
      title: 'JS 代码', outTitle: '控制台输出', copyLabel: '复制输出', mobileLabel: '运行代码', wide: true,
      fields: [{ id: 'code', label: '代码', type: 'textarea', rows: 10, default: 'const a = [1,2,3];\nconsole.log(a.map(x => x * 2));\nconsole.log(new Date().toLocaleString("zh-CN"));' }],
      actions: [{ label: '运行', run: () => {} }],
      build: () => ({ code: '点「运行」执行。' }),
    });
    const run = () => {
      const v = p.values(), logs = [];
      const fake = { log: (...a) => logs.push(a.map(fmtArg).join(' ')), warn: (...a) => logs.push('⚠ ' + a.map(fmtArg).join(' ')), error: (...a) => logs.push('✗ ' + a.map(fmtArg).join(' ')), info: (...a) => logs.push(a.map(fmtArg).join(' ')), table: (x) => logs.push(JSON.stringify(x)) };
      const t0 = performance.now();
      try {
        // 只用 new Function 包一层，不接触页面作用域，也不联网
        const fn = new Function('console', v.code);
        fn(fake);
        logs.push(`\n执行完成，用时 ${(performance.now() - t0).toFixed(2)} ms`);
      } catch (e) { logs.push('✗ ' + (e.message || String(e))); }
      p.setCode(logs.join('\n') || '（没有输出）');
    };
    root.addEventListener('click', (e) => { if (e.target.closest('[data-x-act]')) run(); });
    K.setAction('运行代码', run);
    run();
  },
  badge: (root, K) => panel(root, K, {
    title: '徽章内容', outTitle: 'SVG 徽章', copyLabel: '复制 SVG',
    fields: [
      { id: 'label', label: '左侧标签', type: 'text', default: 'build' },
      { id: 'value', label: '右侧状态', type: 'text', default: 'passing' },
      { id: 'color', label: '状态底色', type: 'color', default: '#2f5bd7' },
      { id: 'style', label: '样式', type: 'select', options: ['flat', 'rounded'], default: 'flat' },
    ],
    actions: [{ label: '下载 SVG', run: (v, c) => c.K.download('badge.svg', c.getResult(), 'image/svg+xml') }],
    build: (v) => {
      const w1 = Math.max(38, String(v.label).length * 7 + 14), w2 = Math.max(38, String(v.value).length * 7 + 14), W = w1 + w2;
      const rx = v.style === 'rounded' ? 4 : 0;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="20" role="img" aria-label="${E(v.label)}: ${E(v.value)}"><rect width="${W}" height="20" rx="${rx}" fill="#555"/><rect x="${w1}" width="${w2}" height="20" rx="${rx}" fill="${E(v.color)}"/><rect x="${w1}" width="4" height="20" fill="${E(v.color)}"/><g fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11"><text x="${w1 / 2}" y="14">${E(v.label)}</text><text x="${w1 + w2 / 2}" y="14">${E(v.value)}</text></g></svg>`;
      return { code: svg, copy: svg, preview: `<div style="text-align:center">${svg}</div>`, stats: [{ label: '宽度', value: W + 'px' }] };
    },
  }),
  shortcut: (root, K) => panel(root, K, {
    title: '快捷方式', outTitle: '文件内容', copyLabel: '复制内容',
    fields: [
      { id: 'name', label: '名称', type: 'text', default: '一页工具' },
      { id: 'url', label: '网址', type: 'text', default: 'https://www.gitd.cn/' },
      { id: 'os', label: '目标系统', type: 'select', options: ['Windows .url', 'Linux .desktop'], default: 'Windows .url' },
    ],
    actions: [{ label: '下载文件', run: (v, c) => c.K.download(v.os.startsWith('Windows') ? `${v.name}.url` : `${v.name}.desktop`, c.getResult(), 'text/plain;charset=utf-8') }],
    build: (v) => {
      const s = v.os.startsWith('Windows')
        ? `[InternetShortcut]\nURL=${v.url}\nIconIndex=0`
        : `[Desktop Entry]\nType=Link\nName=${v.name}\nURL=${v.url}\nIcon=text-html`;
      return { code: s, copy: s };
    },
  }),
  pagerefresh: (root, K) => {
    const p = panel(root, K, {
      title: '刷新设置', outTitle: '预览', copyLabel: '复制网址',
      fields: [
        { id: 'url', label: '网址', type: 'text', default: 'https://www.gitd.cn/' },
        { id: 'sec', label: '间隔', type: 'number', default: 30, unit: '秒' },
      ],
      note: '很多站点用 X-Frame-Options 禁止被嵌入，遇到空白是对方限制，不是工具故障。',
      build: (v) => ({ code: v.url, copy: v.url, preview: `<iframe data-frame src="${E(v.url)}" style="width:100%;height:280px;border:1px solid #e3e8f0;border-radius:8px;background:#fff"></iframe>` }),
    });
    let timer = null;
    const tick = () => { const f = $('[data-frame]', root); if (f) f.src = p.values().url + (p.values().url.includes('?') ? '&' : '?') + '_r=' + Date.now(); };
    const restart = () => { clearInterval(timer); const s = clamp(Number(p.values().sec) || 30, 3, 3600); timer = setInterval(tick, s * 1000); };
    root.addEventListener('input', restart); root.addEventListener('change', restart);
    restart();
  },
  wstest: (root, K) => {
    const p = panel(root, K, {
      title: '连接设置', outTitle: '消息日志', copyLabel: '复制日志',
      fields: [
        { id: 'url', label: 'WebSocket 地址', type: 'text', default: '', placeholder: 'wss://echo.websocket.events' },
        { id: 'msg', label: '要发送的消息', type: 'text', default: 'hello' },
      ],
      actions: [{ label: '连接', run: () => {} }, { label: '发送', run: () => {} }, { label: '断开', run: () => {} }],
      note: '只能连接允许浏览器跨域的公开服务，不要填需要凭据的内网地址。',
      build: () => ({ code: '尚未连接。' }),
    });
    let ws = null; const log = [];
    const add = (s) => { log.push(`[${new Date().toLocaleTimeString('zh-CN')}] ${s}`); p.setCode(log.join('\n')); };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-x-act]'); if (!b) return;
      const i = Number(b.dataset.xAct), v = p.values();
      if (i === 0) {
        if (!/^wss?:\/\//.test(v.url)) { add('请填 wss:// 或 ws:// 开头的地址'); return; }
        try { ws = new WebSocket(v.url); add('正在连接 ' + v.url); ws.onopen = () => add('已连接'); ws.onmessage = (ev) => add('收到：' + ev.data); ws.onerror = () => add('连接出错'); ws.onclose = () => add('连接已关闭'); }
        catch (err) { add('创建连接失败：' + err.message); }
      } else if (i === 1) { if (ws && ws.readyState === 1) { ws.send(v.msg); add('已发送：' + v.msg); } else add('还没有建立连接'); }
      else if (i === 2) { if (ws) ws.close(); ws = null; add('已主动断开'); }
    });
  },
  eyedropper: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>屏幕取色</h2><span class="hint">浏览器原生能力</span></div>
      <button type="button" class="t-btn primary" data-pick>开始取色</button>
      <p class="t-hint" data-msg style="margin-top:14px">点按钮后光标会变成取色器，点屏幕任意位置取色。</p>
      <div data-swatch style="height:90px;border-radius:8px;border:1px solid #e3e8f0;margin-top:14px;background:#f6f8fb"></div>
      </section></div>`;
    root.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-pick]')) return;
      if (!('EyeDropper' in window)) { $('[data-msg]', root).textContent = '当前浏览器不支持 EyeDropper API，请用较新版本的 Edge 或 Chrome。'; return; }
      try { const r = await new EyeDropper().open(); $('[data-msg]', root).textContent = `取到颜色：${r.sRGBHex}　点这里复制`; $('[data-swatch]', root).style.background = r.sRGBHex; $('[data-msg]', root).onclick = () => K.copy(r.sRGBHex); }
      catch (err) { $('[data-msg]', root).textContent = '已取消或取色失败。'; }
    });
    K.setAction('开始取色', () => $('[data-pick]', root)?.click());
  },

  /* ---------- CSS 生成器 ---------- */
  cssglass: cssTool([
    { id: 'blur', label: '背景模糊', type: 'range', min: 0, max: 30, default: 12, unit: 'px' },
    { id: 'alpha', label: '背景不透明度', type: 'range', min: 0, max: 90, default: 22, unit: '%' },
    { id: 'radius', label: '圆角', type: 'range', min: 0, max: 40, default: 16, unit: 'px' },
    { id: 'border', label: '描边不透明度', type: 'range', min: 0, max: 80, default: 35, unit: '%' },
    { id: 'color', label: '玻璃底色', type: 'color', default: '#ffffff' },
  ], (v) => ({
    bg: 'linear-gradient(120deg,#7aa8ff,#f0a6c8 55%,#9be7c4)',
    css: `background: ${v.color}${Math.round(v.alpha * 2.55).toString(16).padStart(2, '0')};\nbackdrop-filter: blur(${v.blur}px) saturate(160%);\n-webkit-backdrop-filter: blur(${v.blur}px) saturate(160%);\nborder: 1px solid rgba(255,255,255,${(v.border / 100).toFixed(2)});\nborder-radius: ${v.radius}px;\nbox-shadow: 0 8px 32px rgba(31,38,135,.18);`,
    demo: `<div style="padding:26px 38px;background:${v.color}${Math.round(v.alpha * 2.55).toString(16).padStart(2, '0')};backdrop-filter:blur(${v.blur}px) saturate(160%);-webkit-backdrop-filter:blur(${v.blur}px) saturate(160%);border:1px solid rgba(255,255,255,${v.border / 100});border-radius:${v.radius}px;box-shadow:0 8px 32px rgba(31,38,135,.18);color:#1b2432;font-weight:600">毛玻璃卡片</div>`,
  }), '需要卡片背后有内容才能看出模糊效果。'),
  cssloading: cssTool([
    { id: 'style', label: '样式', type: 'select', options: ['旋转圆环', '跳动圆点', '进度条', '脉冲方块'], default: '旋转圆环' },
    { id: 'color', label: '颜色', type: 'color', default: '#2f5bd7' },
    { id: 'size', label: '尺寸', type: 'range', min: 12, max: 80, default: 40, unit: 'px' },
    { id: 'speed', label: '速度', type: 'range', min: 4, max: 30, default: 10, unit: '×0.1s' },
  ], (v) => {
    const t = (v.speed / 10).toFixed(1), c = v.color, s = v.size;
    let inner = '', css = '';
    if (v.style === '旋转圆环') { css = `.loader{width:${s}px;height:${s}px;border:4px solid #e3e8f0;border-top-color:${c};border-radius:50%;animation:spin ${t}s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}`; inner = `<div class="loader"></div>`; }
    else if (v.style === '跳动圆点') { css = `.loader{display:flex;gap:6px}\n.loader i{width:${Math.round(s / 4)}px;height:${Math.round(s / 4)}px;border-radius:50%;background:${c};animation:bounce ${t}s infinite ease-in-out}\n.loader i:nth-child(2){animation-delay:.15s}.loader i:nth-child(3){animation-delay:.3s}\n@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-${Math.round(s / 2)}px);opacity:1}}`; inner = `<div class="loader"><i></i><i></i><i></i></div>`; }
    else if (v.style === '进度条') { css = `.loader{width:${s * 4}px;height:8px;border-radius:8px;background:#e3e8f0;overflow:hidden}\n.loader::after{content:"";display:block;width:40%;height:100%;background:${c};border-radius:8px;animation:slide ${t}s infinite ease-in-out}\n@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`; inner = `<div class="loader"></div>`; }
    else { css = `.loader{width:${s}px;height:${s}px;background:${c};border-radius:8px;animation:pulse ${t}s infinite ease-in-out}\n@keyframes pulse{0%,100%{transform:scale(.6);opacity:.4}50%{transform:scale(1);opacity:1}}`; inner = `<div class="loader"></div>`; }
    return { css, demo: `<style>${css}</style>${inner}` };
  }, '复制 CSS 后记得把 @keyframes 一起带上。'),
  cssbubble: cssTool([
    { id: 'text', label: '气泡文字', type: 'text', default: '这是一段带小三角的对话气泡' },
    { id: 'bg', label: '气泡底色', type: 'color', default: '#eaf1ff' },
    { id: 'radius', label: '圆角', type: 'range', min: 0, max: 30, default: 12, unit: 'px' },
    { id: 'size', label: '三角大小', type: 'range', min: 4, max: 28, default: 12, unit: 'px' },
    { id: 'pos', label: '三角水平位置', type: 'range', min: 5, max: 95, default: 25, unit: '%' },
    { id: 'side', label: '三角朝向', type: 'select', options: ['朝下', '朝上', '朝左', '朝右'], default: '朝下' },
  ], (v) => {
    const s = v.size, c = v.bg;
    const after = { 朝下: `bottom:-${s - 1}px;left:${v.pos}%;transform:translateX(-50%);border-width:${s}px ${s}px 0;border-color:${c} transparent transparent`, 朝上: `top:-${s - 1}px;left:${v.pos}%;transform:translateX(-50%);border-width:0 ${s}px ${s}px;border-color:transparent transparent ${c}`, 朝左: `left:-${s - 1}px;top:${v.pos}%;transform:translateY(-50%);border-width:${s}px ${s}px ${s}px 0;border-color:transparent ${c} transparent transparent`, 朝右: `right:-${s - 1}px;top:${v.pos}%;transform:translateY(-50%);border-width:${s}px 0 ${s}px ${s}px;border-color:transparent transparent transparent ${c}` }[v.side];
    const css = `.bubble{position:relative;display:inline-block;padding:12px 16px;background:${c};border-radius:${v.radius}px;color:#1b2432}\n.bubble::after{content:"";position:absolute;width:0;height:0;border-style:solid;${after}}`;
    return { css, demo: `<style>${css}</style><div class="bubble">${E(v.text)}</div>` };
  }),
  cssstripes: cssTool([
    { id: 'c1', label: '颜色一', type: 'color', default: '#eaf1ff' },
    { id: 'c2', label: '颜色二', type: 'color', default: '#ffffff' },
    { id: 'angle', label: '角度', type: 'range', min: 0, max: 180, default: 45, unit: '度' },
    { id: 'w', label: '条纹宽度', type: 'range', min: 4, max: 60, default: 20, unit: 'px' },
  ], (v) => {
    const css = `background: repeating-linear-gradient(\n  ${v.angle}deg,\n  ${v.c1} 0,\n  ${v.c1} ${v.w}px,\n  ${v.c2} ${v.w}px,\n  ${v.c2} ${v.w * 2}px\n);`;
    return { css, demo: `<div style="width:100%;height:110px;border-radius:8px;${css}"></div>` };
  }),
  cssneu: cssTool([
    { id: 'bg', label: '底色', type: 'color', default: '#eef1f6' },
    { id: 'dist', label: '阴影距离', type: 'range', min: 2, max: 30, default: 10, unit: 'px' },
    { id: 'blur', label: '模糊', type: 'range', min: 4, max: 60, default: 20, unit: 'px' },
    { id: 'radius', label: '圆角', type: 'range', min: 0, max: 60, default: 20, unit: 'px' },
    { id: 'inset', label: '内凹效果', type: 'checkbox', default: false },
  ], (v) => {
    const d = v.dist, b = v.blur, light = 'rgba(255,255,255,.9)', dark = 'rgba(163,177,198,.55)';
    const sh = v.inset ? `inset ${d}px ${d}px ${b}px ${dark}, inset -${d}px -${d}px ${b}px ${light}` : `${d}px ${d}px ${b}px ${dark}, -${d}px -${d}px ${b}px ${light}`;
    const css = `background: ${v.bg};\nborder-radius: ${v.radius}px;\nbox-shadow: ${sh};`;
    return { css, bg: v.bg, demo: `<div style="width:150px;height:110px;background:${v.bg};border-radius:${v.radius}px;box-shadow:${sh}"></div>` };
  }, '新拟态对底色要求高，浅灰底上效果最好。'),
  csstextshadow: cssTool([
    { id: 'text', label: '文字', type: 'text', default: '一页工具' },
    { id: 'color', label: '阴影颜色', type: 'color', default: '#2f5bd7' },
    { id: 'x', label: '水平偏移', type: 'range', min: -20, max: 20, default: 3, unit: 'px' },
    { id: 'y', label: '垂直偏移', type: 'range', min: -20, max: 20, default: 3, unit: 'px' },
    { id: 'blur', label: '模糊', type: 'range', min: 0, max: 30, default: 6, unit: 'px' },
    { id: 'layers', label: '叠加层数', type: 'range', min: 1, max: 6, default: 2 },
  ], (v) => {
    const arr = [];
    for (let i = 1; i <= v.layers; i++) arr.push(`${v.x * i}px ${v.y * i}px ${v.blur}px ${v.color}${Math.round(Math.max(30, 200 - i * 28)).toString(16).padStart(2, '0')}`);
    const css = `font-size: 40px;\nfont-weight: 700;\ncolor: #1b2432;\ntext-shadow: ${arr.join(',\n  ')};`;
    return { css, demo: `<div style="font-size:40px;font-weight:700;color:#1b2432;text-shadow:${arr.join(',')}">${E(v.text)}</div>` };
  }),
  cssbutton: cssTool([
    { id: 'text', label: '按钮文字', type: 'text', default: '立即使用' },
    { id: 'c1', label: '渐变起色', type: 'color', default: '#2f5bd7' },
    { id: 'c2', label: '渐变终色', type: 'color', default: '#6b8cf5' },
    { id: 'radius', label: '圆角', type: 'range', min: 0, max: 30, default: 10, unit: 'px' },
    { id: 'pad', label: '内边距', type: 'range', min: 6, max: 28, default: 12, unit: 'px' },
  ], (v) => {
    const css = `.btn{\n  display:inline-block;\n  padding:${v.pad}px ${v.pad * 2}px;\n  border:0;\n  border-radius:${v.radius}px;\n  background:linear-gradient(135deg,${v.c1},${v.c2});\n  color:#fff;\n  font-size:15px;\n  font-weight:600;\n  cursor:pointer;\n  box-shadow:0 6px 16px ${v.c1}40;\n  transition:transform .15s ease, box-shadow .15s ease;\n}\n.btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px ${v.c1}55;}`;
    return { css, demo: `<style>.xbtn{display:inline-block;padding:${v.pad}px ${v.pad * 2}px;border:0;border-radius:${v.radius}px;background:linear-gradient(135deg,${v.c1},${v.c2});color:#fff;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 16px ${v.c1}40}</style><button class="xbtn" type="button">${E(v.text)}</button>` };
  }),

  /* ---------- 图片与画布 ---------- */
  filemd5: (root, K) => {
    const p = panel(root, K, {
      title: '选择文件', outTitle: '校验值', copyLabel: '复制 MD5',
      fields: [{ id: 'file', label: '本地文件', type: 'file' }],
      actions: [{ label: '复制全部', run: (v, c) => c.K.copy(c.getResult()) }],
      build: async (v) => {
        const f = v.file && v.file[0];
        if (!f) return { code: '选一个文件，结果会在这里显示。', copy: '' };
        const buf = await readFile(f);
        const u = new Uint8Array(buf);
        const sha = await crypto.subtle.digest('SHA-256', u);
        const md5 = md5Bytes(u);
        return { code: `文件：${f.name}\n大小：${f.size.toLocaleString('zh-CN')} 字节\nMD5：${md5}\nSHA-256：${L.bytesToHex(sha)}`,
          copy: md5, stats: [{ label: '文件大小', value: (f.size / 1024).toFixed(1) + ' KB' }] };
      },
    });
  },
  qrdecode: (root, K) => panel(root, K, {
    title: '二维码图片', outTitle: '识别结果', copyLabel: '复制内容',
    fields: [{ id: 'file', label: '图片', type: 'file', accept: 'image/*' }],
    note: '依赖浏览器内置 BarcodeDetector；不支持时会明确提示，不会伪造结果。',
    build: async (v) => {
      const f = v.file && v.file[0];
      if (!f) return { code: '选一张二维码图片。', copy: '' };
      if (!('BarcodeDetector' in window)) return { error: '当前浏览器没有 BarcodeDetector，请用较新版本的 Chrome / Edge 或从应用商店安装支持该能力的浏览器。' };
      const bmp = await createImageBitmap(f);
      const det = new BarcodeDetector({ formats: ['qr_code'] });
      const r = await det.detect(bmp);
      if (!r.length) return { error: '图里没有识别到二维码，换个清晰一点的图试试。' };
      return { code: r.map((x) => x.rawValue).join('\n'), copy: r[0].rawValue, stats: [{ label: '识别到', value: String(r.length) + ' 个' }] };
    },
  }),
  imagepicker: (root, K) => {
    const p = panel(root, K, {
      title: '图片取色', outTitle: '取到的颜色', copyLabel: '复制色值',
      fields: [{ id: 'file', label: '图片', type: 'file', accept: 'image/*' }],
      build: (v) => ({ code: '选一张图片，然后点图里的任意位置取色。', copy: '', preview: v.file && v.file[0] ? '' : '' }),
    });
    let url = '';
    root.addEventListener('change', async (e) => {
      if (!e.target.matches('[data-x="file"]')) return;
      const f = e.target.files[0]; if (!f) return;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(f);
      const i = await imgFrom(url);
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
      c.getContext('2d').drawImage(i, 0, 0);
      const ctx = c.getContext('2d');
      const pre = $('[data-x-preview]', p.root || root);
      pre.style.display = ''; pre.innerHTML = `<div style="width:100%;text-align:center"><canvas data-cv style="max-width:100%;height:auto;cursor:crosshair;border-radius:8px"></canvas></div>`;
      const cv = $('[data-cv]', root); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0);
      cv.onclick = (ev) => {
        const r = cv.getBoundingClientRect(), x = Math.floor((ev.clientX - r.left) / r.width * cv.width), y = Math.floor((ev.clientY - r.top) / r.height * cv.height);
        const d = ctx.getImageData(x, y, 1, 1).data;
        const hx = '#' + [d[0], d[1], d[2]].map((q) => q.toString(16).padStart(2, '0')).join('');
        p.setCode(`坐标：(${x}, ${y})\nHEX：${hx}\nRGB：rgb(${d[0]}, ${d[1]}, ${d[2]})\n透明度：${(d[3] / 255).toFixed(2)}`);
      };
    });
  },
  imagegray: (root, K) => panel(root, K, {
    title: '灰度转换', outTitle: '结果', copyLabel: '复制说明',
    fields: [{ id: 'file', label: '彩色图片', type: 'file', accept: 'image/*' }, { id: 'mode', label: '算法', type: 'select', options: ['加权亮度', '简单平均', '二值化'], default: '加权亮度' }, { id: 'th', label: '二值化阈值', type: 'range', min: 0, max: 255, default: 128 }],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('gray.png', c.getResult(), 'application/octet-stream') }],
    build: async (v) => {
      const f = v.file && v.file[0];
      if (!f) return { code: '选一张图片。', copy: '' };
      const img = await imgFrom(await readFile(f, 'dataurl'));
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const g = v.mode === '简单平均' ? (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3 : 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
        const val = v.mode === '二值化' ? (g > v.th ? 255 : 0) : g;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = val;
      }
      ctx.putImageData(d, 0, 0);
      const url = c.toDataURL('image/png');
      return { code: `已生成 ${c.width} × ${c.height} 的灰度图，点「下载 PNG」保存。`, copy: url,
        preview: `<div style="text-align:center"><img src="${url}" style="max-height:300px;max-width:100%;border-radius:8px"></div>`,
        stats: [{ label: '尺寸', value: `${c.width}×${c.height}` }] };
    },
  }),
  imagefilter: (root, K) => panel(root, K, {
    title: '滤镜参数', outTitle: '结果', copyLabel: '复制 CSS filter',
    fields: [
      { id: 'file', label: '图片', type: 'file', accept: 'image/*' },
      { id: 'bright', label: '亮度', type: 'range', min: 0, max: 200, default: 100, unit: '%' },
      { id: 'contrast', label: '对比度', type: 'range', min: 0, max: 200, default: 100, unit: '%' },
      { id: 'sat', label: '饱和度', type: 'range', min: 0, max: 200, default: 100, unit: '%' },
      { id: 'blur', label: '模糊', type: 'range', min: 0, max: 10, default: 0, unit: 'px' },
      { id: 'hue', label: '色相旋转', type: 'range', min: 0, max: 360, default: 0, unit: '度' },
      { id: 'sepia', label: '复古', type: 'range', min: 0, max: 100, default: 0, unit: '%' },
    ],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('filter.png', c.getResult(), 'application/octet-stream') }],
    build: async (v) => {
      const f = v.file && v.file[0];
      const filter = `brightness(${v.bright}%) contrast(${v.contrast}%) saturate(${v.sat}%) blur(${v.blur}px) hue-rotate(${v.hue}deg) sepia(${v.sepia}%)`;
      if (!f) return { code: `filter: ${filter};`, copy: `filter: ${filter};`, preview: '' };
      const img = await imgFrom(await readFile(f, 'dataurl'));
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.filter = filter; ctx.drawImage(img, 0, 0);
      const url = c.toDataURL('image/png');
      return { code: `filter: ${filter};`, copy: url,
        preview: `<div style="text-align:center"><img src="${url}" style="max-height:300px;max-width:100%;border-radius:8px"></div>` };
    },
  }),
  svg2png: (root, K) => panel(root, K, {
    title: 'SVG 源码或文件', outTitle: 'PNG', copyLabel: '复制源码',
    fields: [{ id: 'svg', label: 'SVG 源码', type: 'textarea', rows: 7, default: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="240" height="120" fill="#eaf1ff"/><text x="120" y="68" text-anchor="middle" font-size="24" fill="#2f5bd7">一页工具</text></svg>' }, { id: 'file', label: '或选 .svg 文件', type: 'file', accept: '.svg,image/svg+xml' }, { id: 'scale', label: '放大倍数', type: 'range', min: 1, max: 4, default: 2 }],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('svg.png', c.getResult(), 'application/octet-stream') }],
    build: async (v) => {
      let s = String(v.svg).trim();
      if (v.file && v.file[0]) s = await readFile(v.file[0], 'text');
      if (!/^<svg[\s\S]*<\/svg>$/i.test(s)) return { error: '请粘贴完整的 <svg>…</svg> 源码' };
      const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        const img = await imgFrom(url);
        const c = document.createElement('canvas');
        c.width = (img.naturalWidth || 240) * v.scale; c.height = (img.naturalHeight || 120) * v.scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const png = c.toDataURL('image/png');
        return { code: s, copy: png, preview: `<div style="text-align:center"><img src="${png}" style="max-height:300px;max-width:100%"></div>`, stats: [{ label: '导出尺寸', value: `${c.width}×${c.height}` }] };
      } finally { URL.revokeObjectURL(url); }
    },
  }),
  img2svg: (root, K) => panel(root, K, {
    title: '图片', outTitle: 'SVG 源码', copyLabel: '复制 SVG',
    fields: [{ id: 'file', label: '图片', type: 'file', accept: 'image/*' }],
    note: '生成的是把位图内嵌进 SVG 容器的矢量外壳，不会把像素转成路径。',
    actions: [{ label: '下载 SVG', run: (v, c) => c.K.download('image.svg', c.getResult(), 'image/svg+xml') }],
    build: async (v) => {
      const f = v.file && v.file[0];
      if (!f) return { code: '选一张图片。', copy: '' };
      const data = await readFile(f, 'dataurl');
      const img = await imgFrom(data);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.naturalWidth}" height="${img.naturalHeight}" viewBox="0 0 ${img.naturalWidth} ${img.naturalHeight}">\n  <image width="${img.naturalWidth}" height="${img.naturalHeight}" xlink:href="${data}"/>\n</svg>`;
      return { code: svg, copy: svg, preview: `<div style="text-align:center"><img src="${data}" style="max-height:280px;max-width:100%"></div>` };
    },
  }),
  code2img: (root, K) => panel(root, K, {
    title: '代码与样式', outTitle: '分享图', copyLabel: '复制代码',
    fields: [
      { id: 'code', label: '代码', type: 'textarea', rows: 7, default: 'function hello(name) {\n  return `你好，${name}`;\n}\nconsole.log(hello("一页工具"));' },
      { id: 'bg', label: '背景色', type: 'color', default: '#1b2432' },
      { id: 'fg', label: '文字色', type: 'color', default: '#e8eefc' },
      { id: 'size', label: '字号', type: 'range', min: 12, max: 30, default: 17, unit: 'px' },
    ],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('code.png', c.getResult(), 'application/octet-stream') }],
    build: (v) => {
      const a = String(v.code).split(/\r?\n/), pad = 32, lh = v.size * 1.65;
      const w = Math.max(420, ...a.map((x) => x.length * v.size * 0.62)) + pad * 2, h = a.length * lh + pad * 2 + 46;
      const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
      const x = c.getContext('2d'); x.scale(2, 2);
      x.fillStyle = v.bg; x.fillRect(0, 0, w, h);
      x.fillStyle = v.fg; x.font = `600 12px system-ui`; x.fillText('一页工具 · 代码片段', pad, pad - 8);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { x.beginPath(); x.arc(w - pad - 36 + i * 16, pad - 12, 5, 0, Math.PI * 2); x.fillStyle = col; x.fill(); });
      x.font = `${v.size}px ui-monospace,Consolas,monospace`;
      a.forEach((ln, i) => { x.fillStyle = v.fg; x.fillText(ln, pad, pad + 26 + i * lh); });
      const url = c.toDataURL('image/png');
      return { code: v.code, copy: url, preview: `<div style="text-align:center"><img src="${url}" style="max-width:100%;border-radius:8px"></div>`, stats: [{ label: '图片尺寸', value: `${w * 2}×${h * 2}` }] };
    },
  }),
  identicon: (root, K) => panel(root, K, {
    title: '生成设置', outTitle: '头像', copyLabel: '复制说明',
    fields: [{ id: 'text', label: '输入文本', type: 'text', default: '一页工具' }, { id: 'size', label: '尺寸', type: 'range', min: 96, max: 512, default: 240, unit: 'px' }, { id: 'bg', label: '背景色', type: 'color', default: '#f6f8fb' }],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('avatar.png', c.getResult(), 'application/octet-stream') }],
    build: (v) => {
      const bytes = L.hash(String(v.text), 'sha256');
      const h = parseInt(bytes.slice(0, 6), 16), hue = h % 360;
      const c = document.createElement('canvas'); c.width = c.height = v.size;
      const x = c.getContext('2d'); x.fillStyle = v.bg; x.fillRect(0, 0, v.size, v.size);
      const n = 5, cell = v.size / (n + 2), color = `hsl(${hue} 62% 52%)`;
      x.fillStyle = color;
      for (let row = 0; row < n; row++) for (let col = 0; col < 3; col++) {
        if (parseInt(bytes[(row * 3 + col) % bytes.length], 16) % 2) continue;
        x.fillRect((col + 1) * cell, (row + 1) * cell, cell, cell);
        x.fillRect((n - col) * cell, (row + 1) * cell, cell, cell);
      }
      const url = c.toDataURL('image/png');
      return { code: `由「${v.text}」的 SHA-256 生成 ${v.size}×${v.size} 的对称头像。`, copy: url,
        preview: `<div style="text-align:center"><img src="${url}" style="width:${Math.min(200, v.size)}px;height:${Math.min(200, v.size)}px;border-radius:12px"></div>` };
    },
  }),
  twoblock: (root, K) => panel(root, K, {
    title: 'Logo 内容', outTitle: '图片', copyLabel: '复制说明',
    fields: [
      { id: 'a', label: '前半文字', type: 'text', default: '一页' }, { id: 'b', label: '后半文字', type: 'text', default: '工具' },
      { id: 'bg', label: '背景色', type: 'color', default: '#141414' }, { id: 'fg', label: '高亮块颜色', type: 'color', default: '#f5a623' },
      { id: 'size', label: '字号', type: 'range', min: 30, max: 120, default: 64, unit: 'px' },
    ],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('logo.png', c.getResult(), 'application/octet-stream') }],
    build: (v) => {
      const c = document.createElement('canvas'); c.width = 720; c.height = 220;
      const x = c.getContext('2d'); x.fillStyle = v.bg; x.fillRect(0, 0, c.width, c.height);
      x.font = `700 ${v.size}px system-ui,sans-serif`; x.textBaseline = 'middle';
      const w1 = x.measureText(v.a).width, w2 = x.measureText(v.b).width, gap = 22;
      const start = (c.width - (w1 + w2 + gap)) / 2;
      x.fillStyle = '#ffffff'; x.fillText(v.a, start, c.height / 2);
      x.fillStyle = v.fg; x.fillRect(start + w1 + gap / 2 - 6, c.height / 2 - v.size * 0.62, w2 + 12, v.size * 1.24);
      x.fillStyle = v.bg; x.fillText(v.b, start + w1 + gap / 2, c.height / 2);
      const url = c.toDataURL('image/png');
      return { code: `已生成 720×220 的双色块标识。`, copy: url, preview: `<div style="text-align:center"><img src="${url}" style="max-width:100%;border-radius:8px"></div>` };
    },
  }),
  coconut: (root, K) => panel(root, K, {
    title: '海报文字', outTitle: '图片', copyLabel: '复制说明',
    fields: [{ id: 'title', label: '主标题', type: 'text', default: '椰树风格' }, { id: 'sub', label: '副标题', type: 'text', default: '一页工具 · 打开就能用' }, { id: 'bg', label: '背景色', type: 'color', default: '#0a6b5e' }, { id: 'fg', label: '文字色', type: 'color', default: '#fff3c4' }],
    actions: [{ label: '下载 PNG', run: (v, c) => c.K.download('poster.png', c.getResult(), 'application/octet-stream') }],
    build: (v) => {
      const c = document.createElement('canvas'); c.width = 600; c.height = 800;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 800); g.addColorStop(0, v.bg); g.addColorStop(1, '#043b36');
      x.fillStyle = g; x.fillRect(0, 0, 600, 800);
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2;
      for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i * 80 - 40, 800); x.quadraticCurveTo(i * 80 + 60, 400, i * 80 - 10, 0); x.stroke(); }
      x.fillStyle = v.fg; x.textAlign = 'center';
      x.font = '700 68px system-ui,sans-serif'; x.fillText(v.title, 300, 360);
      x.font = '400 24px system-ui,sans-serif'; x.fillText(v.sub, 300, 420);
      x.fillRect(220, 460, 160, 3);
      x.font = '600 18px system-ui,sans-serif'; x.fillText('一 页 工 具', 300, 520);
      const url = c.toDataURL('image/png');
      return { code: '已生成 600×800 的文字海报。', copy: url, preview: `<div style="text-align:center"><img src="${url}" style="max-height:340px;max-width:100%;border-radius:8px"></div>` };
    },
  }),
  signature: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>手写签名</h2><span class="hint">鼠标或触屏都能画</span></div>
      <canvas data-cv width="720" height="260" style="width:100%;height:auto;touch-action:none;background:#fff;border:1px solid #e3e8f0;border-radius:8px;cursor:crosshair"></canvas>
      <div class="t-actions"><button type="button" class="t-btn" data-clear>重画</button><button type="button" class="t-btn primary" data-save>下载透明底 PNG</button></div>
      <p class="t-hint">导出的是透明背景 PNG，可直接贴到文档里。</p></section></div>`;
    const cv = $('[data-cv]', root), x = cv.getContext('2d');
    x.strokeStyle = '#1b2432'; x.lineWidth = 3.2; x.lineCap = 'round'; x.lineJoin = 'round';
    let drawing = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
    cv.addEventListener('pointerdown', (e) => { drawing = true; const [a, b] = pos(e); x.beginPath(); x.moveTo(a, b); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!drawing) return; const [a, b] = pos(e); x.lineTo(a, b); x.stroke(); });
    cv.addEventListener('pointerup', () => { drawing = false; });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) x.clearRect(0, 0, cv.width, cv.height);
      if (e.target.closest('[data-save]')) canvasDL(K, cv, 'signature.png');
    });
    K.setAction('下载签名', () => canvasDL(K, cv, 'signature.png'));
  },
  camrecord: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>摄像头录像</h2><span class="hint">仅在本机预览与录制</span></div>
      <video data-v autoplay playsinline muted style="width:100%;max-height:320px;background:#1b2432;border-radius:8px"></video>
      <div class="t-actions"><button type="button" class="t-btn primary" data-start>开启摄像头</button><button type="button" class="t-btn" data-rec>开始录制</button><button type="button" class="t-btn" data-stop>停止并下载</button></div>
      <p class="t-hint" data-msg>浏览器会先弹出摄像头授权，录像不会上传。</p></section></div>`;
    const video = $('[data-v]', root), msg = $('[data-msg]', root);
    let stream = null, rec = null, chunks = [];
    root.addEventListener('click', async (e) => {
      if (e.target.closest('[data-start]')) {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); video.srcObject = stream; msg.textContent = '摄像头已开启。'; }
        catch (err) { msg.textContent = '没能打开摄像头：' + err.message; }
      }
      if (e.target.closest('[data-rec]')) {
        if (!stream) { msg.textContent = '请先开启摄像头。'; return; }
        chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = (ev) => chunks.push(ev.data);
        rec.onstop = () => { const b = new Blob(chunks, { type: 'video/webm' }); K.download('record.webm', b); msg.textContent = '录像已下载。'; };
        rec.start(); msg.textContent = '录制中…点「停止并下载」结束。';
      }
      if (e.target.closest('[data-stop]')) { if (rec && rec.state !== 'inactive') rec.stop(); if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
    });
    K.setAction('开启摄像头', () => $('[data-start]', root)?.click());
  },

  /* ---------- 生活小工具 ---------- */
  stopwatch: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>秒表</h2><span class="hint">本地计时</span></div>
      <div data-t style="font:700 42px/1.4 var(--mono);text-align:center;padding:20px;color:var(--accent)">00:00.00</div>
      <div class="t-actions"><button type="button" class="t-btn primary" data-go>开始</button><button type="button" class="t-btn" data-lap>计次</button><button type="button" class="t-btn" data-reset>归零</button></div>
      <div data-laps class="t-hint" style="margin-top:12px">还没有计次记录。</div></section></div>`;
    let t0 = 0, elapsed = 0, running = false, timer = null, laps = [];
    const fmt = (ms) => `${pad2(Math.floor(ms / 60000))}:${pad2(Math.floor(ms / 1000) % 60)}.${pad2(Math.floor(ms / 10) % 100)}`;
    const draw = () => { $('[data-t]', root).textContent = fmt(running ? Date.now() - t0 : elapsed); };
    const go = () => {
      if (running) { elapsed = Date.now() - t0; running = false; clearInterval(timer); $('[data-go]', root).textContent = '继续'; }
      else { t0 = Date.now() - elapsed; running = true; timer = setInterval(draw, 30); $('[data-go]', root).textContent = '暂停'; }
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-go]')) go();
      if (e.target.closest('[data-lap]')) { const now = running ? Date.now() - t0 : elapsed; laps.unshift(`第 ${laps.length + 1} 次　${fmt(now)}　分圈 ${fmt(now - (laps._last || 0))}`); laps._last = now; $('[data-laps]', root).innerHTML = laps.slice(0, 20).join('<br>'); }
      if (e.target.closest('[data-reset]')) { running = false; clearInterval(timer); elapsed = 0; laps = []; laps._last = 0; $('[data-go]', root).textContent = '开始'; $('[data-laps]', root).textContent = '还没有计次记录。'; draw(); }
    });
    K.setAction('开始 / 暂停', go);
    draw();
  },
  alarm: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>闹钟</h2><span class="hint">页面需保持打开</span></div>
      <div class="t-field"><label class="t-label">提醒时间</label><input class="t-input" type="time" data-time></div>
      <div class="t-field"><label class="t-label">备注</label><input class="t-input" data-note placeholder="该起身活动一下了"></div>
      <div class="t-actions"><button type="button" class="t-btn primary" data-set>设定</button><button type="button" class="t-btn" data-cancel>取消</button></div>
      <p class="t-hint" data-msg style="margin-top:12px">还没有设定闹钟。</p></section></div>`;
    let timer = null;
    const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = .12; o.start(); setTimeout(() => { o.stop(); a.close(); }, 1600); } catch (e) {} };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-set]')) {
        const t = $('[data-time]', root).value;
        if (!t) { $('[data-msg]', root).textContent = '先选一个时间。'; return; }
        clearInterval(timer);
        timer = setInterval(() => {
          const now = new Date();
          if (`${pad2(now.getHours())}:${pad2(now.getMinutes())}` === t && now.getSeconds() < 2) {
            beep(); $('[data-msg]', root).textContent = `⏰ ${t} 到点：${$('[data-note]', root).value || '时间到了'}`;
            clearInterval(timer);
          }
        }, 1000);
        $('[data-msg]', root).textContent = `已设定 ${t} 提醒，别关掉这个标签页。`;
      }
      if (e.target.closest('[data-cancel]')) { clearInterval(timer); $('[data-msg]', root).textContent = '已取消。'; }
    });
    K.setAction('设定闹钟', () => $('[data-set]', root)?.click());
  },
  scoreboard: (root, K) => {
    let a = 0, b = 0;
    const html = () => `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>记分板</h2><span class="hint">点击加减分</span></div>
      <div style="display:flex;gap:16px;text-align:center;flex-wrap:wrap">
        ${[['A', a], ['B', b]].map(([n, s]) => `<div style="flex:1;min-width:140px;background:var(--surface-2);border-radius:10px;padding:20px">
          <div style="font:700 54px/1.2 var(--mono);color:var(--accent)" >${s}</div>
          <div class="t-hint">队伍 ${n}</div>
          <div class="t-actions" style="justify-content:center;margin-top:12px">
            <button type="button" class="t-btn" data-t="${n}" data-d="-1">−1</button>
            <button type="button" class="t-btn primary" data-t="${n}" data-d="1">+1</button>
            <button type="button" class="t-btn" data-t="${n}" data-d="2">+2</button>
          </div></div>`).join('')}
      </div>
      <div class="t-actions"><button type="button" class="t-btn" data-swap>换边</button><button type="button" class="t-btn" data-reset>清零</button></div>
      </section></div>`;
    const draw = () => { root.innerHTML = html(); };
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-d]');
      if (btn) { const d = Number(btn.dataset.d); if (btn.dataset.t === 'A') a = Math.max(0, a + d); else b = Math.max(0, b + d); draw(); return; }
      if (e.target.closest('[data-swap]')) { [a, b] = [b, a]; draw(); }
      if (e.target.closest('[data-reset]')) { a = b = 0; draw(); }
    });
    K.setAction('A 队 +1', () => { a++; draw(); });
    draw();
  },
  sedentary: (root, K) => {
    const p = panel(root, K, {
      title: '提醒设置', outTitle: '状态', copyLabel: '复制说明',
      fields: [{ id: 'min', label: '每隔', type: 'number', default: 45, unit: '分钟' }, { id: 'msg', label: '提醒内容', type: 'text', default: '起来走一走，喝口水。' }],
      actions: [{ label: '开始计时', run: () => {} }, { label: '暂停', run: () => {} }],
      build: () => ({ code: '尚未开始。点「开始计时」后按间隔提醒。' }),
    });
    let timer = null, next = null;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-x-act]'); if (!b) return;
      const i = Number(b.dataset.xAct), v = p.values();
      if (i === 0) {
        clearInterval(timer);
        const ms = clamp(Number(v.min) || 45, 1, 240) * 60000;
        next = Date.now() + ms;
        timer = setInterval(() => {
          const left = Math.max(0, Math.ceil((next - Date.now()) / 1000));
          p.setCode(`提醒内容：${v.msg}\n距离下次提醒：${Math.floor(left / 60)} 分 ${left % 60} 秒`);
          if (left === 0) { K.toast(v.msg); next = Date.now() + ms; }
        }, 1000);
        p.setCode('已开始计时。');
      } else { clearInterval(timer); p.setCode('已暂停。'); }
    });
  },
  beijingtime: (root, K) => {
    const p = panel(root, K, {
      title: '标准时间', outTitle: '本机时间', copyLabel: '复制时间', fields: [],
      build: () => ({ code: '正在读取…' }),
    });
    const draw = (offset) => {
      const n = new Date(), s = new Date(n.getTime() + (offset || 0));
      const txt = `本机时间：${s.toLocaleString('zh-CN', { hour12: false })}\n北京时间（UTC+8）：${s.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}\n星期：${'日一二三四五六'[s.getDay()]}\n时间戳：${Math.floor(s.getTime() / 1000)}\n${offset ? `与页面服务器时间偏差：约 ${offset} 毫秒` : '偏差读取失败，仍显示本机时间'}`;
      p.setCode(txt);
    };
    fetch('/', { method: 'HEAD', cache: 'no-store' }).then((r) => {
      const d = r.headers.get('date');
      draw(d ? new Date(d).getTime() - Date.now() : 0);
    }).catch(() => draw(0));
    setInterval(() => draw(0), 1000);
    draw(0);
  },
  wakelock: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>屏幕常亮</h2><span class="hint">需要浏览器支持 Wake Lock</span></div>
      <button type="button" class="t-btn primary" data-go>保持屏幕常亮</button>
      <p class="t-hint" data-msg style="margin-top:14px">开启后切到其它标签页会自动释放，回来需重新点一次。</p></section></div>`;
    let lock = null;
    root.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-go]')) return;
      if (!('wakeLock' in navigator)) { $('[data-msg]', root).textContent = '当前浏览器不支持 Wake Lock API。'; return; }
      if (lock) { await lock.release(); lock = null; e.target.textContent = '保持屏幕常亮'; $('[data-msg]', root).textContent = '已释放常亮锁。'; return; }
      try {
        lock = await navigator.wakeLock.request('screen');
        e.target.textContent = '取消常亮';
        $('[data-msg]', root).textContent = '已开启，屏幕不会自动休眠。';
        lock.addEventListener('release', () => { lock = null; e.target.textContent = '保持屏幕常亮'; });
      } catch (err) { $('[data-msg]', root).textContent = '开启失败：' + err.message; }
    });
    K.setAction('切换常亮', () => $('[data-go]', root)?.click());
  },
  fakeupdate: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>假装系统在升级</h2><span class="hint">摸鱼娱乐</span></div>
      <button type="button" class="t-btn primary" data-go>进入全屏升级画面</button>
      <p class="t-hint">按 Esc 退出。只是个画面，不会改你电脑上的任何东西。</p></section></div>`;
    const start = () => {
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;inset:0;background:#0b3d91;color:#fff;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;cursor:none';
      box.innerHTML = `<div style="font-size:88px;line-height:1">⌛</div><h1 style="font-size:30px;font-weight:500;margin:30px 0 8px">正在安装更新</h1><p data-p style="font-size:16px;opacity:.8">0% 完成，请勿关闭计算机</p><div style="width:320px;height:6px;background:rgba(255,255,255,.2);border-radius:6px;margin-top:26px;overflow:hidden"><div data-bar style="width:0;height:100%;background:#fff;transition:width .4s"></div></div><p style="margin-top:44px;font-size:13px;opacity:.55">按 Esc 退出</p>`;
      document.body.appendChild(box);
      let p = 0;
      const t = setInterval(() => { p = Math.min(99, p + (p < 60 ? 3 : p < 90 ? 1 : 0.2)); $('[data-bar]', box).style.width = p + '%'; $('[data-p]', box).textContent = Math.floor(p) + '% 完成，请勿关闭计算机'; }, 400);
      const esc = (e) => { if (e.key === 'Escape') { clearInterval(t); box.remove(); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
    };
    root.addEventListener('click', (e) => { if (e.target.closest('[data-go]')) start(); });
    K.setAction('进入升级画面', start);
  },
  richeditor: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide">
      <div class="t-head"><h2><span class="step">1</span>富文本编辑</h2><span class="hint">内容只在本机</span></div>
      <div class="t-actions" style="margin-bottom:10px">
        <button type="button" class="t-btn" data-cmd="bold"><b>B</b></button>
        <button type="button" class="t-btn" data-cmd="italic"><i>I</i></button>
        <button type="button" class="t-btn" data-cmd="underline"><u>U</u></button>
        <button type="button" class="t-btn" data-cmd="insertUnorderedList">列表</button>
        <button type="button" class="t-btn" data-cmd="formatBlock" data-val="h2">标题</button>
        <button type="button" class="t-btn" data-html>查看 HTML</button>
        <button type="button" class="t-btn primary" data-copy>复制 HTML</button>
      </div>
      <div data-ed contenteditable="true" style="min-height:220px;padding:16px;border:1px solid #e3e8f0;border-radius:8px;background:#fff;line-height:1.8">在这里写点什么，选中文字再点上方的按钮。</div>
      <pre data-out class="t-out" style="margin-top:12px;white-space:pre-wrap;display:none"></pre>
      </section></div>`;
    const ed = $('[data-ed]', root), out = $('[data-out]', root);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cmd]');
      if (b) { ed.focus(); document.execCommand(b.dataset.cmd, false, b.dataset.val || null); }
      if (e.target.closest('[data-html]')) { out.style.display = out.style.display === 'none' ? '' : 'none'; out.textContent = ed.innerHTML; }
      if (e.target.closest('[data-copy]')) K.copy(ed.innerHTML);
    });
    K.setAction('复制 HTML', () => K.copy(ed.innerHTML));
  },

  /* ---------- 小游戏 ---------- */
  game2048: (root, K) => {
    let g, score;
    const init = () => { g = Array.from({ length: 4 }, () => Array(4).fill(0)); score = 0; add(); add(); draw(); };
    const add = () => { const e = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (!g[i][j]) e.push([i, j]); if (e.length) { const [i, j] = L.pick(e); g[i][j] = Math.random() < .9 ? 2 : 4; } };
    const move = (dir) => {
      let changed = false;
      const line = (a) => { const b = a.filter(Boolean); for (let i = 0; i < b.length - 1; i++) if (b[i] === b[i + 1]) { b[i] *= 2; score += b[i]; b.splice(i + 1, 1); } while (b.length < 4) b.push(0); return b; };
      for (let k = 0; k < 4; k++) {
        let a = dir === 'ArrowLeft' || dir === 'ArrowRight' ? g[k] : [g[0][k], g[1][k], g[2][k], g[3][k]];
        if (dir === 'ArrowRight' || dir === 'ArrowDown') a = [...a].reverse();
        const b = line(a);
        if (dir === 'ArrowRight' || dir === 'ArrowDown') b.reverse();
        for (let i = 0; i < 4; i++) {
          const [r, c] = dir === 'ArrowLeft' || dir === 'ArrowRight' ? [k, i] : [i, k];
          if (g[r][c] !== b[i]) changed = true;
          g[r][c] = b[i];
        }
      }
      if (changed) add(); draw();
    };
    const draw = () => {
      const cell = (n) => `<div style="width:66px;height:66px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 ${n > 999 ? 18 : 24}px var(--mono);background:${n ? ({ 2: '#eef2fb', 4: '#dfe9ff', 8: '#b9d0ff', 16: '#8fb2ff', 32: '#6b94f7', 64: '#4b78e8', 128: '#2f5bd7', 256: '#2549b4', 512: '#1d3b96', 1024: '#162e78', 2048: '#0f225c' }[n] || '#0f225c') : '#f6f8fb'};color:${n > 8 ? '#fff' : '#1b2432'}">${n || ''}</div>`;
      root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>2048</h2><span class="hint">方向键或下方按钮移动</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>得分 ${score}</b><button type="button" class="t-btn" data-new>重新开始</button></div>
        <div style="display:grid;grid-template-columns:repeat(4,max-content);gap:8px;justify-content:center;padding:12px;background:#e3e8f0;border-radius:10px">${g.flat().map(cell).join('')}</div>
        <div class="t-actions" style="justify-content:center;margin-top:14px"><button class="t-btn" data-d="ArrowUp">↑</button><button class="t-btn" data-d="ArrowLeft">←</button><button class="t-btn" data-d="ArrowDown">↓</button><button class="t-btn" data-d="ArrowRight">→</button></div>
        </section></div>`;
    };
    const key = (e) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key); } };
    document.addEventListener('keydown', key);
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) move(b.dataset.d); if (e.target.closest('[data-new]')) init(); });
    K.setAction('重新开始', init);
    init();
  },
  gomoku: (root, K) => {
    const N = 15, S = 30;
    let board, over;
    const init = () => { board = Array.from({ length: N }, () => Array(N).fill(0)); over = false; draw(); };
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    const win = (r, c, p) => dirs.some(([dr, dc]) => {
      let n = 1;
      for (const s of [1, -1]) for (let k = 1; k < 5; k++) { const y = r + dr * k * s, x = c + dc * k * s; if (y < 0 || x < 0 || y >= N || x >= N || board[y][x] !== p) break; n++; }
      return n >= 5;
    });
    const score = (r, c, p) => {
      let s = 0;
      for (const [dr, dc] of dirs) for (const side of [1, -1]) {
        let n = 0, open = 0;
        for (let k = 1; k <= 4; k++) { const y = r + dr * k * side, x = c + dc * k * side; if (y < 0 || x < 0 || y >= N || x >= N) break; if (board[y][x] === p) n++; else { if (board[y][x] === 0) open++; break; } }
        s += [0, 3, 15, 70, 400][n] + open * 2;
      }
      return s;
    };
    const ai = () => {
      let best = -1, cell = null;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (board[r][c]) continue;
        let near = false;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const y = r + dr, x = c + dc; if (y >= 0 && x >= 0 && y < N && x < N && board[y][x]) near = true; }
        if (!near) continue;
        const v = score(r, c, 2) * 1.15 + score(r, c, 1);
        if (v > best) { best = v; cell = [r, c]; }
      }
      if (!cell) cell = [7, 7];
      board[cell[0]][cell[1]] = 2;
      if (win(cell[0], cell[1], 2)) over = '电脑赢了，再来一局？';
      draw();
    };
    function draw() {
      root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>五子棋</h2><span class="hint">你执黑先手</span></div>
        <p class="t-hint" data-msg>${E(over || '点棋盘落子，先连成五子者胜。')}</p>
        <div style="display:flex;justify-content:center"><canvas data-cv width="${N * S}" height="${N * S}" style="max-width:100%;height:auto;cursor:pointer;background:#f3d9a4;border-radius:8px"></canvas></div>
        <div class="t-actions"><button type="button" class="t-btn" data-new>重新开始</button></div></section></div>`;
      const cv = $('[data-cv]', root), x = cv.getContext('2d');
      x.strokeStyle = '#a8875a'; x.lineWidth = 1;
      for (let i = 0; i < N; i++) { x.beginPath(); x.moveTo(S / 2 + i * S, S / 2); x.lineTo(S / 2 + i * S, S / 2 + (N - 1) * S); x.stroke(); x.beginPath(); x.moveTo(S / 2, S / 2 + i * S); x.lineTo(S / 2 + (N - 1) * S, S / 2 + i * S); x.stroke(); }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board[r][c]) {
        x.beginPath(); x.arc(S / 2 + c * S, S / 2 + r * S, S * 0.42, 0, Math.PI * 2);
        x.fillStyle = board[r][c] === 1 ? '#252525' : '#fff'; x.fill(); x.strokeStyle = '#888'; x.stroke();
      }
      cv.onclick = (e) => {
        if (over) return;
        const b = cv.getBoundingClientRect(), c = Math.round((e.clientX - b.left) / b.width * N * S / S - .5), r = Math.round((e.clientY - b.top) / b.height * N * S / S - .5);
        if (r < 0 || c < 0 || r >= N || c >= N || board[r][c]) return;
        board[r][c] = 1;
        if (win(r, c, 1)) { over = '你赢了！'; draw(); return; }
        ai();
      };
    }
    root.addEventListener('click', (e) => { if (e.target.closest('[data-new]')) init(); });
    K.setAction('重新开始', init);
    init();
  },
  minesweeper: (root, K) => {
    const N = 9, M = 10;
    let g, revealed, flags, over;
    const init = () => { g = Array.from({ length: N }, () => Array(N).fill(0)); revealed = Array.from({ length: N }, () => Array(N).fill(false)); flags = Array.from({ length: N }, () => Array(N).fill(false)); over = false; let k = 0; while (k < M) { const r = L.randInt(0, N - 1), c = L.randInt(0, N - 1); if (g[r][c] === -1) continue; g[r][c] = -1; k++; } for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] !== -1) g[r][c] = around(r, c).filter(([a, b]) => g[a][b] === -1).length; draw(); };
    const around = (r, c) => { const a = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const y = r + dr, x = c + dc; if ((dr || dc) && y >= 0 && x >= 0 && y < N && x < N) a.push([y, x]); } return a; };
    const open = (r, c) => {
      if (revealed[r][c] || flags[r][c]) return;
      revealed[r][c] = true;
      if (g[r][c] === -1) { over = '踩到雷了，点「重新开始」再来。'; return; }
      if (g[r][c] === 0) for (const [a, b] of around(r, c)) open(a, b);
    };
    const draw = () => {
      const cell = (r, c) => {
        const v = flags[r][c] ? '🚩' : revealed[r][c] ? (g[r][c] === -1 ? '💣' : g[r][c] || '') : '';
        return `<button type="button" data-r="${r}" data-c="${c}" style="width:34px;height:34px;border:1px solid #d5dce8;border-radius:4px;background:${revealed[r][c] ? '#fff' : '#eaf1ff'};color:${['', '#2f5bd7', '#0e9f6e', '#e0453b', '#8b5cf6'][g[r][c]] || '#1b2432'};font-weight:700;cursor:pointer">${v}</button>`;
      };
      const done = revealed.flat().filter(Boolean).length >= N * N - M;
      root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>扫雷</h2><span class="hint">左键翻开，右键标旗</span></div>
        <p class="t-hint">${E(over || (done ? '全部排完了，赢了！' : `还有 ${M - flags.flat().filter(Boolean).length} 面旗可用`))}</p>
        <div style="display:grid;grid-template-columns:repeat(${N},34px);gap:2px;justify-content:center">${Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => cell(r, c)).join('')).join('')}</div>
        <div class="t-actions"><button type="button" class="t-btn" data-new>重新开始</button></div></section></div>`;
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) { init(); return; }
      const b = e.target.closest('[data-r]'); if (!b || over) return;
      open(Number(b.dataset.r), Number(b.dataset.c)); draw();
    });
    root.addEventListener('contextmenu', (e) => { const b = e.target.closest('[data-r]'); if (!b || over) return; e.preventDefault(); const r = +b.dataset.r, c = +b.dataset.c; if (!revealed[r][c]) flags[r][c] = !flags[r][c]; draw(); });
    K.setAction('重新开始', init);
    init();
  },
  maze: (root, K) => {
    const N = 15;
    let walls, pos, goal, steps;
    const init = () => {
      walls = Array.from({ length: N }, () => Array.from({ length: N }, () => [1, 1, 1, 1]));
      const seen = Array.from({ length: N }, () => Array(N).fill(false));
      const stack = [[0, 0]]; seen[0][0] = true;
      const dirs = [[-1, 0, 0, 2], [1, 0, 2, 0], [0, -1, 3, 1], [0, 1, 1, 3]];
      while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const opts = dirs.filter(([dr, dc]) => { const y = r + dr, x = c + dc; return y >= 0 && x >= 0 && y < N && x < N && !seen[y][x]; });
        if (!opts.length) { stack.pop(); continue; }
        const [dr, dc, a, b] = L.pick(opts), y = r + dr, x = c + dc;
        walls[r][c][a] = 0; walls[y][x][b] = 0; seen[y][x] = true; stack.push([y, x]);
      }
      pos = [0, 0]; goal = [N - 1, N - 1]; steps = 0; draw();
    };
    const move = (dr, dc, a, b) => {
      if (walls[pos[0]][pos[1]][a]) return;
      pos = [pos[0] + dr, pos[1] + dc]; steps++; draw();
    };
    function draw() {
      const S = 24;
      root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>迷宫</h2><span class="hint">方向键或按钮移动</span></div>
        <p class="t-hint">步数 ${steps}　${pos[0] === goal[0] && pos[1] === goal[1] ? '到终点了！' : '走到右下角绿色格子。'}</p>
        <canvas data-cv width="${N * S + 2}" height="${N * S + 2}" style="max-width:100%;height:auto;border-radius:8px"></canvas>
        <div class="t-actions" style="justify-content:center"><button class="t-btn" data-d="up">↑</button><button class="t-btn" data-d="left">←</button><button class="t-btn" data-d="down">↓</button><button class="t-btn" data-d="right">→</button><button class="t-btn" data-new>换个迷宫</button></div></section></div>`;
      const cv = $('[data-cv]', root), x = cv.getContext('2d');
      x.fillStyle = '#f6f8fb'; x.fillRect(0, 0, cv.width, cv.height);
      x.fillStyle = '#c7ecd9'; x.fillRect(1 + goal[1] * S, 1 + goal[0] * S, S - 2, S - 2);
      x.strokeStyle = '#1b2432'; x.lineWidth = 2;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const w = walls[r][c], X = 1 + c * S, Y = 1 + r * S;
        if (w[0]) { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + S, Y); x.stroke(); }
        if (w[2]) { x.beginPath(); x.moveTo(X, Y + S); x.lineTo(X + S, Y + S); x.stroke(); }
        if (w[3]) { x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y + S); x.stroke(); }
        if (w[1]) { x.beginPath(); x.moveTo(X + S, Y); x.lineTo(X + S, Y + S); x.stroke(); }
      }
      x.fillStyle = '#2f5bd7'; x.beginPath(); x.arc(1 + pos[1] * S + S / 2, 1 + pos[0] * S + S / 2, S * .3, 0, Math.PI * 2); x.fill();
    }
    const key = (e) => { const m = { ArrowUp: [-1, 0, 0, 2], ArrowDown: [1, 0, 2, 0], ArrowLeft: [0, -1, 3, 1], ArrowRight: [0, 1, 1, 3] }[e.key]; if (m) { e.preventDefault(); move(...m); } };
    document.addEventListener('keydown', key);
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) move(...({ up: [-1, 0, 0, 2], down: [1, 0, 2, 0], left: [0, -1, 3, 1], right: [0, 1, 1, 3] }[b.dataset.d])); if (e.target.closest('[data-new]')) init(); });
    K.setAction('换个迷宫', init);
    init();
  },
  dino: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>恐龙快跑</h2><span class="hint">空格或点击跳跃</span></div>
      <canvas data-cv width="640" height="180" style="width:100%;height:auto;background:#fbfcfe;border:1px solid #e3e8f0;border-radius:8px"></canvas>
      <p class="t-hint" data-msg>跳过 cactus 得分，撞到就重来。</p></section></div>`;
    const cv = $('[data-cv]', root), x = cv.getContext('2d'), msg = $('[data-msg]', root);
    let y = 0, vy = 0, obs = [], score = 0, dead = false, tick = 0, raf = null;
    const jump = () => { if (dead) { obs = []; score = 0; dead = false; y = 0; vy = 0; msg.textContent = '重新开始。'; } else if (y === 0) vy = 11; };
    const loop = () => {
      tick++;
      if (!dead) {
        y += vy; vy -= .6; if (y < 0) { y = 0; vy = 0; }
        if (tick % 90 === 0) obs.push({ x: 640, h: 22 + L.randInt(0, 22) });
        obs.forEach((o) => o.x -= 4.2);
        obs = obs.filter((o) => o.x > -30);
        score++;
        for (const o of obs) if (o.x < 74 && o.x > 34 && y < o.h) { dead = true; msg.textContent = `撞上了，得分 ${Math.floor(score / 6)}。点一下或按空格重来。`; }
      }
      x.clearRect(0, 0, 640, 180);
      x.fillStyle = '#e3e8f0'; x.fillRect(0, 150, 640, 2);
      x.fillStyle = '#2f5bd7'; x.fillRect(40, 150 - y - 30, 26, 30);
      x.fillRect(66, 150 - y - 30, 6, 8);
      x.fillStyle = '#0e9f6e';
      for (const o of obs) { x.fillRect(o.x, 150 - o.h, 12, o.h); x.fillRect(o.x - 5, 150 - o.h + 8, 5, 6); }
      x.fillStyle = '#1b2432'; x.font = '14px var(--mono)'; x.fillText('得分 ' + Math.floor(score / 6), 560, 26);
      raf = requestAnimationFrame(loop);
    };
    const key = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    document.addEventListener('keydown', key);
    cv.addEventListener('pointerdown', jump);
    K.setAction('跳跃', jump);
    loop();
  },
  fireworks: (root, K) => {
    root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>烟花</h2><span class="hint">点画面放一朵</span></div>
      <canvas data-cv width="640" height="340" style="width:100%;height:auto;background:#101a30;border-radius:8px;cursor:crosshair"></canvas>
      <p class="t-hint">放了 <b data-n>0</b> 朵。颜色随机，粒子在本地计算。</p></section></div>`;
    const cv = $('[data-cv]', root), x = cv.getContext('2d');
    let ps = [], count = 0;
    const burst = (cx, cy) => {
      const hue = L.randInt(0, 360);
      for (let i = 0; i < 70; i++) { const a = Math.PI * 2 * i / 70, sp = 1.5 + Math.random() * 3.5; ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, hue: hue + L.randInt(-20, 20) }); }
      count++; $('[data-n]', root).textContent = count;
    };
    const loop = () => {
      x.fillStyle = 'rgba(16,26,48,.22)'; x.fillRect(0, 0, 640, 340);
      ps = ps.filter((p) => p.life > 0);
      for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += .035; p.life -= .014; x.fillStyle = `hsla(${p.hue},90%,65%,${Math.max(0, p.life)})`; x.fillRect(p.x, p.y, 2.6, 2.6); }
      requestAnimationFrame(loop);
    };
    cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); burst((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 340); });
    K.setAction('放一朵', () => burst(320, 150));
    loop();
  },
  woodfish: (root, K) => {
    let n = 0;
    const hit = () => {
      n++;
      try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(420, a.currentTime); o.frequency.exponentialRampToValueAtTime(160, a.currentTime + .12); g.gain.setValueAtTime(.18, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .18); o.start(); o.stop(a.currentTime + .2); setTimeout(() => a.close(), 300); } catch (e) {}
      $('[data-n]', root).textContent = n;
      const t = $('[data-fly]', root); t.textContent = '功德 +1'; t.style.opacity = 1; t.style.transform = 'translateY(0)';
      setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateY(-40px)'; }, 420);
    };
    root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>电子木鱼</h2><span class="hint">敲一下积一次</span></div>
      <div style="text-align:center;padding:20px;position:relative"><div data-fly style="position:absolute;left:0;right:0;top:10px;color:var(--accent);font-weight:700;opacity:0;transition:all .4s"></div>
      <button type="button" data-hit style="font-size:110px;line-height:1;border:0;background:none;cursor:pointer;transition:transform .08s">🪵</button>
      <p class="t-hint">已敲 <b data-n>0</b> 下</p></div></section></div>`;
    root.addEventListener('click', (e) => { if (e.target.closest('[data-hit]')) { const b = $('[data-hit]', root); b.style.transform = 'scale(.9)'; setTimeout(() => b.style.transform = '', 80); hit(); } });
    K.setAction('敲一下', hit);
  },
  bubbles: (root, K) => {
    let n = 20, popped = 0;
    const draw = () => {
      root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>捏泡泡</h2><span class="hint">点破所有泡泡</span></div>
        <p class="t-hint">已捏破 ${popped} 个，还剩 ${n} 个。<button type="button" class="t-btn" data-new style="margin-left:10px">换一张</button></p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:10px;padding:14px;background:#f6f8fb;border-radius:10px">
        ${Array.from({ length: n }, (_, i) => `<button type="button" data-b="${i}" style="width:48px;height:48px;border-radius:50%;border:1px solid #b9cdf5;background:radial-gradient(circle at 32% 30%,#fff,#a9c4f7 60%,#6b94e8);cursor:pointer;box-shadow:inset -3px -3px 6px rgba(0,0,0,.08)"></button>`).join('')}
        </div></section></div>`;
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) { n = 20; popped = 0; draw(); return; }
      const b = e.target.closest('[data-b]'); if (!b) return;
      b.remove(); n--; popped++;
      if (n === 0) { $('[data-new]', root).textContent = '再玩一次'; }
      const p = root.querySelector('.t-hint'); if (p) p.firstChild.textContent = `已捏破 ${popped} 个，还剩 ${n} 个。`;
    });
    K.setAction('换一张', () => { n = 20; popped = 0; draw(); });
    draw();
  },
  fan: (root, K) => {
    const p = panel(root, K, {
      title: '风扇设置', outTitle: '效果', copyLabel: '复制说明',
      fields: [{ id: 'speed', label: '档位', type: 'select', options: ['1 档', '2 档', '3 档', '关'], default: '2 档' }, { id: 'color', label: '扇叶颜色', type: 'color', default: '#8fb2ff' }],
      build: (v) => {
        const dur = ({ '1 档': 2.4, '2 档': 1.2, '3 档': .45, '关': 0 })[v.speed];
        const spin = dur ? `animation: xfan ${dur}s linear infinite` : '';
        return { code: `当前档位：${v.speed}${dur ? `，每圈 ${dur} 秒` : '，已关闭'}`, copy: v.speed,
          preview: `<style>@keyframes xfan{to{transform:rotate(360deg)}}</style><div style="display:flex;justify-content:center;padding:10px"><div style="width:150px;height:150px;position:relative;${spin}">${[0, 90, 180, 270].map((a) => `<div style="position:absolute;left:50%;top:50%;width:64px;height:26px;border-radius:50% 50% 40% 40%;background:${E(v.color)};transform-origin:0 50%;transform:rotate(${a}deg) translateY(-13px)"></div>`).join('')}<div style="position:absolute;left:50%;top:50%;width:22px;height:22px;border-radius:50%;background:#e3e8f0;transform:translate(-50%,-50%)"></div></div></div><p style="text-align:center" class="t-hint">没有风，只有画面。</p>` };
      },
    });
  },
  cps: (root, K) => {
    let clicks = 0, start = 0, running = false;
    root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>手速测试</h2><span class="hint">5 秒内尽量多点</span></div>
      <div data-big style="font:700 44px/1.4 var(--mono);text-align:center;color:var(--accent)">0</div>
      <button type="button" data-go class="t-btn primary" style="display:block;width:100%;padding:38px;font-size:18px">点这里开始</button>
      <p class="t-hint" data-msg style="text-align:center;margin-top:12px">开始后 5 秒内连续点按钮。</p></section></div>`;
    root.addEventListener('click', (e) => {
      if (!e.target.closest('[data-go]')) return;
      if (!running) { running = true; clicks = 0; start = Date.now(); $('[data-msg]', root).textContent = '计时中…'; $('[data-go]', root).textContent = '快点！'; setTimeout(() => { running = false; const cps = clicks / 5; $('[data-msg]', root).textContent = `5 秒点了 ${clicks} 次，平均 ${cps.toFixed(1)} 次/秒。`; $('[data-go]', root).textContent = '再来一次'; }, 5000); }
      clicks++; $('[data-big]', root).textContent = clicks;
    });
    K.setAction('开始 / 点击', () => $('[data-go]', root)?.click());
  },
  fart: (root, K) => {
    const play = () => {
      try {
        const a = new (window.AudioContext || window.webkitAudioContext)(), len = a.sampleRate * .45;
        const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len) * (.5 + .5 * Math.sin(i / 900));
        const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
        s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = .35;
        s.connect(f); f.connect(g); g.connect(a.destination); s.start();
        setTimeout(() => a.close(), 700);
      } catch (e) {}
    };
    root.innerHTML = `<div class="t-work"><section class="t-panel wide"><div class="t-head"><h2><span class="step">1</span>放屁音效</h2><span class="hint">本地合成，不加载音频</span></div>
      <button type="button" class="t-btn primary" data-go style="width:100%;padding:40px;font-size:20px">💨 点一下</button>
      <p class="t-hint" style="text-align:center">纯娱乐，声音由 Web Audio 实时合成。</p></section></div>`;
    root.addEventListener('click', (e) => { if (e.target.closest('[data-go]')) play(); });
    K.setAction('播放', play);
  },
  paysound: (root, K) => {
    const p = panel(root, K, {
      title: '到账金额', outTitle: '音效', copyLabel: '复制说明',
      fields: [{ id: 'amount', label: '金额', type: 'number', default: 100, unit: '元' }],
      actions: [{ label: '播放提示音', run: () => {} }],
      build: (v) => ({ code: `金额：${Number(v.amount).toFixed(2)} 元。点「播放提示音」试听。` }),
    });
    const play = (amount) => {
      try {
        const a = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [880, 1174.7, 1318.5];
        notes.forEach((f, i) => {
          const o = a.createOscillator(), g = a.createGain();
          o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(a.destination);
          const t = a.currentTime + i * .16;
          g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
          o.start(t); o.stop(t + .3);
        });
        setTimeout(() => a.close(), 1200);
      } catch (e) {}
    };
    root.addEventListener('click', (e) => { if (e.target.closest('[data-x-act]')) play(p.values().amount); });
    K.setAction('播放提示音', () => play(p.values().amount));
  },

  /* ---------- PDF 扩展 ---------- */
  pdfmeta: (root, K) => panel(root, K, {
    title: '选择 PDF', outTitle: '元数据', copyLabel: '复制信息',
    fields: [{ id: 'file', label: 'PDF 文件', type: 'file', accept: 'application/pdf,.pdf' }],
    build: async (v) => {
      const f = v.file && v.file[0];
      if (!f) return { code: '选一个 PDF 文件。', copy: '' };
      const pdf = await pdfOpen(await readFile(f));
      const m = await pdf.getMetadata();
      const info = m.info || {};
      const rows = Object.entries(info).filter(([, x]) => x != null && x !== '').map(([k, x]) => [k, String(x)]);
      return { code: `文件：${f.name}\n页数：${pdf.numPages}\n\n${rows.map((r) => `${r[0]}：${r[1]}`).join('\n') || '（没有可读的元数据）'}`,
        copy: rows.map((r) => r.join('\t')).join('\n'),
        preview: rows.length ? `<div style="width:100%;max-height:280px;overflow:auto"><table class="t-table"><tbody>${rows.map((r) => `<tr><th>${E(r[0])}</th><td>${E(r[1])}</td></tr>`).join('')}</tbody></table></div>` : '',
        stats: [{ label: '页数', value: String(pdf.numPages) }] };
    },
  }),
  pdfmetawrite: (root, K) => panel(root, K, {
    title: '设置元数据', outTitle: '结果', copyLabel: '复制说明',
    fields: [
      { id: 'file', label: 'PDF 文件', type: 'file', accept: 'application/pdf,.pdf' },
      { id: 'title', label: '标题', type: 'text', default: '' }, { id: 'author', label: '作者', type: 'text', default: '' },
      { id: 'subject', label: '主题', type: 'text', default: '' }, { id: 'keywords', label: '关键词', type: 'text', default: '' },
    ],
    actions: [{ label: '下载新 PDF', run: () => {} }],
    build: () => ({ code: '选文件、填好字段，点「下载新 PDF」。' }),
  }),
  pdfimages: (root, K) => panel(root, K, {
    title: '选择 PDF', outTitle: '提取结果', copyLabel: '复制说明',
    fields: [{ id: 'file', label: 'PDF 文件', type: 'file', accept: 'application/pdf,.pdf' }],
    note: '只提取 PDF 里以 DCT/JPX 流保存的原始位图，矢量图与重压缩对象不在范围内。',
    actions: [{ label: '打包下载', run: () => {} }],
    build: async (v) => {
      const f = v.file && v.file[0];
      if (!f) return { code: '选一个 PDF 文件。', copy: '' };
      const bytes = new Uint8Array(await readFile(f));
      const imgs = extractJpeg(bytes);
      return { code: `找到 ${imgs.length} 张内嵌位图。${imgs.length ? '点「打包下载」逐张保存。' : ''}`,
        copy: String(imgs.length),
        preview: imgs.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;max-height:300px;overflow:auto">${imgs.slice(0, 20).map((i) => `<img src="${i.url}" style="max-width:120px;max-height:110px;border-radius:6px">`).join('')}</div>` : '',
        stats: [{ label: '内嵌位图', value: String(imgs.length) }] };
    },
  }),
  pdfnup: (root, K) => panel(root, K, {
    title: '拼版设置', outTitle: '结果', copyLabel: '复制说明',
    fields: [
      { id: 'file', label: 'PDF 文件', type: 'file', accept: 'application/pdf,.pdf' },
      { id: 'cols', label: '每行放几页', type: 'range', min: 1, max: 4, default: 2 },
      { id: 'rows', label: '每列放几页', type: 'range', min: 1, max: 4, default: 2 },
    ],
    actions: [{ label: '下载拼版 PDF', run: () => {} }],
    note: '把原 PDF 的页面按比例缩小，按 N×M 排到一张新页面上。',
    build: (v) => ({ code: v.file && v.file[0] ? `将 ${v.cols} × ${v.rows} 页拼成一张，点「下载拼版 PDF」。原文件只在本地读取。` : '选一个 PDF 文件。', copy: '' }),
  }),
};

/* 从 PDF 字节里找 JPEG 流（FFD8 … FFD9），不解析对象流，只处理未压缩的原始位图 */
function extractJpeg(u8) {
  const out = [];
  for (let i = 0; i < u8.length - 4; i++) {
    if (u8[i] === 0xff && u8[i + 1] === 0xd8 && u8[i + 2] === 0xff) {
      let j = i + 2;
      while (j < u8.length - 1) { if (u8[j] === 0xff && u8[j + 1] === 0xd9) break; j++; }
      if (j < u8.length - 1 && j - i > 200) {
        const blob = new Blob([u8.slice(i, j + 2)], { type: 'image/jpeg' });
        out.push({ url: URL.createObjectURL(blob), blob });
        i = j + 1;
      }
    }
  }
  return out;
}

/* 把 PDF 下载类按钮接到对应处理逻辑：在模块加载后统一挂一次事件补充 */
const pdfDownloaders = {
  pdfmetawrite: async (vals, K) => {
    const { PDFDocument } = await vendor('pdf');
    const f = vals.file && vals.file[0]; if (!f) throw new Error('先选一个 PDF');
    const doc = await PDFDocument.load(await readFile(f));
    if (vals.title) doc.setTitle(vals.title);
    if (vals.author) doc.setAuthor(vals.author);
    if (vals.subject) doc.setSubject(vals.subject);
    if (vals.keywords) doc.setKeywords(vals.keywords.split(/[,，]/).map((x) => x.trim()).filter(Boolean));
    doc.setModificationDate(new Date());
    K.download('metadata.pdf', new Blob([await doc.save()], { type: 'application/pdf' }));
  },
  pdfimages: async (vals, K) => {
    const f = vals.file && vals.file[0]; if (!f) throw new Error('先选一个 PDF');
    const imgs = extractJpeg(new Uint8Array(await readFile(f)));
    if (!imgs.length) throw new Error('没找到可提取的内嵌位图');
    const { buildZip } = await import('/engines.js');
    const entries = [];
    for (let n = 0; n < imgs.length; n++) {
      entries.push({ name: `image-${String(n + 1).padStart(3, '0')}.jpg`, data: new Uint8Array(await imgs[n].blob.arrayBuffer()) });
    }
    K.download('pdf-images.zip', await buildZip(entries));
  },
  pdfnup: async (vals, K) => {
    const { PDFDocument } = await vendor('pdf');
    const f = vals.file && vals.file[0]; if (!f) throw new Error('先选一个 PDF');
    const src = await pdfOpen(await readFile(f));
    const out = await PDFDocument.create();
    const cols = clamp(Number(vals.cols) || 2, 1, 4), rows = clamp(Number(vals.rows) || 2, 1, 4);
    const per = cols * rows, PW = 595, PH = 842, cw = PW / cols, ch = PH / rows;
    for (let k = 0; k < src.numPages; k += per) {
      const page = out.addPage([PW, PH]);
      for (let n = 0; n < per && k + n < src.numPages; n++) {
        const sp = await src.getPage(k + n + 1);
        const vp = sp.getViewport({ scale: 1.2 });
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
        await sp.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        const png = await out.embedPng(cv.toDataURL('image/png').split(',')[1]);
        const s = Math.min((cw - 8) / png.width, (ch - 8) / png.height);
        page.drawImage(png, {
          x: (n % cols) * cw + (cw - png.width * s) / 2,
          y: PH - (Math.floor(n / cols) + 1) * ch + (ch - png.height * s) / 2,
          width: png.width * s, height: png.height * s,
        });
      }
    }
    K.download('nup.pdf', new Blob([await out.save()], { type: 'application/pdf' }));
  },
};

/* 包装：给 PDF 类的「下载」按钮补上真实动作 */
for (const [id, fn] of Object.entries(pdfDownloaders)) {
  const orig = CUSTOM[id];
  CUSTOM[id] = (root, K, d) => {
    const r = orig(root, K, d);
    root.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-x-act]')) return;
      try {
        const vals = {};
        for (const el of root.querySelectorAll('[data-x]')) {
          const k = el.dataset.x;
          vals[k] = el.type === 'file' ? el.files : el.type === 'checkbox' ? el.checked : el.value;
        }
        await fn(vals, K);
      } catch (err) { K.toast(err.message || String(err)); }
    }, true);
    return r;
  };
}
