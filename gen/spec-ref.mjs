// 速查表 / 离线语料类工具
const R = (s) => ({ $ref: s });
export const S = {};

/* ============ 导航资源 ============ */
S['cn-mirrors'] = { kind: 'ref', title: '国内镜像源速查', placeholder: '搜 pip / npm / Ubuntu / Docker / Maven…',
  columns: [{ label: '工具' }, { label: '镜像方' }, { label: '地址' }, { label: '怎么配' }],
  rows: R('D.mirrors'), note: '地址可直接复制；配置命令写在第四列。镜像同步有延迟，遇到缺包可换回官方源。' };

S['cn-dns'] = { kind: 'ref', title: '公共 DNS 速查', placeholder: '搜阿里 / Cloudflare / IPv6 / DoH',
  columns: [{ label: '服务商' }, { label: 'IPv4 主' }, { label: 'IPv4 备' }, { label: 'IPv6' }, { label: 'DoH 地址' }],
  rows: R('D.dns'), note: '境内访问建议用阿里 / DNSPod / 114；DoH 需要在浏览器或系统里单独配置。' };

S['cn-ntp'] = { kind: 'ref', title: '公共 NTP 时间源', placeholder: '搜阿里 / 腾讯 / 国家授时中心 / NTS',
  columns: [{ label: '提供方' }, { label: '主地址' }, { label: '备用地址' }, { label: '说明' }],
  rows: R('D.ntp'), note: '服务器对时建议配 3 个以上不同来源；Google 用 leap-smear，跨厂混用前先确认口径。' };

S['http-headers'] = { kind: 'ref', title: 'HTTP 头速查', placeholder: '搜 CORS / 缓存 / CSP / Cookie / 代理',
  columns: [{ label: '头字段' }, { label: '方向' }, { label: '中文释义' }, { label: '归类' }],
  rows: R('D.httpHeaders'), filters: [{ label: '归类', values: ['全部', '请求', '响应', '通用', 'CORS', '安全', '缓存', '代理'], col: 3 }],
  note: '点任意一行复制该行；请求头由客户端发，响应头由服务端返回，通用头两边都能用。' };

S['llm-api'] = { kind: 'ref', title: '大模型 API 速查', placeholder: '搜 DeepSeek / Claude / Gemini / 通义 / 本地',
  columns: [{ label: '厂商' }, { label: '代表模型' }, { label: 'Base URL' }, { label: '环境变量' }],
  rows: R('D.llm'), note: '接口地址与模型名会随厂商更新，以官方文档为准；密钥只放在你自己的环境里。' };

/* 升级：以前在浏览器里直连 cloudflare trace / ipify / ipwho.is，受 CORS 影响且把访客 IP
   暴露给多个外站。现在统一走本站同源 /api/net，服务端做缓存、限流与输入校验。 */
