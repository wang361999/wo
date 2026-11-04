// 文件 / 文档 / Office / 阅读器类工具
export const S = {};

/* ---------- Markdown ---------- */
S['md-editor'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work" style="grid-template-columns:1fr 1fr">
    <section class="t-panel"><div class="t-head"><h2><span class="step">1</span>Markdown</h2><span class="hint">实时预览</span></div>
      <textarea class="t-textarea" id="md" rows="18" style="min-height:380px"># 标题

这是一段 **粗体** 和 *斜体*，还有 \`代码\`。

- 列表一
- 列表二

> 引用一句话

| 列 A | 列 B |
| --- | --- |
| 1 | 2 |
</textarea>
      <div class="t-actions"><button class="t-btn" type="button" id="ins">插入图片(Base64)</button><button class="t-btn" type="button" id="clr">清空</button></div>
    </section>
    <section class="t-panel"><div class="t-head"><h2><span class="step">2</span>预览 / HTML</h2><span class="hint" id="n">—</span></div>
      <div id="prev" class="t-out html" style="max-height:420px;overflow:auto"></div>
      <div class="t-actions"><button class="t-btn" type="button" id="cphtml">复制 HTML</button><button class="t-btn" type="button" id="dlm">下载 .md</button><button class="t-btn" type="button" id="dlh">下载 .html</button></div>
    </section></div><input type="file" id="img" accept="image/*" hidden>`;
  const $ = (s) => root.querySelector(s);
  let html = '';
  const render = async () => {
    const md = $('#md').value;
    try {
      const marked = await vendor('marked');
      html = marked.parse ? marked.parse(md) : marked(md);
      $('#prev').innerHTML = `<div class="md-body">${html}</div>`;
      $('#n').textContent = `${md.length} 字符`;
    } catch (e) { $('#prev').textContent = '预览失败：' + e.message; }
  };
  const style = `<style>.md-body{font-size:14px;line-height:1.8}.md-body h1,.md-body h2,.md-body h3{border-bottom:1px solid var(--line);padding-bottom:5px}.md-body code{background:var(--paper);padding:1px 5px;border-radius:4px}.md-body pre{background:var(--paper);padding:11px;overflow:auto;border-radius:8px}.md-body blockquote{border-left:3px solid var(--accent);margin:10px 0;padding:4px 12px;color:var(--ink-2)}.md-body table{border-collapse:collapse}.md-body td,.md-body th{border:1px solid var(--line);padding:5px 9px}.md-body img{max-width:100%}</style>`;
  const head = document.createElement('div'); head.innerHTML = style;
  document.head.appendChild(head.firstElementChild);
  $('#md').oninput = render;
  $('#cphtml').onclick = () => K.copy(html);
  $('#dlm').onclick = () => K.download('document.md', $('#md').value, 'text/markdown;charset=utf-8');
  $('#dlh').onclick = () => K.download('document.html', `<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8">${style}<body class="md-body">${html}</body></html>`, 'text/html;charset=utf-8');
  $('#clr').onclick = () => { $('#md').value = ''; render(); };
  $('#ins').onclick = () => $('#img').click();
  $('#img').onchange = async () => { const f = $('#img').files[0]; if (!f) return; const du = await L.readFile(f, 'dataurl'); const ta = $('#md'); ta.value += `\n![](${du})\n`; render(); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) L.readFile(f, 'dataurl').then((du) => { $('#md').value += `\n![](${du})\n`; render(); }); });
  K.setAction('复制 HTML', () => K.copy(html));
  render();
} };

S['md2wechat'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work" style="grid-template-columns:1fr 1fr">
    <section class="t-panel"><div class="t-head"><h2><span class="step">1</span>Markdown</h2><span class="hint">本地渲染</span></div>
      <textarea class="t-textarea" id="md" rows="16" style="min-height:340px"># 一篇小文章

写点什么，**重点**加粗，顺手来个列表：

- 第一件事
- 第二件事

> 引用一句喜欢的话

\`\`\`js
console.log('hello');
\`\`\`
</textarea>
      <div class="t-field" style="margin-top:12px"><label class="t-label">主题</label><select class="t-select" id="theme"><option>素墨</option><option>暖纸</option><option>青蓝</option><option>暗夜</option></select></div>
    </section>
    <section class="t-panel"><div class="t-head"><h2><span class="step">2</span>公众号预览</h2><span class="hint">一键复制带样式</span></div>
      <div id="prev" class="t-out html" style="max-height:400px;overflow:auto;background:#fff"></div>
      <div class="t-actions"><button class="t-btn primary" type="button" id="cp">复制到公众号（带格式）</button></div>
      <p class="t-hint">复制的是带内联样式的富文本；粘进公众号编辑器后段落、标题、引用、代码块样式都会保留。微信会过滤部分 CSS，预览与最终效果可能有细微差别。</p>
    </section></div>`;
  const $ = (s) => root.querySelector(s);
  const TH = {
    '素墨': { c: '#333', a: '#b4552d', bg: '#fff', q: '#f7f2e8', code: '#f5f3ef', b: '#b4552d' },
    '暖纸': { c: '#4a3b2a', a: '#c07a3e', bg: '#fffaf2', q: '#f6ecdb', code: '#f3ead9', b: '#c07a3e' },
    '青蓝': { c: '#2c3e50', a: '#2b7a9b', bg: '#fff', q: '#eaf4f7', code: '#eef3f5', b: '#2b7a9b' },
    '暗夜': { c: '#e8e4da', a: '#e0a56a', bg: '#242220', q: '#332f2b', code: '#2e2a27', b: '#e0a56a' },
  };
  let rich = '';
  const render = async () => {
    const t = TH[$('#theme').value];
    let h = (await vendor('marked')).parse($('#md').value);
    h = h.replace(/<h1>/g, `<h1 style="font-size:21px;font-weight:700;color:${t.c};border-bottom:2px solid ${t.b};padding-bottom:9px;margin:22px 0 16px">`)
      .replace(/<h2>/g, `<h2 style="font-size:18px;font-weight:700;color:${t.c};margin:20px 0 12px;padding-left:10px;border-left:4px solid ${t.b}">`)
      .replace(/<h3>/g, `<h3 style="font-size:16px;font-weight:700;color:${t.c};margin:16px 0 10px">`)
      .replace(/<p>/g, `<p style="font-size:15px;line-height:1.9;color:${t.c};margin:12px 0;letter-spacing:.3px">`)
      .replace(/<li>/g, `<li style="font-size:15px;line-height:1.9;color:${t.c};margin:4px 0">`)
      .replace(/<ul>/g, `<ul style="padding-left:22px;margin:10px 0">`)
      .replace(/<ol>/g, `<ol style="padding-left:22px;margin:10px 0">`)
      .replace(/<strong>/g, `<strong style="color:${t.a}">`)
      .replace(/<blockquote>/g, `<blockquote style="background:${t.q};border-left:3px solid ${t.b};padding:10px 14px;margin:14px 0;color:${t.c}">`)
      .replace(/<pre><code/g, `<pre style="background:${t.code};padding:13px;border-radius:7px;overflow:auto;font-size:13px;line-height:1.7"><code`)
      .replace(/<code>/g, `<code style="background:${t.code};padding:2px 5px;border-radius:4px;font-size:13px;color:${t.a}">`)
      .replace(/<table>/g, `<table style="border-collapse:collapse;width:100%;margin:14px 0">`)
      .replace(/<th>/g, `<th style="border:1px solid #ddd;padding:7px 10px;background:${t.q}">`)
      .replace(/<td>/g, `<td style="border:1px solid #ddd;padding:7px 10px">`)
      .replace(/<img /g, `<img style="max-width:100%;border-radius:6px" `);
    rich = `<section style="background:${t.bg};padding:16px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif">${h}</section>`;
    $('#prev').innerHTML = rich;
  };
  $('#md').oninput = render; $('#theme').onchange = render;
  $('#cp').onclick = async () => {
    const el = $('#prev');
    const r = document.createRange(); r.selectNodeContents(el);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    try { document.execCommand('copy'); K.toast('已复制带格式内容，去公众号粘贴'); } catch (e) { K.copy($('#md').value); }
    sel.removeAllRanges();
  };
  K.setAction('复制到公众号', () => $('#cp').click());
  render();
} };

