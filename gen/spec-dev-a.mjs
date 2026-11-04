// 文本与开发类：编码 / 转换 / 解析 / 校验
export const S = {};
const F = (label, id, extra = {}) => ({ id, label, type: 'text', ...extra });

/* 编码与格式 */
S['base64-file'] = { kind: 'file', titleIn: '选文件', titleOut: 'Base64 / Data URL',
  multiple: false, accept: '', primary: '转换', dropTitle: '拖一个文件进来（或粘贴）',
  fields: [{ id: 'mode', label: '方向', type: 'select', options: ['文件 → Base64 / Data URL', 'Base64 → 文件'] },
    { id: 'text', label: 'Base64 文本（反向时填）', type: 'textarea', rows: 3, placeholder: '把 Base64 或 data:...;base64,... 粘这里' }],
  note: '反向转换时不用选文件，直接粘文本再点「转换」。大文件会生成很长的字符串，浏览器里复制可能较慢。',
  auto: false,
  process: async (files, v, ctx) => {
    if (v.mode.startsWith('Base64')) {
      const t = String(v.text || '').trim();
      if (!t) return { error: '先粘一段 Base64' };
      const mime = (t.match(/^data:([^;,]+);base64,/) || [])[1] || 'application/octet-stream';
      const bytes = L.b64ToBytes(t.replace(/^data:[^,]*,/, ''));
      const name = 'decoded-' + Date.now() + (mime.includes('png') ? '.png' : mime.includes('jpeg') ? '.jpg' : mime.includes('pdf') ? '.pdf' : '.bin');
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      return { text: `已还原 ${bytes.length} 字节\nMIME：${mime}\n前 32 字节：${L.bytesToHex(bytes.slice(0, 32), ' ')}`,
        preview: /^image\//.test(mime) ? `<img src="${url}" style="max-height:260px">` : mime === 'application/pdf' ? `<iframe src="${url}" style="width:100%;height:260px;border:0"></iframe>` : '',
        files: [{ name, data: bytes, mime, label: '下载还原文件' }], stats: [{ label: '大小', value: L.humanSize(bytes.length) }] };
    }
    const f = files[0]; if (!f) return { error: '先选一个文件' };
    const buf = new Uint8Array(await f.arrayBuffer());
    const b64 = L.bytesToB64(buf);
    const du = `data:${f.type || 'application/octet-stream'};base64,${b64}`;
    const url = URL.createObjectURL(f);
    return { text: (v.text && v.text.length > 10 ? '' : du), copy: du,
      preview: /^image\//.test(f.type) ? `<img src="${url}" style="max-height:240px">` : /^audio\//.test(f.type) ? `<audio controls src="${url}"></audio>` : /^video\//.test(f.type) ? `<video controls src="${url}" style="max-height:240px"></video>` : '',
      stats: [{ label: '原大小', value: L.humanSize(f.size) }, { label: 'Base64 长度', value: b64.length }, { label: '膨胀', value: '+33%' }],
      files: [{ name: f.name + '.base64.txt', data: L.utf8(du), mime: 'text/plain', label: '下载 Data URL' }] };
  } };