S['ip'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>本机公网 IP</h2><span class="hint">经本站同源接口查询</span></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">查一下</button></div>
    <div class="t-out html" id="res" style="margin-top:14px">点「查一下」读取当前出口 IP 与归属地。</div>
    <p class="t-hint">IP 与归属地来自 CDN 边缘节点信息和公开 IP 库，仅作参考。本站不保存、不记录你的 IP；查询词只用于这一次取数。</p>
  </section>
  <section class="t-panel wide">
    <div class="t-head"><h2><span class="step">2</span>批量查 IP</h2><span class="hint">一行一个，最多 20 个</span></div>
    <textarea class="t-textarea" id="ips" rows="4" placeholder="8.8.8.8&#10;1.1.1.1"></textarea>
    <div class="t-actions"><button class="t-btn" type="button" id="batch">查询并导出 CSV</button><button class="t-btn" type="button" id="local">看本机内网地址</button></div>
    <div class="t-out" id="bres" style="margin-top:12px"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const out = (el, s) => { el.textContent = s; };
  const esc = L.esc;
  const BOM = String.fromCharCode(0xFEFF);
  const api = async (mode, q) => {
    const u = '/api/net?mode=' + encodeURIComponent(mode) + (q ? '&q=' + encodeURIComponent(q) : '');
    const r = await fetch(u);
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.detail || j.error || ('HTTP ' + r.status));
    return j;
  };
  const stamp = (j) => '<p class="t-hint">' +
    (j.stale ? '实时查询暂不可用，以下是上一次成功的结果。' : '数据实时查询，服务端短期缓存。') +
    '来源：' + esc(j.source || '公开数据源') + (j.cached ? ' · 命中缓存' : '') +
    (j.note ? '<br>' + esc(j.note) : '') + '</p>';
  const card = (j) => {
    const v = (x) => esc(x === '' || x === null || x === undefined ? '—' : x);
    const ll = (j.latitude !== null && j.latitude !== undefined && j.longitude !== null && j.longitude !== undefined)
      ? j.latitude + ', ' + j.longitude : '—';
    return `<div class="t-stat-row">
      <div class="t-stat"><b>${v(j.ip)}</b><span>公网 IP · ${v(j.version)}</span></div>
      <div class="t-stat"><b>${v(j.country)}</b><span>国家/地区 ${j.country_code ? '(' + v(j.country_code) + ')' : ''}</span></div>
      <div class="t-stat"><b>${v(j.region)}</b><span>省份 / 州</span></div>
      <div class="t-stat"><b>${v(j.city)}</b><span>城市</span></div>
      <div class="t-stat"><b>${v(j.isp)}</b><span>运营商${j.asn ? ' · ' + v(j.asn) : ''}</span></div>
    </div><p class="t-hint">经纬度：${v(ll)}　时区：${v(j.timezone)}</p>` + stamp(j);
  };
  $('#go').onclick = async () => {
    const el = $('#res');
    el.className = 't-out'; el.textContent = '正在查询…';
    try {
      const j = await api('self');
      el.className = 't-out html';
      el.innerHTML = card(j);
    } catch (e) { out(el, '查询失败：' + e.message + '。稍后再试。'); }
  };
  $('#batch').onclick = async () => {
    const list = L.nonEmptyLines($('#ips').value).slice(0, 20);
    const el = $('#bres');
    if (!list.length) { out(el, '先粘几个 IP'); return; }
    out(el, '正在查询 ' + list.length + ' 个…');
    const rows = [['IP', '国家', '省份', '城市', '运营商', 'ASN', '时区']];
    for (const ip of list) {
      try {
        const j = await api('ip', ip);
        rows.push([ip, j.country || '', j.region || '', j.city || '', j.isp || '', j.asn || '', j.timezone || '']);
      } catch (e) { rows.push([ip, '查询失败：' + e.message, '', '', '', '', '']); }
    }
    out(el, L.toCSV(rows));
    K.download('ip-查询.csv', BOM + L.toCSV(rows), 'text/csv;charset=utf-8');
  };
  $('#local').onclick = async () => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel(''); const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const found = new Set();
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); out($('#bres'), [...found].join('\n') || '浏览器未暴露内网地址'); return; }
        const m = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
        if (m) found.add(m[1]);
      };
      out($('#bres'), '正在读取…');
    } catch (e) { out($('#bres'), '读取失败：' + e.message); }
  };
} };

/* 升级：原先浏览器直连 Cloudflare DoH，跨域与限流都不可控。现在走同源 /api/net?mode=host，
   服务端并行查 A / AAAA / CNAME、缓存 10 分钟、识别常见 CDN 厂商。 */