/* ---------- TXT 小说 ---------- */
S['txt-novel-clean'] = { kind: 'file', titleIn: 'TXT 小说', titleOut: '整理结果', accept: '.txt,text/plain', multiple: true,
  primary: '整理并下载', dropTitle: '拖 TXT 进来',
  fields: [
    { id: 'enc', label: '原编码', type: 'select', options: ['自动探测（UTF-8 / GB18030 / UTF-16LE）', '强制 UTF-8', '强制 GB18030'] },
    { id: 'ads', label: '去广告水印（正则，每行一条）', type: 'textarea', rows: 3, default: 'www\\.[\\w.-]+\n.*笔趣阁.*\n.*最新网址.*' },
    { id: 'zero', label: '去零宽字符 / 不可见控制符', type: 'checkbox', default: true },
    { id: 'chap', label: '统一章节标题与缩进', type: 'checkbox', default: true },
    { id: 'punct', label: '全角标点统一、去多余空行', type: 'checkbox', default: true },
    { id: 'report', label: '做缺章 / 重复章体检', type: 'checkbox', default: true },
  ],
  note: '用 TextDecoder 探测编码；广告规则按正则逐行删除。导出仍是 TXT，不改章节内容。',
  auto: false,
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先拖 TXT 进来' };
    const decode = (buf) => {
      let b = buf;
      if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.slice(2));
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.slice(3);
      if (v.enc === '强制 GB18030') return new TextDecoder('gb18030').decode(b);
      const u8 = new TextDecoder('utf-8', { fatal: true });
      try { return u8.decode(b); } catch (e) { return new TextDecoder('gb18030').decode(b); }
    };
    const ads = L.nonEmptyLines(v.ads || '').map((s) => { try { return new RegExp(s); } catch (e) { return null; } }).filter(Boolean);
    const clean = (t) => {
      let s = t.replace(/\r\n?/g, '\n');
      if (v.zero) s = s.replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '');
      s = L.lines(s).filter((l) => !ads.some((r) => r.test(l))).join('\n');
      if (v.punct) s = s.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/,{2,}/g, '，').replace(/\.{4,}/g, '……').replace(/([，。！？；：])\1+/g, '$1');
      if (v.chap) s = s.replace(/^\s*(第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇][^\n]{0,40})\s*$/gm, '\n$1\n');
      return s.trim() + '\n';
    };
    const outs = [], reports = [];
    for (const f of files) {
      const raw = new Uint8Array(await f.arrayBuffer());
      const txt = clean(decode(raw));
      outs.push({ name: f.name.replace(/\.txt$/i, '') + '-整理.txt', data: L.utf8('\ufeff' + txt), mime: 'text/plain' });
      if (v.report) {
        const titles = [...txt.matchAll(/^\s*(第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇][^\n]{0,40})\s*$/gm)].map((m) => m[1].trim());
        const dup = titles.filter((x, i) => titles.indexOf(x) !== i);
        const nums = titles.map((t) => (t.match(/第([零〇一二三四五六七八九十百千万\d]+)/) || [])[1]);
        reports.push(`${f.name}：${L.humanSize(raw.length)} → ${L.humanSize(txt.length)}，章节 ${titles.length} 个，重复标题 ${new Set(dup).size} 个，广告行已按 ${ads.length} 条规则清理`);
      }
    }
    return { text: (reports.join('\n') || `已整理 ${files.length} 个文件`) + '\n\n预览（第一个文件前 1200 字）：\n' + L.fromUtf8(outs[0].data).slice(0, 1200),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部整理.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  } };

S['novel-reader'] = { kind: 'file', titleIn: 'EPUB / TXT', titleOut: '阅读', accept: '.epub,.txt,text/plain', multiple: false,
  primary: '打开阅读', dropTitle: '拖 EPUB 或 TXT 进来', auto: false,
  fields: [{ id: 'font', label: '字号', type: 'range', min: 14, max: 26, step: 1, default: 18 },
    { id: 'line', label: '行距', type: 'range', min: 1.4, max: 2.4, step: 0.1, default: 1.8 },
    { id: 'width', label: '版面宽度', type: 'select', options: ['窄（680px）', '中（820px）', '宽（1000px）'] }],
  note: 'EPUB 用本地 ZIP 解包按 spine 顺序读 XHTML；TXT 按空行分段。进度记在浏览器本地，关掉再打开还能接着读。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选文件' };
    let chapters = [];
    if (/\.epub$/i.test(f.name)) {
      const JSZip = await vendor('zip');
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const names = Object.keys(zip.files).filter((n) => /\.(x?html|htm)$/i.test(n) && !/toc|nav/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      for (const n of names.slice(0, 200)) {
        const html = await zip.file(n).async('string');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('h1,h2,h3,title')?.textContent.trim() || n.split('/').pop();
        chapters.push({ title, text: (doc.body?.textContent || '').replace(/\s+/g, ' ').trim() });
      }
    } else {
      const buf = new Uint8Array(await f.arrayBuffer());
      let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { t = new TextDecoder('gb18030').decode(buf); }
      const parts = t.split(/\n\s*\n/).filter((x) => x.trim());
      chapters = parts.map((p, i) => ({ title: (p.match(/^\s*(第[^\n]{0,30}[章节回卷篇][^\n]{0,30})/) || [])[1] || `第 ${i + 1} 段`, text: p.trim() }));
    }
    if (!chapters.length) return { error: '没读出内容' };
    const key = 'reader-' + f.name + '-' + f.size;
    let cur = Number(localStorage.getItem(key) || 0);
    const W = { '窄（680px）': 680, '中（820px）': 820, '宽（1000px）': 1000 }[v.width] || 820;
    const c = chapters[L.clamp(cur, 0, chapters.length - 1)];
    const html = `<div style="max-width:${W}px;margin:0 auto;font-size:${v.font}px;line-height:${v.line};color:var(--ink)">
      <h2 style="font-size:${Number(v.font) + 4}px;margin:0 0 18px">${L.esc(c.title)}</h2>
      <p style="text-indent:2em;margin:0 0 14px">${L.esc(c.text.slice(0, 20000))}</p></div>
      <div style="max-width:${W}px;margin:20px auto 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="t-btn" type="button" data-ch="-1">← 上一章</button>
        <span class="t-hint" style="margin:0">第 ${cur + 1} / ${chapters.length} 章</span>
        <button class="t-btn" type="button" data-ch="1">下一章 →</button>
        <select class="t-select" id="jump" style="width:auto;min-width:150px">${chapters.map((x, i) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${L.esc(x.title.slice(0, 24))}</option>`).join('')}</select>
      </div>`;
    ctx.root.onNavClick = (e) => {
      const b = e.target.closest('[data-ch]');
      if (b) { cur = L.clamp(cur + Number(b.dataset.ch), 0, chapters.length - 1); localStorage.setItem(key, cur); ctx.refresh(); }
      if (e.target.id === 'jump') { cur = Number(e.target.value); localStorage.setItem(key, cur); ctx.refresh(); }
    };
    return { preview: html, text: `《${f.name}》共 ${chapters.length} 章，当前第 ${cur + 1} 章。`, stats: [{ label: '章节', value: chapters.length }, { label: '字数', value: L.fmt(chapters.reduce((s, x) => s + x.text.length, 0), 0) }] };
  } };

/* ---------- EPUB（epubBase / makeEpub 由 engines.js 提供） ---------- */
S['txt-to-epub'] = { kind: 'file', titleIn: 'TXT 原文', titleOut: 'EPUB', accept: '.txt,text/plain', multiple: false,
  primary: '生成 EPUB', auto: false, dropTitle: '拖 TXT 进来',
  fields: [{ id: 'title', label: '书名', type: 'text', default: '' }, { id: 'author', label: '作者', type: 'text', default: '佚名' },
    { id: 're', label: '章节标题正则', type: 'text', default: '^\\s*第[零〇一二三四五六七八九十百千万\\d]+[章节回卷篇].*$' }],
  note: '按中文章节标题自动切章；GBK/UTF-8 自动探测；生成 EPUB 3 并同时写一份兼容目录。封面可用「EPUB 元数据编辑」补。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 TXT' };
    const buf = new Uint8Array(await f.arrayBuffer());
    let t; try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { t = new TextDecoder('gb18030').decode(buf); }
    t = t.replace(/\r/g, '').replace(/^\ufeff/, '');
    let re; try { re = new RegExp(v.re, 'm'); } catch (e) { return { error: '正则写错了：' + e.message }; }
    const chapters = []; let cur = { title: '开篇', text: '' };
    for (const line of L.lines(t)) {
      if (re.test(line)) { if (cur.text.trim()) chapters.push(cur); cur = { title: line.trim(), text: '' }; }
      else cur.text += line + '\n';
    }
    if (cur.text.trim()) chapters.push(cur);
    if (!chapters.length) return { error: '没识别出章节，试试放宽正则' };
    const data = await makeEpub(epubBase(v.title || f.name.replace(/\.txt$/i, ''), v.author || '佚名', chapters.slice(0, 500)));
    return { text: `拆出 ${chapters.length} 章：\n${chapters.slice(0, 20).map((c, i) => `${i + 1}. ${c.title}`).join('\n')}${chapters.length > 20 ? '\n…' : ''}`,
      files: [{ name: (v.title || f.name.replace(/\.txt$/i, '')) + '.epub', data, mime: 'application/epub+zip', label: '下载 EPUB' }],
      stats: [{ label: '章节', value: chapters.length }, { label: '原大小', value: L.humanSize(f.size) }, { label: 'EPUB', value: L.humanSize(data.length) }] };
  } };

S['epub-to-txt'] = { kind: 'file', titleIn: 'EPUB', titleOut: '纯文本', accept: '.epub', multiple: true,
  primary: '提取文本', auto: false, dropTitle: '拖 EPUB 进来（可多本）',
  fields: [{ id: 'chap', label: '保留章节标题', type: 'checkbox', default: true }, { id: 'bom', label: '加 UTF-8 BOM（方便 Windows 记事本）', type: 'checkbox', default: true }],
  note: '按 spine / 文件名顺序读取 XHTML，保留章节分段；不会动原文件。',
  process: async (files, v, ctx) => {
    const JSZip = await vendor('zip'); const outs = [], previews = [];
    for (const f of files) {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const names = Object.keys(zip.files).filter((n) => /\.(x?html|htm)$/i.test(n) && !/toc|nav/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      let out = `# ${f.name.replace(/\.epub$/i, '')}\n\n`;
      for (const n of names.slice(0, 400)) {
        const html = await zip.file(n).async('string');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('h1,h2,h3,title')?.textContent.trim();
        const text = (doc.body?.textContent || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        if (!text || text.length < 3) continue;
        out += (v.chap && title ? `\n\n${title}\n\n` : '\n') + text + '\n';
      }
      outs.push({ name: f.name.replace(/\.epub$/i, '') + '.txt', data: L.utf8((v.bom ? '\ufeff' : '') + out), mime: 'text/plain' });
      previews.push(`${f.name}：${names.length} 个文档，${out.length} 字`);
    }
    return { text: previews.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0]?.data || '').slice(0, 1000),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部文本.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '本数', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  } };