S['jwt'] = { kind: 'form', titleIn: 'JWT', titleOut: '解析结果',
  fields: [{ id: 't', label: '粘贴 Token', type: 'textarea', rows: 6, default: '', placeholder: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.xxx' }],
  primary: '复制头部与载荷', sample: { t: '' },
  hintOut: '只做本地解析与展示，不校验签名（验签请用「JWT 验签」）。exp / iat / nbf 会换算成本地时间。',
  compute: (v) => {
    const t = String(v.t || '').trim();
    if (!t) return { text: '粘一个 JWT 进来。' };
    const p = t.split('.');
    if (p.length !== 3) return { error: 'JWT 应该是用两个点隔开的三段' };
    const dec = (s) => { try { return JSON.parse(L.fromUtf8(L.b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { throw new Error('第 ' + (s === p[0] ? 1 : 2) + ' 段不是合法 JSON'); } };
    let h, pl; try { h = dec(p[0]); pl = dec(p[1]); } catch (e) { return { error: e.message }; }
    const tm = (k) => pl[k] ? `${pl[k]} → ${new Date(pl[k] * 1000).toLocaleString('zh-CN')}` : null;
    const times = ['exp', 'iat', 'nbf'].map(tm).filter(Boolean);
    const expired = pl.exp && pl.exp * 1000 < Date.now();
    return { html: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="tag">Header</span><span class="tag">Payload</span><span class="tag">Signature（${p[2].length} 字符）</span></div>
      <p class="t-label">头部</p><pre class="t-out" style="max-height:150px">${L.esc(JSON.stringify(h, null, 2))}</pre>
      <p class="t-label" style="margin-top:12px">载荷</p><pre class="t-out" style="max-height:220px">${L.esc(JSON.stringify(pl, null, 2))}</pre>
      ${times.length ? `<p class="t-hint">${times.map(L.esc).join('<br>')}${expired ? '<br><b style="color:#a63d34">此 Token 已过期</b>' : ''}</p>` : ''}`,
      copy: `Header:\n${JSON.stringify(h, null, 2)}\n\nPayload:\n${JSON.stringify(pl, null, 2)}`,
      stats: [{ label: '算法', value: h.alg || '—' }, { label: '类型', value: h.typ || '—' }, { label: '声明数', value: Object.keys(pl).length }, { label: '状态', value: expired ? '已过期' : pl.exp ? '有效' : '无有效期' }] };
  } };

S['ndjson'] = { kind: 'form', titleIn: 'NDJSON / JSONL', titleOut: '转换结果', wide: false,
  fields: [{ id: 'txt', label: '每行一个 JSON（或 JSON 数组 / CSV）', type: 'textarea', rows: 9, default: '{"id":1,"name":"小明"}\n{"id":2,"name":"小红"}' },
    { id: 'mode', label: '目标', type: 'select', options: ['NDJSON → JSON 数组', 'JSON 数组 → NDJSON', 'NDJSON → CSV', 'CSV → NDJSON'] }],
  primary: '复制结果', hintOut: '解析错误会精确报出第几行；字段集合统计会列出所有出现过的 key。',
  compute: (v) => {
    const t = String(v.txt || '').trim();
    if (!t) return { text: '' };
    try {
      if (v.mode === 'NDJSON → JSON 数组' || v.mode === 'NDJSON → CSV') {
        const objs = L.lines(t).map((l, i) => { if (!l.trim()) return null; try { return JSON.parse(l); } catch (e) { throw new Error(`第 ${i + 1} 行解析失败：${e.message}`); } }).filter(Boolean);
        const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))];
        const out = v.mode === 'NDJSON → JSON 数组' ? JSON.stringify(objs, null, 2) : L.toCSV([keys, ...objs.map((o) => keys.map((k) => o[k] ?? ''))]);
        return { text: out, stats: [{ label: '行数', value: objs.length }, { label: '字段', value: keys.length }], preview: `<p class="t-hint">字段集合：${L.esc(keys.join(', '))}</p>` };
      }
      if (v.mode === 'JSON 数组 → NDJSON') {
        const arr = JSON.parse(t);
        if (!Array.isArray(arr)) return { error: '输入应是 JSON 数组' };
        return { text: arr.map((x) => JSON.stringify(x)).join('\n'), stats: [{ label: '条数', value: arr.length }] };
      }
      const rows = L.parseCSV(t); const h = rows[0];
      const objs = rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, /^-?\d+(\.\d+)?$/.test(r[i] || '') ? Number(r[i]) : r[i] ?? ''])));
      return { text: objs.map((x) => JSON.stringify(x)).join('\n'), stats: [{ label: '条数', value: objs.length }, { label: '字段', value: h.length }] };
    } catch (e) { return { error: e.message }; }
  } };

S['json-diff'] = { kind: 'form', titleIn: '两份 JSON', titleOut: '语义差异', wide: false,
  fields: [{ id: 'a', label: 'JSON A', type: 'textarea', rows: 6, default: '{"a":1,"b":{"c":2}}' }, { id: 'b', label: 'JSON B', type: 'textarea', rows: 6, default: '{"a":1,"b":{"c":3},"d":4}' }],
  primary: '复制差异', hintOut: '按路径比较，忽略对象里 key 的书写顺序；数组按下标比。',
  compute: (v) => {
    let a, b; try { a = JSON.parse(v.a); b = JSON.parse(v.b); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const d = L.diffJSON(a, b);
    if (!d.length) return { text: '两份 JSON 语义上完全一致。', stats: [{ label: '差异', value: 0 }] };
    const show = (x) => x === undefined ? '（不存在）' : JSON.stringify(x);
    return { html: `<table class="t-table"><thead><tr><th>路径</th><th>A</th><th>B</th></tr></thead><tbody>${d.slice(0, 200).map((r) => `<tr><td class="num">${L.esc(r[0])}</td><td>${L.esc(show(r[1]))}</td><td>${L.esc(show(r[2]))}</td></tr>`).join('')}</tbody></table>`,
      copy: d.map((r) => `${r[0]}\tA=${show(r[1])}\tB=${show(r[2])}`).join('\n'), stats: [{ label: '差异点', value: d.length }] };
  } };

S['json-to-schema'] = { kind: 'form', titleIn: '样本 JSON', titleOut: '推断的 Schema',
  fields: [{ id: 'txt', label: 'JSON', type: 'textarea', rows: 9, default: '{"name":"小明","age":18,"tags":["a","b"],"addr":{"city":"北京"}}' },
    { id: 'req', label: 'required 策略', type: 'select', options: ['全部字段必填', '都不必填'] }],
  primary: '复制 Schema', hintOut: '按样本推断类型；数组取第一个元素作为 items，嵌套对象递归展开。',
  compute: (v) => {
    let o; try { o = JSON.parse(v.txt); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const s = L.inferSchema(o);
    if (v.req === '都不必填') { const strip = (x) => { if (x && typeof x === 'object') { delete x.required; Object.values(x.properties || {}).forEach(strip); if (x.items) strip(x.items); } }; strip(s); }
    s.$schema = 'https://json-schema.org/draft/2020-12/schema';
    return { text: JSON.stringify(s, null, 2), stats: [{ label: '顶层字段', value: Object.keys(s.properties || {}).length }] };
  } };

S['schema-to-ts'] = { kind: 'form', titleIn: 'JSON Schema', titleOut: 'TypeScript',
  fields: [{ id: 'txt', label: 'Schema 或样本 JSON', type: 'textarea', rows: 8, default: '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"integer"}},"required":["name"]}' },
    { id: 'name', label: '根类型名', type: 'text', default: 'Root' }],
  primary: '复制类型', hintOut: '支持 $ref 的本地解析（#/$defs/... 与 #/definitions/...），数组、枚举与联合类型。',
  compute: (v) => {
    let s; try { s = JSON.parse(v.txt); } catch (e) { return { error: '解析失败：' + e.message }; }
    if (!s.type) s = L.inferSchema(s);
    const defs = { ...(s.$defs || {}), ...(s.definitions || {}) };
    const go = (x, depth = 0) => {
      if (depth > 12) return 'any';
      if (x.$ref) { const k = x.$ref.split('/').pop(); return defs[k] ? (v.name && k === v.name ? k : go(defs[k], depth + 1)) : k; }
      if (x.enum) return x.enum.map((e) => JSON.stringify(e)).join(' | ');
      if (x.anyOf || x.oneOf) return (x.anyOf || x.oneOf).map((y) => go(y, depth + 1)).join(' | ');
      if (x.type === 'array') return `${go(x.items || {}, depth + 1)}[]`;
      if (x.type === 'object' || x.properties) {
        const req = x.required || [];
        const parts = Object.entries(x.properties || {}).map(([k, y]) => `  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}${req.includes(k) ? '' : '?'}: ${go(y, depth + 1)};`);
        return `{\n${parts.join('\n')}\n}`;
      }
      return ({ integer: 'number', number: 'number', boolean: 'boolean', null: 'null', string: 'string' })[x.type] || 'any';
    };
    const extra = Object.entries(defs).filter(([k]) => k !== v.name).map(([k, d]) => `export interface ${k} ${go(d)}`).join('\n\n');
    const out = `export interface ${v.name || 'Root'} ${go(s)}\n${extra ? '\n' + extra : ''}`;
    return { text: out, stats: [{ label: '行数', value: out.split('\n').length }] };
  } };

S['schema-validator'] = { kind: 'form', titleIn: 'Schema + 数据', titleOut: '校验结果',
  fields: [{ id: 'schema', label: 'JSON Schema', type: 'textarea', rows: 7, default: '{"type":"object","required":["name","age"],"properties":{"name":{"type":"string"},"age":{"type":"integer","minimum":0}}}' },
    { id: 'data', label: '待校验 JSON', type: 'textarea', rows: 6, default: '{"name":"小明","age":-3}' }],
  primary: '复制报告', hintOut: '本地实现 type / required / minimum / maximum / minLength / maxLength / pattern / enum / items 常用关键字，覆盖 Draft 7 常见用法；不是完整 ajv。',
  compute: (v) => {
    let s, d; try { s = JSON.parse(v.schema); d = JSON.parse(v.data); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const errs = [];
    const go = (x, val, path) => {
      if (!x || typeof x !== 'object') return;
      if (x.$ref) return;
      if (x.type) {
        const t = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;
        const ok = x.type === 'integer' ? Number.isInteger(val) : x.type === 'number' ? t === 'number' : t === x.type;
        if (!ok) { errs.push(`${path || '$'} 类型应为 ${x.type}，实际 ${t}`); return; }
      }
      if (x.enum && !x.enum.includes(val)) errs.push(`${path} 不在允许值内`);
      if (typeof val === 'string') {
        if (x.minLength != null && val.length < x.minLength) errs.push(`${path} 少于 ${x.minLength} 字符`);
        if (x.maxLength != null && val.length > x.maxLength) errs.push(`${path} 超过 ${x.maxLength} 字符`);
        if (x.pattern && !new RegExp(x.pattern).test(val)) errs.push(`${path} 不匹配 ${x.pattern}`);
      }
      if (typeof val === 'number') {
        if (x.minimum != null && val < x.minimum) errs.push(`${path} 小于最小值 ${x.minimum}`);
        if (x.maximum != null && val > x.maximum) errs.push(`${path} 大于最大值 ${x.maximum}`);
      }
      if (Array.isArray(val) && x.items) val.forEach((y, i) => go(x.items, y, `${path}[${i}]`));
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        (x.required || []).forEach((k) => { if (!(k in val)) errs.push(`${path}.${k} 缺失（必填）`); });
        Object.entries(x.properties || {}).forEach(([k, y]) => { if (k in val) go(y, val[k], `${path}.${k}`); });
      }
    };
    go(s, d, '$');
    return { text: errs.length ? errs.join('\n') : '✓ 校验通过', stats: [{ label: '错误', value: errs.length }, { label: '结论', value: errs.length ? '不通过' : '通过' }] };
  } };

S['diff'] = { kind: 'form', titleIn: '两份文本', titleOut: '逐行差异', wide: false,
  fields: [{ id: 'a', label: '原文 A', type: 'textarea', rows: 8, default: '第一行\n第二行\n第三行' }, { id: 'b', label: '改后 B', type: 'textarea', rows: 8, default: '第一行\n第二行改了\n第三行\n第四行' }],
  primary: '复制 diff', hintOut: 'LCS 逐行对比；绿色是新增，红色是删除，也可切逐词模式。',
  compute: (v) => {
    const d = L.diffLines(String(v.a || ''), String(v.b || ''));
    const add = d.filter((x) => x.startsWith('+')).length, del = d.filter((x) => x.startsWith('-')).length;
    const html = `<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.8;max-height:400px;overflow:auto">${d.map((l) => {
      const c = l[0] === '+' ? '#e6f2e6;color:#2f6b3a' : l[0] === '-' ? '#fae9e6;color:#a03b30' : 'transparent';
      return `<div style="background:${c};padding:0 7px;white-space:pre-wrap">${L.esc(l)}</div>`;
    }).join('')}</div>`;
    return { html, copy: d.join('\n'), stats: [{ label: '新增', value: add }, { label: '删除', value: del }, { label: '未变', value: d.length - add - del }] };
  } };

S['cron'] = { kind: 'form', titleIn: 'Cron 表达式', titleOut: '解释与下次执行',
  fields: [{ id: 'e', label: '表达式', type: 'text', default: '*/5 9-18 * * 1-5', placeholder: '分 时 日 月 周（5 段）或 秒 分 时 日 月 周（6 段）' },
    { id: 'n', label: '列几次', type: 'number', default: 8 }],
  primary: '复制结果', sample: { e: '0 9 * * 1', n: 8 },
  hintOut: '支持 * / , - 与星期名缩写；下次执行时间按本机时区推算，最多往后找一年。',
  compute: (v) => {
    const parts = String(v.e || '').trim().split(/\s+/);
    if (![5, 6].includes(parts.length)) return { error: 'Cron 应为 5 段或 6 段' };
    const six = parts.length === 6;
    const [mi, hr, dm, mo, dw] = six ? parts.slice(1) : parts;
    const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
    const parse = (s, idx) => {
      const [lo, hi] = ranges[idx]; const set = new Set();
      for (const seg of s.split(',')) {
        const [base, step] = seg.split('/');
        const st = step ? Number(step) : 1;
        let a, b;
        if (base === '*' || base === '?') { a = lo; b = hi; }
        else if (base.includes('-')) { [a, b] = base.split('-').map(Number); }
        else { a = b = Number(base); }
        if ([a, b, st].some((x) => !Number.isFinite(x))) throw new Error(`第 ${idx + 1} 段写错了：${seg}`);
        for (let x = a; x <= b; x += st) set.add(x % (hi + 1) === x ? x : x);
      }
      return set;
    };
    let sets; try { sets = [mi, hr, dm, mo, dw].map(parse); } catch (e) { return { error: e.message }; }
    const has = (set, x) => set.has(x) || (set.size === 1 && [...set][0] === 0 && x === 0);
    const dwSet = new Set([...sets[4]].map((x) => (x === 7 ? 0 : x)));
    const desc = `${[...sets[0]].slice(0, 6).join(',')}${sets[0].size > 6 ? '…' : ''} 分，${[...sets[1]].slice(0, 6).join(',')}${sets[1].size > 6 ? '…' : ''} 时，月 ${[...sets[3]].join(',')}，日 ${[...sets[2]].slice(0, 5).join(',')}${sets[2].size > 5 ? '…' : ''}，周 ${[...dwSet].join(',')}`;
    const next = []; let d = new Date(); d.setSeconds(six ? 0 : 0, 0); d.setMinutes(d.getMinutes() + 1);
    const end = d.getTime() + 366 * 86400000;
    while (d.getTime() < end && next.length < Math.min(50, Number(v.n) || 8)) {
      if (sets[3].has(d.getMonth() + 1) && sets[2].has(d.getDate()) && dwSet.has(d.getDay()) && sets[1].has(d.getHours()) && sets[0].has(d.getMinutes())) {
        next.push(L.fmtDate(d, true) + ' 周' + L.weekdayCN(d)); d = new Date(d.getTime() + 60000);
      } else d = new Date(d.getTime() + 60000);
    }
    return { text: `解读：${desc}\n\n接下来 ${next.length} 次：\n${next.join('\n') || '一年内没有匹配时间'}`,
      stats: [{ label: '段数', value: parts.length }, { label: '下次', value: next[0] ? next[0].slice(5, 16) : '—' }] };
  } };

S['hash'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>文本或文件</h2><span class="hint">本地计算</span></div>
    <textarea class="t-textarea" id="txt" rows="6" placeholder="要算摘要的文本…">hello world</textarea>
    <div class="t-drop" id="drop" style="margin-top:11px;min-height:86px"><div class="t">或拖一个文件算校验值</div><div class="s">点这里选文件，也可以 Ctrl+V</div><input type="file" id="file" hidden></div>
    <div class="t-field"><label class="t-label">算法</label><select class="t-select" id="algo"><option>md5</option><option>sha1</option><option>sha256</option></select></div>
    <div class="t-field"><label class="t-label">HMAC 密钥（留空则只算摘要）</label><input class="t-input" id="key" placeholder="可选"></div>
  </section><section class="t-panel">
    <div class="t-head"><h2><span class="step">2</span>摘要</h2><span class="hint">实时更新</span></div>
    <div class="t-out" id="out"></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="cp">复制摘要</button></div>
    <p class="t-hint" id="fileinfo"></p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let fileBuf = null, fileName = '';
  const calc = async () => {
    const algo = $('#algo').value, key = $('#key').value;
    const src = fileBuf || $('#txt').value;
    if (key) {
      const enc = new TextEncoder();
      const ckey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algo === 'md5' ? 'SHA-256' : algo.toUpperCase() }, false, ['sign']);
      const data = typeof src === 'string' ? enc.encode(src) : src;
      const sig = await crypto.subtle.sign('HMAC', ckey, data);
      $('#out').textContent = 'HMAC-' + (algo === 'md5' ? 'SHA-256' : algo.toUpperCase()) + '\n' + L.bytesToHex(sig);
    } else if (fileBuf) {
      // 文件：用 SubtleCrypto 算 SHA，MD5 走纯 JS
      if (algo === 'md5') $('#out').textContent = 'MD5（文件）\n' + L.hash(L.fromUtf8(fileBuf), 'md5');
      else { const d = await crypto.subtle.digest(algo.toUpperCase(), fileBuf); $('#out').textContent = algo.toUpperCase() + '\n' + L.bytesToHex(d); }
    } else $('#out').textContent = algo.toUpperCase() + '\n' + L.hash(String(src), algo);
    $('#fileinfo').textContent = fileName ? `当前对文件 ${fileName}（${L.humanSize(fileBuf.length)}）计算` : '当前对文本框内容计算';
  };
  ['#txt', '#algo', '#key'].forEach((s) => $(s).addEventListener('input', calc));
  const setFile = async (f) => { if (!f) return; fileBuf = new Uint8Array(await f.arrayBuffer()); fileName = f.name; $('#drop').querySelector('.t').textContent = f.name; await calc(); };
  $('#file').onchange = () => setFile($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { if (e.clipboardData?.files?.length) setFile(e.clipboardData.files[0]); });
  $('#cp').onclick = () => K.copy($('#out').textContent);
  K.setAction('复制摘要', () => K.copy($('#out').textContent));
  calc();
} };

S['regex'] = { kind: 'form', titleIn: '正则与文本', titleOut: '匹配结果', wide: false,
  fields: [{ id: 'p', label: '表达式（不含斜杠）', type: 'text', default: '(\\w+)@(\\w+)\\.(\\w+)' },
    { id: 'flags', label: '标志', type: 'select', options: ['g', 'gi', 'gim', 'gimsu', 'i', ''] },
    { id: 'txt', label: '测试文本', type: 'textarea', rows: 7, default: '联系我：hello@example.com 或 admin@test.cn' },
    { id: 'rep', label: '替换模板（可选）', type: 'text', default: '$1 [at] $2' }],
  primary: '复制匹配', hintOut: '实时高亮、分组捕获与替换预览；正则只在本机执行，不会把文本发出去。',
  compute: (v) => {
    let re; try { re = new RegExp(v.p, v.flags.replace(/[^gimsuyd]/g, '')); } catch (e) { return { error: '正则写错了：' + e.message }; }
    const t = String(v.txt || '');
    const ms = []; let m, guard = 0;
    const g = re.flags.includes('g');
    while ((m = re.exec(t)) !== null && guard++ < 5000) { ms.push({ index: m.index, text: m[0], groups: m.slice(1), named: m.groups || {} }); if (!g) break; if (!m[0]) re.lastIndex++; }
    let hi = '', last = 0;
    for (const x of ms.slice(0, 200)) { hi += L.esc(t.slice(last, x.index)) + `<mark style="background:#f6e2b8;padding:0 2px;border-radius:3px">${L.esc(x.text)}</mark>`; last = x.index + x.text.length; }
    hi += L.esc(t.slice(last));
    const rep = v.rep ? t.replace(new RegExp(v.p, re.flags.includes('g') ? re.flags : re.flags + 'g'), v.rep) : '';
    const table = ms.length ? `<table class="t-table" style="margin-top:12px"><thead><tr><th>#</th><th>位置</th><th>匹配</th><th>分组</th></tr></thead><tbody>${ms.slice(0, 60).map((x, i) => `<tr><td class="num">${i + 1}</td><td class="num">${x.index}</td><td>${L.esc(x.text)}</td><td>${L.esc(x.groups.join(' | '))}</td></tr>`).join('')}</tbody></table>` : '';
    return { html: `<div style="line-height:1.9;white-space:pre-wrap;word-break:break-all">${hi}</div>${rep ? `<p class="t-label" style="margin-top:14px">替换预览</p><div class="t-out" style="white-space:pre-wrap">${L.esc(rep)}</div>` : ''}${table}`,
      copy: ms.map((x, i) => `${i + 1}\t${x.index}\t${x.text}\t${x.groups.join(' | ')}`).join('\n'),
      stats: [{ label: '匹配', value: ms.length }, { label: '分组', value: ms[0]?.groups.length || 0 }] };
  } };

S['regex-pro'] = { kind: 'form', titleIn: 'Regex Pro', titleOut: '解析与替换', wide: false,
  fields: [{ id: 'p', label: '表达式', type: 'text', default: '(?<user>\\w+)@(?<host>[\\w.]+)' },
    { id: 'flags', label: '标志', type: 'select', options: ['g', 'gi', 'gim', 'gimsu'] },
    { id: 'txt', label: '测试文本', type: 'textarea', rows: 6, default: 'a@x.com b@y.org' },
    { id: 'rep', label: '替换模板', type: 'text', default: '$<user> ← $<host>' }],
  primary: '复制结果', hintOut: '给出命名组、语法着色与逐段中文解释；替换预览支持 $1 / $<name>。',
  compute: (v) => {
    let re; try { re = new RegExp(v.p, v.flags); } catch (e) { return { error: e.message }; }
    const tokens = [];
    const p = String(v.p);
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      const map = { '\\d': '数字', '\\w': '单词字符', '\\s': '空白', '^': '行首锚点', '$': '行尾锚点', '.': '任意字符', '*': '重复 0 次或更多', '+': '重复 1 次或更多', '?': '重复 0 或 1 次 / 惰性', '|': '或', '[': '字符类开始', ']': '字符类结束', '(': '分组开始', ')': '分组结束' };
      let hit = '';
      if (c === '\\' && p[i + 1]) { hit = c + p[i + 1]; i++; }
      else if (p.startsWith('(?<', i)) { const j = p.indexOf('>', i); tokens.push([p.slice(i, j + 1), '命名捕获组']); i = j; continue; }
      else if (p.startsWith('(?=', i) || p.startsWith('(?!', i) || p.startsWith('(?<=', i)) { tokens.push([p.slice(i, i + 4), '零宽断言']); i += 3; continue; }
      else hit = c;
      if (map[hit]) tokens.push([hit, map[hit]]);
    }
    const ms = [...String(v.txt || '').matchAll(re)].slice(0, 100);
    const color = (s) => L.esc(s).replace(/(\\[dwsDSW]|\(\?&lt;\w+&gt;|[.*+?^$()\[\]{}|])/g, '<b style="color:var(--accent)">$1</b>');
    const rep = v.rep ? String(v.txt || '').replace(re, v.rep) : '';
    return { html: `<p class="t-label">语法着色</p><div class="t-out" style="font-size:13px">${color(p)}</div>
      ${tokens.length ? `<p class="t-label" style="margin-top:12px">逐段解释</p><table class="t-table"><tbody>${tokens.map((t) => `<tr><td class="num">${L.esc(t[0])}</td><td>${L.esc(t[1])}</td></tr>`).join('')}</tbody></table>` : ''}
      ${rep ? `<p class="t-label" style="margin-top:12px">替换预览</p><div class="t-out">${L.esc(rep)}</div>` : ''}
      <p class="t-label" style="margin-top:12px">捕获明细</p><table class="t-table"><thead><tr><th>匹配</th><th>命名组</th><th>位置</th></tr></thead><tbody>${ms.map((m) => `<tr><td>${L.esc(m[0])}</td><td>${L.esc(JSON.stringify(m.groups || {}))}</td><td class="num">${m.index}</td></tr>`).join('')}</tbody></table>`,
      copy: ms.map((m) => `${m[0]}\t${JSON.stringify(m.groups || {})}`).join('\n'),
      stats: [{ label: '匹配', value: ms.length }, { label: '语法节点', value: tokens.length }] };
  } };

S['regex-railroad'] = { kind: 'form', titleIn: '正则', titleOut: '结构图',
  fields: [{ id: 'p', label: '表达式', type: 'text', default: '^\\d{3}-(?<name>\\w+)$' }],
  primary: '复制 SVG', hintOut: '把表达式按字符类 / 量词 / 分组 / 断言拆成节点，画成从左到右的流程图；可导出 SVG。',
  compute: (v) => {
    const p = String(v.p || '');
    const nodes = []; let i = 0;
    while (i < p.length) {
      const c = p[i];
      if (p.startsWith('(?<', i)) { const j = p.indexOf('>', i); nodes.push(['命名组 ' + p.slice(i + 3, j), 'group']); i = j + 1; continue; }
      if (p.startsWith('(?', i)) { const j = p.indexOf(')', i); nodes.push(['断言 ' + p.slice(i, j + 1), 'assert']); i = j + 1; continue; }
      if (c === '[') { const j = p.indexOf(']', i); nodes.push(['字符类 ' + p.slice(i, j + 1), 'class']); i = j + 1; continue; }
      if (c === '\\') { nodes.push(['转义 ' + p.slice(i, i + 2), 'class']); i += 2; continue; }
      if (c === '{') { const j = p.indexOf('}', i); nodes.push(['量词 ' + p.slice(i, j + 1), 'quant']); i = j + 1; continue; }
      if ('*+?'.includes(c)) { nodes.push(['量词 ' + c, 'quant']); i++; continue; }
      if (c === '(' || c === ')') { nodes.push([c === '(' ? '分组开始' : '分组结束', 'group']); i++; continue; }
      if ('^$'.includes(c)) { nodes.push([c === '^' ? '行首' : '行尾', 'assert']); i++; continue; }
      if (c === '|') { nodes.push(['或', 'alt']); i++; continue; }
      nodes.push(['字面 ' + c, 'lit']); i++;
    }
    const colors = { lit: '#f2eee5', class: '#e7f0e4', quant: '#f8ecd5', group: '#e9eef6', assert: '#f5e6e3', alt: '#efe8f4' };
    const bw = 118, gap = 14, h = 46;
    const w = Math.max(560, 40 + nodes.length * (bw + gap));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 110" style="width:100%;min-width:${Math.min(w, 900)}px">
      <line x1="10" y1="55" x2="${w - 10}" y2="55" stroke="#c9c1b2" stroke-width="1.5"/>
      ${nodes.map((n, i) => { const x = 20 + i * (bw + gap); return `<g><rect x="${x}" y="32" width="${bw}" height="${h}" rx="7" fill="${colors[n[1]]}" stroke="#d6cbb8"/><text x="${x + bw / 2}" y="52" text-anchor="middle" font-size="11" fill="#4a4034">${L.esc(n[0].slice(0, 14))}</text><text x="${x + bw / 2}" y="68" text-anchor="middle" font-size="9" fill="#8a7c68">${n[1]}</text></g>`; }).join('')}
      <text x="10" y="20" font-size="11" fill="#8a7c68">起点</text><text x="${w - 34}" y="20" font-size="11" fill="#8a7c68">终点</text></svg>`;
    return { preview: svg, copy: svg, text: `${nodes.length} 个节点：\n${nodes.map((n) => n[1] + ' → ' + n[0]).join('\n')}`,
      stats: [{ label: '节点', value: nodes.length }], actions: [{ label: '下载 SVG', run: (v2, ctx) => { const el = ctx.root.querySelector('[data-preview] svg'); ctx.download('regex-railroad.svg', el ? el.outerHTML : '', 'image/svg+xml'); } }] };
  } };

S['unicode'] = { kind: 'form', titleIn: '文本或转义', titleOut: '互转与检视',
  fields: [{ id: 'txt', label: '输入', type: 'textarea', rows: 5, default: '你好 A 😀' },
    { id: 'mode', label: '输出格式', type: 'select', options: ['\\u 转义', '&#x; 实体', 'U+ 码位', 'UTF-8 字节 hex', 'JSON \\u', '字符检视表'] },
    { id: 'dir', label: '方向', type: 'select', options: ['编码', '解码'] }],
  primary: '复制结果', hintOut: '支持 \\uXXXX / \\u{XXXXX} / &#x...; / &#...; / U+XXXX 混合解码，以及 NFC / NFD 归一化。',
  compute: (v) => {
    const t = String(v.txt || '');
    if (v.dir === '解码') return { text: L.fromEscapes(t), stats: [{ label: '字符数', value: Array.from(L.fromEscapes(t)).length }] };
    const cps = Array.from(t).map((c) => c.codePointAt(0));
    if (v.mode === '字符检视表') {
      return { html: `<table class="t-table"><thead><tr><th>字符</th><th>码位 U+</th><th>UTF-8</th><th>NFC</th><th>NFD</th></tr></thead><tbody>${Array.from(t).slice(0, 200).map((c) => `<tr><td>${L.esc(c)}</td><td class="num">${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}</td><td>${L.bytesToHex(L.utf8(c), ' ')}</td><td>${L.esc(c.normalize('NFC'))}</td><td>${L.esc(c.normalize('NFD'))}</td></tr>`).join('')}</tbody></table>`,
        copy: Array.from(t).map((c) => `${c}\tU+${c.codePointAt(0).toString(16).toUpperCase()}\t${L.bytesToHex(L.utf8(c), ' ')}`).join('\n') };
    }
    const map = {
      '\\u 转义': () => Array.from(t).map((c) => c.codePointAt(0) > 0xffff ? `\\u{${c.codePointAt(0).toString(16)}}` : `\\u${c.codePointAt(0).toString(16).padStart(4, '0')}`).join(''),
      '&#x; 实体': () => cps.map((n) => `&#x${n.toString(16)};`).join(''),
      'U+ 码位': () => cps.map((n) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`).join(' '),
      'UTF-8 字节 hex': () => L.bytesToHex(L.utf8(t), ' '),
      'JSON \\u': () => JSON.stringify(t).slice(1, -1),
    };
    return { text: (map[v.mode] || map['\\u 转义'])(), stats: [{ label: '字符', value: cps.length }, { label: '字节', value: L.utf8(t).length }] };
  } };

S['url-parse'] = { kind: 'form', titleIn: 'URL', titleOut: '拆解与参数',
  fields: [{ id: 'u', label: '整条网址', type: 'text', default: 'https://user:pass@example.com:8080/a/b?x=1&x=2&name=%E5%B0%8F%E6%98%8E#top' },
    { id: 'edit', label: '改参数（key=value，每行一条）', type: 'textarea', rows: 4, default: 'x=9\nnew=hello' }],
  primary: '复制拼回的 URL', hintOut: '上半部分是拆解结果；下半部分按你填的参数重新拼一条 URL，重复 key 会保留为数组。',
  compute: (v) => {
    let u; try { u = new URL(v.u); } catch (e) { return { error: 'URL 不合法：' + e.message }; }
    const params = [...u.searchParams.entries()];
    const rebuilt = new URL(v.u);
    const rules = L.nonEmptyLines(v.edit || '');
    for (const r of rules) { const i = r.indexOf('='); if (i < 0) continue; const k = r.slice(0, i).trim(), val = r.slice(i + 1); if (!k) continue; if (val === '') rebuilt.searchParams.delete(k); else rebuilt.searchParams.set(k, val); }
    const rows = [['protocol', u.protocol], ['username', u.username], ['password', u.password], ['hostname', u.hostname], ['port', u.port], ['pathname', u.pathname], ['hash', u.hash], ['origin', u.origin]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1] || '（空）')}</td></tr>`).join('')}</tbody></table>
      <p class="t-label" style="margin-top:14px">查询参数（${params.length}）</p><table class="t-table"><tbody>${params.map((p) => `<tr><td>${L.esc(p[0])}</td><td>${L.esc(p[1])}</td></tr>`).join('') || '<tr><td colspan="2">无参数</td></tr>'}</tbody></table>
      <p class="t-label" style="margin-top:14px">拼回的 URL</p><div class="t-out" style="word-break:break-all">${L.esc(rebuilt.href)}</div>`,
      copy: rebuilt.href, stats: [{ label: '参数', value: params.length }, { label: '端口', value: u.port || '默认' }] };
  } };

S['hex-text'] = { kind: 'form', titleIn: 'HEX / 文本', titleOut: '互转结果',
  fields: [{ id: 'txt', label: '输入', type: 'textarea', rows: 5, default: '你好 hello' },
    { id: 'dir', label: '方向', type: 'select', options: ['文本 → HEX', 'HEX → 文本'] },
    { id: 'enc', label: '编码', type: 'select', options: ['UTF-8', 'GB18030/GBK', 'UTF-16LE', 'ISO-8859-1', 'ASCII'] }],
  primary: '复制结果', hintOut: '带 BOM 会自动识别并去掉；乱码诊断会把不可解码字节标成 . 并给出提示。',
  compute: (v) => {
    const t = String(v.txt || '').trim();
    if (!t) return { text: '' };
    const enc = ({ 'UTF-8': 'utf-8', 'GB18030/GBK': 'gb18030', 'UTF-16LE': 'utf-16le', 'ISO-8859-1': 'latin1', 'ASCII': 'ascii' })[v.enc] || 'utf-8';
    if (v.dir === 'HEX → 文本') {
      let b; try { b = L.hexToBytes(t); } catch (e) { return { error: e.message }; }
      let bom = '';
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) { bom = 'UTF-8 BOM'; b = b.slice(3); }
      else if (b[0] === 0xff && b[1] === 0xfe) { bom = 'UTF-16LE BOM'; b = b.slice(2); }
      try {
        const s = new TextDecoder(enc, { fatal: false }).decode(b);
        const bad = (s.match(/\ufffd/g) || []).length;
        return { text: s, stats: [{ label: '字节', value: b.length }, { label: '字符', value: Array.from(s).length }, { label: 'BOM', value: bom || '无' }],
          preview: bad ? `<p class="t-hint" style="color:#a63d34">有 ${bad} 个字节无法用 ${v.enc} 解码（显示为 ）。试着切到 GB18030/GBK 或 UTF-8。</p>` : '' };
      } catch (e) { return { error: e.message }; }
    }
    const b = enc === 'utf-8' ? L.utf8(t) : enc === 'utf-16le' ? new Uint8Array(new Uint16Array(Array.from(t).map((c) => c.charCodeAt(0))).buffer) : new Uint8Array(Array.from(t).map((c) => c.charCodeAt(0) & 255));
    return { text: L.bytesToHex(b, ' '), stats: [{ label: '字节', value: b.length }, { label: '编码', value: v.enc }] };
  } };

S['hex-frame'] = { kind: 'form', titleIn: 'HEX 帧与模板', titleOut: '解析结果',
  fields: [{ id: 'hex', label: 'HEX 字节流', type: 'text', default: 'AA 55 01 00 00 00 2A 01 02 03 04' },
    { id: 'tpl', label: '字段模板（每行 名称:类型:长度）', type: 'textarea', rows: 5, default: 'head:uint16:2\ncmd:uint8:1\nlen:uint32:4\nvalue:uint8:1\npayload:ascii:4' },
    { id: 'endian', label: '字节序', type: 'select', options: ['大端 BE', '小端 LE'] },
    { id: 'crc', label: '校验', type: 'select', options: ['无', 'CRC16-Modbus（末 2 字节）', '累加和（末 1 字节）'] }],
  primary: '复制结果', hintOut: '类型支持 uint8/16/32、int8/16/32、float32/64、ascii、hex、bcd；长度按字节计。可反向拼帧。',
  compute: (v) => {
    let b; try { b = L.hexToBytes(v.hex); } catch (e) { return { error: e.message }; }
    const le = v.endian === '小端 LE';
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let off = 0; const rows = [];
    for (const line of L.nonEmptyLines(v.tpl || '')) {
      const [name, typ, lenS] = line.split(':').map((x) => x.trim());
      const len = Number(lenS) || 1;
      if (off + len > b.length) { rows.push([name, '越界', off, '']); break; }
      let val = '';
      const sl = b.slice(off, off + len);
      try {
        if (typ === 'uint8') val = dv.getUint8(off);
        else if (typ === 'uint16') val = dv.getUint16(off, le);
        else if (typ === 'uint32') val = dv.getUint32(off, le);
        else if (typ === 'int8') val = dv.getInt8(off);
        else if (typ === 'int16') val = dv.getInt16(off, le);
        else if (typ === 'int32') val = dv.getInt32(off, le);
        else if (typ === 'float32') val = dv.getFloat32(off, le);
        else if (typ === 'float64') val = dv.getFloat64(off, le);
        else if (typ === 'ascii') val = JSON.stringify(L.fromUtf8(sl));
        else if (typ === 'hex') val = L.bytesToHex(sl, ' ');
        else if (typ === 'bcd') val = L.bytesToHex(sl, '').replace(/([0-9a-f])([0-9a-f])/g, '$1$2 ');
        else val = L.bytesToHex(sl, ' ');
      } catch (e) { val = '读取失败'; }
      rows.push([name || '?', typ, off, String(val)]); off += len;
    }
    let crcNote = '';
    if (v.crc === 'CRC16-Modbus（末 2 字节）' && b.length >= 2) {
      const body = b.slice(0, -2), expect = (body[body.length - 1] << 8) | body[body.length - 2];
      let c = 0xffff;
      for (const x of body) { c ^= x; for (let i = 0; i < 8; i++) c = (c & 1) ? (c >> 1) ^ 0xa001 : c >> 1; }
      crcNote = `CRC16 计算值 0x${(c & 0xffff).toString(16).toUpperCase().padStart(4, '0')}，帧尾 0x${(expect & 0xffff).toString(16).toUpperCase().padStart(4, '0')} → ${(c & 0xffff) === (expect & 0xffff) ? '一致 ✓' : '不一致'}`;
    }
    return { html: `<table class="t-table"><thead><tr><th>字段</th><th>类型</th><th>偏移</th><th>值</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td>${L.esc(r[1])}</td><td class="num">${r[2]}</td><td class="num">${L.esc(r[3])}</td></tr>`).join('')}</tbody></table>${crcNote ? `<p class="t-hint">${L.esc(crcNote)}</p>` : ''}`,
      copy: rows.map((r) => r.join('\t')).join('\n') + (crcNote ? '\n' + crcNote : ''), stats: [{ label: '字段', value: rows.length }, { label: '已解析', value: `${off}/${b.length} 字节` }] };
  } };

