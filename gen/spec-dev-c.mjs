// 加密 / 证书 / 可视化 / 时钟 / 画板
export const S = {};

/* ---------- TOTP 与 Authenticator（b32 / hotp / totpNow / pb* / otpUri 由 engines.js 提供） ---------- */
S['totp'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>账号密钥</h2><span class="hint">本地保存，不上传</span></div>
    <div class="t-field"><label class="t-label">账号名</label><input class="t-input" id="name" placeholder="例如 GitHub"></div>
    <div class="t-field"><label class="t-label">Base32 密钥</label><input class="t-input" id="key" placeholder="JBSWY3DPEHPK3PXP"></div>
    <div class="t-actions"><button class="t-btn" type="button" id="add">添加 / 更新</button></div>
    <p class="t-hint">兼容 Google Authenticator 的 SHA-1 / 30 秒 / 6 位默认参数。密钥保存在这个浏览器的 localStorage 里。</p>
  </section><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">2</span>动态口令</h2><span class="hint" id="clock">—</span></div>
    <div id="list" class="t-out html"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const KEY = 'toolbox-totp';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (a) => localStorage.setItem(KEY, JSON.stringify(a));
  const draw = async () => {
    const items = load(); const now = Date.now();
    $('#clock').textContent = new Date().toLocaleTimeString('zh-CN');
    if (!items.length) { $('#list').innerHTML = '<p class="t-hint">还没有账号。左边填一个 Base32 密钥试试，或者用「示例密钥」按钮。</p>'; return; }
    const rows = [];
    for (const it of items) {
      try { const r = await totpNow(b32(it.key)); rows.push(`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line-2);flex-wrap:wrap">
        <div style="flex:1;min-width:120px"><b>${L.esc(it.name)}</b><div class="t-hint" style="margin:2px 0 0">每 30 秒更新 · 还剩 ${r.left}s</div></div>
        <div style="font-size:25px;font-weight:700;letter-spacing:.12em;font-variant-numeric:tabular-nums">${L.esc(r.code)}</div>
        <button class="t-btn" type="button" data-cp="${L.esc(r.code)}">复制</button><button class="t-btn" type="button" data-rm="${L.esc(it.name)}">删除</button>
        <div style="width:100%;height:4px;background:var(--paper);border-radius:3px"><div style="height:100%;width:${r.left / 30 * 100}%;background:var(--accent);border-radius:3px"></div></div></div>`); }
      catch (e) { rows.push(`<p class="t-hint" style="color:#a63d34">${L.esc(it.name)}：${L.esc(e.message)}</p>`); }
    }
    $('#list').innerHTML = rows.join('');
  };
  $('#add').onclick = () => { const n = $('#name').value.trim(), k = $('#key').value.trim(); if (!n || !k) return K.toast('账号名和密钥都要填'); try { b32(k); } catch (e) { return K.toast(e.message); } const a = load().filter((x) => x.name !== n); a.push({ name: n, key: k }); save(a); $('#key').value = ''; draw(); };
  $('#list').onclick = (e) => { const cp = e.target.closest('[data-cp]'); if (cp) return K.copy(cp.dataset.cp); const rm = e.target.closest('[data-rm]'); if (rm) { save(load().filter((x) => x.name !== rm.dataset.rm)); draw(); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) draw(); });
  K.setAction('刷新口令', draw);
  draw(); setInterval(draw, 1000);
} };

S['ga-import'] = { kind: 'form', titleIn: '密钥列表', titleOut: '迁移二维码',
  fields: [{ id: 'rows', label: '每行：名称|Base32密钥|发行方（可省）', type: 'textarea', rows: 6, default: 'GitHub|JBSWY3DPEHPK3PXP|GitHub\nGoogle|JBSWY3DPEHPK3PXP|Google' },
    { id: 'batch', label: '每批几个账号（多了会自动分张）', type: 'number', default: 10 }],
  primary: '复制 otpauth URI', hintOut: '生成 Google Authenticator「导出账号」格式的迁移二维码，用手机上的 Authenticator 扫一下即可批量导入。二维码用本地库绘制，不联网。',
  compute: async (v) => {
    const items = L.nonEmptyLines(v.rows || '').map((l) => l.split('|').map((x) => x.trim())).filter((r) => r[0] && r[1]);
    if (!items.length) return { error: '至少填一行 名称|密钥' };
    const per = Math.max(1, Math.min(20, Number(v.batch) || 10));
    const groups = []; for (let i = 0; i < items.length; i += per) groups.push(items.slice(i, i + per));
    const qrc = await vendor('qr');
    const svgs = groups.map((g, gi) => {
      let payload = [];
      g.forEach((r) => {
        const secretBytes = b32(r[1]);
        let p = [];
        p.push(...pbLen(1, Array.from(secretBytes)));
        p.push(...pbLen(2, Array.from(L.utf8(r[0]))));
        p.push(...pbLen(3, Array.from(L.utf8(r[2] || r[0]))));
        p.push(...pbNum(4, 1)); p.push(...pbNum(5, 1)); p.push(...pbNum(6, 2));
        payload.push(...pbLen(1, p));
      });
      payload.push(...pbNum(2, 1), ...pbNum(3, g.length), ...pbNum(4, 1), ...pbNum(5, g.length));
      const uri = 'otpauth-migration://offline?data=' + encodeURIComponent(L.bytesToB64(new Uint8Array(payload)));
      const q = qrc(0, 'M'); q.addData(uri); q.make();
      return `<div style="margin:8px 0"><p class="t-hint">第 ${gi + 1} 张 · ${g.length} 个账号</p><div style="background:#fff;padding:10px;display:inline-block">${q.createSvgTag(3, 0).replace(/<svg/, '<svg style="width:210px;height:210px"')}</div></div>`;
    }).join('');
    const uris = items.map((r) => otpUri(r[1], r[0], r[2] || r[0])).join('\n');
    return { preview: svgs, copy: uris, text: '', stats: [{ label: '账号', value: items.length }, { label: '二维码', value: groups.length }] };
  } };