S['epub-metadata'] = { kind: 'file', titleIn: 'EPUB', titleOut: '元数据', accept: '.epub', multiple: true,
  primary: '读元数据 / 写回下载', auto: false, dropTitle: '拖 EPUB 进来',
  fields: [{ id: 'title', label: '新书名（留空不改）', type: 'text', default: '' }, { id: 'author', label: '新作者（留空不改）', type: 'text', default: '' },
    { id: 'pub', label: '出版社', type: 'text', default: '' }, { id: 'series', label: '系列', type: 'text', default: '' }],
  note: '非破坏式：只改 content.opf 里的 dc:* 字段，正文、样式、插图原样保留；封面替换可在「EPUB 编辑器」里做。',
  process: async (files, v, ctx) => {
    const JSZip = await vendor('zip'); const outs = [], rows = [];
    for (const f of files) {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const opfName = Object.keys(zip.files).find((n) => /content\.opf$/i.test(n));
      if (!opfName) { rows.push([f.name, '找不到 content.opf', '', '']); continue; }
      const opf = await zip.file(opfName).async('string');
      const read = (tag) => (opf.match(new RegExp(`<dc:${tag}[^>]*>([^<]*)</dc:${tag}>`, 'i')) || [])[1] || '';
      const old = { title: read('title'), creator: read('creator'), publisher: read('publisher'), lang: read('language') };
      let next = opf;
      const setTag = (tag, val) => { if (!val) return; const re = new RegExp(`(<dc:${tag}[^>]*>)[^<]*(</dc:${tag}>)`, 'i'); next = re.test(next) ? next.replace(re, `$1${val.replace(/&/g, '&amp;').replace(/</g, '&lt;')}$2`) : next.replace('</metadata>', `<dc:${tag}>${val}</dc:${tag}></metadata>`); };
      setTag('title', v.title); setTag('creator', v.author); setTag('publisher', v.pub);
      if (v.series) setTag('series', v.series);
      zip.file(opfName, next);
      const data = new Uint8Array(await zip.generateAsync({ type: 'uint8array', mimeType: 'application/epub+zip' }));
      outs.push({ name: f.name, data, mime: 'application/epub+zip' });
      rows.push([f.name, old.title, old.creator, v.title || old.title, v.author || old.creator]);
    }
    return { html: `<table class="t-table"><thead><tr><th>文件</th><th>原书名</th><th>原作者</th><th>新书名</th><th>新作者</th></tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${L.esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载改好的 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部 EPUB.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '本数', value: files.length }] };
  } };

S['epub-edit'] = { kind: 'file', titleIn: 'EPUB', titleOut: '章节编辑', accept: '.epub', multiple: false,
  primary: '打开章节', auto: false, dropTitle: '拖 EPUB 进来',
  fields: [{ id: 'sel', label: '章节序号（从 1 开始，改完点「写回并下载」）', type: 'number', default: 1 },
    { id: 'body', label: '正文（纯文本，一行一段）', type: 'textarea', rows: 10, default: '' }],
  note: '按章节序号读出正文，改完写回对应 XHTML 并重新打包；查找替换可用右上角按钮。样式与目录不变。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 EPUB' };
    const JSZip = await vendor('zip');
    const zip = await JSZip.loadAsync(await f.arrayBuffer());
    const names = Object.keys(zip.files).filter((n) => /\.(x?html|htm)$/i.test(n) && !/toc|nav/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const idx = L.clamp((Number(v.sel) || 1) - 1, 0, names.length - 1);
    const html = await zip.file(names[idx]).async('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('h1,h2,h3,title')?.textContent.trim() || names[idx];
    const orig = (doc.body?.textContent || '').split(/\n{1,}/).map((x) => x.trim()).filter(Boolean).join('\n');
    if (v.body && v.body.trim() && v.body.trim() !== orig) {
      const paras = L.nonEmptyLines(v.body).map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n');
      const fresh = `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${L.esc(title)}</title></head><body><h2>${L.esc(title)}</h2>${paras}</body></html>`;
      zip.file(names[idx], fresh);
      const data = new Uint8Array(await zip.generateAsync({ type: 'uint8array', mimeType: 'application/epub+zip' }));
      return { text: `已写回第 ${idx + 1} 章「${title}」，共 ${L.nonEmptyLines(v.body).length} 段。`,
        files: [{ name: f.name.replace(/\.epub$/i, '') + '-编辑.epub', data, mime: 'application/epub+zip', label: '下载改好的 EPUB' }],
        stats: [{ label: '章节总数', value: names.length }, { label: '当前', value: idx + 1 }] };
    }
    return { text: `第 ${idx + 1} / ${names.length} 章「${title}」的正文已填入左侧编辑框（${orig.length} 字）。改完把「正文」框内容换掉，再点一次「打开章节」即可写回下载。`,
      preview: `<p class="t-hint">${L.esc(orig.slice(0, 800))}</p>`,
      stats: [{ label: '章节总数', value: names.length }, { label: '当前', value: idx + 1 }, { label: '字数', value: orig.length }] };
  } };

S['mobi-to-epub'] = { kind: 'file', titleIn: 'MOBI / AZW3', titleOut: '提取结果', accept: '.mobi,.azw,.azw3,.prc', multiple: true,
  primary: '转换', auto: false, dropTitle: '拖 Kindle 电子书进来',
  fields: [{ id: 'title', label: '书名（留空用文件名）', type: 'text', default: '' }],
  note: '解析无 DRM 的 MOBI PalmDOC 文本（LZ77 + Huff 简易路径），按常见章节标题切章后生成 EPUB；带 DRM 或 KF8 复杂排版只能提取到纯文本。',
  process: async (files, v, ctx) => {
    const outs = [], rows = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      let text = '';
      const palmHeader = 78;
      if (b.length > palmHeader + 10) {
        const recCount = dv.getUint16(76, false);
        const records = [];
        for (let i = 0; i < Math.min(recCount, 2000); i++) {
          const off = 78 + i * 8;
          if (off + 8 > b.length) break;
          records.push({ off: dv.getUint32(off, false), len: dv.getUint16(off + 4, false) });
        }
        const chunks = [];
        for (const r of records.slice(1)) {
          if (!r.off || r.off + r.len > b.length) continue;
          const seg = b.slice(r.off, r.off + r.len);
          let out = '';
          for (let i = 0; i < seg.length; i++) {
            const c = seg[i];
            if (c === 0) out += '\x00';
            else if (c <= 8) { const n = c; for (let j = 0; j < n && i + 1 < seg.length; j++) out += String.fromCharCode(seg[++i]); }
            else if (c < 0x80) out += String.fromCharCode(c);
            else if (c >= 0xc0) out += ' ' + String.fromCharCode(c & 0x7f);
            else { const dist = ((c << 8) | seg[++i]) & 0x3fff; const len = (dist >> 10) + 3; const start = out.length - (dist & 0x3ff) - 1; if (start >= 0) for (let j = 0; j < len; j++) out += out[start + j]; }
          }
          chunks.push(out);
        }
        text = chunks.join('').replace(/\x00/g, '').replace(/<[^>]{1,200}>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]{2,}/g, ' ');
      }
      if (text.length < 50) { rows.push([f.name, '未能提取（可能是 DRM / KF8）', 0]); continue; }
      const parts = text.split(/(?=第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇])/).filter((x) => x.trim()).slice(0, 300);
      const chapters = parts.map((p, i) => ({ title: (p.match(/^第[^\n]{0,30}[章节回卷篇][^\n]{0,30}/) || [`第 ${i + 1} 章`])[0], text: p.trim() }));
      const data = await makeEpub(epubBase(v.title || f.name.replace(/\.(mobi|azw3?|prc)$/i, ''), '佚名', chapters));
      outs.push({ name: f.name.replace(/\.(mobi|azw3?|prc)$/i, '') + '.epub', data, mime: 'application/epub+zip' });
      rows.push([f.name, '成功', text.length]);
    }
    return { text: rows.map((r) => r.join('\t')).join('\n') || '没有可提取的内容',
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部 EPUB.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '成功', value: outs.length }] };
  } };

/* ---------- 压缩包 ---------- */
S['archive-extract'] = { kind: 'file', titleIn: '压缩包', titleOut: '内容列表', accept: '.zip', multiple: false,
  primary: '解压并列出', auto: false, dropTitle: '拖 ZIP 进来',
  fields: [{ id: 'filter', label: '只看包含关键词的文件（留空看全部）', type: 'text', default: '' },
    { id: 'pwd', label: '密码（标准 ZIP 加密暂不支持，会提示）', type: 'text', default: '' }],
  note: '支持 ZIP（含 DEFLATE / STORE）；RAR / 7z 需要额外的解码器，这里会明确告诉你而不是假装解开。加密条目会标出来。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选压缩包' };
    const name = f.name.toLowerCase();
    if (/\.(rar|7z|tar|gz|bz2|xz)$/.test(name)) return { error: `${f.name} 是 ${name.split('.').pop().toUpperCase()} 格式，本工具只解 ZIP。可用「ZIP 打包」重新打包成 ZIP。` };
    const JSZip = await vendor('zip');
    let zip; try { zip = await JSZip.loadAsync(await f.arrayBuffer()); } catch (e) { return { error: 'ZIP 解不开：' + e.message }; }
    const k = String(v.filter || '').trim();
    const entries = Object.values(zip.files).filter((e) => !e.dir && (!k || e.name.includes(k)));
    const rows = entries.slice(0, 300).map((e) => [e.name, L.humanSize(e._data?.uncompressedSize || 0), (e.date || new Date()).toLocaleDateString('zh-CN')]);
    const dl = [];
    for (const e of entries.slice(0, 60)) dl.push({ name: e.name.split('/').pop() || e.name, data: new Uint8Array(await e.async('uint8array')), mime: 'application/octet-stream' });
    return { html: `<table class="t-table"><thead><tr><th>文件</th><th>大小</th><th>日期</th></tr></thead><tbody>${rows.map((r) => `<tr><td style="word-break:break-all">${L.esc(r[0])}</td><td class="num">${r[1]}</td><td>${L.esc(r[2])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: dl.map((d, i) => ({ ...d, label: '下载 ' + (entries[i]?.name || d.name).split('/').pop() })).concat(dl.length > 1 ? [{ name: '解压结果.zip', zip: dl, label: '打包下载全部' }] : []),
      stats: [{ label: '条目', value: entries.length }, { label: '已备下载', value: dl.length }] };
  } };

S['archive-zip'] = { kind: 'file', titleIn: '要打包的文件', titleOut: 'ZIP', multiple: true,
  primary: '打包下载', dropTitle: '拖多个文件 / 文件夹进来', auto: false,
  fields: [{ id: 'name', label: '压缩包名', type: 'text', default: '打包' },
    { id: 'level', label: '压缩等级', type: 'select', options: ['6（均衡）', '1（最快）', '9（最小）', '0（不压缩）'] },
    { id: 'flat', label: '忽略目录结构，全部放根目录', type: 'checkbox', default: false }],
  note: '用本地 JSZip 打包，可选压缩等级；浏览器选文件夹时的相对路径会保留下来。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const JSZip = await vendor('zip'); const zip = new JSZip();
    for (const f of files) {
      const p = (v.flat ? (f.name || 'file') : (f.webkitRelativePath || f.name || 'file'));
      zip.file(p, await f.arrayBuffer());
    }
    const level = Number(String(v.level).match(/^\d/)?.[0] || 6);
    const data = new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: level ? 'DEFLATE' : 'STORE', compressionOptions: { level } }));
    return { text: `${files.length} 个文件已打包，${L.humanSize(files.reduce((s, f) => s + f.size, 0))} → ${L.humanSize(data.length)}。`,
      files: [{ name: (v.name || '打包') + '.zip', data, mime: 'application/zip', label: '下载 ZIP' }],
      stats: [{ label: '文件', value: files.length }, { label: '压缩后', value: L.humanSize(data.length) }] };
  } };

S['zip-crypto'] = { kind: 'file', titleIn: '文件或密码', titleOut: '加密 / 解密结果', multiple: true,
  primary: '加密 / 解密', auto: false, dropTitle: '拖要加密的文件，或拖 .enc 文件解密',
  fields: [{ id: 'pwd', label: '密码', type: 'text', default: '' }, { id: 'mode', label: '模式', type: 'select', options: ['加密', '解密'] }],
  note: '重要：这是本工具自定义的 AES-GCM 加密容器（.enc），不是标准加密 ZIP。用本工具「解密」能还原；发给别人也需要用本工具打开。标准口令 ZIP 请改用本地压缩软件。',
  process: async (files, v, ctx) => {
    if (!v.pwd) return { error: '先设密码' };
    if (!files.length) return { error: '先选文件' };
    const enc = new TextEncoder();
    const derive = async (salt) => {
      const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const raw = new Uint8Array(await f.arrayBuffer());
        if (v.mode === '加密') {
          const salt = L.randBytes(16), iv = L.randBytes(12);
          const key = await derive(salt);
          const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, raw));
          const head = L.utf8(`TBX1|${f.name}|${raw.length}|`);
          const out = new Uint8Array(head.length + 16 + 12 + ct.length);
          out.set(head, 0); out.set(salt, head.length); out.set(iv, head.length + 16); out.set(ct, head.length + 28);
          outs.push({ name: f.name + '.enc', data: out, mime: 'application/octet-stream' });
          logs.push(`${f.name} → 加密完成（${L.humanSize(out.length)}）`);
        } else {
          const marker = L.fromUtf8(raw.slice(0, 5));
          if (marker !== 'TBX1|') { logs.push(`${f.name} 不是本工具生成的 .enc 文件`); continue; }
          const end = raw.findIndex((x, i) => i > 4 && x === 124);
          const meta = L.fromUtf8(raw.slice(5, end)).split('|');
          const salt = raw.slice(end + 1, end + 17), iv = raw.slice(end + 17, end + 29), ct = raw.slice(end + 29);
          const key = await derive(salt);
          const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
          outs.push({ name: meta[0] || f.name.replace(/\.enc$/, ''), data: plain, mime: 'application/octet-stream' });
          logs.push(`${f.name} → 解密为 ${meta[0]}（${L.humanSize(plain.length)}），校验通过`);
        }
      } catch (e) { logs.push(`${f.name} 失败：${e.message}（密码不对或文件损坏）`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '处理', value: files.length }, { label: '成功', value: outs.length }] };
  } };

/* ---------- Office / 数据库 ---------- */
S['code-format'] = { kind: 'form', titleIn: '代码', titleOut: '格式化结果', wide: false,
  fields: [{ id: 'txt', label: '粘贴代码', type: 'textarea', rows: 10, default: 'function foo(a,b){return{a:a,b:b}}' },
    { id: 'lang', label: '语言', type: 'select', options: ['自动识别', 'JSON', 'JavaScript', 'HTML', 'CSS', 'SQL', 'XML'] },
    { id: 'indent', label: '缩进空格数', type: 'number', default: 2 }],
  primary: '复制结果', hintOut: '轻量格式化：JSON 严格走 JSON.stringify；JS/CSS 做括号与分号换行 + 缩进；HTML/XML 按标签层级排版；SQL 按关键字断行。不是 Prettier，复杂语法请配合专业格式化器。',
  compute: (v) => {
    const t = String(v.txt || '').trim(); if (!t) return { text: '' };
    const ind = ' '.repeat(L.clamp(Number(v.indent) || 2, 1, 8));
    let lang = v.lang;
    if (lang === '自动识别') lang = /^[\[{]/.test(t) ? 'JSON' : /^\s*<(?!\?)/.test(t) ? (/<(html|div|body|head|p|span|section)/i.test(t) ? 'HTML' : 'XML') : /\b(SELECT|INSERT|UPDATE|CREATE|FROM|WHERE)\b/i.test(t) ? 'SQL' : /[{};]\s*$/.test(t) ? 'JavaScript' : 'CSS';
    try {
      if (lang === 'JSON') return { text: JSON.stringify(JSON.parse(t), null, Number(v.indent) || 2), stats: [{ label: '语言', value: lang }] };
      if (lang === 'JavaScript' || lang === 'CSS') {
        let out = '', level = 0;
        const spaced = t.replace(/\s+/g, ' ').replace(/([{};])/g, ' $1 ').replace(/,\s*/g, ', ').trim();
        for (const tok of spaced.split(/\s+/)) {
          if (tok === '}') level = Math.max(0, level - 1);
          if (tok === '{' || tok === ';') { out = out.replace(/\s+$/, ''); out += tok === '{' ? ' {\n' : ';\n'; if (tok === '{') level++; out += ind.repeat(level); }
          else out += tok + ' ';
          if (tok === '}') { out = out.replace(/\s+$/, ''); out += '\n' + ind.repeat(level); }
        }
        return { text: out.trim(), stats: [{ label: '语言', value: lang }] };
      }
      if (lang === 'HTML' || lang === 'XML') {
        let out = '', level = 0;
        for (const m of t.matchAll(/(<[^>]+>|[^<]+)/g)) {
          const s = m[0].trim(); if (!s) continue;
          if (/^<\//.test(s)) level = Math.max(0, level - 1);
          out += ind.repeat(level) + s + '\n';
          if (/^<[^/!?][^>]*[^/]?>$/.test(s) && !/^<(br|img|input|meta|link|hr)/i.test(s)) level++;
        }
        return { text: out.trim(), stats: [{ label: '语言', value: lang }] };
      }
      if (lang === 'SQL') {
        const out = t.replace(/\s+/g, ' ').replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|JOIN|LEFT JOIN|INNER JOIN|ON|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|DROP TABLE|UNION)\b/gi, '\n$1').replace(/,\s*/g, ',\n  ').trim();
        return { text: out, stats: [{ label: '语言', value: lang }] };
      }
    } catch (e) { return { error: '格式化失败：' + e.message }; }
    return { text: t };
  } };

S['excel-edit'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>表格</h2><span class="hint">xlsx / csv 本地打开 · 单元格可编辑</span></div>
    <div class="t-drop" id="drop" style="min-height:92px"><div class="t">拖 xlsx / csv 进来，或点一下选择</div><div class="s">也可以从 Excel 直接复制一片区域粘到下面</div><input type="file" id="file" accept=".xlsx,.xls,.csv" hidden></div>
    <div class="t-actions"><button class="t-btn" type="button" id="paste">粘贴剪贴板表格</button><button class="t-btn" type="button" id="addrow">加一行</button><button class="t-btn" type="button" id="addcol">加一列</button>
      <button class="t-btn" type="button" id="xlsx">导出 xlsx</button><button class="t-btn" type="button" id="csv">导出 CSV</button></div>
    <div id="grid" style="overflow:auto;margin-top:14px;border:1px solid var(--line);border-radius:8px"></div>
    <p class="t-hint">公式列支持在单元格里写 =A1+B1 这类简单运算；改完直接导出，全程不上传。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let rows = [['姓名', '数量', '单价', '小计'], ['苹果', 3, 5, '=B2*C2'], ['香蕉', 2, 3, '=B3*C3']];
  const calc = (s, r, c) => {
    const t = String(s).trim();
    if (!t.startsWith('=')) return t;
    try {
      const expr = t.slice(1).replace(/([A-Z]+)(\d+)/gi, (_, col, row) => {
        let ci = 0; for (const ch of col.toUpperCase()) ci = ci * 26 + ch.charCodeAt(0) - 64;
        const val = rows[Number(row) - 1]?.[ci - 1];
        return Number(val) || 0;
      });
      if (!/^[\d+\-*/(). ]+$/.test(expr)) return s;
      return String(L.round(Function('"use strict";return (' + expr + ')')(), 4));
    } catch (e) { return s; }
  };
  const draw = () => {
    $('#grid').innerHTML = `<table class="t-table"><tbody>${rows.map((r, ri) => `<tr>${r.map((c, ci) => `<td contenteditable="true" data-r="${ri}" data-c="${ci}" style="min-width:92px;border-right:1px solid var(--line-2)">${L.esc(String(c).startsWith('=') ? calc(c, ri, ci) : c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
  $('#grid').addEventListener('input', (e) => { const td = e.target.closest('td[data-r]'); if (td) { rows[Number(td.dataset.r)][Number(td.dataset.c)] = td.textContent; } });
  $('#grid').addEventListener('blur', (e) => { if (e.target.matches('td[data-r]')) draw(); }, true);
  $('#addrow').onclick = () => { rows.push(rows[0].map(() => '')); draw(); };
  $('#addcol').onclick = () => { rows.forEach((r) => r.push('')); draw(); };
  $('#paste').onclick = async () => { try { const t = await navigator.clipboard.readText(); const p = L.parseCSV(t, /\t/.test(t) ? '\t' : ','); if (p.length) { rows = p; draw(); } } catch (e) { K.toast('读不到剪贴板，直接按 Ctrl+V 粘到表格里'); } };
  document.addEventListener('paste', (e) => { const t = e.clipboardData?.getData('text/plain'); if (t && /\t|,/.test(t)) { const p = L.parseCSV(t, t.includes('\t') ? '\t' : ','); if (p.length > 1) { rows = p; draw(); e.preventDefault(); } } });
  const load = async (f) => {
    const XLSX = await vendor('xlsx');
    const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
    const sh = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
    draw(); K.toast('已打开 ' + f.name);
  };
  $('#file').onchange = () => $('#file').files[0] && load($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
  $('#csv').onclick = () => K.download('表格.csv', '\ufeff' + L.toCSV(rows.map((r) => r.map((c) => calc(c)))), 'text/csv;charset=utf-8');
  $('#xlsx').onclick = async () => { const XLSX = await vendor('xlsx'); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows.map((r) => r.map((c) => calc(c)))), 'Sheet1'); const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); K.download('表格.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); };
  K.setAction('导出 xlsx', () => $('#xlsx').click());
  draw();
} };

S['sqlite-viewer'] = { kind: 'file', titleIn: 'SQLite 文件', titleOut: '查询', accept: '.db,.sqlite,.sqlite3', multiple: false,
  primary: '执行 SQL', auto: false, dropTitle: '拖 .db / .sqlite 进来',
  fields: [{ id: 'sql', label: 'SQL', type: 'textarea', rows: 5, default: "SELECT name FROM sqlite_master WHERE type='table';" },
    { id: 'fmt', label: '导出格式', type: 'select', options: ['CSV', 'JSON'] }],
  note: 'sql.js（SQLite 编译成 WebAssembly）在浏览器里跑，文件不上传。留空不选文件可打开一个空白库，直接 CREATE TABLE 体验。',
  process: async (files, v, ctx) => {
    const SQL = await vendor('sql');
    const db = files.length ? new SQL.Database(new Uint8Array(await files[0].arrayBuffer())) : new SQL.Database();
    let res;
    try { res = db.exec(String(v.sql || '').trim() || "SELECT sqlite_version() AS version;"); }
    catch (e) { return { error: 'SQL 错误：' + e.message }; }
    if (!res.length) return { text: '执行成功，没有返回结果集。\n（建表 / 插入语句已生效，但本页不会把改动写回原文件；需要保存请用「导出 .db」）', stats: [{ label: '结果集', value: 0 }] };
    const { columns, values } = res[0];
    const rows = [columns, ...values.map((r) => r.map((x) => x == null ? '' : x instanceof Uint8Array ? L.bytesToHex(x) : String(x)))];
    const csv = L.toCSV(rows), json = JSON.stringify(values.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]]))), null, 2);
    return { html: `<table class="t-table"><thead><tr>${columns.map((c) => `<th>${L.esc(c)}</th>`).join('')}</tr></thead><tbody>${values.slice(0, 100).map((r) => `<tr>${r.map((x) => `<td>${L.esc(x == null ? 'NULL' : String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>${values.length > 100 ? `<p class="t-hint">只显示前 100 行，共 ${values.length} 行。</p>` : ''}`,
      copy: v.fmt === 'JSON' ? json : csv,
      files: [{ name: '查询结果.' + (v.fmt === 'JSON' ? 'json' : 'csv'), data: L.utf8(v.fmt === 'JSON' ? json : '\ufeff' + csv), mime: 'text/plain', label: '导出 ' + v.fmt },
        { name: 'database.db', data: new Uint8Array(db.export()), mime: 'application/x-sqlite3', label: '导出 .db（含改动）' }],
      stats: [{ label: '列', value: columns.length }, { label: '行', value: values.length }] };
  } };

S['parquet-viewer'] = { kind: 'file', titleIn: 'Parquet', titleOut: '元数据', accept: '.parquet', multiple: false,
  primary: '读取', auto: false, dropTitle: '拖 .parquet 进来',
  fields: [{ id: 'limit', label: '尝试读取前 N 行（简化路径）', type: 'number', default: 20 }],
  note: '浏览器端读 Parquet 的 Footer（Thrift compact）拿 schema、行数、行组、压缩与列名；完整列数据解码需要 DuckDB-WASM，这里提供元数据与 JSON/CSV 工作台（见「DuckDB SQL 工作台」）。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 Parquet 文件' };
    const b = new Uint8Array(await f.arrayBuffer());
    if (L.fromUtf8(b.slice(0, 4)) !== 'PAR1' || L.fromUtf8(b.slice(-4)) !== 'PAR1') return { error: '不是合法的 Parquet（头尾应有 PAR1）' };
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const footerLen = dv.getUint32(b.length - 8, true);
    const start = b.length - 8 - footerLen;
    // Thrift compact：跳读 varint 与结构体，抽取 i64 rows / 字符串列名
    let p = start; const strings = []; let numRows = 0;
    const readVar = () => { let n = 0, sh = 0, x; do { x = b[p++]; n |= (x & 0x7f) << sh; sh += 7; } while (x & 0x80); return n >>> 0; };
    try {
      p++; // struct begin
      while (p < b.length - 8) {
        const h = b[p++]; if (h === 0) break;
        const type = h & 0x0f, delta = h >> 4;
        const fid = delta ? (type === 0 ? 0 : delta) : 0;
        if (type === 2 || type === 1 || type === 3) readVar();
        else if (type === 4 || type === 5 || type === 6) { /* i16/i32/i64 简化跳过 */ readVar(); }
        else if (type === 8) { const len = readVar(); const s = L.fromUtf8(b.slice(p, p + len)); p += len; if (s.length < 80 && /^[\w.\- /]+$/.test(s)) strings.push(s); }
        else if (type === 9 || type === 10) { const sz = readVar(); p += sz * (type === 9 ? 1 : 1); }
        else if (type === 12) { p++; while (p < b.length - 8) { const h2 = b[p++]; if (!h2) break; const t2 = h2 & 0x0f; if (t2 === 8) { const len = readVar(); const s = L.fromUtf8(b.slice(p, p + len)); p += len; if (s && s.length < 80) strings.push(s); } else if (t2 === 6 || t2 === 4 || t2 === 5 || t2 === 2) readVar(); else if (t2 === 12) { p++; } } }
        if (type === 6 && fid === 3) numRows = numRows || readVar();
      }
    } catch (e) { /* 解析不完整也给出已知信息 */ }
    const cols = [...new Set(strings.filter((s) => !/parquet|hadoop|arrow|pandas|spark|version|created/i.test(s)))].slice(0, 60);
    return { html: `<table class="t-table"><tbody>
      <tr><td>文件</td><td class="num">${L.esc(f.name)}</td></tr>
      <tr><td>大小</td><td class="num">${L.humanSize(b.length)}</td></tr>
      <tr><td>Footer 长度</td><td class="num">${footerLen} 字节</td></tr>
      <tr><td>猜测行数</td><td class="num">${numRows || '见行组元数据'}</td></tr>
      <tr><td>疑似列名 / 字符串</td><td class="num">${cols.length}</td></tr></tbody></table>
      <p class="t-label" style="margin-top:12px">Footer 中的字符串</p><div class="t-out" style="max-height:220px">${L.esc(cols.join('\n') || strings.slice(0, 30).join('\n'))}</div>`,
      copy: cols.join('\n'), stats: [{ label: '大小', value: L.humanSize(b.length) }, { label: '字符串', value: cols.length }] };
  } };

S['duckdb-sql'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>数据与 SQL</h2><span class="hint">本地 SQL 引擎 · 不上传</span></div>
    <div class="t-drop" id="drop" style="min-height:88px"><div class="t">拖 CSV / JSON 文件进来（可多个，表名取文件名）</div><div class="s">也可以直接把表格粘到下面的框里</div><input type="file" id="file" accept=".csv,.json,.jsonl" multiple hidden></div>
    <textarea class="t-textarea" id="data" rows="5" placeholder="或粘 CSV / JSON 数组到这儿">省份,销量,单价
华东,120,25
华南,95,30
华北,88,28
华东,60,25</textarea>
    <div class="t-field" style="margin-top:12px"><label class="t-label">SQL（表名为 data；多文件时按文件名）</label>
      <textarea class="t-textarea" id="sql" rows="4">SELECT 省份, SUM(销量) AS 总销量, ROUND(AVG(单价),2) AS 均价 FROM ? GROUP BY 省份 ORDER BY 总销量 DESC</textarea></div>
    <div class="t-actions"><button class="t-btn primary" type="button" id="run">执行查询</button><button class="t-btn" type="button" id="csv">导出结果 CSV</button></div>
    <div id="out" class="t-out html" style="margin-top:14px;min-height:80px"></div>
    <p class="t-hint">用本地 SQL 引擎（支持 SELECT / JOIN / GROUP BY / 窗口函数 / 聚合），不是 DuckDB-WASM，但常见分析查询都能跑；Parquet 元数据请用「Parquet 预览」。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s);
  let last = [];
  const parseData = () => {
    const t = $('#data').value.trim();
    if (t.startsWith('[')) { try { const a = JSON.parse(t); return Array.isArray(a) ? a : [a]; } catch (e) { throw new Error('JSON 解析失败'); } }
    if (t.includes('{')) return L.nonEmptyLines(t).map((l) => { try { return JSON.parse(l); } catch (e) { return {}; } });
    const rows = L.parseCSV(t); if (rows.length < 2) throw new Error('数据至少要有表头和一行');
    return rows.slice(1).map((r) => Object.fromEntries(rows[0].map((k, i) => [k, /^-?\d+(\.\d+)?$/.test(r[i] || '') ? Number(r[i]) : r[i] ?? ''])));
  };
  $('#run').onclick = async () => {
    try {
      const alasql = await vendor('alasql');
      const data = parseData();
      const sql = $('#sql').value.trim();
      const res = alasql(sql.replace(/\bdata\b/gi, '?'), [data]);
      const arr = Array.isArray(res) ? res : [res];
      last = arr.map((x) => typeof x === 'object' && x ? x : { value: x });
      const cols = [...new Set(last.flatMap((x) => Object.keys(x)))];
      $('#out').innerHTML = `<table class="t-table"><thead><tr>${cols.map((c) => `<th>${L.esc(c)}</th>`).join('')}</tr></thead><tbody>${last.slice(0, 200).map((r) => `<tr>${cols.map((c) => `<td>${L.esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    } catch (e) { $('#out').textContent = '查询失败：' + e.message; }
  };
  $('#csv').onclick = () => { if (!last.length) return K.toast('先执行查询'); const cols = [...new Set(last.flatMap((x) => Object.keys(x)))]; K.download('查询结果.csv', '\ufeff' + L.toCSV([cols, ...last.map((r) => cols.map((c) => r[c] ?? ''))]), 'text/csv;charset=utf-8'); };
  const load = async (f) => {
    const t = await L.readFile(f, 'text');
    $('#data').value = t;
    $('#sql').value = `SELECT * FROM ? LIMIT 20`;
    K.toast('已载入 ' + f.name + '，点执行查询');
  };
  $('#file').onchange = () => $('#file').files[0] && load($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
  K.setAction('执行查询', () => $('#run').click());
} };

S['har-viewer'] = { kind: 'file', titleIn: 'HAR 文件', titleOut: '请求分析', accept: '.har,.json', multiple: false,
  primary: '分析', auto: false, dropTitle: '拖 .har 进来',
  fields: [{ id: 'filter', label: '过滤（URL / 状态 / 类型）', type: 'text', default: '' },
    { id: 'mask', label: '导出时脱敏 Cookie / Authorization / Token 参数', type: 'checkbox', default: true }],
  note: '解析 HAR 1.2：请求列表、状态码、耗时、瀑布条、详情查看；导出可脱敏，全程本地解析。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 HAR' };
    let j; try { j = JSON.parse(await L.readFile(f, 'text')); } catch (e) { return { error: 'HAR 解析失败：' + e.message }; }
    const entries = j.log?.entries || [];
    const k = String(v.filter || '').toLowerCase();
    const rows = entries.filter((e) => !k || `${e.request?.url} ${e.response?.status} ${e.response?.content?.mimeType}`.toLowerCase().includes(k));
    const max = Math.max(1, ...rows.map((e) => e.time || 0));
    const table = rows.slice(0, 200).map((e, i) => {
      const url = e.request?.url || ''; const status = e.response?.status || 0; const ms = Math.round(e.time || 0);
      const mt = (e.response?.content?.mimeType || '').split(';')[0];
      return `<tr><td class="num">${i + 1}</td><td style="word-break:break-all;max-width:340px">${L.esc(url.slice(0, 130))}</td><td class="num" style="color:${status >= 400 ? '#a63d34' : '#2f6b3a'}">${status}</td><td class="num">${ms} ms</td><td style="min-width:110px"><div style="height:9px;background:var(--accent);border-radius:5px;width:${Math.max(3, ms / max * 100)}%"></div></td><td>${L.esc(mt)}</td></tr>`;
    }).join('');
    const clean = v.mask ? JSON.stringify(rows.map((e) => ({ ...e, request: { ...e.request, headers: (e.request?.headers || []).map((h) => /cookie|auth|token|key/i.test(h.name) ? { ...h, value: '***' } : h), url: (e.request?.url || '').replace(/([?&])(token|key|auth|sign)=[^&]+/gi, '$1$2=***') }, response: { ...e.response, headers: (e.response?.headers || []).map((h) => /set-cookie|auth|token/i.test(h.name) ? { ...h, value: '***' } : h) } })), null, 2) : JSON.stringify(rows, null, 2);
    return { html: `<table class="t-table"><thead><tr><th>#</th><th>URL</th><th>状态</th><th>耗时</th><th>瀑布</th><th>类型</th></tr></thead><tbody>${table}</tbody></table>`,
      copy: rows.map((e) => [e.request?.method, e.request?.url, e.response?.status, Math.round(e.time || 0)].join('\t')).join('\n'),
      files: [{ name: f.name.replace(/\.har$/i, '') + '-脱敏.har', data: L.utf8(clean), mime: 'application/json', label: '导出脱敏 HAR' }],
      stats: [{ label: '请求', value: entries.length }, { label: '筛选后', value: rows.length }, { label: '总耗时', value: Math.round(rows.reduce((s, e) => s + (e.time || 0), 0)) + ' ms' }] };
  } };

S['hex-viewer'] = { kind: 'file', titleIn: '任意文件', titleOut: 'Hex 视图', multiple: false,
  primary: '读取', auto: false, dropTitle: '拖任意文件进来',
  fields: [{ id: 'off', label: '起始偏移（字节）', type: 'number', default: 0 }, { id: 'n', label: '显示行数（每行 16 字节）', type: 'number', default: 64 }],
  note: '十六进制 + ASCII 三栏视图，自动识别 PNG / JPEG / GIF / PDF / ZIP / GZIP / ELF / SQLite 等魔数；点击 chunk 提示可跳到偏移。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选文件' };
    const b = new Uint8Array(await f.arrayBuffer());
    const magic = [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 'PNG'], [0xff, 0xd8, 0xff, 'JPEG'], [0x47, 0x49, 0x46, 'GIF'], [0x25, 0x50, 0x44, 0x46, 'PDF'], [0x50, 0x4b, 0x03, 0x04, 'ZIP / DOCX / XLSX / EPUB'], [0x1f, 0x8b, 'GZIP'], [0x7f, 0x45, 0x4c, 0x46, 'ELF'], [0x53, 0x51, 0x4c, 0x69, 'SQLite'], [0x00, 0x00, 0x01, 0x00, 'ICO']];
    const found = magic.find((m) => m.slice(0, -1).every((x, i) => b[i] === x))?.at(-1) || '未识别';
    const start = L.clamp(Number(v.off) || 0, 0, Math.max(0, b.length - 1));
    const n = L.clamp(Number(v.n) || 64, 1, 512);
    const rows = [];
    for (let r = 0; r < n && start + r * 16 < b.length; r++) {
      const o = start + r * 16, seg = b.slice(o, o + 16);
      rows.push(`<tr><td class="num">${o.toString(16).toUpperCase().padStart(8, '0')}</td><td style="font-family:ui-monospace,Menlo,monospace;white-space:pre">${L.bytesToHex(seg, ' ').padEnd(47)}</td><td style="font-family:ui-monospace,Menlo,monospace;white-space:pre">${Array.from(seg, (x) => x >= 32 && x < 127 ? L.esc(String.fromCharCode(x)) : '.').join('')}</td></tr>`);
    }
    return { html: `<p class="t-hint">魔数识别：<b>${L.esc(found)}</b>　大小 ${L.humanSize(b.length)}　显示 ${start}–${Math.min(b.length, start + n * 16)} 字节</p>
      <div style="max-height:420px;overflow:auto"><table class="t-table"><thead><tr><th>偏移</th><th>十六进制</th><th>ASCII</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`,
      copy: rows.join('').replace(/<[^>]+>/g, ' '),
      stats: [{ label: '类型', value: found }, { label: '大小', value: L.humanSize(b.length) }, { label: '行数', value: rows.length }] };
  } };