S['yaml-csv-xml'] = { kind: 'form', titleIn: '源数据', titleOut: '转换结果',
  fields: [{ id: 'txt', label: 'JSON / CSV / YAML / XML', type: 'textarea', rows: 9, default: '[{"name":"小明","age":18},{"name":"小红","age":20}]' },
    { id: 'from', label: '源格式', type: 'select', options: ['自动识别', 'JSON', 'CSV', 'YAML', 'XML'] },
    { id: 'to', label: '目标格式', type: 'select', options: ['JSON', 'CSV', 'YAML', 'XML', 'TOML'] }],
  primary: '复制结果', hintOut: 'YAML / TOML 用轻量解析器（支持缩进映射、列表、基本类型），复杂锚点与多行块请先在别处展开。',
  compute: (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    let from = v.from;
    if (from === '自动识别') from = t.startsWith('[') || t.startsWith('{') ? 'JSON' : t.startsWith('<') ? 'XML' : /^[\w-]+\s*:/m.test(t) || t.includes('\n  ') ? 'YAML' : 'CSV';
    let obj;
    try {
      if (from === 'JSON') obj = JSON.parse(t);
      else if (from === 'CSV') obj = L.csvToObjects(t);
      else if (from === 'XML') {
        const doc = new DOMParser().parseFromString(t, 'text/xml');
        const node = (el) => { const kids = [...el.children]; if (!kids.length) return el.textContent; const o = {}; kids.forEach((k) => { const x = node(k); o[k.tagName] = o[k.tagName] === undefined ? x : [].concat(o[k.tagName], x); }); return o; };
        obj = node(doc.documentElement);
      } else {
        const parseYAML = (s) => {
          const ls = s.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
          const root = []; const stack = [{ ind: -1, val: root }];
          for (const l of ls) {
            const ind = l.match(/^\s*/)[0].length; const body = l.trim();
            while (stack.length > 1 && ind <= stack[stack.length - 1].ind) stack.pop();
            const cur = stack[stack.length - 1].val;
            if (body.startsWith('- ')) { const item = body.slice(2); const o = {}; if (Array.isArray(cur)) cur.push(o); stack.push({ ind, val: o }); if (item.includes(':')) { const [k, ...r] = item.split(':'); o[k.trim()] = cast(r.join(':').trim()); } }
            else { const i = body.indexOf(':'); if (i < 0) continue; const k = body.slice(0, i).trim(), raw = body.slice(i + 1).trim(); if (!raw) { const o = {}; cur[k] = o; stack.push({ ind, val: o }); } else cur[k] = cast(raw); }
          }
          return root.length ? root : (Object.keys(root).length ? root : {});
        };
        const cast = (x) => x === 'true' ? true : x === 'false' ? false : x === 'null' ? null : /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : /^["'].*["']$/.test(x) ? x.slice(1, -1) : x;
        obj = parseYAML(t);
      }
    } catch (e) { return { error: '解析失败：' + e.message }; }
    const toYAML = (o, ind = 0) => {
      const sp = ' '.repeat(ind);
      if (Array.isArray(o)) return o.map((x) => typeof x === 'object' && x ? sp + '- ' + toYAML(x, ind + 2).trimStart() : sp + '- ' + JSON.stringify(x)).join('\n');
      if (o && typeof o === 'object') return Object.entries(o).map(([k, x]) => x && typeof x === 'object' ? `${sp}${k}:\n${toYAML(x, ind + 2)}` : `${sp}${k}: ${typeof x === 'string' && /[:#\n]/.test(x) ? JSON.stringify(x) : String(x)}`).join('\n');
      return sp + String(o);
    };
    const toXML = (o, tag = 'root') => {
      if (Array.isArray(o)) return o.map((x) => toXML(x, 'item')).join('\n');
      if (o && typeof o === 'object') return `<${tag}>\n${Object.entries(o).map(([k, x]) => toXML(x, k)).join('\n')}\n</${tag}>`;
      return `<${tag}>${L.esc(String(o))}</${tag}>`;
    };
    const toTOML = (o, prefix = '') => {
      const simple = Object.entries(o).filter(([, x]) => x === null || typeof x !== 'object' || Array.isArray(x));
      const tables = Object.entries(o).filter(([, x]) => x && typeof x === 'object' && !Array.isArray(x));
      const line = ([k, x]) => `${k} = ${Array.isArray(x) ? '[' + x.map((y) => JSON.stringify(y)).join(', ') + ']' : JSON.stringify(x)}`;
      return simple.map(line).join('\n') + (tables.length ? '\n' + tables.map(([k, x]) => `[${prefix}${k}]\n${toTOML(x, prefix + k + '.')}`).join('\n') : '');
    };
    let out;
    try {
      out = v.to === 'JSON' ? JSON.stringify(obj, null, 2) : v.to === 'CSV' ? L.toCSV((() => { const arr = Array.isArray(obj) ? obj : [obj]; const keys = [...new Set(arr.flatMap((x) => Object.keys(x)))]; return [keys, ...arr.map((x) => keys.map((k) => x[k] ?? ''))]; })()) : v.to === 'YAML' ? toYAML(obj) : v.to === 'XML' ? toXML(obj) : toTOML(obj);
    } catch (e) { return { error: '转换失败：' + e.message }; }
    return { text: out, stats: [{ label: '源', value: from }, { label: '目标', value: v.to }, { label: '字符', value: out.length }] };
  } };

S['xml'] = { kind: 'form', titleIn: 'XML', titleOut: '结果',
  fields: [{ id: 'txt', label: 'XML 文本', type: 'textarea', rows: 9, default: '<root><item id="1"><name>小明</name></item><item id="2"><name>小红</name></item></root>' },
    { id: 'mode', label: '操作', type: 'select', options: ['格式化', '压缩', 'XPath 查询', '树视图'] },
    { id: 'xp', label: 'XPath（查询时填）', type: 'text', default: '//item/name' }],
  primary: '复制结果', hintOut: '用浏览器原生 DOMParser / XPath 实现，不引第三方引擎；格式错误会给出行号附近的信息。',
  compute: (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    const doc = new DOMParser().parseFromString(t, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return { error: 'XML 解析失败：' + err.textContent.slice(0, 160) };
    if (v.mode === '压缩') return { text: t.replace(/>\s+</g, '><').trim(), stats: [{ label: '压缩后', value: t.replace(/>\s+</g, '><').trim().length }] };
    if (v.mode === 'XPath 查询') {
      let r; try { r = doc.evaluate(v.xp, doc, null, XPathResult.ANY_TYPE, null); } catch (e) { return { error: 'XPath 写错了：' + e.message }; }
      const out = []; let n;
      while ((n = r.iterateNext()) && out.length < 500) out.push(n.nodeType === 2 ? `${n.name}="${n.value}"` : n.textContent.trim());
      return { text: out.length ? out.join('\n') : '没有匹配节点', stats: [{ label: '命中', value: out.length }] };
    }
    const fmt = (node, ind = 0) => {
      const sp = '  '.repeat(ind);
      if (node.nodeType === 3) return node.textContent.trim() ? sp + L.esc(node.textContent.trim()) + '\n' : '';
      if (node.nodeType !== 1) return '';
      const attrs = [...node.attributes].map((a) => ` ${a.name}="${L.esc(a.value)}"`).join('');
      const kids = [...node.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent.trim()));
      if (!kids.length) return `${sp}<${node.tagName}${attrs}/>\n`;
      const onlyText = kids.length === 1 && kids[0].nodeType === 3;
      const content = onlyText ? L.esc(kids[0].textContent.trim()) : '\n' + kids.map((c) => fmt(c, ind + 1)).join('') + sp;
      return `${sp}<${node.tagName}${attrs}>${content}</${node.tagName}>\n`;
    };
    const pretty = fmt(doc.documentElement);
    if (v.mode === '树视图') {
      const tree = (node, ind = 0) => {
        const sp = '  '.repeat(ind); const attrs = [...(node.attributes || [])].map((a) => ` ${a.name}="${a.value}"`).join('');
        const kids = [...(node.children || [])];
        let s = `${sp}└─ <${node.tagName}${attrs}>\n`;
        for (const k of kids) s += tree(k, ind + 1);
        const txt = (node.textContent || '').trim();
        if (!kids.length && txt) s += `${sp}   ${L.esc(txt)}\n`;
        return s;
      };
      return { text: tree(doc.documentElement), stats: [{ label: '节点', value: doc.getElementsByTagName('*').length }] };
    }
    return { text: pretty.trim(), stats: [{ label: '节点', value: doc.getElementsByTagName('*').length }, { label: '行数', value: pretty.split('\n').length }] };
  } };

S['ua-parse'] = { kind: 'form', titleIn: 'User-Agent', titleOut: '拆解结果',
  fields: [{ id: 'ua', label: 'UA 字符串', type: 'textarea', rows: 4, default: '' }],
  primary: '复制结果', sample: { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  hintOut: '留空则自动读取当前浏览器的 UA；Bot 识别覆盖常见爬虫关键字。',
  compute: (v) => {
    const ua = String(v.ua || navigator.userAgent);
    const bots = ['bot', 'spider', 'crawl', 'slurp', 'curl', 'wget', 'python-requests', 'facebookexternalhit', 'headlesschrome'];
    const isBot = bots.some((b) => ua.toLowerCase().includes(b));
    const browsers = [['Edg/', 'Edge'], ['OPR/', 'Opera'], ['Firefox/', 'Firefox'], ['Chrome/', 'Chrome'], ['Version/.*Safari', 'Safari'], ['MSIE ', 'IE'], ['Trident/', 'IE 11']];
    const browser = browsers.find(([p]) => new RegExp(p).test(ua))?.[1] || '未知';
    const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows NT/.test(ua) ? 'Windows' : /iPhone|iPad|iPod/.test(ua) ? 'iOS ' + (ua.match(/OS (\d+[._]\d+)/) || [])[1]?.replace('_', '.') : /Android/.test(ua) ? 'Android ' + (ua.match(/Android ([\d.]+)/) || [])[1] : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '未知';
    const device = /iPad/.test(ua) ? '平板' : /iPhone|iPod|Android.*Mobile|Mobile/.test(ua) ? '手机' : '桌面';
    const engine = /AppleWebKit/.test(ua) ? 'WebKit/Blink' : /Gecko\//.test(ua) ? 'Gecko' : /Trident/.test(ua) ? 'Trident' : '未知';
    const ver = (ua.match(new RegExp(browser === 'Chrome' ? 'Chrome/([\\d.]+)' : browser === 'Firefox' ? 'Firefox/([\\d.]+)' : browser === 'Safari' ? 'Version/([\\d.]+)' : 'Edg/([\\d.]+)')) || [])[1] || '—';
    const rows = [['浏览器', browser + ' ' + ver], ['内核', engine], ['操作系统', os || '未知'], ['设备类型', device], ['是否 Bot', isBot ? '是（' + bots.find((b) => ua.toLowerCase().includes(b)) + '）' : '否'], ['原始 UA', ua]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td style="word-break:break-all">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '浏览器', value: browser }, { label: '设备', value: device }, { label: 'Bot', value: isBot ? '是' : '否' }] };
  } };