S['ga-migrate'] = { kind: 'form', titleIn: '迁移内容', titleOut: '解出的密钥',
  fields: [{ id: 'uri', label: '粘贴 otpauth-migration://offline?data=... （或只粘 data= 后面那段）', type: 'textarea', rows: 6, default: '' }],
  primary: '复制全部 otpauth URI', hintOut: '把「导出账号」二维码用任意扫码工具解成文本粘进来即可；本工具不会调用摄像头，也不会把密钥发出去。',
  compute: (v) => {
    const t = String(v.uri || '').trim(); if (!t) return { text: '先粘迁移链接。' };
    let b64 = t.includes('data=') ? decodeURIComponent(t.split('data=')[1].split('&')[0]) : t.replace(/^otpauth-migration:\/\/offline\?/, '');
    let b; try { b = L.b64ToBytes(b64); } catch (e) { return { error: 'Base64 解不开：' + e.message }; }
    const top = pbDecode(b);
    const items = [];
    for (const f of top.filter((x) => x.field === 1 && Array.isArray(x.val))) {
      const p = f.val; const secret = p.find((x) => x.field === 1)?.val || 'bytes';
      const name = p.find((x) => x.field === 2)?.val || '账号';
      const issuer = p.find((x) => x.field === 3)?.val || '';
      const hex = p.find((x) => x.field === 1)?.hex || '';
      const bytes = hex ? L.hexToBytes(hex.replace(/\s/g, '')) : new Uint8Array();
      const sec = (() => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', out = ''; for (const x of bytes) bits += x.toString(2).padStart(8, '0'); for (let i = 0; i + 5 <= bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5), 2)]; return out; })();
      items.push({ name: JSON.parse(name), issuer: JSON.parse(issuer), secret: sec });
    }
    if (!items.length) return { error: '没解出 otp_parameters，确认粘的是完整的迁移链接' };
    const uris = items.map((x) => otpUri(x.secret, x.name, x.issuer || x.name)).join('\n');
    return { html: `<table class="t-table"><thead><tr><th>账号</th><th>发行方</th><th>Base32 密钥</th></tr></thead><tbody>${items.map((x) => `<tr><td>${L.esc(x.name)}</td><td>${L.esc(x.issuer)}</td><td class="num">${L.esc(x.secret)}</td></tr>`).join('')}</tbody></table>`,
      copy: uris, text: '', stats: [{ label: '账号', value: items.length }] };
  } };

S['totp-debug'] = { kind: 'form', titleIn: '调试参数', titleOut: '出码结果',
  fields: [{ id: 'key', label: 'Base32 密钥', type: 'text', default: 'JBSWY3DPEHPK3PXP' },
    { id: 'mode', label: '模式', type: 'select', options: ['TOTP（当前时间）', 'TOTP（指定时间戳）', 'HOTP（计数器）'] },
    { id: 'ts', label: '时间戳（秒）/ HOTP 计数器', type: 'text', default: '1700000000' },
    { id: 'step', label: '时间窗（秒）', type: 'number', default: 30 }, { id: 'digits', label: '位数', type: 'number', default: 6 },
    { id: 'code', label: '反查：某个验证码属于第几个时间窗（可选）', type: 'text', default: '' }],
  primary: '复制结果', hintOut: '可指定时间戳出码、模拟时钟偏移、切 HOTP 计数器；反查会在前后若干个时间窗里找匹配的码。',
  compute: async (v) => {
    let k; try { k = b32(v.key); } catch (e) { return { error: e.message }; }
    const digits = L.clamp(Number(v.digits) || 6, 4, 10), step = L.clamp(Number(v.step) || 30, 1, 3600);
    const at = v.mode === 'TOTP（当前时间）' ? Date.now() : (Number(v.ts) || 0) * 1000;
    let code, counter;
    if (v.mode === 'HOTP（计数器）') { counter = Number(v.ts) || 0; code = await hotp(k, counter, digits); }
    else { const r = await totpNow(k, step, digits, at); code = r.code; counter = r.c; }
    let reverse = '';
    if (v.code) { const hits = []; for (let c = counter - 60; c <= counter + 60; c++) if (await hotp(k, c, digits) === String(v.code).trim()) hits.push(c); reverse = `反查「${v.code}」：命中时间窗 ${hits.slice(0, 12).join(', ') || '前后 120 个窗口内没有'} （当前窗 ${counter}）`; }
    return { text: `验证码：${code}\n计数器 / 时间窗：${counter}\n时间：${new Date(at).toLocaleString('zh-CN')}\n参数：SHA-1 / ${step}s / ${digits} 位\n${reverse}`,
      stats: [{ label: '当前码', value: code }, { label: '时间窗', value: counter }] };
  } };

/* ---------- 加解密 ---------- */
S['aes-crypt'] = { kind: 'form', titleIn: '明文 / 密文', titleOut: '结果', wide: false,
  fields: [{ id: 'txt', label: '文本', type: 'textarea', rows: 5, default: '这是一段需要加密的文字' },
    { id: 'key', label: '密钥（任意长度，会 SHA-256 派生成 256 位）', type: 'text', default: 'my-secret' },
    { id: 'mode', label: '模式', type: 'select', options: ['AES-GCM', 'AES-CBC', 'AES-CTR'] },
    { id: 'dir', label: '方向', type: 'select', options: ['加密', '解密'] },
    { id: 'fmt', label: '密文格式', type: 'select', options: ['Base64', 'HEX'] }],
  primary: '复制结果', hintOut: 'WebCrypto 原生实现；GCM 带认证标签，CBC/CTR 用 PKCS7 填充。密文头部含随机 IV/盐，同样的明文每次结果都不同。ECB 模式不安全，浏览器也不提供，故不做。',
  compute: async (v) => {
    const enc = new TextEncoder();
    const keyBuf = await crypto.subtle.digest('SHA-256', enc.encode(v.key || 'key'));
    const baseKey = await crypto.subtle.importKey('raw', keyBuf, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const parse = (s) => v.fmt === 'HEX' ? L.hexToBytes(s) : L.b64ToBytes(s);
    if (v.dir === '加密') {
      const iv = L.randBytes(v.mode === 'AES-GCM' ? 12 : 16);
      const alg = { name: v.mode, iv };
      const key = await crypto.subtle.importKey('raw', keyBuf, v.mode, false, ['encrypt']);
      const ct = new Uint8Array(await crypto.subtle.encrypt(alg, key, enc.encode(v.txt || '')));
      const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
      return { text: v.fmt === 'HEX' ? L.bytesToHex(out) : L.bytesToB64(out), stats: [{ label: '模式', value: v.mode }, { label: 'IV', value: iv.length + 'B' }, { label: '长度', value: out.length }] };
    }
    let all; try { all = parse(String(v.txt || '').trim()); } catch (e) { return { error: e.message }; }
    const ivLen = v.mode === 'AES-GCM' ? 12 : 16;
    if (all.length <= ivLen) return { error: '密文太短' };
    const iv = all.slice(0, ivLen), ct = all.slice(ivLen);
    try {
      const key = await crypto.subtle.importKey('raw', keyBuf, v.mode, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name: v.mode, iv }, key, ct);
      return { text: new TextDecoder().decode(plain), stats: [{ label: '模式', value: v.mode }, { label: '解密', value: '成功' }] };
    } catch (e) { return { error: '解密失败：密钥不对、模式选错或密文被改动' }; }
  } };

S['rsa-crypt'] = { kind: 'form', titleIn: '文本 / 密钥', titleOut: '结果', wide: false,
  fields: [{ id: 'txt', label: '文本 / 密文（Base64）', type: 'textarea', rows: 4, default: '你好 RSA' },
    { id: 'pem', label: 'PEM 密钥（留空则自动生成一对 2048 位密钥）', type: 'textarea', rows: 4, default: '' },
    { id: 'op', label: '操作', type: 'select', options: ['生成密钥对', '公钥加密 → 私钥解密', '私钥签名 → 公钥验签'] },
    { id: 'hash', label: '签名哈希', type: 'select', options: ['SHA-256', 'SHA-1', 'SHA-512'] }],
  primary: '复制结果', hintOut: 'WebCrypto 原生 RSA-OAEP / RSASSA-PKCS1-v1_5；PEM 支持 PKCS8 私钥与 SPKI 公钥。密钥只在本地生成，不上传。',
  compute: async (v) => {
    const pem2buf = (s) => L.b64ToBytes(s.replace(/-----[^-]+-----|\s/g, ''));
    if (v.op === '生成密钥对') {
      const kp = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
      const pub = await crypto.subtle.exportKey('spki', kp.publicKey), pri = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
      const wrap = (b, label) => `-----BEGIN ${label}-----\n${L.bytesToB64(b).match(/.{1,64}/g).join('\n')}\n-----END ${label}-----\n`;
      return { text: wrap(pub, 'PUBLIC KEY') + '\n' + wrap(pri, 'PRIVATE KEY'), stats: [{ label: '位数', value: '2048' }, { label: '用途', value: '加解密' }] };
    }
    if (v.op === '公钥加密 → 私钥解密') {
      if (v.pem.trim()) {
        const isPriv = v.pem.includes('PRIVATE');
        const key = await crypto.subtle.importKey(isPriv ? 'pkcs8' : 'spki', pem2buf(v.pem), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [isPriv ? 'decrypt' : 'encrypt']);
        if (isPriv) { const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, L.b64ToBytes(v.txt.trim())); return { text: new TextDecoder().decode(plain) }; }
        const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(v.txt)); return { text: L.bytesToB64(new Uint8Array(ct)) };
      }
      const kp = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
      const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, kp.publicKey, new TextEncoder().encode(v.txt));
      const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, kp.privateKey, ct);
      return { text: `自测通过：\n密文 Base64：${L.bytesToB64(new Uint8Array(ct)).slice(0, 120)}…\n解密还原：${new TextDecoder().decode(plain)}\n\n（想 persistent 使用，请填自己的 PEM 密钥）`, stats: [{ label: '结果', value: '自测通过' }] };
    }
    const h = v.hash || 'SHA-256';
    const alg = { name: 'RSASSA-PKCS1-v1_5', hash: h, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };
    let kp;
    if (v.pem.trim()) {
      const isPriv = v.pem.includes('PRIVATE');
      kp = { privateKey: isPriv ? await crypto.subtle.importKey('pkcs8', pem2buf(v.pem), { name: 'RSASSA-PKCS1-v1_5', hash: h }, true, ['sign']) : null,
        publicKey: !isPriv ? await crypto.subtle.importKey('spki', pem2buf(v.pem), { name: 'RSASSA-PKCS1-v1_5', hash: h }, true, ['verify']) : null };
      if (!kp.privateKey || !kp.publicKey) return { error: '签名需要私钥、验签需要公钥，用「生成密钥对」拿一对再分别填' };
    } else kp = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(v.txt)));
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', kp.publicKey, sig, new TextEncoder().encode(v.txt));
    return { text: `签名（Base64）：\n${L.bytesToB64(sig)}\n\n验签结果：${ok ? '通过 ✓' : '不通过'}`, stats: [{ label: '哈希', value: h }, { label: '验签', value: ok ? '通过' : '失败' }] };
  } };