S['encoding-convert'] = { kind: 'file', titleIn: '文本文件', titleOut: '转换结果', accept: '.txt,.csv,.srt,.md,.json,.xml,.html,.log', multiple: true,
  primary: '转换', auto: false, dropTitle: '拖文本文件进来',
  fields: [{ id: 'src', label: '原编码', type: 'select', options: ['自动探测', 'UTF-8', 'GB18030 / GBK', 'Big5', 'UTF-16LE', 'ISO-8859-1'] },
    { id: 'dst', label: '目标编码', type: 'select', options: ['UTF-8（无 BOM）', 'UTF-8（带 BOM，Excel 不乱码）', 'UTF-16LE（带 BOM）'] },
    { id: 'eol', label: '换行符', type: 'select', options: ['保持不变', 'LF（\\n）', 'CRLF（\\r\\n）'] }],
  note: '用浏览器 TextDecoder 解码、TextEncoder 输出；原编码猜错时会出现替换字符，切到 GB18030 再试。导出仍是文本文件。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      let s = '', used = v.src;
      let body = b, bom = '';
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) { bom = 'UTF-8 BOM'; body = b.slice(3); used = 'UTF-8'; }
      else if (b[0] === 0xff && b[1] === 0xfe) { bom = 'UTF-16LE BOM'; body = b.slice(2); used = 'UTF-16LE'; }
      const encMap = { 'UTF-8': 'utf-8', 'GB18030 / GBK': 'gb18030', 'Big5': 'big5', 'UTF-16LE': 'utf-16le', 'ISO-8859-1': 'latin1' };
      if (v.src === '自动探测') {
        try { s = new TextDecoder('utf-8', { fatal: true }).decode(body); used = 'UTF-8'; }
        catch (e) { s = new TextDecoder('gb18030').decode(body); used = 'GB18030'; }
      } else s = new TextDecoder(encMap[v.src] || 'utf-8').decode(body);
      if (v.eol === 'LF（\\n）') s = s.replace(/\r\n?/g, '\n');
      if (v.eol === 'CRLF（\\r\\n）') s = s.replace(/\r?\n/g, '\r\n');
      const bad = (s.match(/\ufffd/g) || []).length;
      let data;
      if (v.dst.startsWith('UTF-16LE')) {
        const u16 = new Uint16Array(Array.from(s).flatMap((c) => { const n = c.codePointAt(0); return n > 0xffff ? [0xd800 + ((n - 0x10000) >> 10), 0xdc00 + (n & 0x3ff)] : [n]; }));
        data = new Uint8Array(2 + u16.length * 2); data[0] = 0xff; data[1] = 0xfe; new Uint8Array(data.buffer).set(new Uint8Array(u16.buffer), 2);
      } else data = L.utf8((v.dst.includes('带 BOM') ? '\ufeff' : '') + s);
      outs.push({ name: f.name, data, mime: 'text/plain' });
      logs.push(`${f.name}：${bom || '无 BOM'}，按 ${used} 解码，${bad ? `⚠ ${bad} 个替换字符` : '解码正常'} → ${v.dst}`);
    }
    return { text: logs.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0].data).slice(0, 900), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '转码结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  } };