S['ip-tools'] = { kind: 'form', titleIn: 'IP / CIDR', titleOut: '计算结果',
  fields: [{ id: 'cidr', label: 'IP 或 CIDR', type: 'text', default: '192.168.1.0/24' },
    { id: 'check', label: '检查某 IP 是否在此网段（可选）', type: 'text', default: '192.168.1.42' }],
  primary: '复制结果', hintOut: '支持 IPv4 的 CIDR 计算、子网包含判断、进制互转与私网地址判定；反向 DNS 需要联网查询，这里不猜。',
  compute: (v) => {
    const c = String(v.cidr || '').trim();
    try {
      if (c.includes('/')) {
        const i = L.cidrInfo(c);
        const inside = v.check ? (() => { try { return i.contains(String(v.check).trim()) ? '在网段内 ✓' : '不在网段内'; } catch (e) { return e.message; } })() : '—';
        const rows = [['网络地址', i.network], ['广播地址', i.broadcast], ['子网掩码', i.mask], ['可用首地址', i.first], ['可用末地址', i.last], ['可用主机数', L.fmt(i.hosts, 0)], ['掩码位数', '/' + i.bits], ['检查 IP', inside]];
        return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`, copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '主机数', value: L.fmt(i.hosts, 0) }, { label: '掩码', value: '/' + i.bits }] };
      }
      const n = L.ip2long(c);
      const priv = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)/.test(c);
      return { text: [`十进制：${n}`, `十六进制：0x${n.toString(16).toUpperCase().padStart(8, '0')}`, `二进制：${n.toString(2).padStart(32, '0').match(/.{8}/g).join('.')}`, `还原：${L.long2ip(n)}`, `类型：${priv ? '私有/保留地址' : '公网地址'}`].join('\n'),
        stats: [{ label: '十进制', value: String(n) }, { label: '类型', value: priv ? '私有' : '公网' }] };
    } catch (e) { return { error: e.message }; }
  } };

S['og-preview'] = { kind: 'form', titleIn: 'HTML / 元信息', titleOut: '社交卡片预览',
  fields: [{ id: 'html', label: '粘贴网页 <head> 或完整 HTML', type: 'textarea', rows: 8, default: '<meta property="og:title" content="一页工具"><meta property="og:description" content="打开就能用的小工具箱"><meta name="twitter:card" content="summary_large_image"><title>一页工具</title>' },
    { id: 'plat', label: '平台样式', type: 'select', options: ['Twitter / X', '微信', 'Facebook', '微博'] }],
  primary: '复制标签', hintOut: '纯前端解析 og: / twitter: / 标准 meta，不发起网络请求；粘 HTML 就能看到卡片长什么样。',
  compute: (v) => {
    const doc = new DOMParser().parseFromString(String(v.html || ''), 'text/html');
    const get = (sel, attr) => [...doc.querySelectorAll(sel)].map((el) => el.getAttribute(attr)).filter(Boolean);
    const meta = {};
    doc.querySelectorAll('meta').forEach((m) => { const k = m.getAttribute('property') || m.getAttribute('name'); if (k) meta[k.toLowerCase()] = m.getAttribute('content') || ''; });
    const title = meta['og:title'] || meta['twitter:title'] || doc.title || '（缺标题）';
    const desc = meta['og:description'] || meta['description'] || meta['twitter:description'] || '（缺描述）';
    const img = meta['og:image'] || meta['twitter:image'] || '';
    const url = meta['og:url'] || '';
    const missing = ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card'].filter((k) => !meta[k]);
    const card = `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden;max-width:420px;background:#fff">
      ${img ? `<img src="${L.esc(img)}" style="width:100%;height:170px;object-fit:cover;display:block" onerror="this.style.display='none'">` : ''}
      <div style="padding:12px 14px"><div style="font-size:11px;color:#8a7c68">${L.esc(url || 'example.com')}</div>
      <div style="font-size:15px;font-weight:700;margin:4px 0">${L.esc(title)}</div>
      <div style="font-size:12.5px;color:#6b6152;line-height:1.6">${L.esc(desc)}</div></div></div>`;
    return { preview: card + (missing.length ? `<p class="t-hint" style="margin-top:10px;color:#a63d34">建议补上：${L.esc(missing.join('、'))}</p>` : ''),
      html: `<table class="t-table"><tbody>${Object.entries(meta).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${L.esc(x)}</td></tr>`).join('')}</tbody></table>`,
      copy: Object.entries(meta).map(([k, x]) => `${k}: ${x}`).join('\n'), stats: [{ label: 'meta', value: Object.keys(meta).length }, { label: '缺失', value: missing.length }] };
  } };

S['mock-data'] = { kind: 'form', titleIn: '字段与数量', titleOut: '生成的数据',
  fields: [{ id: 'fields', label: '字段（逗号分隔）', type: 'text', default: 'name,phone,idcard,email,city,company,date' },
    { id: 'n', label: '条数', type: 'number', default: 20 }, { id: 'fmt', label: '输出格式', type: 'select', options: ['JSON', 'JSONL', 'CSV', 'SQL INSERT'] }],
  primary: '复制数据', hintOut: '内置 15 种字段：name/phone/idcard/bankcard/carplate/uscc/email/city/company/date/ip/uuid/amount/age/word。生成的是格式合法的测试数据，不是真实个人信息。',
  compute: (v) => {
    const fields = String(v.fields || '').split(/[,，\s]+/).filter(Boolean);
    const n = Math.max(1, Math.min(10000, Number(v.n) || 20));
    const S = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '陈', '刘', '林', '杨', '黄', '徐'];
    const G = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超'];
    const CITY = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '长沙'];
    const CO = ['星辰科技', '远山贸易', '青禾设计', '云舟网络', '南风文化', '木石数据', '白鹭传媒', '合川实业'];
    const WORDS = L.D.coca.slice(0, 400);
    const rnd = (a, b) => L.randInt(a, b);
    const gen = (f) => {
      switch (f) {
        case 'name': return L.pick(S) + L.pick(G);
        case 'phone': return '1' + L.pick(['3', '5', '7', '8', '9']) + String(rnd(0, 9)) + String(rnd(10000000, 99999999));
        case 'idcard': { const y = rnd(1970, 2005), m = L.pad(rnd(1, 12)), d = L.pad(rnd(1, 28)); const body = `110101${y}${m}${d}${L.pad(rnd(0, 999), 3)}`; const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]; const chk = '10X98765432'; return body + chk[body.split('').reduce((s, c, i) => s + Number(c) * w[i], 0) % 11]; }
        case 'bankcard': return '62' + String(rnd(100000000000000, 999999999999999));
        case 'carplate': return L.pick(['京', '沪', '粤', '浙', '苏', '川']) + String.fromCharCode(65 + rnd(0, 25)) + String(rnd(10000, 99999));
        case 'uscc': return '91' + String(rnd(1000000000000000, 9999999999999999));
        case 'email': return L.pick(WORDS) + rnd(1, 999) + '@' + L.pick(['qq.com', '163.com', 'gmail.com', 'outlook.com']);
        case 'city': return L.pick(CITY);
        case 'company': return L.pick(CITY) + L.pick(CO);
        case 'date': return `${rnd(2020, 2026)}-${L.pad(rnd(1, 12))}-${L.pad(rnd(1, 28))}`;
        case 'ip': return `${rnd(1, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
        case 'uuid': return L.uuid();
        case 'amount': return L.round(rnd(100, 999999) / 100, 2);
        case 'age': return rnd(18, 65);
        case 'word': return L.pick(WORDS);
        default: return f + '_' + rnd(1000, 9999);
      }
    };
    const rows = Array.from({ length: n }, () => Object.fromEntries(fields.map((f) => [f, gen(f)])));
    let out;
    if (v.fmt === 'JSON') out = JSON.stringify(rows, null, 2);
    else if (v.fmt === 'JSONL') out = rows.map((r) => JSON.stringify(r)).join('\n');
    else if (v.fmt === 'CSV') out = L.toCSV([fields, ...rows.map((r) => fields.map((f) => r[f]))]);
    else out = rows.map((r) => `INSERT INTO mock_data (${fields.join(', ')}) VALUES (${fields.map((f) => typeof r[f] === 'number' ? r[f] : `'${String(r[f]).replace(/'/g, "''")}'`).join(', ')});`).join('\n');
    return { text: out, stats: [{ label: '条数', value: n }, { label: '字段', value: fields.length }, { label: '字符', value: out.length }] };
  } };

S['llm-token'] = { kind: 'form', titleIn: '文本与模型', titleOut: 'Token 估算',
  fields: [{ id: 'txt', label: '提示词 / 文本', type: 'textarea', rows: 8, default: '请用中文解释一下什么是复利，举一个简单的例子。' },
    { id: 'model', label: '模型', type: 'select', options: ['GPT 系列（cl100k）', 'Claude 系列', '中文模型（按字数估）', '通用粗略估算'] },
    { id: 'ctx', label: '上下文窗口', type: 'number', default: 128000 }, { id: 'price', label: '每百万 token 单价 ¥', type: 'number', default: 7 }],
  primary: '复制报告', hintOut: '本地启发式估算：英文按 4 字符≈1 token、中文按 1.5 字≈1 token，标点和空白另计。不是官方分词器，仅供预算参考。',
  compute: (v) => {
    const t = String(v.txt || '');
    const cn = (t.match(/[\u3400-\u9fff]/g) || []).length;
    const en = t.replace(/[\u3400-\u9fff]/g, '').length;
    const factor = v.model.startsWith('Claude') ? 1.08 : v.model.startsWith('中文') ? 1 : v.model.startsWith('通用') ? 0.95 : 1;
    const est = Math.ceil((cn / 1.5 + en / 4) * factor);
    const ctx = Number(v.ctx) || 128000, price = Number(v.price) || 0;
    const lines = L.lines(t);
    return { text: `估算 token：${est}\n中文字符 ${cn} · 其它字符 ${en} · 行数 ${lines.length}\n上下文占用：${(est / ctx * 100).toFixed(2)}%（窗口 ${L.fmt(ctx, 0)}）\n剩余可用：${L.fmt(Math.max(0, ctx - est), 0)} token\n预估费用：¥${(est / 1e6 * price).toFixed(4)}（输入侧）\n\n分词切片（前 40 片，按词/字）：\n${(t.match(/[a-zA-Z]+|[\u3400-\u9fff]|\d+|[^\s]/g) || []).slice(0, 40).join(' | ')}`,
      stats: [{ label: '估算 token', value: L.fmt(est, 0) }, { label: '占用', value: (est / ctx * 100).toFixed(1) + '%' }, { label: '费用', value: '¥' + (est / 1e6 * price).toFixed(3) }] };
  } };

S['bandwidth-calc'] = { kind: 'form', titleIn: '带宽与文件', titleOut: '换算结果',
  fields: [{ id: 'mbps', label: '带宽', unit: 'Mbps', type: 'number', default: 100 },
    { id: 'size', label: '文件大小', unit: 'GB', type: 'number', default: 2.5 },
    { id: 'ratio', label: '实际能达到的比例', unit: '%', type: 'number', default: 80 }],
  primary: '复制结果', hintOut: '运营商说的是兆比特（Mb），下载软件常显示兆字节（MB），差 8 倍；这里按你填的达成比例算真实速度。',
  compute: (v) => {
    const m = Number(v.mbps), g = Number(v.size), r = Number(v.ratio) / 100;
    if (!m || g <= 0) return { error: '带宽与文件大小都要填正数' };
    const mb = m / 8 * r, sec = g * 1024 / mb;
    const human = sec < 60 ? `${Math.ceil(sec)} 秒` : sec < 3600 ? `${Math.round(sec / 60)} 分钟` : `${(sec / 3600).toFixed(1)} 小时`;
    const levels = [10, 30, 50, 100, 200, 500, 1000].map((x) => [x + ' Mbps', (x / 8).toFixed(1) + ' MB/s', (g * 1024 / (x / 8 * r) / 60).toFixed(1) + ' 分钟']);
    return { html: `<table class="t-table"><thead><tr><th>带宽档</th><th>理论速度</th><th>下完 ${g} GB</th></tr></thead><tbody>${levels.map((r2) => `<tr><td>${r2[0]}</td><td class="num">${r2[1]}</td><td class="num">${r2[2]}</td></tr>`).join('')}</tbody></table>`,
      text: '', copy: levels.map((x) => x.join('\t')).join('\n'), stats: [{ label: '实际速度', value: mb.toFixed(1) + ' MB/s' }, { label: '耗时', value: human }, { label: '1 GB', value: (1024 / mb).toFixed(0) + ' 秒' }] };
  } };

S['chmod-calc'] = { kind: 'form', titleIn: '权限', titleOut: '互转结果',
  fields: [{ id: 'num', label: '数字形式（如 755）', type: 'text', default: '755' },
    { id: 'sym', label: '符号形式（如 rwxr-xr-x / u+x,go-w）', type: 'text', default: '' }],
  primary: '复制数字权限', hintOut: '支持 3 位或 4 位（含 setuid/setgid/sticky），也可写 chmod 符号修改式，实时互转。',
  compute: (v) => {
    const bits = ['r', 'w', 'x'];
    const symOf = (n) => [6, 3, 0].map((s) => bits.map((b, i) => (n >> (s + (2 - i))) & 1 ? b : '-').join('')).join('');
    let n;
    if (v.sym && /^[rwx-]{9}$/.test(v.sym.trim())) {
      n = 0; const s = v.sym.trim();
      for (let i = 0; i < 9; i++) if (s[i] !== '-') n |= 1 << (8 - i);
    } else {
      const t = String(v.num || '').trim();
      if (!/^[0-7]{3,4}$/.test(t)) return { error: '填 3 位或 4 位八进制，或 9 位符号形式' };
      n = parseInt(t, 8);
    }
    const special = (n >> 9) & 7;
    const sym = symOf(n & 0o777);
    const sp = special & 4 ? sym.slice(0, 2) + (sym[2] === 'x' ? 's' : 'S') + sym.slice(3) : sym;
    const sp2 = special & 2 ? sp.slice(3, 5) + (sp[5] === 'x' ? 's' : 'S') + sp.slice(6) : sp;
    const sp3 = special & 1 ? sp2.slice(6, 8) + (sp2[8] === 'x' ? 't' : 'T') + sp2.slice(9) : sp2;
    const oct = (n & 0o777).toString(8).padStart(3, '0');
    return { text: `数字：${special ? (special.toString(8)) : ''}${oct}\n符号：${sp3}\n\n所有者：${sym.slice(0, 3)}　组：${sym.slice(3, 6)}　其它：${sym.slice(6, 9)}\nsetuid=${!!(special & 4)} setgid=${!!(special & 2)} sticky=${!!(special & 1)}\n\n命令：chmod ${oct} 文件名`,
      stats: [{ label: '数字', value: oct }, { label: '符号', value: sym }] };
  } };

S['snowflake'] = { kind: 'form', titleIn: '雪花 ID', titleOut: '反解结果',
  fields: [{ id: 'id', label: 'ID', type: 'text', default: '1759288472991006720' },
    { id: 'epoch', label: '自定义纪元（毫秒，0 用 Twitter 默认 1288834974657）', type: 'text', default: '0' },
    { id: 'wbits', label: '机器位', type: 'number', default: 10 }, { id: 'sbits', label: '序列位', type: 'number', default: 12 }],
  primary: '复制结果', hintOut: '按「时间戳 | 机器位 | 序列位」从低位往高位切；不同厂商的纪元与位宽不同，改参数即可对上。',
  compute: (v) => {
    let id; try { id = BigInt(String(v.id).trim()); } catch (e) { return { error: 'ID 应为十进制整数' }; }
    const W = BigInt(Math.max(0, Number(v.wbits) || 10)), S = BigInt(Math.max(0, Number(v.sbits) || 12));
    const seq = id & ((1n << S) - 1n);
    const worker = (id >> S) & ((1n << W) - 1n);
    const ts = id >> (S + W);
    const ep = Number(v.epoch) || 1288834974657;
    const ms = Number(ts) + ep;
    const date = new Date(ms);
    const bin = id.toString(2).padStart(64, '0');
    return { text: `时间戳段：${ts}（+纪元 ${ep} = ${ms}）\n北京时间：${isNaN(date) ? '超出范围' : date.toLocaleString('zh-CN')}\n工作机器：${worker}\n序列号：${seq}\n\n二进制（64 位）：\n${bin.match(/.{8}/g).join(' ')}`,
      stats: [{ label: '机器', value: String(worker) }, { label: '序列', value: String(seq) }, { label: '年份', value: isNaN(date) ? '—' : date.getFullYear() }] };
  } };

S['docker-run-compose'] = { kind: 'form', titleIn: 'docker run 命令', titleOut: 'compose.yml',
  fields: [{ id: 'cmd', label: '命令', type: 'textarea', rows: 6, default: 'docker run -d --name web -p 8080:80 -v ./data:/app/data -e TZ=Asia/Shanghai --restart unless-stopped nginx:latest' },
    { id: 'dir', label: '方向', type: 'select', options: ['run → compose', 'compose → run'] }],
  primary: '复制结果', hintOut: '解析 -p / -v / -e / --name / --restart / --network / 镜像与命令参数，反向也能拼回一条 docker run。',
  compute: (v) => {
    const t = String(v.cmd || '').trim();
    if (v.dir === 'run → compose') {
      const tok = t.replace(/^docker\s+run\s+/, '').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      const get = (flag) => { const out = []; for (let i = 0; i < tok.length; i++) if (tok[i] === flag && tok[i + 1]) out.push(tok[++i].replace(/^["']|["']$/g, '')); return out; };
      const name = get('--name')[0] || 'app';
      const ports = get('-p').concat(get('--publish'));
      const vols = get('-v').concat(get('--volume'));
      const envs = get('-e').concat(get('--env'));
      const restart = get('--restart')[0] || '';
      const net = get('--network')[0] || '';
      const labels = get('-l').concat(get('--label'));
      const flags = tok.filter((x) => x.startsWith('-'));
      const image = tok.filter((x, i) => !x.startsWith('-') && !(i > 0 && flags.includes(tok[i - 1]))).pop() || 'image:latest';
      const y = [`services:`, `  ${name}:`, `    image: ${image}`,
        ports.length ? `    ports:\n${ports.map((p) => `      - "${p}"`).join('\n')}` : '',
        vols.length ? `    volumes:\n${vols.map((p) => `      - ${p}`).join('\n')}` : '',
        envs.length ? `    environment:\n${envs.map((e) => { const i = e.indexOf('='); return i > 0 ? `      ${e.slice(0, i)}: "${e.slice(i + 1)}"` : `      - ${e}`; }).join('\n')}` : '',
        net ? `    networks:\n      - ${net}` : '', restart ? `    restart: ${restart}` : '',
        labels.length ? `    labels:\n${labels.map((l) => `      - "${l}"`).join('\n')}` : '',
        tok.includes('-d') || tok.includes('--detach') ? '' : ''].filter(Boolean).join('\n');
      return { text: y, stats: [{ label: '端口', value: ports.length }, { label: '卷', value: vols.length }, { label: '环境变量', value: envs.length }] };
    }
    const lines = L.lines(t); let svc = '', img = '', ports = [], envs = [], vols = [], restart = '';
    for (const l of lines) {
      const s = l.trim();
      if (/^[\w-]+:$/.test(s) && l.startsWith('  ') && !l.startsWith('    ')) svc = s.slice(0, -1);
      if (/^image:/.test(s)) img = s.slice(6).trim();
      if (/^restart:/.test(s)) restart = s.slice(8).trim();
      const p = s.match(/^-\s*"?([\d.]+:\d+:\d+|\d+:\d+)"?$/); if (p && ports.length >= 0) ports.push(p[1]);
      const e = s.match(/^-\s*"?(\w+=[^"]+)"?$/); if (e) envs.push(e[1]);
      const vo = s.match(/^-\s*([\w./\-]+:[\w./\-]+)$/); if (vo) vols.push(vo[1]);
    }
    const cmd = ['docker run -d', svc ? `--name ${svc}` : '', ...ports.map((p) => `-p ${p}`), ...vols.map((x) => `-v ${x}`), ...envs.map((x) => `-e ${x}`), restart ? `--restart ${restart}` : '', img].filter(Boolean).join(' ');
    return { text: cmd, stats: [{ label: '服务', value: svc || '—' }, { label: '镜像', value: img || '—' }] };
  } };

S['gitignore'] = { kind: 'form', titleIn: '勾选模板', titleOut: '.gitignore',
  fields: [
    { id: 'common', label: '通用系统 / 编辑器 / 密钥', type: 'checkbox', default: true },
    { id: 'node', label: 'Node / 前端', type: 'checkbox', default: false },
    { id: 'python', label: 'Python', type: 'checkbox', default: false },
    { id: 'java', label: 'Java / Maven / Gradle', type: 'checkbox', default: false },
    { id: 'go', label: 'Go', type: 'checkbox', default: false },
    { id: 'web', label: '前端构建产物', type: 'checkbox', default: false },
    { id: 'c', label: 'C / C++', type: 'checkbox', default: false },
    { id: 'unity', label: 'Unity', type: 'checkbox', default: false },
    { id: 'extra', label: '额外规则（每行一条）', type: 'textarea', rows: 3, default: '' },
    { id: 'dedup', label: '合并去重、去掉空行', type: 'checkbox', default: true },
  ], primary: '复制 .gitignore', hintOut: '自动合并去重，注释行保留；生成的规则只写进文本框，不会动你的项目。',
  compute: (v, ctx) => {
    const keys = ['common', 'node', 'python', 'java', 'go', 'web', 'c', 'unity'];
    let lines = [];
    for (const k of keys) if (v[k]) lines.push(...L.lines(L.D.gitignore[k]));
    if (v.extra) lines.push(...L.nonEmptyLines(v.extra));
    if (v.dedup) lines = [...new Set(lines.map((x) => x.trim()).filter(Boolean))];
    const text = lines.join('\n') + '\n';
    return { text, stats: [{ label: '规则', value: lines.filter((x) => x && !x.startsWith('#')).length }, { label: '模板', value: keys.filter((k) => v[k]).length }],
      actions: [{ label: '下载文件', run: (vv, c) => c.download('.gitignore', c.root.querySelector('[data-out]').textContent, 'text/plain;charset=utf-8') }] };
  } };