S['domain-ip'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel">
    <div class="t-head"><h2><span class="step">1</span>域名</h2><span class="hint">一行一个，最多 10 个</span></div>
    <textarea class="t-textarea" id="dom" rows="6" placeholder="example.com&#10;www.baidu.com">example.com</textarea>
    <div class="t-actions"><button class="t-btn primary" type="button" id="go">解析</button></div>
    <p class="t-hint">真实 DNS 查询（A / AAAA / CNAME），经本站同源接口向公共 DoH 取数并短期缓存。只有域名会送到服务端，文件与页面里其它输入不上传。</p>
  </section><section class="t-panel">
    <div class="t-head"><h2><span class="step">2</span>解析结果</h2><span class="hint">A / AAAA / CNAME</span></div>
    <div class="t-out" id="res">等待解析。</div>
    <div class="t-actions"><button class="t-btn" type="button" id="csv">导出 CSV</button></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const esc = L.esc;
  const BOM = String.fromCharCode(0xFEFF);
  let last = [['域名', '类型', '值', 'TTL(秒)']];
  const api = async (host) => {
    const r = await fetch('/api/net?mode=host&q=' + encodeURIComponent(host));
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.detail || j.error || ('HTTP ' + r.status));
    return j;
  };
  const label = (t) => t === 'A' ? 'A / IPv4' : t === 'AAAA' ? 'AAAA / IPv6' : 'CNAME';
  $('#go').onclick = async () => {
    const names = L.nonEmptyLines($('#dom').value).slice(0, 10);
    const el = $('#res');
    if (!names.length) { el.textContent = '先填域名'; return; }
    el.className = 't-out'; el.textContent = '解析中…';
    last = [['域名', '类型', '值', 'TTL(秒)']];
    const cdns = [], sources = [];
    let stale = false;
    for (const n of names) {
      try {
        const j = await api(n);
        if (!j.answers || !j.answers.length) last.push([n, '—', '没有解析记录', '']);
        for (const a of j.answers) last.push([n, label(a.type), a.value, String(a.ttl || '')]);
        if (j.cdn) cdns.push(esc(n) + ' → ' + esc(j.cdn));
        if (j.source && sources.indexOf(j.source) < 0) sources.push(j.source);
        stale = stale || !!j.stale;
      } catch (e) { last.push([n, '查询失败', e.message, '']); }
    }
    const rows = last.slice(1).map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('');
    el.className = 't-out html';
    el.innerHTML = '<table class="t-table"><thead><tr><th>域名</th><th>类型</th><th>值</th><th>TTL</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (cdns.length ? '<p class="t-hint">识别到 CDN：' + cdns.join('；') + '。CNAME 指向这些厂商通常说明域名接了 CDN。</p>' : '') +
      '<p class="t-hint">' + (stale ? '实时查询暂不可用，部分是上一次成功的结果。' : '真实 DNS 解析结果，服务端缓存 10 分钟。') +
      (sources.length ? '来源：' + esc(sources.join(' / ')) : '') + '</p>';
  };
  $('#csv').onclick = () => { K.download('域名解析.csv', BOM + L.toCSV(last), 'text/csv;charset=utf-8'); };
} };

/* ============ 文本与开发速查 ============ */
S['http-ref'] = { kind: 'ref', title: 'HTTP 状态码 / MIME 速查', placeholder: '搜 404 / 502 / json / png / 缓存',
  columns: [{ label: '类别' }, { label: '代码/扩展名' }, { label: '英文/类型' }, { label: '中文释义' }, { label: '备注' }],
  rows: R('D.httpRef'), filters: [{ label: '类别', values: ['全部', '状态码', 'MIME'], col: 0 }],
  note: '状态码按 1xx–5xx 分段；MIME 可用扩展名反查 Content-Type。' };

S['ascii-table'] = { kind: 'ref', title: 'ASCII 码表', placeholder: '搜 65 / A / 0x41 / LF / DEL',
  columns: [{ label: 'DEC' }, { label: 'HEX' }, { label: 'OCT' }, { label: 'BIN' }, { label: '字符/名称' }, { label: '类型' }],
  rows: R('D.asciiRows'), filters: [{ label: '类型', values: ['全部', '可打印', '控制字符'], col: 5 }],
  note: '0–31 与 127 是控制字符，32–126 可打印；中文不在 ASCII 范围内。' };