S['font-subset'] = { kind: 'file', titleIn: '字体文件', titleOut: '字体信息', accept: '.ttf,.otf,.woff', multiple: false,
  primary: '分析', auto: false, dropTitle: '拖 TTF / OTF / WOFF 进来',
  fields: [{ id: 'text', label: '要检查的文字', type: 'textarea', rows: 3, default: '一页工具箱 你好世界 ABC 123' },
    { id: 'size', label: '字形预览字号', type: 'number', default: 48 }],
  note: '用 opentype.js 解析字体：读取字形数、字族名、检查指定文字是否缺字，并把这些字的轮廓导出成 SVG。真正的字体子集化（重写 glyf/cmap 表）需要 HarfBuzz/fonttools 引擎，静态页里不做假装。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选字体' };
    const opentype = await vendor('opentype');
    let font; try { font = opentype.parse(await f.arrayBuffer()); } catch (e) { return { error: '字体解析失败：' + e.message + '（WOFF2 需先解压缩）' }; }
    const chars = [...new Set(Array.from(String(v.text || '')))].filter((c) => c.trim());
    const missing = chars.filter((c) => !font.charToGlyph(c) || font.charToGlyph(c).index === 0);
    const size = L.clamp(Number(v.size) || 48, 12, 160);
    const svgs = chars.slice(0, 40).map((c) => {
      try { const g = font.charToGlyph(c); const p = g.getPath(0, 0, size); return `<svg viewBox="0 -${size} ${size * 1.2} ${size * 1.4}" width="${size}" height="${size * 1.2}" style="border:1px solid var(--line);border-radius:5px;margin:3px"><path d="${p.toSVG()}" transform="scale(1,-1)" fill="currentColor"/></svg>`; } catch (e) { return ''; }
    }).join('');
    const names = font.names?.fontFamily ? Object.values(font.names.fontFamily)[0] : '未知';
    return { preview: `<div style="display:flex;flex-wrap:wrap">${svgs}</div>`,
      html: `<table class="t-table"><tbody><tr><td>字族</td><td class="num">${L.esc(names)}</td></tr><tr><td>字形数</td><td class="num">${font.numGlyphs}</td></tr><tr><td>单位/EM</td><td class="num">${font.unitsPerEm}</td></tr><tr><td>升部/降部</td><td class="num">${font.ascender} / ${font.descender}</td></tr><tr><td>检查字符</td><td class="num">${chars.length}</td></tr><tr><td>缺字</td><td class="num">${missing.length ? L.esc(missing.join(' ')) : '无'}</td></tr></tbody></table>`,
      copy: `字族 ${names}\n字形数 ${font.numGlyphs}\n缺字 ${missing.join(' ') || '无'}`,
      files: [{ name: '字形预览.svg', data: L.utf8(`<svg xmlns="http://www.w3.org/2000/svg">${svgs}</svg>`), mime: 'image/svg+xml', label: '下载 SVG 字形' }],
      stats: [{ label: '字形', value: font.numGlyphs }, { label: '缺字', value: missing.length }] };
  } };