S['sm-crypt'] = { kind: 'form', titleIn: '国密输入', titleOut: '结果', wide: false,
  fields: [{ id: 'txt', label: '文本 / 密文 HEX', type: 'textarea', rows: 5, default: '国密测试 123' },
    { id: 'key', label: 'SM4 密钥（16 字节，不足补零 / 过长截取）', type: 'text', default: '0123456789abcde' },
    { id: 'op', label: '操作', type: 'select', options: ['SM3 摘要', 'SM3 HMAC（简化）', 'SM4 加密（ECB + PKCS7）', 'SM4 解密'] }],
  primary: '复制结果', hintOut: 'SM3 与 SM4 用纯 JS 本地实现（GB/T 标准算法），ECB 模式仅用于教学与兼容旧系统；真实业务请用 CBC/GCM 并注意 IV 管理。',
  compute: (v) => {
    const key = new Uint8Array(16); const kb = L.utf8(v.key || ''); key.set(kb.slice(0, 16));
    try {
      if (v.op === 'SM3 摘要') return { text: L.sm3(v.txt || ''), stats: [{ label: '算法', value: 'SM3' }, { label: '长度', value: '256 bit' }] };
      if (v.op === 'SM3 HMAC（简化）') { const k = Array.from(key); const inner = new Uint8Array(64 + L.utf8(v.txt).length); inner.fill(0x36, 0, 64); inner.set(L.utf8(v.txt), 64); k.forEach((x, i) => inner[i] ^= x); const outer = new Uint8Array(64 + 32); outer.fill(0x5c, 0, 64); const ih = L.hexToBytes(L.sm3(inner)); outer.set(ih, 64); k.forEach((x, i) => outer[i] ^= x); return { text: L.sm3(outer), stats: [{ label: '算法', value: 'HMAC-SM3' }] }; }
      if (v.op === 'SM4 加密（ECB + PKCS7）') { const out = L.sm4Crypt(L.utf8(v.txt || ''), key, true); return { text: L.bytesToHex(out), stats: [{ label: '分组', value: out.length / 16 }, { label: '模式', value: 'ECB' }] }; }
      const b = L.hexToBytes(String(v.txt || '').trim()); const out = L.sm4Crypt(b, key, false);
      return { text: L.fromUtf8(out), stats: [{ label: '解密', value: '成功' }] };
    } catch (e) { return { error: e.message }; }
  } };

S['cert-decode'] = { kind: 'form', titleIn: 'PEM / DER', titleOut: '证书内容', wide: false,
  fields: [{ id: 'pem', label: '粘贴 PEM（-----BEGIN CERTIFICATE-----）或 CSR / 公钥', type: 'textarea', rows: 8, default: '' }],
  primary: '复制报告', hintOut: '本地解析 ASN.1 DER：版本、序列号、签名算法、签发者、主体、有效期、公钥算法与 SAN；指纹用 SHA-256 / SHA-1 本地算。',
  compute: async (v) => {
    const t = String(v.pem || '').trim(); if (!t) return { text: '粘一段 PEM 证书进来。' };
    let der;
    try { der = L.b64ToBytes(t.replace(/-----[^-]+-----|\s/g, '')); }
    catch (e) { return { error: 'Base64 解不开：' + e.message }; }
    const fp = async (alg) => L.bytesToHex(await crypto.subtle.digest(alg, der)).toUpperCase();
    const OIDs = { '1.2.840.113549.1.1.1': 'RSA', '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption', '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption', '1.2.840.10045.2.1': 'EC', '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256', '2.5.4.3': 'CN 通用名', '2.5.4.6': 'C 国家', '2.5.4.8': 'ST 省份', '2.5.4.7': 'L 城市', '2.5.4.10': 'O 组织', '2.5.4.11': 'OU 部门', '2.5.29.17': 'subjectAltName SAN', '2.5.29.19': 'basicConstraints', '2.5.29.15': 'keyUsage', '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption' };
    const oid = (b, p, len) => { if (!len || p + len > b.length) return ''; const a = []; let first = b[p]; a.push(Math.floor(first / 40), first % 40); let n = 0n; for (let i = 1; i < len; i++) { n = (n << 7n) | BigInt(b[p + i] & 0x7f); if (!(b[p + i] & 0x80)) { a.push(Number(n)); n = 0n; } } return a.join('.'); };
    const tlv = (b, p) => {
      if (p + 2 > b.length) return null;
      const tag = b[p++]; let len = b[p++];
      if (len & 0x80) { const n = len & 0x7f; len = 0; for (let i = 0; i < n; i++) len = (len << 8) | b[p++]; }
      return { tag, len, start: p, end: Math.min(b.length, p + len) };
    };
    const strings = []; const oids = []; let serial = '', dates = [];
    const walk = (p, end, depth = 0) => {
      if (depth > 12) return;
      while (p < end) {
        const n = tlv(der, p); if (!n || n.end <= p) break;
        if (n.tag === 0x06) { const o = oid(der, n.start, n.len); if (o) oids.push(OIDs[o] || o); }
        if ([0x0c, 0x13, 0x16, 0x17, 0x18, 0x14, 0x1a].includes(n.tag)) { const s = L.fromUtf8(der.slice(n.start, n.end)).trim(); if (s && /^[\x20-\x7e\u4e00-\u9fff.:/@_-]+$/.test(s)) strings.push(s); }
        if (n.tag === 0x17 || n.tag === 0x18) { const s = L.fromUtf8(der.slice(n.start, n.end)); if (/^\d{10,14}Z?$/.test(s)) dates.push(s); }
        if (n.tag === 0x02 && !serial) serial = L.bytesToHex(der.slice(n.start, n.end)).toUpperCase();
        if (n.tag === 0x30 || n.tag === 0x31) walk(n.start, n.end, depth + 1);
        p = n.end;
      }
    };
    walk(0, der.length);
    const dns = strings.filter((s) => /^[a-z0-9.*-]+\.[a-z]{2,}$/i.test(s) || s.includes('@'));
    return { text: [`解析到 ${strings.length} 个字符串、${oids.length} 个 OID`, `序列号：${serial || '—'}`, `有效期字段：${dates.join(' / ') || '—'}`,
      `算法 / 用途：${[...new Set(oids)].slice(0, 14).join('、') || '—'}`, `SAN / 域名：${[...new Set(dns)].slice(0, 20).join(', ') || '—'}`,
      `主体相关字符串：${[...new Set(strings)].slice(0, 24).join(' | ')}`, '',
      `SHA-256 指纹：${await fp('SHA-256')}`, `SHA-1 指纹：${await fp('SHA-1')}`, '',
      '说明：这是按 ASN.1 结构做的轻量解析，能读出主要字段，不替代 openssl x509 -text。'].join('\n'),
      stats: [{ label: 'DER 字节', value: der.length }, { label: 'OID', value: oids.length }, { label: 'SAN', value: dns.length }] };
  } };