S['git-ref'] = { kind: 'ref', title: 'Git 命令速查', placeholder: '搜 撤销 / rebase / stash / reflog / 强推',
  columns: [{ label: '命令' }, { label: '归类' }, { label: '写法' }, { label: '说明' }],
  rows: R('D.git'), filters: [{ label: '归类', values: ['全部', '初始化', '取远端', '暂存', '提交', '查看', '分支', '合并', '撤销', '远端', '救命', '排查', '标签', '子模块', '工作树', '维护', '导出', '统计', '配置'], col: 1 }],
  note: '标「危险」的会丢改动，执行前先 git status 看一眼。找回被 reset 掉的提交用 git reflog。' };

S['regex-ref'] = { kind: 'ref', title: '正则语法速查', placeholder: '搜 前瞻 / 分组 / 量词 / 手机号 / Unicode',
  columns: [{ label: '写法' }, { label: '含义' }, { label: '说明 / 常用模式' }],
  rows: R('D.regexRef'), note: 'JS 与 PCRE 差异：JS 的 \\w 默认不含中文，需要 u 标志配合 \\p{L}；后顾断言需较新浏览器。' };

S['keycode'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>按任意键</h2><span class="hint">焦点在本页即可</span></div>
    <div class="t-preview" id="show" style="min-height:150px;flex-direction:column;gap:6px"><div style="font-size:34px;font-weight:700" id="key">⌨</div><div class="t-hint" id="detail">按一下键盘</div></div>
    <div class="t-out" id="code" style="margin-top:12px"></div>
    <p class="t-hint">常用键码表：</p>
    <div class="t-refwrap" id="tbl"></div>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const common = [['Enter', 'Enter', 13], ['Space', ' ', 32], ['Backspace', 'Backspace', 8], ['Tab', 'Tab', 9], ['Escape', 'Escape', 27], ['Shift', 'ShiftLeft', 16], ['Ctrl', 'ControlLeft', 17], ['Alt', 'AltLeft', 18], ['↑', 'ArrowUp', 38], ['↓', 'ArrowDown', 40], ['←', 'ArrowLeft', 37], ['→', 'ArrowRight', 39], ['A', 'KeyA', 65], ['0', 'Digit0', 48], ['F1', 'F1', 112], ['CapsLock', 'CapsLock', 20]];
  $('#tbl').innerHTML = `<table class="t-table"><thead><tr><th>按键</th><th>event.code</th><th>keyCode（旧）</th></tr></thead><tbody>${common.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td class="num">${r[2]}</td></tr>`).join('')}</tbody></table>`;
  const handler = (e) => {
    $('#key').textContent = e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key : e.key);
    const bits = [`event.key = ${JSON.stringify(e.key)}`, `event.code = ${e.code}`, `event.keyCode = ${e.keyCode}`, `location = ${e.location}`, `ctrl = ${e.ctrlKey} · shift = ${e.shiftKey} · alt = ${e.altKey} · meta = ${e.metaKey}`, `repeat = ${e.repeat}`];
    $('#detail').textContent = `${e.code} / keyCode ${e.keyCode}`;
    $('#code').textContent = bits.join('\n');
  };
  window.addEventListener('keydown', handler);
  root._cleanup = () => window.removeEventListener('keydown', handler);
} };

/* ============ 离线语料 ============ */
S['poetry'] = { kind: 'form', titleIn: '搜诗词', titleOut: '匹配结果', wide: false,
  fields: [{ id: 'q', label: '关键词', type: 'text', default: '明月', placeholder: '诗题 / 作者 / 诗句都行' },
    { id: 'mode', label: '范围', type: 'select', options: ['全部', '唐诗', '宋词', '先秦/其它'] }],
  primary: '复制结果', sample: { q: '明月', mode: '全部' },
  hintOut: '离线精选版：内置 90 余首常见篇目，按诗题、作者、诗句检索，不联网。完整 34 万首需要外部语料库。',
  compute: (v) => {
    const k = String(v.q || '').trim();
    const rows = L.D.poetry.filter((r) => {
      if (k && !r.join(' ').includes(k)) return false;
      if (v.mode === '唐诗' && r[2] !== '唐') return false;
      if (v.mode === '宋词' && r[2] !== '宋') return false;
      if (v.mode === '先秦/其它' && ['唐', '宋'].includes(r[2])) return false;
      return true;
    });
    if (!rows.length) return { text: '没有匹配的篇目，换个词试试。', stats: [{ label: '命中', value: 0 }] };
    const html = rows.slice(0, 40).map((r) => `<div style="padding:11px 0;border-bottom:1px solid var(--line-2)">
      <b>${L.esc(r[0])}</b> <span style="color:var(--ink-3);font-size:12px">${L.esc(r[2])}·${L.esc(r[1])}</span>
      <p style="margin:6px 0 0;line-height:1.9;color:var(--ink-2)">${L.esc(r[3])}</p></div>`).join('');
    return { html, copy: rows.slice(0, 40).map((r) => `${r[0]}｜${r[2]}·${r[1]}\n${r[3]}`).join('\n\n'), stats: [{ label: '命中篇目', value: rows.length }, { label: '内置总数', value: L.D.poetry.length }] };
  } };

S['coca-rank'] = { kind: 'form', titleIn: '查单词', titleOut: '词频与难度',
  fields: [{ id: 'w', label: '英文单词', type: 'text', default: 'important', placeholder: '一次查一个，或用空格分隔多个' }],
  primary: '复制结果', sample: { w: 'important' },
  hintOut: '离线精简版：内置约 1600 个按常用度排序的词，未收录的词会标注「超出内置词表」。真实 COCA 排名需完整语料库。',
  compute: (v) => {
    const ws = String(v.w || '').toLowerCase().split(/[\s,;]+/).filter(Boolean).slice(0, 30);
    if (!ws.length) return { text: '输入一个英文单词。' };
    const list = L.D.coca.map((x) => x.toLowerCase());
    const rows = ws.map((w) => { const i = list.indexOf(w); return [w, i < 0 ? '—' : i + 1, i < 0 ? '超出内置词表' : i < 500 ? '核心高频' : i < 1200 ? '中学/高考' : i < 2000 ? '四六级/雅思' : '进阶/学术']; });
    const html = `<table class="t-table"><thead><tr><th>单词</th><th>内置序号</th><th>难度档</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td>${L.esc(r[2])}</td></tr>`).join('')}</tbody></table>`;
    return { html, copy: rows.map((r) => r.join('\t')).join('\n'), stats: [{ label: '已查', value: rows.length }, { label: '词表规模', value: L.D.coca.length }] };
  } };