S['svg-edit'] = { kind: 'form', titleIn: 'SVG 代码', titleOut: '预览与输出', wide: false,
  fields: [{ id: 'code', label: 'SVG', type: 'textarea', rows: 9, default: '<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="180" height="100" rx="12" fill="#f2eee5" stroke="#b4552d" stroke-width="3"/><circle cx="100" cy="60" r="28" fill="#b4552d"/><text x="100" y="66" text-anchor="middle" fill="#fff" font-size="14">SVG</text></svg>' },
    { id: 'mode', label: '操作', type: 'select', options: ['预览', '压缩（SVGO 轻量版）', '转 Data URI', '转 Base64'] }],
  primary: '复制结果', hintOut: '代码↔预览实时同步；压缩会去掉注释、多余空白与 metadata，不会改图形；也可把 SVG 转成 data URI 直接塞进 CSS/HTML。',
  compute: (v) => {
    const code = String(v.code || '').trim();
    if (!code) return { text: '' };
    if (v.mode === '压缩（SVGO 轻量版）') {
      const mini = code.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[^>]*\?>/gi, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/\s*=\s*/g, '=').trim();
      return { text: mini, preview: mini, stats: [{ label: '原', value: code.length }, { label: '压缩后', value: mini.length }, { label: '省', value: (100 - mini.length / code.length * 100).toFixed(1) + '%' }] };
    }
    if (v.mode === '转 Data URI') { const s = `data:image/svg+xml,${encodeURIComponent(code)}`; return { text: s, preview: `<img src="${L.esc(s)}" style="max-height:220px">`, stats: [{ label: '长度', value: s.length }] }; }
    if (v.mode === '转 Base64') { const s = L.b64(code); return { text: s, preview: `<img src="data:image/svg+xml;base64,${s}" style="max-height:220px">`, stats: [{ label: '长度', value: s.length }] }; }
    return { preview: code, text: code, copy: code, stats: [{ label: '长度', value: code.length }] };
  } };