S['jwt-sign'] = { kind: 'form', titleIn: '载荷与密钥', titleOut: 'Token', wide: false,
  fields: [{ id: 'head', label: 'Header JSON', type: 'textarea', rows: 3, default: '{"alg":"HS256","typ":"JWT"}' },
    { id: 'pl', label: 'Payload JSON', type: 'textarea', rows: 5, default: '{"sub":"1234567890","name":"小明","iat":1700000000,"exp":1900000000}' },
    { id: 'key', label: '密钥（HS*）或 PEM 私钥（RS*）', type: 'textarea', rows: 4, default: 'my-secret' },
    { id: 'alg', label: '算法', type: 'select', options: ['HS256', 'HS384', 'HS512', 'RS256'] }],
  primary: '复制 Token', hintOut: 'HS 系列用 HMAC，RS256 用 RSASSA-PKCS1-v1_5 + PEM PKCS8 私钥；全部在 WebCrypto 本地签名，密钥不离开设备。',
  compute: async (v) => {
    const b64u = (b) => L.bytesToB64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    let h, p; try { h = JSON.parse(v.head); p = JSON.parse(v.pl); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const hs = v.alg.startsWith('HS');
    h.alg = v.alg; if (!h.typ) h.typ = 'JWT';
    const signingInput = b64u(L.utf8(JSON.stringify(h))) + '.' + b64u(L.utf8(JSON.stringify(p)));
    let sig;
    try {
      if (hs) {
        const hash = 'SHA-' + v.alg.slice(2);
        const k = await crypto.subtle.importKey('raw', L.utf8(v.key || 'key'), { name: 'HMAC', hash }, false, ['sign']);
        sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, L.utf8(signingInput)));
      } else {
        const pem = L.b64ToBytes(String(v.key || '').replace(/-----[^-]+-----|\s/g, ''));
        const k = await crypto.subtle.importKey('pkcs8', pem, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
        sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, L.utf8(signingInput)));
      }
    } catch (e) { return { error: '签名失败：' + e.message + '（RS256 需要 PKCS8 私钥）' }; }
    const token = signingInput + '.' + b64u(sig);
    return { text: token, stats: [{ label: '算法', value: v.alg }, { label: '长度', value: token.length }] };
  } };

S['jwt-verify'] = { kind: 'form', titleIn: 'Token 与密钥', titleOut: '验签结果', wide: false,
  fields: [{ id: 'token', label: 'JWT', type: 'textarea', rows: 5, default: '' },
    { id: 'key', label: 'HMAC 密钥 / PEM 公钥（RS256）', type: 'textarea', rows: 3, default: 'my-secret' },
    { id: 'check', label: '检查 exp / nbf 时效', type: 'checkbox', default: true }],
  primary: '复制报告', hintOut: '按 header 里的 alg 自动选 HMAC 或 RSA；会检查签名、exp 过期、nbf 未生效、iat 与 iss/aud 声明。',
  compute: async (v) => {
    const t = String(v.token || '').trim(); if (!t) return { text: '先粘一个 JWT。' };
    const parts = t.split('.'); if (parts.length !== 3) return { error: 'JWT 应为三段' };
    const u2b = (s) => L.b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/'));
    let h; try { h = JSON.parse(L.fromUtf8(u2b(parts[0]))); } catch (e) { return { error: '头部解析失败' }; }
    const alg = h.alg || 'HS256'; let ok = false;
    try {
      if (alg.startsWith('HS')) {
        const k = await crypto.subtle.importKey('raw', L.utf8(v.key || ''), { name: 'HMAC', hash: 'SHA-' + alg.slice(2) }, false, ['verify']);
        ok = await crypto.subtle.verify('HMAC', k, u2b(parts[2]), L.utf8(parts[0] + '.' + parts[1]));
      } else if (alg === 'RS256') {
        const pem = L.b64ToBytes(String(v.key || '').replace(/-----[^-]+-----|\s/g, ''));
        const k = await crypto.subtle.importKey('spki', pem, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
        ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, u2b(parts[2]), L.utf8(parts[0] + '.' + parts[1]));
      } else return { error: '暂不支持算法 ' + alg };
    } catch (e) { return { error: '验签失败：' + e.message }; }
    let pl = {}; try { pl = JSON.parse(L.fromUtf8(u2b(parts[1]))); } catch (e) {}
    const now = Math.floor(Date.now() / 1000);
    const time = [];
    if (v.check) {
      if (pl.exp) time.push(`exp ${new Date(pl.exp * 1000).toLocaleString('zh-CN')} → ${pl.exp < now ? '已过期' : '未过期'}`);
      if (pl.nbf) time.push(`nbf ${new Date(pl.nbf * 1000).toLocaleString('zh-CN')} → ${pl.nbf > now ? '尚未生效' : '已生效'}`);
      if (pl.iat) time.push(`iat ${new Date(pl.iat * 1000).toLocaleString('zh-CN')}`);
    }
    return { text: `算法：${alg}\n签名：${ok ? '验证通过 ✓' : '验证不通过 ✗（密钥不对或内容被改）'}\n${time.join('\n')}\n声明：${Object.keys(pl).join(', ') || '—'}`,
      stats: [{ label: '签名', value: ok ? '通过' : '不通过' }, { label: '算法', value: alg }, { label: '声明', value: Object.keys(pl).length }] };
  } };

S['protobuf-decoder'] = { kind: 'form', titleIn: 'HEX / Base64', titleOut: '字段结构',
  fields: [{ id: 'txt', label: 'protobuf 二进制', type: 'textarea', rows: 5, default: '0a 05 68 65 6c 6c 6f 10 2a 1a 03 61 62 63' },
    { id: 'fmt', label: '输入格式', type: 'select', options: ['HEX（可带空格）', 'Base64'] }],
  primary: '复制结果', hintOut: '无 schema 也能按 wire type 拆出 tag / varint / 长度分隔字段；长度字段会尝试当字符串或嵌套消息递归解析。',
  compute: (v) => {
    let b; try { b = v.fmt === 'Base64' ? L.b64ToBytes(String(v.txt || '').trim()) : L.hexToBytes(v.txt); } catch (e) { return { error: e.message }; }
    const fields = pbDecode(b);
    const flat = (arr, ind = '') => arr.map((f) => {
      let val = Array.isArray(f.val) ? '\n' + flat(f.val, ind + '  ') : String(f.val);
      return `${ind}#${f.field} (wire ${f.wt}) = ${val}${f.hex ? `  [${f.hex}]` : ''}`;
    }).join('\n');
    const wtName = { 0: 'varint', 1: '64bit', 2: 'length-delimited', 5: '32bit' };
    return { html: `<table class="t-table"><thead><tr><th>字段号</th><th>Wire</th><th>值</th><th>原始字节</th></tr></thead><tbody>${fields.map((f) => `<tr><td class="num">${f.field}</td><td>${wtName[f.wt] || f.wt}</td><td style="word-break:break-all">${L.esc(Array.isArray(f.val) ? `嵌套 ${f.val.length} 个字段` : String(f.val))}</td><td style="font-size:11px">${L.esc(f.hex)}</td></tr>`).join('')}</tbody></table>`,
      copy: flat(fields), stats: [{ label: '字节', value: b.length }, { label: '顶层字段', value: fields.length }] };
  } };