S['coca-list'] = { kind: 'form', titleIn: '选词频段', titleOut: '单词表',
  fields: [{ id: 'band', label: '难度段', type: 'select', options: ['核心高频 1–500', '中学/高考 501–1200', '四六级/雅思 1201–2000', '进阶/学术 2001+', '全部'] },
    { id: 'n', label: '最多取多少个', type: 'number', default: 100 }, { id: 'fmt', label: '输出格式', type: 'select', options: ['一行一个', '逗号分隔', 'CSV（序号,单词,档位）'] }],
  primary: '复制词表', hintOut: '离线精简版词表，导出的是内置序号而非 COCA 官方排名，适合拿来做背诵清单。',
  compute: (v) => {
    const bands = { '核心高频 1–500': [0, 500], '中学/高考 501–1200': [500, 1200], '四六级/雅思 1201–2000': [1200, 2000], '进阶/学术 2001+': [2000, 99999], '全部': [0, 99999] };
    const [a, b] = bands[v.band] || [0, 99999];
    const rows = L.D.coca.slice(a, b).slice(0, Math.max(1, Math.min(2000, Number(v.n) || 100))).map((w, i) => [a + i + 1, w, a + i < 500 ? '核心高频' : a + i < 1200 ? '中学/高考' : a + i < 2000 ? '四六级/雅思' : '进阶/学术']);
    const text = v.fmt === '逗号分隔' ? rows.map((r) => r[1]).join(', ') : v.fmt === 'CSV（序号,单词,档位）' ? L.toCSV([['序号', '单词', '档位'], ...rows]) : rows.map((r) => r[1]).join('\n');
    return { text, stats: [{ label: '词条', value: rows.length }, { label: '词表规模', value: L.D.coca.length }] };
  } };