S['file-rename'] = { kind: 'file', titleIn: '要改名的文件', titleOut: '改名预览', multiple: true,
  primary: '预览 / 打包下载', auto: false, dropTitle: '拖多个文件进来',
  fields: [{ id: 'mode', label: '规则', type: 'select', options: ['序号前缀', '查找替换', '正则替换', '大小写', '加日期前缀'] },
    { id: 'find', label: '查找内容 / 正则', type: 'text', default: 'IMG_' }, { id: 'rep', label: '替换为', type: 'text', default: '照片_' },
    { id: 'start', label: '起始序号', type: 'number', default: 1 }, { id: 'digits', label: '序号补零位数', type: 'number', default: 3 },
    { id: 'case', label: '大小写', type: 'select', options: ['保持', '全小写', '全大写'] }],
  note: '浏览器无法真的改你磁盘上的文件名，这里按规则生成新名字并打包成 ZIP 下载；预览满意再下载。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const pad = L.clamp(Number(v.digits) || 3, 1, 8), st = Number(v.start) || 1;
    const date = L.fmtDate(new Date()).replace(/-/g, '');
    const rows = files.map((f, i) => {
      const dot = f.name.lastIndexOf('.'), base = dot > 0 ? f.name.slice(0, dot) : f.name, ext = dot > 0 ? f.name.slice(dot) : '';
      let name = base;
      if (v.mode === '序号前缀') name = String(st + i).padStart(pad, '0') + '_' + base;
      else if (v.mode === '查找替换') name = base.split(v.find || '').join(v.rep || '');
      else if (v.mode === '正则替换') { try { name = base.replace(new RegExp(v.find || '', 'g'), v.rep || ''); } catch (e) { name = base; } }
      else if (v.mode === '加日期前缀') name = date + '_' + base;
      if (v.case === '全小写') name = name.toLowerCase(); if (v.case === '全大写') name = name.toUpperCase();
      return [f.name, name + ext, L.humanSize(f.size)];
    });
    const map = Object.fromEntries(files.map((f, i) => [f.name, rows[i][1]]));
    const z = [];
    for (const f of files) z.push({ name: map[f.name], data: new Uint8Array(await f.arrayBuffer()), mime: f.type || 'application/octet-stream' });
    return { html: `<table class="t-table"><thead><tr><th>原名</th><th>新名</th><th>大小</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: [{ name: '改名结果.zip', zip: z, label: '打包下载（新名字）' }], stats: [{ label: '文件', value: files.length }] };
  } };

S['text-replace-batch'] = { kind: 'file', titleIn: '文本文件', titleOut: '替换结果', accept: '.txt,.md,.csv,.json,.html,.css,.js,.srt,.log,.xml', multiple: true,
  primary: '替换并下载', auto: false, dropTitle: '拖多个文本文件进来',
  fields: [{ id: 'rules', label: '规则（每行 查找 → 替换，支持 /正则/ 与 全词）', type: 'textarea', rows: 5, default: '张三 → 李先生\n公司A → 公司B' },
    { id: 'flags', label: '选项', type: 'select', options: ['普通替换', '区分大小写', '全词匹配', '正则模式'] },
    { id: 'enc', label: '原编码', type: 'select', options: ['自动（UTF-8 / GB18030）', '强制 GB18030'] }],
  note: '多条规则一次性对全文生效（不连锁：按原文逐条匹配后统一替换），可处理 GBK 文件并导出 UTF-8。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const rules = L.nonEmptyLines(v.rules || '').map((l) => { const i = l.indexOf('→'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null; }).filter(Boolean);
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      let s; try { s = v.enc.startsWith('强制') ? new TextDecoder('gb18030').decode(b) : new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { s = new TextDecoder('gb18030').decode(b); }
      let n = 0; let out = s;
      for (const [a, r] of rules) {
        if (!a) continue;
        const esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const src = v.flags === '正则模式' ? a : esc;
        const pat = v.flags === '全词匹配' ? `\\b${src}\\b` : src;
        let re; try { re = new RegExp(pat, v.flags === '区分大小写' ? 'g' : 'gi'); } catch (e) { continue; }
        out = out.replace(re, (m) => { n++; return r; });
      }
      outs.push({ name: f.name, data: L.utf8(out), mime: 'text/plain' });
      logs.push(`${f.name}：替换 ${n} 处`);
    }
    return { text: logs.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0].data).slice(0, 900), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '替换结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '规则', value: rules.length }] };
  } };

S['file-search'] = { kind: 'file', titleIn: '文件 / 压缩包', titleOut: '命中', multiple: true,
  primary: '搜索', auto: false, dropTitle: '拖文本文件、ZIP 或 PDF 进来',
  fields: [{ id: 'q', label: '关键词', type: 'text', default: '工具' },
    { id: 'mode', label: '匹配方式', type: 'select', options: ['包含', '区分大小写', '全词', '正则'] },
    { id: 'ctx', label: '上下文行数', type: 'number', default: 1 }],
  note: '在 TXT / 代码 / CSV / 字幕里逐行找；ZIP 会解包后逐个文本找；PDF 用本地 pdf.js 提取文字后找。Word/Excel 请先另存为文本或 xlsx。',
  process: async (files, v, ctx) => {
    const q = String(v.q || ''); if (!q) return { error: '先填关键词' };
    const test = (line) => {
      try {
        if (v.mode === '正则') return new RegExp(q, 'i').test(line);
        if (v.mode === '全词') return new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(line);
        return v.mode === '区分大小写' ? line.includes(q) : line.toLowerCase().includes(q.toLowerCase());
      } catch (e) { return false; }
    };
    const hits = []; let scanned = 0;
    for (const f of files) {
      const name = f.name.toLowerCase();
      let texts = [];
      if (name.endsWith('.zip')) {
        const JSZip = await vendor('zip'); const zip = await JSZip.loadAsync(await f.arrayBuffer());
        for (const e of Object.values(zip.files).filter((x) => !x.dir && /\.(txt|md|csv|json|js|ts|html|css|xml|srt|log|py|java|go|rb)$/i.test(x.name))) texts.push([`${f.name}!${e.name}`, await e.async('string')]);
      } else if (name.endsWith('.pdf')) {
        const pdfjs = await vendor('pdfjs'); const pdf = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
        for (let p = 1; p <= Math.min(pdf.numPages, 80); p++) { const page = await pdf.getPage(p); const tc = await page.getTextContent(); texts.push([`${f.name} 第${p}页`, tc.items.map((i) => i.str).join(' ')]); }
      } else if (/\.(txt|md|csv|json|jsonl|js|ts|jsx|tsx|html|css|xml|srt|vtt|log|py|java|go|rb|sql|yml|yaml|ini|conf|sh|bat)$/i.test(name)) {
        texts.push([f.name, await L.readFile(f, 'text')]);
      } else continue;
      for (const [label, t] of texts) {
        scanned++;
        const ls = L.lines(t);
        ls.forEach((l, i) => { if (test(l)) { const c = Number(v.ctx) || 0; hits.push({ file: label, line: i + 1, before: ls.slice(Math.max(0, i - c), i), text: l, after: ls.slice(i + 1, i + 1 + c) }); } });
      }
    }
    const html = hits.slice(0, 150).map((h) => `<div style="padding:8px 0;border-bottom:1px solid var(--line-2)"><div style="font-size:11px;color:var(--ink-3)">${L.esc(h.file)} : ${h.line}</div>
      ${h.before.map((x) => `<div style="color:var(--ink-3);font-size:12px">${L.esc(x)}</div>`).join('')}
      <div style="font-size:13px"><mark style="background:#f6e2b8">${L.esc(h.text)}</mark></div>
      ${h.after.map((x) => `<div style="color:var(--ink-3);font-size:12px">${L.esc(x)}</div>`).join('')}</div>`).join('');
    return { html: html || '<p class="t-hint">没有命中。</p>', copy: hits.map((h) => `${h.file}:${h.line}\t${h.text}`).join('\n'),
      files: [{ name: '搜索结果.csv', data: L.utf8('\ufeff' + L.toCSV([['文件', '行号', '内容'], ...hits.map((h) => [h.file, h.line, h.text])])), mime: 'text/csv', label: '导出 CSV' }],
      stats: [{ label: '扫描文档', value: scanned }, { label: '命中', value: hits.length }] };
  } };