S['bson-format'] = { kind: 'form', titleIn: 'mongosh / EJSON / BSON', titleOut: '结果',
  fields: [{ id: 'txt', label: '输入', type: 'textarea', rows: 8, default: '{ _id: ObjectId("507f1f77bcf86cd799439011"), name: "小明", created: ISODate("2020-01-01T00:00:00Z"), count: NumberLong("42") }' },
    { id: 'mode', label: '模式', type: 'select', options: ['EJSON / mongosh → 标准 JSON', 'JSON → EJSON', 'ObjectId 提时间戳', '二进制 BSON HEX → 文档'] }],
  primary: '复制结果', hintOut: '解析 mongosh 打印格式（ObjectId / ISODate / NumberLong / NumberInt / Decimal128）与二进制 BSON；ObjectId 前 4 字节是秒级时间戳。',
  compute: (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    if (v.mode === 'ObjectId 提时间戳') {
      const ids = t.match(/[0-9a-f]{24}/gi) || [];
      return { text: ids.map((id) => `${id} → ${new Date(parseInt(id.slice(0, 8), 16) * 1000).toLocaleString('zh-CN')}`).join('\n') || '没找到 24 位十六进制 ObjectId', stats: [{ label: 'ObjectId', value: ids.length }] };
    }
    if (v.mode === '二进制 BSON HEX → 文档') {
      let b; try { b = L.hexToBytes(t); } catch (e) { return { error: e.message }; }
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      const out = []; let p = 4;
      const rdCstr = () => { const e = b.indexOf(0, p); const s = L.fromUtf8(b.slice(p, e)); p = e + 1; return s; };
      while (p < b.length - 1) {
        const typ = b[p++]; const name = rdCstr(); let val;
        try {
          if (typ === 0x01) { val = dv.getFloat64(p, true); p += 8; }
          else if (typ === 0x02) { const n = dv.getInt32(p, true); p += 4; val = L.fromUtf8(b.slice(p, p + n - 1)); p += n; }
          else if (typ === 0x07) { val = 'ObjectId(' + L.bytesToHex(b.slice(p, p + 12)) + ')'; p += 12; }
          else if (typ === 0x08) { val = !!b[p++]; }
          else if (typ === 0x09 || typ === 0x11) { val = Number(dv.getBigInt64(p, true)); p += 8; }
          else if (typ === 0x10) { val = dv.getInt32(p, true); p += 4; }
          else if (typ === 0x12) { val = Number(dv.getBigInt64(p, true)); p += 8; }
          else if (typ === 0x0a) val = null;
          else { val = `(type 0x${typ.toString(16)} 未展开)`; break; }
        } catch (e) { break; }
        out.push([name, val]);
      }
      return { text: JSON.stringify(Object.fromEntries(out), null, 2), stats: [{ label: '字段', value: out.length }] };
    }
    if (v.mode === 'JSON → EJSON') {
      let o; try { o = JSON.parse(t); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
      const ejson = JSON.stringify(o, null, 2).replace(/"(\d{4}-\d{2}-\d{2}T[^"]+)"/g, 'ISODate("$1")').replace(/"([0-9a-f]{24})"/g, 'ObjectId("$1")');
      return { text: ejson, stats: [{ label: '字段', value: Object.keys(o).length }] };
    }
    let s = t.replace(/\bObjectId\(\s*["']([0-9a-f]{24})["']\s*\)/gi, '"$1"')
      .replace(/\bISODate\(\s*["']([^"']+)["']\s*\)/gi, '"$1"')
      .replace(/\b(NumberLong|NumberInt|Decimal128|NumberDecimal)\(\s*["']?([^"')]+)["']?\s*\)/gi, '"$2"')
      .replace(/\b(BinData|UUID|RegExp)\([^)]*\)/gi, 'null')
      .replace(/([{,:]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/,\s*([}\]])/g, '$1');
    try { return { text: JSON.stringify(JSON.parse(s), null, 2), stats: [{ label: '字段', value: Object.keys(JSON.parse(s)).length }] }; }
    catch (e) { return { text: s, error: '还不是严格 JSON（可能含 mongosh 特有语法），已尽量转成可复制形式：\n' + e.message }; }
  } };

S['pcap-viewer'] = { kind: 'file', titleIn: 'PCAP', titleOut: '包列表', accept: '.pcap,.pcapng,.cap', multiple: false,
  primary: '解析', auto: false, dropTitle: '拖 .pcap / .pcapng 进来',
  fields: [{ id: 'filter', label: '过滤（IP / 端口 / 协议关键字）', type: 'text', default: '' }],
  note: '解析 pcap 全局头与包记录，拆 Ethernet / IPv4 / TCP / UDP / ICMP，能看到 SNI、DNS 查询名与 HTTP 请求行（未加密部分）。pcapng 按增强包块简化解析。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选抓包文件' };
    const b = new Uint8Array(await f.arrayBuffer()); const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const magic = L.bytesToHex(b.slice(0, 4));
    const pcapng = magic === '0a0d0d0a';
    const le = magic === 'd4c3b2a1' || magic === '4d3cb2a1';
    let p = pcapng ? 0 : 24, rows = [], n = 0;
    const ip = (o) => [b[o], b[o + 1], b[o + 2], b[o + 3]].join('.');
    const u16 = (o) => dv.getUint16(o, !le), u32 = (o) => dv.getUint32(o, !le);
    const add = (time, src, dst, proto, len, info) => { rows.push([String(++n), time, src, dst, proto, String(len), info]); };
    while (p + 16 < b.length && n < 500) {
      let capLen = 0, ts = '', data;
      if (pcapng) {
        const type = u32(p), blockLen = u32(p + 4);
        if (blockLen < 12 || p + blockLen > b.length) break;
        if (type === 0x00000006) { const cap = u32(p + 20); capLen = cap; ts = `${Number(dv.getBigUint64(p + 12, true) / 1000n)} (pcapng)`; data = p + 28; }
        p += blockLen; if (!capLen) continue;
      } else {
        const sec = u32(p), usec = u32(p + 4); capLen = u32(p + 8);
        if (capLen > 65535 || p + 16 + capLen > b.length) break;
        ts = new Date(sec * 1000).toLocaleTimeString('zh-CN') + '.' + String(usec).padStart(6, '0');
        data = p + 16; p += 16 + capLen;
      }
      const off = data;
      if (capLen < 34) continue;
      const ethType = (b[off + 12] << 8) | b[off + 13];
      if (ethType !== 0x0800) { if (ethType === 0x0806) add(ts, L.bytesToHex(b.slice(off + 6, off + 12), ':'), '广播', 'ARP', capLen, '地址解析'); continue; }
      const ipOff = off + 14, ihl = (b[ipOff] & 15) * 4;
      const proto = b[ipOff + 9], src = ip(ipOff + 12), dst = ip(ipOff + 16);
      const tOff = ipOff + ihl; let info = '', pname = String(proto);
      if (proto === 6) { pname = 'TCP'; const sp = (b[tOff] << 8) | b[tOff + 1], dp = (b[tOff + 2] << 8) | b[tOff + 3]; const flags = b[tOff + 13]; info = `${src}:${sp} → ${dst}:${dp} [${(flags & 2 ? 'S' : '')}${(flags & 16 ? 'A' : '')}${(flags & 1 ? 'F' : '')}]`;
        const pay = tOff + ((b[tOff + 12] >> 4) * 4);
        const ascii = L.fromUtf8(b.slice(pay, Math.min(pay + 120, off + capLen))).replace(/[^\x20-\x7e]/g, '');
        if (/^(GET|POST|PUT|DELETE|HTTP\/|Host:)/m.test(ascii)) info += ' ' + ascii.split(/\r?\n/)[0].slice(0, 60);
        if (/[\x16\x17]\x03/.test(ascii)) { const sni = (ascii.match(/[\x00]([a-z0-9.-]+\.[a-z]{2,})/) || [])[1]; info += sni ? ` TLS SNI=${sni}` : ' TLS'; }
      } else if (proto === 17) { pname = 'UDP'; const sp = (b[tOff] << 8) | b[tOff + 1], dp = (b[tOff + 2] << 8) | b[tOff + 3]; info = `${src}:${sp} → ${dst}:${dp}`;
        if (sp === 53 || dp === 53) { const q = L.fromUtf8(b.slice(tOff + 20, Math.min(tOff + 60, off + capLen))).replace(/[^\x20-\x7e]/g, '.'); info += ' DNS ' + q.slice(0, 40); } }
      else if (proto === 1) { pname = 'ICMP'; info = `type=${b[tOff]}`; }
      add(ts, src, dst, pname, capLen, info);
      if (!pcapng) { /* p advanced above */ }
    }
    const k = String(v.filter || '').toLowerCase();
    const show = rows.filter((r) => !k || r.join(' ').toLowerCase().includes(k));
    return { html: `<table class="t-table"><thead><tr><th>#</th><th>时间</th><th>源</th><th>目的</th><th>协议</th><th>长度</th><th>摘要</th></tr></thead><tbody>${show.slice(0, 300).map((r) => `<tr>${r.map((x, i) => `<td${i === 4 ? ' class="num"' : ''}>${L.esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
      copy: show.map((r) => r.join('\t')).join('\n'),
      files: [{ name: 'pcap-摘要.csv', data: L.utf8('\ufeff' + L.toCSV([['#', '时间', '源', '目的', '协议', '长度', '摘要'], ...show])), mime: 'text/csv', label: '导出 CSV' }],
      stats: [{ label: '包', value: rows.length }, { label: '格式', value: pcapng ? 'pcapng' : 'pcap' }] };
  } };

/* ---------- 可视化 / 时钟 / 画板 ---------- */
S['mermaid'] = { kind: 'form', titleIn: 'Mermaid DSL', titleOut: '流程图', wide: false,
  fields: [{ id: 'code', label: 'graph 语法（支持 TD / LR、节点标签、--> 与 --|文字|-->）', type: 'textarea', rows: 9, default: 'graph TD\n  A[开始] --> B{判断}\n  B -- 是 --> C[处理]\n  B -- 否 --> D[结束]\n  C --> D' },
    { id: 'dir', label: '方向', type: 'select', options: ['TD 上下', 'LR 左右'] }],
  primary: '复制 SVG', hintOut: '轻量实现：解析 graph / flowchart 的节点、边与边标签，做分层布局画成 SVG。时序图、甘特图等 14 类完整语法需要 Mermaid 引擎，这里不假装支持。',
  compute: (v) => {
    const lines = L.nonEmptyLines(v.code || '');
    const nodes = new Map(), edges = [];
    for (const l of lines) {
      if (/^(graph|flowchart)\b/i.test(l)) continue;
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\)|\[\[[^\]]*\]\])?\s*(--?>\s*|--\|[^|]*\|\s*-->|-->\s*|-\.->\s*)(.+)$/);
      if (!m) continue;
      const [, a, shapeA, , rest] = m;
      const label = (s) => (s || '').replace(/^[\[{(]+|[\]})]+$/g, '');
      if (!nodes.has(a)) nodes.set(a, label(shapeA) || a);
      const m2 = String(rest).trim().match(/^([A-Za-z0-9_]+)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))?\s*(.*)$/);
      if (m2) { const [, b, shapeB] = m2; if (!nodes.has(b)) nodes.set(b, label(shapeB) || b); const edgeLabel = (l.match(/--\|([^|]*)\|/) || [])[1] || ''; edges.push([a, b, edgeLabel]); }
    }
    if (!nodes.size) return { error: '没解析出节点，检查写法是否形如 A[开始] --> B[结束]' };
    const ids = [...nodes.keys()];
    const depth = new Map(ids.map((x) => [x, 0]));
    for (let i = 0; i < ids.length; i++) for (const [a, b] of edges) depth.set(b, Math.max(depth.get(b) || 0, (depth.get(a) || 0) + 1));
    const levels = {}; ids.forEach((x) => { const d = depth.get(x) || 0; (levels[d] ||= []).push(x); });
    const lr = v.dir.startsWith('LR'), W = 150, H = 54, GX = 80, GY = 78;
    const pos = {};
    Object.entries(levels).forEach(([d, arr]) => arr.forEach((id, i) => { pos[id] = lr ? { x: 30 + Number(d) * (W + GX), y: 30 + i * (H + GY) } : { x: 30 + i * (W + GX), y: 30 + Number(d) * (H + GY) }; }));
    const w = Math.max(...Object.values(pos).map((p) => p.x)) + W + 40, h = Math.max(...Object.values(pos).map((p) => p.y)) + H + 40;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:100%;min-width:${Math.min(w, 900)}px;background:#fff">
      <defs><marker id="ar" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8a7c68"/></marker></defs>
      ${edges.map(([a, b, lab]) => { const p1 = pos[a], p2 = pos[b]; if (!p1 || !p2) return ''; const x1 = p1.x + W / 2, y1 = p1.y + H / 2, x2 = p2.x + W / 2, y2 = p2.y + H / 2; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#a89a84" stroke-width="1.6" marker-end="url(#ar)"/>${lab ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-size="11" fill="#6b5a3f">${L.esc(lab)}</text>` : ''}`; }).join('')}
      ${ids.map((id) => { const p = pos[id], shape = nodes.get(id); return `<g><rect x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="${String(shape).startsWith('{') ? 6 : 8}" fill="#f7f2e8" stroke="#b4552d" stroke-width="1.6"/><text x="${p.x + W / 2}" y="${p.y + H / 2 + 5}" text-anchor="middle" font-size="13" fill="#3d3328">${L.esc(shape)}</text></g>`; }).join('')}</svg>`;
    return { preview: svg, copy: svg, text: `${nodes.size} 个节点，${edges.length} 条边。`, stats: [{ label: '节点', value: nodes.size }, { label: '边', value: edges.length }] };
  } };

S['markmap'] = { kind: 'form', titleIn: 'Markdown', titleOut: '思维导图', wide: false,
  fields: [{ id: 'md', label: '标题 / 列表', type: 'textarea', rows: 10, default: '# 我的工具箱\n\n## 图片类\n- 九宫格切图\n- 图片压缩\n- 占位图\n\n## 文本类\n- Base64\n- 正则测试\n- Markdown 编辑器\n\n## 计算类\n- 房贷计算\n- 复利计算' }],
  primary: '复制 SVG', hintOut: '把 Markdown 的 # 标题与 - 列表转成树，画成左右展开的思维导图；支持任意层级，可导出 SVG。',
  compute: (v) => {
    const root = { t: 'root', c: [] }; const stack = [{ level: 0, node: root }];
    for (const l of L.lines(v.md || '')) {
      const h = l.match(/^(#{1,6})\s+(.+)$/); const li = l.match(/^\s*[-*+]\s+(.+)$/);
      if (h) { const level = h[1].length, node = { t: h[2].trim(), c: [] }; while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop(); stack[stack.length - 1].node.c.push(node); stack.push({ level, node }); }
      else if (li) { const node = { t: li[1].trim(), c: [] }; stack[stack.length - 1].node.c.push(node); }
    }
    const flat = []; let leaf = 0;
    const walk = (n, d) => { flat.push({ ...n, d, y: n.c.length ? 0 : leaf++ }); n.c.forEach((x) => walk(x, d + 1)); };
    root.c.forEach((x) => walk(x, 0));
    if (!flat.length) return { error: '没读到标题或列表' };
    const DX = 190, DY = 34;
    const maxD = Math.max(...flat.map((x) => x.d));
    const W = (maxD + 1) * DX + 220, H = Math.max(120, leaf * DY + 40);
    const pos = {};
    const place = (n, d) => { n.c.forEach((c) => place(c, d + 1)); const kids = n.c; n._y = kids.length ? kids.reduce((s, c) => s + c._y, 0) / kids.length : leafY++; };
    let leafY = 0; root.c.forEach((c) => place(c, 0));
    root._y = root.c.length ? root.c.reduce((s, c) => s + c._y, 0) / root.c.length : 0;
    const collect = (n, d, parent) => { if (parent) pos[`${d}-${n.t}-${n._y}`] = { x: 20 + d * DX, y: 24 + n._y * DY, parent: { x: 20 + (d - 1) * DX, y: 24 + parent._y * DY }, t: n.t }; n.c.forEach((c) => collect(c, d + 1, n)); };
    root.c.forEach((c) => collect(c, 0, root));
    const items = Object.values(pos);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;min-width:${Math.min(W, 900)}px;background:#fff">
      ${items.map((p) => `<path d="M${p.parent.x + 150},${p.parent.y + 12} C${p.parent.x + 175},${p.parent.y + 12} ${p.x - 15},${p.y + 12} ${p.x},${p.y + 12}" fill="none" stroke="#cbbba4" stroke-width="1.5"/>`).join('')}
      ${items.map((p) => `<g><rect x="${p.x}" y="${p.y}" width="150" height="25" rx="6" fill="#f2eee5" stroke="#d6cbb8"/><text x="${p.x + 8}" y="${p.y + 17}" font-size="12" fill="#3d3328">${L.esc(p.t.slice(0, 18))}</text></g>`).join('')}
      <text x="20" y="${H - 8}" font-size="11" fill="#8a7c68">共 ${flat.length} 个节点</text></svg>`;
    return { preview: svg, copy: svg, text: `${flat.length} 个节点。`, stats: [{ label: '节点', value: flat.length }, { label: '层级', value: maxD + 1 }] };
  } };

S['latex-math'] = { kind: 'form', titleIn: 'LaTeX', titleOut: '公式', wide: false,
  fields: [{ id: 'tex', label: '公式', type: 'textarea', rows: 4, default: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
    { id: 'size', label: '字号', type: 'select', options: ['正常', '大', '特大'] },
    { id: 'tpl', label: '插入模板', type: 'select', options: ['不插入', '分式', '求和', '矩阵', '方程组', '希腊字母', '上下标', '根号'] }],
  primary: '复制 LaTeX', hintOut: 'KaTeX 本地渲染（库随站点打包，不联网）。点模板可把常用片段插进输入框；右侧可复制 LaTeX。',
  compute: async (v) => {
    const tpls = { '分式': '\\frac{a}{b}', '求和': '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', '矩阵': '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '方程组': '\\begin{cases} x+y=1 \\\\ x-y=3 \\end{cases}', '希腊字母': '\\alpha + \\beta + \\gamma + \\Delta + \\Omega', '上下标': 'x_i^2 + a_{n+1}', '根号': '\\sqrt[3]{x^2 + y^2}' };
    const tex = String(v.tex || '').trim();
    if (!tex) return { text: '' };
    const scale = { '正常': '1', '大': '1.4', '特大': '1.9' }[v.size] || '1';
    try {
      const katex = await vendor('katex');
      const html = katex.renderToString(tex, { throwOnError: false, displayMode: true, output: 'html' });
      return { preview: `<div style="font-size:${scale}em;overflow:auto">${html}</div>`, copy: tex,
        text: v.tpl !== '不插入' ? tpls[v.tpl] : tex, stats: [{ label: '字符', value: tex.length }] };
    } catch (e) { return { error: '渲染失败：' + e.message }; }
  } };

S['world-clock'] = { kind: 'custom', render: (root, K) => {
  const zones = [['北京', 'Asia/Shanghai'], ['东京', 'Asia/Tokyo'], ['首尔', 'Asia/Seoul'], ['伦敦', 'Europe/London'], ['柏林', 'Europe/Berlin'], ['巴黎', 'Europe/Paris'], ['纽约', 'America/New_York'], ['洛杉矶', 'America/Los_Angeles'], ['悉尼', 'Australia/Sydney'], ['迪拜', 'Asia/Dubai'], ['新加坡', 'Asia/Singapore'], ['UTC', 'UTC']];
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>世界时钟</h2><span class="hint" id="now">—</span></div>
    <div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px"></div>
    <div class="t-field" style="margin-top:18px"><label class="t-label">跨时区会议规划：选一个北京时间</label>
      <div class="t-row"><input class="t-input grow" type="time" id="meet" value="09:00"><button class="t-btn" type="button" id="planBtn">看各地几点</button></div></div>
    <div class="t-out" id="planOut" style="margin-top:11px"></div>
    <p class="t-hint">用浏览器 Intl 时区数据库换算，含夏令时；不需要联网。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const tick = () => {
    const now = new Date();
    $('#now').textContent = '本机 ' + now.toLocaleString('zh-CN', { hour12: false });
    $('#grid').innerHTML = zones.map(([n, z]) => {
      const s = new Intl.DateTimeFormat('zh-CN', { timeZone: z, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
      const d = new Intl.DateTimeFormat('zh-CN', { timeZone: z, month: '2-digit', day: '2-digit', weekday: 'short' }).format(now);
      const hr = Number(s.slice(0, 2)); const day = hr >= 8 && hr < 19;
      return `<div style="border:1px solid var(--line);border-radius:9px;padding:11px;background:${day ? '#f7f2e8' : '#eeece6'}">
        <div style="font-size:12px;color:var(--ink-3)">${n} <span style="float:right">${day ? '☀' : '☾'}</span></div>
        <div style="font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin:4px 0">${s}</div>
        <div style="font-size:11px;color:var(--ink-3)">${d} · ${z.split('/').pop().replace(/_/g, ' ')}</div></div>`;
    }).join('');
  };
  $('#planBtn').onclick = () => {
    const [h, m] = $('#meet').value.split(':').map(Number);
    const base = new Date(); base.setHours(h || 9, m || 0, 0, 0);
    $('#planOut').textContent = zones.map(([n, z]) => `${n.padEnd(6, '　')} ${new Intl.DateTimeFormat('zh-CN', { timeZone: z, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).format(base)}`).join('\n');
  };
  K.setAction('看各地几点', () => $('#planBtn').click());
  tick(); setInterval(tick, 1000);
} };

S['whiteboard'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>画板</h2><span class="hint">鼠标 / 触屏都能画</span></div>
    <div class="t-row" style="margin-bottom:10px">
      <select class="t-select" id="tool" style="width:auto"><option>画笔</option><option>矩形</option><option>箭头</option><option>便签</option><option>文字</option><option>橡皮</option></select>
      <input class="t-input" type="color" id="color" value="#b4552d" style="width:52px;padding:3px;height:36px">
      <input class="t-range" type="range" id="size" min="1" max="14" value="3" style="width:110px">
      <button class="t-btn" type="button" id="undo">撤销</button><button class="t-btn" type="button" id="clear">清空</button>
      <button class="t-btn" type="button" id="png">导出 PNG</button><button class="t-btn" type="button" id="svg">导出 SVG</button>
    </div>
    <canvas id="cv" width="1000" height="560" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#fff;touch-action:none;cursor:crosshair"></canvas>
    <p class="t-hint">便签 / 文字工具点一下画布会弹出输入框；所有笔迹留在本机内存里，导出后关掉页面就没了。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const cv = $('#cv'), g = cv.getContext('2d'); let ops = [], drawing = false, start = null;
  const redraw = () => {
    g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    for (const o of ops) {
      g.save(); g.strokeStyle = o.color; g.fillStyle = o.color; g.lineWidth = o.size; g.lineCap = 'round'; g.lineJoin = 'round';
      if (o.type === '画笔' || o.type === '橡皮') { g.globalCompositeOperation = o.type === '橡皮' ? 'destination-out' : 'source-over'; g.beginPath(); o.pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); }
      else if (o.type === '矩形') g.strokeRect(o.a.x, o.a.y, o.b.x - o.a.x, o.b.y - o.a.y);
      else if (o.type === '箭头') { g.beginPath(); g.moveTo(o.a.x, o.a.y); g.lineTo(o.b.x, o.b.y); g.stroke(); const an = Math.atan2(o.b.y - o.a.y, o.b.x - o.a.x); g.beginPath(); g.moveTo(o.b.x, o.b.y); g.lineTo(o.b.x - 12 * Math.cos(an - .4), o.b.y - 12 * Math.sin(an - .4)); g.lineTo(o.b.x - 12 * Math.cos(an + .4), o.b.y - 12 * Math.sin(an + .4)); g.closePath(); g.fill(); }
      else if (o.type === '便签') { g.globalAlpha = .85; g.fillStyle = '#f6e2b8'; g.fillRect(o.a.x, o.a.y, 160, 90); g.globalAlpha = 1; g.fillStyle = '#4a3b2a'; g.font = '15px sans-serif'; (o.text || '').split('\n').forEach((t, i) => g.fillText(t, o.a.x + 10, o.a.y + 24 + i * 20)); }
      else if (o.type === '文字') { g.font = `${14 + o.size * 2}px sans-serif`; g.fillText(o.text || '', o.a.x, o.a.y); }
      g.restore();
    }
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', (e) => {
    const p = pt(e), type = $('#tool').value;
    if (type === '便签' || type === '文字') { const t = prompt(type === '便签' ? '便签内容（可换行）' : '输入文字', type === '便签' ? '写点什么' : '文字'); if (t) { ops.push({ type, a: p, color: $('#color').value, size: Number($('#size').value), text: t }); redraw(); } return; }
    drawing = true; start = p; cv.setPointerCapture(e.pointerId);
    ops.push({ type, a: p, b: p, color: $('#color').value, size: Number($('#size').value), pts: [p] });
  });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const o = ops[ops.length - 1], p = pt(e); o.b = p; if (o.pts) o.pts.push(p); redraw(); });
  cv.addEventListener('pointerup', () => { drawing = false; });
  $('#undo').onclick = () => { ops.pop(); redraw(); };
  $('#clear').onclick = () => { ops = []; redraw(); };
  $('#png').onclick = () => K.canvasDownload(cv, '白板.png');
  $('#svg').onclick = () => {
    const inner = ops.map((o) => {
      const c = o.color;
      if (o.type === '矩形') return `<rect x="${o.a.x}" y="${o.a.y}" width="${o.b.x - o.a.x}" height="${o.b.y - o.a.y}" fill="none" stroke="${c}" stroke-width="${o.size}"/>`;
      if (o.type === '箭头') return `<line x1="${o.a.x}" y1="${o.a.y}" x2="${o.b.x}" y2="${o.b.y}" stroke="${c}" stroke-width="${o.size}"/>`;
      if (o.type === '文字' || o.type === '便签') return `<text x="${o.a.x + 8}" y="${o.a.y + 22}" fill="#3d3328" font-size="15">${L.esc(o.text || '')}</text>`;
      return `<polyline points="${(o.pts || []).map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${o.size}"/>`;
    }).join('');
    K.download('白板.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cv.width} ${cv.height}"><rect width="100%" height="100%" fill="#fff"/>${inner}</svg>`, 'image/svg+xml');
  };
  K.setAction('导出 PNG', () => $('#png').click());
  redraw();
} };

S['ascii-art'] = { kind: 'form', titleIn: '文字', titleOut: 'ASCII 艺术字',
  fields: [{ id: 'txt', label: '英文字母 / 数字（中文会转成方块阵）', type: 'text', default: 'HELLO' },
    { id: 'font', label: '字形', type: 'select', options: ['5×5 方块', '5×5 粗体', '5×5 轮廓', '反白'] },
    { id: 'char', label: '填充字符', type: 'text', default: '█' }],
  primary: '复制结果', hintOut: '内置 A–Z / 0–9 的 5×5 点阵字库，四种渲染风格；中文没有现成英文字体，会按笔画数生成方块阵示意。完整 figlet 20 款字形与中文点阵字体需要外部字库。',
  compute: (v) => {
    const F = {
      A: ['01110', '10001', '11111', '10001', '10001'], B: ['11110', '10001', '11110', '10001', '11110'], C: ['01111', '10000', '10000', '10000', '01111'],
      D: ['11110', '10001', '10001', '10001', '11110'], E: ['11111', '10000', '11110', '10000', '11111'], F: ['11111', '10000', '11110', '10000', '10000'],
      G: ['01111', '10000', '10111', '10001', '01111'], H: ['10001', '10001', '11111', '10001', '10001'], I: ['11111', '00100', '00100', '00100', '11111'],
      J: ['00111', '00010', '00010', '10010', '01100'], K: ['10001', '10010', '11100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '11111'],
      M: ['10001', '11011', '10101', '10001', '10001'], N: ['10001', '11001', '10101', '10011', '10001'], O: ['01110', '10001', '10001', '10001', '01110'],
      P: ['11110', '10001', '11110', '10000', '10000'], Q: ['01110', '10001', '10001', '10101', '01101'], R: ['11110', '10001', '11110', '10010', '10001'],
      S: ['01111', '10000', '01110', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100'], U: ['10001', '10001', '10001', '10001', '01110'],
      V: ['10001', '10001', '10001', '01010', '00100'], W: ['10001', '10001', '10101', '11011', '10001'], X: ['10001', '01010', '00100', '01010', '10001'],
      Y: ['10001', '01010', '00100', '00100', '00100'], Z: ['11111', '00010', '00100', '01000', '11111'],
      0: ['01110', '10011', '10101', '11001', '01110'], 1: ['00100', '01100', '00100', '00100', '01110'], 2: ['01110', '10001', '00110', '01000', '11111'],
      3: ['11110', '00001', '01110', '00001', '11110'], 4: ['00010', '00110', '01010', '11111', '00010'], 5: ['11111', '10000', '11110', '00001', '11110'],
      6: ['01111', '10000', '11110', '10001', '01110'], 7: ['11111', '00010', '00100', '01000', '01000'], 8: ['01110', '10001', '01110', '10001', '01110'],
      9: ['01110', '10001', '01111', '00001', '11110'], ' ': ['00000', '00000', '00000', '00000', '00000'], '!': ['00100', '00100', '00100', '00000', '00100'],
      '?': ['01110', '10001', '00110', '00000', '00100'], '-': ['00000', '00000', '11111', '00000', '00000'], '.': ['00000', '00000', '00000', '00000', '00100'],
    };
    const ch = String(v.char || '#')[0] || '#';
    const chars = Array.from(String(v.txt || '').toUpperCase()).slice(0, 24);
    const glyph = (c) => F[c] || (() => { const n = c.codePointAt(0) % 16; return Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, i) => ((n + r * 3 + i * 5) % 3 ? '1' : '0')).join('')); })();
    const bold = v.font.includes('粗体'), outline = v.font.includes('轮廓'), invert = v.font.includes('反白');
    const rows = Array.from({ length: 5 }, (_, r) => chars.map((c) => {
      const g = glyph(c); let s = g[r];
      if (bold) s = s.replace(/1/g, '11').slice(0, 6).padEnd(6, '0');
      if (outline) s = s.split('').map((x, i) => x === '1' && (i === 0 || g[r][i - 1] === '0') ? '1' : '0').join('');
      return s.split('').map((x) => (invert ? x === '0' : x === '1') ? ch : ' ').join('');
    }).join(' '));
    return { text: rows.join('\n'), stats: [{ label: '字符', value: chars.length }, { label: '行数', value: 5 }] };
  } };