S['coca-text'] = { kind: 'form', titleIn: '英文文章', titleOut: '难度分析', wide: false,
  fields: [{ id: 'txt', label: '粘贴英文', type: 'textarea', rows: 10, default: 'The quick brown fox jumps over the lazy dog. A good tool should be simple and useful.' },
    { id: 'band', label: '对标档位', type: 'select', options: ['高考', '四六级', '雅思托福', '母语者'] }],
  primary: '复制报告',
  hintOut: '按内置高频词表估算覆盖率，超纲词会在原文里标出来；不是官方 COCA 覆盖率。',
  compute: (v) => {
    const words = (String(v.txt || '').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []);
    const set = new Set(L.D.coca.map((x) => x.toLowerCase()));
    const cutoff = { '高考': 1200, '四六级': 2000, '雅思托福': 3000, '母语者': 99999 }[v.band] || 1200;
    const core = new Set(L.D.coca.slice(0, cutoff).map((x) => x.toLowerCase()));
    const uniqW = [...new Set(words)];
    const covered = uniqW.filter((w) => core.has(w)).length;
    const outOfBand = uniqW.filter((w) => !core.has(w) && set.has(w));
    const unknown = uniqW.filter((w) => !set.has(w));
    const rate = uniqW.length ? covered / uniqW.length * 100 : 0;
    const level = rate > 92 ? '偏易' : rate > 80 ? '适中' : rate > 65 ? '偏难' : '很难';
    const hi = (t) => t.replace(/[a-z]+(?:'[a-z]+)?/gi, (m) => {
      const w = m.toLowerCase();
      return core.has(w) ? L.esc(m) : `<mark style="background:#f6e2b8;padding:0 2px;border-radius:3px" title="${set.has(w) ? '超出对标档位' : '内置词表未收录'}">${L.esc(m)}</mark>`;
    });
    return {
      html: `<div style="line-height:2;font-size:13.5px">${hi(String(v.txt || ''))}</div>`,
      copy: `总词数 ${words.length} / 去重 ${uniqW.length}\n对标「${v.band}」覆盖率 ${rate.toFixed(1)}%（${level}）\n超纲词：${outOfBand.join(', ') || '无'}\n未收录：${unknown.join(', ') || '无'}`,
      stats: [{ label: '总词数', value: words.length }, { label: '去重词', value: uniqW.length }, { label: '覆盖率', value: rate.toFixed(1) + '%' }, { label: '难度', value: level }],
    };
  } };

S['life-guide'] = { kind: 'ref', title: '高性价比人生指南（离线精简版）', placeholder: '搜 健康 / 存钱 / 睡眠 / 效率 / 备份',
  columns: [{ label: '主题' }, { label: '建议' }, { label: '成本' }, { label: '依据' }],
  rows: R('D.lifeGuideRows'), filters: [{ label: '主题', values: ['全部', '健康', '效率', '金钱', '关系', '学习', '生活', '工作', '心理', '安全'], col: 0 }],
  note: '内置 70 余条通用建议，可搜索、可整表复制。原本 676 条 + 34 节出处需要外部语料，这里只保留了最容易立刻照做的部分。' };

S['garbage-sort'] = { kind: 'ref', title: '垃圾分类查询（上海口径）', placeholder: '搜 电池 / 外卖盒 / 奶茶 / 旧衣服 / 大骨头',
  columns: [{ label: '物品' }, { label: '分类' }, { label: '投放提示' }],
  rows: R('D.garbage'), filters: [{ label: '分类', values: ['全部', '可回收物', '湿垃圾', '干垃圾', '有害垃圾'], col: 1 }],
  note: '内置 80 余条常见物品。各地口径有差异，以当地公示为准；没搜到时按「干垃圾」兜底更稳妥。' };

S['emoji-search'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>Emoji 与符号</h2><span class="hint">点一下复制 · 内置 ${L.D.emoji.length} 项</span></div>
    <input class="t-input" id="q" type="search" placeholder="搜 笑 / 心 / 箭头 / 动物 / 庆祝 / 警告">
    <div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;margin-top:14px"></div>
    <p class="t-hint">点击复制符号，双击可收藏（仅本次会话）。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  const draw = () => {
    const k = ($('#q').value || '').trim();
    const rows = L.D.emoji.filter((r) => !k || r.join(' ').includes(k));
    $('#grid').innerHTML = rows.slice(0, 300).map((r) => `<button type="button" class="t-chip" data-e="${L.esc(r[0])}" title="${L.esc(r[1])} ${L.esc(r[2])}" style="font-size:24px;padding:8px 4px">${r[0]}</button>`).join('') || '<p class="t-hint">没找到。</p>';
  };
  $('#q').oninput = draw;
  $('#grid').onclick = (e) => { const b = e.target.closest('[data-e]'); if (b) K.copy(b.dataset.e); };
  draw();
} };

/* ============ 生活速查 ============ */
S['shoe-size'] = { kind: 'form', titleIn: '脚长与人群', titleOut: '五国鞋码',
  fields: [{ id: 'cm', label: '脚长', unit: 'cm', type: 'number', default: 25 },
    { id: 'who', label: '人群', type: 'select', options: ['成人', '儿童（比成人小 1.5 码）'] }],
  primary: '复制结果', sample: { cm: 25, who: '成人' },
  hintOut: '对照表按常见欧码换算，不同品牌楦型会差半码；量脚长请靠墙站立，取最长脚趾到脚跟。',
  compute: (v) => {
    const cm = Number(v.cm);
    if (!cm || cm < 10 || cm > 35) return { error: '脚长填 10–35 cm' };
    const shift = v.who.startsWith('儿童') ? 1.5 : 0;
    const near = L.D.shoe.reduce((a, b) => Math.abs(Number(b[0]) - cm) < Math.abs(Number(a[0]) - cm) ? b : a);
    const eu = Math.round(Number(near[1]) - shift);
    const rows = [['中国/欧码', String(eu)], ['美码 US', (Number(near[2]) - shift).toFixed(1)], ['英码 UK', (Number(near[3]) - shift).toFixed(1)], ['日码 JP', (Number(near[4]) - shift).toFixed(1)], ['脚长', cm + ' cm']];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '建议码', value: 'EU ' + eu }, { label: '脚长', value: cm + 'cm' }] };
  } };

S['clothing-size'] = { kind: 'form', titleIn: '身材数据', titleOut: '号型对照',
  fields: [{ id: 'h', label: '身高', unit: 'cm', type: 'number', default: 170 }, { id: 'b', label: '胸围', unit: 'cm', type: 'number', default: 92 },
    { id: 'w', label: '腰围', unit: 'cm', type: 'number', default: 78 },
    { id: 'sex', label: '性别版型', type: 'select', options: ['男', '女'] }, { id: 'kind', label: '品类', type: 'select', options: ['上装', '裤装'] }],
  primary: '复制结果',
  hintOut: '国标号型写法是「身高/胸围(腰围) + 体型代号」；Y 偏瘦、A 标准、B 微胖、C 偏胖。实际以品牌尺码表为准。',
  compute: (v) => {
    const h = Number(v.h), b = Number(v.b), w = Number(v.w);
    if (!h || !b || !w) return { error: '三项都要填' };
    const diff = v.kind === '上装' ? b - w : 0;
    const type = v.sex === '男' ? (diff > 16 ? 'Y' : diff > 11 ? 'A' : diff > 6 ? 'B' : 'C') : (diff > 19 ? 'Y' : diff > 14 ? 'A' : diff > 9 ? 'B' : 'C');
    const gb = `${Math.round(h / 5) * 5}/${v.kind === '上装' ? Math.round(b / 4) * 4 : Math.round(w / 4) * 4}${type}`;
    const intl = b < 88 ? 'S' : b < 96 ? 'M' : b < 104 ? 'L' : b < 112 ? 'XL' : 'XXL';
    const rows = [['国标号型', gb], ['国际码', intl], ['体型代号', type + '（' + ({ Y: '偏瘦', A: '标准', B: '微胖', C: '偏胖' })[type] + '）'], ['身高段', `${Math.round(h / 5) * 5} cm`], [v.kind === '上装' ? '胸围档' : '腰围档', `${v.kind === '上装' ? Math.round(b / 4) * 4 : Math.round(w / 4) * 4} cm`]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '国标', value: gb }, { label: '国际', value: intl }] };
  } };

S['wind-scale'] = { kind: 'ref', title: '蒲福风级对照', placeholder: '搜 台风 / 8 级 / 微风 / 风速',
  columns: [{ label: '风级' }, { label: '名称' }, { label: '风速 m/s' }, { label: '陆上现象' }, { label: '浪高 m' }],
  rows: R('D.wind'), note: '0–12 级为蒲福风级，13–17 级是台风补充分级。输入风速可在「风力换算」里自动判级。' };

S['asset-level'] = { kind: 'ref', title: '资产等级换算', placeholder: '搜 A8 / 千万 / 亿 / A4',
  columns: [{ label: '等级' }, { label: '人民币' }, { label: '数量级' }, { label: '备注' }],
  rows: R('D.assetLevel'), note: 'A 后面的数字约等于以「元」计的十的幂；A8 即 1 亿。网络俗称，不是金融术语。' };

S['purine'] = { kind: 'ref', title: '食物嘌呤查询', placeholder: '搜 啤酒 / 香菇 / 鸡胸 / 浓肉汤 / 鸡蛋',
  columns: [{ label: '食物' }, { label: '嘌呤 mg/100g' }, { label: '档位' }, { label: '建议' }],
  rows: R('D.purine'), filters: [{ label: '档位', values: ['全部', '低', '中', '中高', '高', '极高'], col: 2 }],
  note: '数值为常见参考区间，不同检测口径会浮动；痛风急性期请遵医嘱，酒精与含糖饮料对尿酸的影响不只看嘌呤。' };

S['district'] = { kind: 'ref', title: '行政区代码速查', placeholder: '搜 广东 / 11 / 浙江 / 香港',
  columns: [{ label: '省级代码' }, { label: '省 / 特别行政区' }],
  rows: R('D.phoneRegionRows'), note: '身份证前两位、行政区划代码前两位都用这张表；完整省市区级联需要更完整的区划库。' };

S['ancient-units'] = { kind: 'ref', title: '古代度量衡换算', placeholder: '搜 唐 / 尺 / 斤 / 里 / 升 / 清',
  columns: [{ label: '朝代' }, { label: '单位' }, { label: '折今制' }, { label: '今制单位' }],
  rows: R('D.ancient'), note: '历代度量衡并不统一，同一朝代不同时期也有变化；读史时按当朝口径折算，别直接套现代单位。' };

S['travel-price-scale'] = { kind: 'ref', title: '海外物价标尺', placeholder: '搜 东京 / 巴黎 / 曼谷 / 纽约',
  columns: [{ label: '城市' }, { label: '汉堡 ¥' }, { label: '咖啡 ¥' }, { label: '地铁 ¥' }, { label: '出租车 ¥' }],
  rows: R('D.travelPrice'), note: '四个锚点按常见游客消费折成人民币，用来快速判断「这地方贵不贵」；不是实时价格。' };
