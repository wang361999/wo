// PDF 工具：pdf-lib（写） + pdf.js（渲染 / 取文字），二者均已打包在 /vendor/
export const S = {};
const notePDF = '处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。';

S['pdf-merge'] = { kind: 'file', titleIn: '多个 PDF', titleOut: '合并结果', accept: 'application/pdf,.pdf', multiple: true,
  primary: '合并下载', auto: false, dropTitle: '拖多个 PDF 进来，按文件名顺序合并',
  fields: [{ id: 'order', label: '顺序（填文件名关键词，逗号分隔；留空按拖入顺序）', type: 'text', default: '' },
    { id: 'bookmark', label: '给每段加书签（用文件名）', type: 'checkbox', default: false }],
  note: notePDF + ' 拖拽后可在下面列表里看到顺序；加密 PDF 需先解密。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '至少选两个 PDF' };
    const { PDFDocument } = await vendor('pdf');
    let list = files;
    const keys = L.nonEmptyLines(String(v.order || '').replace(/,/g, '\n'));
    if (keys.length) list = [...files].sort((a, b) => {
      const ia = keys.findIndex((k) => a.name.includes(k)), ib = keys.findIndex((k) => b.name.includes(k));
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    const out = await PDFDocument.create(); let total = 0;
    for (const f of list) {
      const src = await PDFDocument.load(await f.arrayBuffer());
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p)); total += pages.length;
    }
    const bytes = await out.save();
    return { text: `已按以下顺序合并：\n${list.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}\n\n共 ${total} 页。`, copy: list.map((f) => f.name).join('\n'),
      files: [{ name: '合并结果.pdf', data: bytes, mime: 'application/pdf', label: '下载合并 PDF' }],
      stats: [{ label: '文件', value: list.length }, { label: '页数', value: total }, { label: '大小', value: L.humanSize(bytes.length) }] };
  } };

S['pdf-split'] = { kind: 'file', titleIn: 'PDF', titleOut: '拆分结果', accept: 'application/pdf,.pdf', multiple: false,
  primary: '拆分下载', auto: false, dropTitle: '拖一个 PDF 进来',
  fields: [{ id: 'mode', label: '方式', type: 'select', options: ['按页码范围', '每页一个文件', '按固定页数分段'] },
    { id: 'range', label: '页码范围（如 1-3,5,8-10）', type: 'text', default: '1-3' },
    { id: 'step', label: '每段几页', type: 'number', default: 5 }],
  note: notePDF + ' 每页独立时会打包成 ZIP，方便一次拿走。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument } = await vendor('pdf');
    const src = await PDFDocument.load(await f.arrayBuffer());
    const n = src.getPageCount();
    const groups = [];
    if (v.mode === '每页一个文件') for (let i = 0; i < n; i++) groups.push([i]);
    else if (v.mode === '按固定页数分段') { const s = Math.max(1, Number(v.step) || 5); for (let i = 0; i < n; i += s) groups.push(Array.from({ length: Math.min(s, n - i) }, (_, j) => i + j)); }
    else {
      for (const seg of String(v.range || '').split(/[,，]/)) {
        const m = seg.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) continue;
        const a = L.clamp(Number(m[1]), 1, n), b = L.clamp(Number(m[2] || m[1]), 1, n);
        groups.push(Array.from({ length: Math.max(0, b - a + 1) }, (_, j) => a - 1 + j));
      }
    }
    if (!groups.length) return { error: '没解析出有效页码' };
    const outs = [];
    for (let i = 0; i < groups.length; i++) {
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, groups[i].filter((x) => x >= 0 && x < n));
      pages.forEach((p) => doc.addPage(p));
      if (!pages.length) continue;
      outs.push({ name: `${f.name.replace(/\.pdf$/i, '')}-${i + 1}.pdf`, data: await doc.save(), mime: 'application/pdf' });
    }
    return { text: `原 PDF ${n} 页，拆成 ${outs.length} 份。`, copy: outs.map((o) => o.name).join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '拆分结果.zip', zip: outs, label: '打包下载全部' }] : []),
      stats: [{ label: '原页数', value: n }, { label: '拆出', value: outs.length }] };
  } };

S['img-to-pdf'] = { kind: 'file', titleIn: '图片', titleOut: 'PDF', accept: 'image/*', multiple: true,
  primary: '生成 PDF', auto: false, dropTitle: '拖多张图片进来',
  fields: [{ id: 'layout', label: '每页放几张', type: 'select', options: ['1 张', '2 张（上下）', '4 张（2×2）', '6 张（2×3）', '9 张（3×3）'] },
    { id: 'paper', label: '纸张', type: 'select', options: ['A4', 'A3', 'Letter', '按图片原尺寸'] },
    { id: 'margin', label: '页边距', unit: 'pt', type: 'number', default: 18 },
    { id: 'quality', label: 'JPEG 质量', type: 'range', min: 0.4, max: 0.95, step: 0.05, default: 0.85 }],
  note: notePDF + ' HEIC / AVIF 能否读取决于浏览器解码能力；读不了的会明确跳过。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const { PDFDocument } = await vendor('pdf');
    const SIZES = { 'A4': [595.28, 841.89], 'A3': [841.89, 1190.55], 'Letter': [612, 792] };
    const per = { '1 张': 1, '2 张（上下）': 2, '4 张（2×2）': 4, '6 张（2×3）': 6, '9 张（3×3）': 9 }[v.layout] || 1;
    const cols = per === 1 ? 1 : per <= 2 ? 1 : per <= 6 ? 2 : 3;
    const rows = Math.ceil(per / cols);
    const imgs = [];
    for (const f of files) {
      try { const im = await L.imageFromFile(f); imgs.push({ f, im }); } catch (e) { /* 明确跳过 */ }
    }
    if (!imgs.length) return { error: '浏览器解不开这些图片（HEIC/AVIF 常见于 iPhone，请先转成 JPG/PNG）' };
    const doc = await PDFDocument.create();
    const pageCount = Math.ceil(imgs.length / per);
    for (let p = 0; p < pageCount; p++) {
      const batch = imgs.slice(p * per, (p + 1) * per);
      let W, H;
      if (v.paper === '按图片原尺寸') { const first = batch[0].im; W = first.naturalWidth; H = first.naturalHeight * rows; }
      else [W, H] = SIZES[v.paper] || SIZES.A4;
      const page = doc.addPage([W, H]);
      const m = Number(v.margin) || 0;
      const cw = (W - m * 2) / cols, ch = (H - m * 2) / rows;
      for (let i = 0; i < batch.length; i++) {
        const { f, im } = batch[i];
        const cv = L.canvasOf(im.naturalWidth, im.naturalHeight);
        cv.getContext('2d').drawImage(im, 0, 0);
        let jpg;
        try { jpg = await doc.embedJpg(await (await L.canvasBlob(cv, 'image/jpeg', Number(v.quality) || 0.85)).arrayBuffer()); }
        catch (e) { jpg = await doc.embedPng(await (await L.canvasBlob(cv, 'image/png')).arrayBuffer()); }
        const scale = Math.min(cw / jpg.width, ch / jpg.height) * 0.96;
        const w = jpg.width * scale, h = jpg.height * scale;
        const cx = m + (i % cols) * cw + (cw - w) / 2, cy = H - m - (Math.floor(i / cols) + 1) * ch + (ch - h) / 2;
        page.drawImage(jpg, { x: cx, y: cy, width: w, height: h });
      }
    }
    const bytes = await doc.save();
    return { text: `${imgs.length} 张图片 → ${pageCount} 页 PDF${imgs.length < files.length ? `（${files.length - imgs.length} 张格式不支持已跳过）` : ''}。`,
      files: [{ name: '图片合集.pdf', data: bytes, mime: 'application/pdf', label: '下载 PDF' }],
      stats: [{ label: '图片', value: imgs.length }, { label: '页数', value: pageCount }, { label: '大小', value: L.humanSize(bytes.length) }] };
  } };

S['pdf-to-img'] = { kind: 'file', titleIn: 'PDF', titleOut: '图片', accept: 'application/pdf,.pdf', multiple: false,
  primary: '导出图片', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'range', label: '页码范围（留空全部）', type: 'text', default: '' },
    { id: 'scale', label: '清晰度', type: 'select', options: ['1×', '2×', '3×'] },
    { id: 'fmt', label: '格式', type: 'select', options: ['PNG', 'JPG'] }],
  note: notePDF + ' 用 pdf.js 逐页渲染到 canvas，再导出 PNG / JPG；页数多时会打包成 ZIP。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const pdf = await pdfOpen(await f.arrayBuffer());
    const scale = Number(String(v.scale).replace('×', '')) || 1;
    let pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const t = String(v.range || '').trim();
    if (t) { pages = []; for (const seg of t.split(/[,，]/)) { const m = seg.match(/^(\d+)(?:-(\d+))?$/); if (m) { const a = Number(m[1]), b = Number(m[2] || m[1]); for (let i = a; i <= b; i++) pages.push(i); } } }
    const jpg = v.fmt === 'JPG', outs = [];
    for (const n of pages.slice(0, 60)) {
      if (n < 1 || n > pdf.numPages) continue;
      const { canvas } = await pdfRenderPage(pdf, n, scale);
      const data = await L.canvasU8(canvas, jpg ? 'image/jpeg' : 'image/png', 0.9);
      outs.push({ name: `${f.name.replace(/\.pdf$/i, '')}-${String(n).padStart(3, '0')}.${jpg ? 'jpg' : 'png'}`, data, mime: jpg ? 'image/jpeg' : 'image/png' });
    }
    if (!outs.length) return { error: '没有可导出的页' };
    return { preview: `<img src="${URL.createObjectURL(new Blob([outs[0].data], { type: outs[0].mime }))}" style="max-height:260px">`,
      text: `PDF 共 ${pdf.numPages} 页，导出 ${outs.length} 张 ${v.fmt}（${v.scale} 清晰度）。`,
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: 'PDF 转图片.zip', zip: outs, label: '打包下载全部' }] : []),
      stats: [{ label: '总页', value: pdf.numPages }, { label: '导出', value: outs.length }] };
  } };

S['pdf-to-text'] = { kind: 'file', titleIn: 'PDF', titleOut: '文字', accept: 'application/pdf,.pdf', multiple: false,
  primary: '提取文字', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'range', label: '页码范围（留空全部）', type: 'text', default: '' },
    { id: 'fmt', label: '输出', type: 'select', options: ['TXT', 'Markdown（启发式标题）'] },
    { id: 'pageMark', label: '标注页码', type: 'checkbox', default: true }],
  note: notePDF + ' 取的是 PDF 里的文字层；纯扫描件（图片）没有文字层，请先用 OCR 工具识别。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const pdf = await pdfOpen(await f.arrayBuffer());
    let pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const t = String(v.range || '').trim();
    if (t) { pages = []; for (const seg of t.split(/[,，]/)) { const m = seg.match(/^(\d+)(?:-(\d+))?$/); if (m) { for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) pages.push(i); } } }
    pages = pages.filter((n) => n >= 1 && n <= pdf.numPages).slice(0, 200);
    const chunks = [];
    for (const n of pages) {
      const tc = await (await pdf.getPage(n)).getTextContent();
      const lines = []; let lastY = null, cur = '';
      for (const it of tc.items) { const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 4) { lines.push(cur.trim()); cur = ''; } cur += it.str; lastY = y; }
      if (cur.trim()) lines.push(cur.trim());
      const body = lines.map((l) => {
        if (v.fmt.startsWith('Markdown') && /^(第[一二三四五六七八九十\d]+[章节部分篇]|[一二三四五六七八九十]+、|\d+[\.、]\s*\S{2,30})$/.test(l) && l.length < 40) return `\n## ${l}\n`;
        return l;
      }).join('\n');
      chunks.push(v.pageMark ? `【第 ${n} 页】\n${body}` : body);
    }
    const text = chunks.join('\n\n');
    const ext = v.fmt.startsWith('Markdown') ? 'md' : 'txt';
    return { text: text.slice(0, 20000) + (text.length > 20000 ? '\n…（预览截断，下载文件是全文）' : ''), copy: text,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '.' + ext, data: L.utf8(text), mime: 'text/plain', label: '下载全文' }],
      stats: [{ label: '总页', value: pdf.numPages }, { label: '提取', value: pages.length }, { label: '字符', value: text.length }] };
  } };

S['pdf-edit'] = { kind: 'file', titleIn: 'PDF', titleOut: '页面编辑', accept: 'application/pdf,.pdf', multiple: false,
  primary: '重排并下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'order', label: '新页序（如 3,1,2,5-7；留空按原序）', type: 'text', default: '' },
    { id: 'del', label: '要删除的页（如 2,4）', type: 'text', default: '' },
    { id: 'rot', label: '全部页面旋转', type: 'select', options: ['不旋转', '顺时针 90°', '180°', '逆时针 90°'] }],
  note: notePDF + ' 缩略图按页码列出，填新顺序 / 删除页 / 旋转后重新保存，文字层保留。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument, degrees } = await vendor('pdf');
    const src = await PDFDocument.load(await f.arrayBuffer());
    const n = src.getPageCount();
    const parseList = (s) => { const out = []; for (const seg of String(s || '').split(/[,，]/)) { const m = seg.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (m) { for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) if (i >= 1 && i <= n) out.push(i - 1); } } return out; };
    const del = new Set(parseList(v.del));
    let order = parseList(v.order);
    if (!order.length) order = Array.from({ length: n }, (_, i) => i);
    order = order.filter((x) => !del.has(x));
    if (!order.length) return { error: '删完没有页面了' };
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, order);
    const rot = { '顺时针 90°': 90, '180°': 180, '逆时针 90°': 270 }[v.rot] || 0;
    pages.forEach((p) => { if (rot) p.setRotation(degrees((p.getRotation().angle + rot) % 360)); out.addPage(p); });
    const bytes = await out.save();
    return { text: `原 ${n} 页 → 新 ${order.length} 页\n新顺序（原页码）：${order.map((x) => x + 1).join(', ')}${del.size ? `\n删除：${[...del].map((x) => x + 1).join(', ')}` : ''}`,
      copy: order.map((x) => x + 1).join(', '),
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-编辑.pdf', data: bytes, mime: 'application/pdf', label: '下载编辑后的 PDF' }],
      stats: [{ label: '原页', value: n }, { label: '新页', value: order.length }, { label: '删除', value: del.size }] };
  } };

S['pdf-watermark'] = { kind: 'file', titleIn: 'PDF', titleOut: '加水印', accept: 'application/pdf,.pdf', multiple: false,
  primary: '加水印下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'text', label: '水印文字', type: 'text', default: '仅供内部使用' },
    { id: 'style', label: '样式', type: 'select', options: ['斜向铺满', '单个居中', '页脚一行'] },
    { id: 'opacity', label: '透明度', type: 'range', min: 0.05, max: 0.6, step: 0.05, default: 0.18 },
    { id: 'size', label: '字号', type: 'number', default: 32 }, { id: 'color', label: '颜色', type: 'color', default: '#b4552d' }],
  note: notePDF + ' 用 pdf-lib 的 drawText 叠加矢量文字水印，保留原文字层；中文用内置标准字体可能显示为方块，建议先用英文/数字水印或换字体方案。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument, StandardFonts, rgb, degrees } = await vendor('pdf');
    const doc = await PDFDocument.load(await f.arrayBuffer());
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const c = L.hex2rgb(v.color) || [180, 85, 45];
    const col = rgb(c[0] / 255, c[1] / 255, c[2] / 255);
    const ascii = /^[\x20-\x7e]*$/.test(String(v.text || '')) ? String(v.text) : String(v.text || '').replace(/[^\x20-\x7e]/g, '');
    const label = ascii || 'WATERMARK';
    for (const page of doc.getPages()) {
      const { width: W, height: H } = page.getSize(), s = Number(v.size) || 32, a = Number(v.opacity) || 0.18;
      if (v.style === '斜向铺满') {
        for (let y = -H; y < H * 1.5; y += s * 4) for (let x = -W; x < W * 1.5; x += s * 10)
          page.drawText(label, { x, y, size: s, font, color: col, opacity: a, rotate: degrees(35) });
      } else if (v.style === '单个居中') page.drawText(label, { x: W / 2 - label.length * s * 0.28, y: H / 2, size: s * 1.6, font, color: col, opacity: a, rotate: degrees(35) });
      else page.drawText(label, { x: 24, y: 22, size: 10, font, color: col, opacity: Math.min(0.8, a * 2) });
    }
    const bytes = await doc.save();
    return { text: `已给 ${doc.getPageCount()} 页加上「${label}」水印${ascii !== String(v.text || '') ? '（中文被过滤，标准字体不支持中文）' : ''}。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-水印.pdf', data: bytes, mime: 'application/pdf', label: '下载加水印 PDF' }],
      stats: [{ label: '页数', value: doc.getPageCount() }, { label: '大小', value: L.humanSize(bytes.length) }] };
  } };

S['pdf-sign'] = { kind: 'file', titleIn: 'PDF + 签名图', titleOut: '签名结果', accept: 'application/pdf,.pdf,image/*', multiple: true,
  primary: '盖章下载', auto: false, dropTitle: '拖 1 个 PDF + 1 张签名/印章 PNG',
  fields: [{ id: 'page', label: '放到第几页（0 = 每页）', type: 'number', default: 1 },
    { id: 'x', label: 'X 位置（pt，从左下角算）', type: 'number', default: 380 },
    { id: 'y', label: 'Y 位置（pt）', type: 'number', default: 90 },
    { id: 'w', label: '宽度（pt）', type: 'number', default: 140 }],
  note: notePDF + ' 签名图请传透明底 PNG（可用「手绘白板」写好导出，或手写拍照后抠白底）；没有传图时会生成一份示例签名框。',
  process: async (files, v, ctx) => {
    const pdfFile = files.find((f) => /\.pdf$/i.test(f.name));
    if (!pdfFile) return { error: '需要一个 PDF 文件' };
    const { PDFDocument } = await vendor('pdf');
    const doc = await PDFDocument.load(await pdfFile.arrayBuffer());
    const signFile = files.find((f) => f.type.startsWith('image/') && f !== pdfFile);
    let img;
    if (signFile) {
      const buf = await signFile.arrayBuffer();
      try { img = await doc.embedPng(buf); } catch (e) { img = await doc.embedJpg(buf); }
    }
    const pages = doc.getPages(), target = Number(v.page) || 0;
    const w = Number(v.w) || 140, h = img ? w * img.height / img.width : w * 0.4;
    for (let i = 0; i < pages.length; i++) {
      if (target && i + 1 !== target) continue;
      const p = pages[i];
      if (img) p.drawImage(img, { x: Number(v.x) || 380, y: Number(v.y) || 90, width: w, height: h });
      else { p.drawRectangle({ x: Number(v.x) || 380, y: Number(v.y) || 90, width: w, height: h, borderWidth: 1, borderColor: (await vendor('pdf')).rgb(0.7, 0.35, 0.2) }); }
    }
    const bytes = await doc.save();
    return { text: `${signFile ? '已嵌入签名图 ' + signFile.name : '未传签名图，已画一个占位签名框'}，作用于${target ? `第 ${target} 页` : '每一页'}。`,
      files: [{ name: pdfFile.name.replace(/\.pdf$/i, '') + '-签名.pdf', data: bytes, mime: 'application/pdf', label: '下载签名 PDF' }],
      stats: [{ label: '页数', value: pages.length }, { label: '加盖', value: target ? 1 : pages.length }] };
  } };

S['pdf-page-number'] = { kind: 'file', titleIn: 'PDF', titleOut: '加页码', accept: 'application/pdf,.pdf', multiple: false,
  primary: '加页码下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'pos', label: '位置', type: 'select', options: ['页脚居中', '页脚右侧', '页眉居中', '页眉右侧'] },
    { id: 'fmt', label: '格式', type: 'select', options: ['1 / 3', '第 1 页 / 共 3 页', '1', '- 1 -', 'Page 1 of 3'] },
    { id: 'skip', label: '跳过前几页（封面）', type: 'number', default: 0 },
    { id: 'size', label: '字号', type: 'number', default: 10 }],
  note: notePDF + ' 在页眉/页脚叠加矢量文字，原文字层保留；中文格式含汉字时标准字体不支持，会自动回退成数字格式。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument, StandardFonts, rgb } = await vendor('pdf');
    const doc = await PDFDocument.load(await f.arrayBuffer());
    const font = await doc.embedFont(StandardFonts.Helvetica), pages = doc.getPages(), n = pages.length, s = Number(v.size) || 10;
    const skip = Math.max(0, Number(v.skip) || 0);
    const chinese = /[\u4e00-\u9fff]/.test(v.fmt);
    for (let i = skip; i < n; i++) {
      const p = pages[i], { width: W, height: H } = p.getSize(), cur = i + 1;
      const label = chinese ? `${cur} / ${n}` : ({ '1 / 3': `${cur} / ${n}`, '第 1 页 / 共 3 页': `${cur} / ${n}`, '1': String(cur), '- 1 -': `- ${cur} -`, 'Page 1 of 3': `Page ${cur} of ${n}` })[v.fmt] || String(cur);
      const y = v.pos.startsWith('页脚') ? 22 : H - 28;
      const x = v.pos.includes('右侧') ? W - 24 - label.length * s * 0.55 : W / 2 - label.length * s * 0.28;
      p.drawText(label, { x, y, size: s, font, color: rgb(0.35, 0.32, 0.28) });
    }
    const bytes = await doc.save();
    return { text: `已给第 ${skip + 1}–${n} 页加页码，共 ${n - skip} 页。${chinese ? '（标准字体不支持中文，已回退为 1 / 3 形式）' : ''}`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-页码.pdf', data: bytes, mime: 'application/pdf', label: '下载加页码 PDF' }],
      stats: [{ label: '总页', value: n }, { label: '加码', value: n - skip }] };
  } };

S['pdf-remove-page-number'] = { kind: 'file', titleIn: 'PDF', titleOut: '去页码', accept: 'application/pdf,.pdf', multiple: false,
  primary: '覆盖并下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'side', label: '区域', type: 'select', options: ['页脚', '页眉', '自定义坐标'] },
    { id: 'x', label: 'X（pt，从左下角）', type: 'number', default: 0 }, { id: 'y', label: 'Y（pt）', type: 'number', default: 0 },
    { id: 'w', label: '宽（pt，0 = 整页宽）', type: 'number', default: 0 }, { id: 'h', label: '高（pt）', type: 'number', default: 32 },
    { id: 'color', label: '填充色（取页面底色）', type: 'color', default: '#ffffff' }],
  note: notePDF + ' 在指定坐标画一个同底色矩形把页码盖住，对每一页生效；纯扫描件底色不匀时会留痕。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument, rgb } = await vendor('pdf');
    const doc = await PDFDocument.load(await f.arrayBuffer()), pages = doc.getPages();
    const c = L.hex2rgb(v.color) || [255, 255, 255]; const col = rgb(c[0] / 255, c[1] / 255, c[2] / 255);
    const h = Number(v.h) || 32;
    for (const p of pages) {
      const { width: W, height: H } = p.getSize();
      const x = Number(v.w) ? Number(v.x) : 0, w = Number(v.w) || W;
      const y = v.side === '页眉' ? H - h : v.side === '页脚' ? 0 : Number(v.y) || 0;
      p.drawRectangle({ x, y, width: w, height: h, color: col, borderWidth: 0 });
    }
    const bytes = await doc.save();
    return { text: `已在 ${pages.length} 页的「${v.side}」区域覆盖 ${h}pt 高的底色矩形。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-去页码.pdf', data: bytes, mime: 'application/pdf', label: '下载去页码 PDF' }],
      stats: [{ label: '页数', value: pages.length }] };
  } };

S['pdf-compress'] = { kind: 'file', titleIn: 'PDF（扫描件效果最明显）', titleOut: '压缩结果', accept: 'application/pdf,.pdf', multiple: false,
  primary: '压缩下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'q', label: '质量档', type: 'select', options: ['高（JPEG 0.85）', '中（0.65）', '低（0.45）', '极低（0.3）'] },
    { id: 'scale', label: '渲染倍率', type: 'select', options: ['1×', '1.5×', '2×'] }],
  note: notePDF + ' 做法是把每页重渲染成 JPEG 再组装成新 PDF，对扫描件/图片型 PDF 瘦身明显；对纯文字 PDF 会丢掉文字层，请按需选择。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const q = { '高（JPEG 0.85）': 0.85, '中（0.65）': 0.65, '低（0.45）': 0.45, '极低（0.3）': 0.3 }[v.q] || 0.65;
    const scale = Number(String(v.scale).replace('×', '')) || 1.5;
    const pdf = await pdfOpen(await f.arrayBuffer());
    const { PDFDocument } = await vendor('pdf');
    const doc = await PDFDocument.create();
    for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
      const { canvas, viewport } = await pdfRenderPage(pdf, i, scale);
      const buf = await (await L.canvasBlob(canvas, 'image/jpeg', q)).arrayBuffer();
      const jpg = await doc.embedJpg(buf);
      const page = doc.addPage([viewport.width / scale, viewport.height / scale]);
      page.drawImage(jpg, { x: 0, y: 0, width: viewport.width / scale, height: viewport.height / scale });
    }
    const bytes = await doc.save();
    const ratio = (100 - bytes.length / f.size * 100).toFixed(1);
    return { text: `${f.name}：${L.humanSize(f.size)} → ${L.humanSize(bytes.length)}（${Number(ratio) >= 0 ? '缩小' : '变大'} ${Math.abs(ratio)}%）\n共 ${Math.min(pdf.numPages, 100)} 页，质量 ${q}。\n\n注意：这是重渲染，文字层会变成图片；纯文字 PDF 建议用「PDF 页面编辑」重存来去冗余。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-压缩.pdf', data: bytes, mime: 'application/pdf', label: '下载压缩 PDF' }],
      stats: [{ label: '原', value: L.humanSize(f.size) }, { label: '新', value: L.humanSize(bytes.length) }, { label: '变化', value: ratio + '%' }] };
  } };

S['pdf-decrypt'] = { kind: 'file', titleIn: 'PDF', titleOut: '解密结果', accept: 'application/pdf,.pdf,.enc', multiple: false,
  primary: '解密 / 去限制', auto: false, dropTitle: '拖 PDF 或本工具生成的 .pdfenc',
  fields: [{ id: 'pwd', label: '密码（自定义 .pdfenc 容器必填）', type: 'text', default: '' }],
  note: notePDF + ' 标准「打开密码」PDF 需要 qpdf 引擎，浏览器端不做假装；这里能处理的是①无打开密码但带复制/打印限制的 PDF（重存即解除）②本工具「PDF 加密」生成的 .pdfenc 容器。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选文件' };
    const buf = new Uint8Array(await f.arrayBuffer());
    if (/\.pdfenc$/i.test(f.name) || /\.enc$/i.test(f.name)) {
      if (!v.pwd) return { error: '这是加密容器，先填密码' };
      try {
        const enc = new TextEncoder();
        const marker = L.fromUtf8(buf.slice(0, 5));
        if (marker !== 'TBX1|') throw new Error('不是本工具生成的容器');
        const end = buf.findIndex((x, i) => i > 4 && x === 124);
        const meta = L.fromUtf8(buf.slice(5, end)).split('|');
        const salt = buf.slice(end + 1, end + 17), iv = buf.slice(end + 17, end + 29), ct = buf.slice(end + 29);
        const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
        return { text: `解密成功：${meta[0]}（${L.humanSize(plain.length)}），AES-GCM 校验通过。`,
          files: [{ name: meta[0] || '解密.pdf', data: plain, mime: 'application/pdf', label: '下载原 PDF' }], stats: [{ label: '结果', value: '成功' }] };
      } catch (e) { return { error: '解密失败：密码不对或文件损坏' }; }
    }
    const { PDFDocument } = await vendor('pdf');
    let doc;
    try { doc = await PDFDocument.load(buf, { ignoreEncryption: true }); }
    catch (e) { return { error: '打不开：' + e.message + '。带「打开密码」的 PDF 请用本地 qpdf：qpdf --decrypt in.pdf out.pdf' }; }
    const bytes = await doc.save();
    return { text: `已重存 ${doc.getPageCount()} 页，去掉了权限限制标志（复制 / 打印 / 编辑）。\n如果原文件要求打开密码，pdf-lib 也读不了，这一步会直接失败并提示。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-解密.pdf', data: bytes, mime: 'application/pdf', label: '下载无限制 PDF' }],
      stats: [{ label: '页数', value: doc.getPageCount() }, { label: '原', value: L.humanSize(f.size) }, { label: '新', value: L.humanSize(bytes.length) }] };
  } };

S['pdf-encrypt'] = { kind: 'file', titleIn: 'PDF', titleOut: '加密结果', accept: 'application/pdf,.pdf', multiple: true,
  primary: '加密下载', auto: false, dropTitle: '拖 PDF 进来',
  fields: [{ id: 'pwd', label: '密码', type: 'text', default: '' }],
  note: '重要：浏览器端没有可用的标准 PDF 口令加密引擎，这里用 AES-GCM 把 PDF 包成本工具自定义的 .pdfenc 容器（PBKDF2 15 万次派生 + 随机盐与 IV）。用「PDF 解密」填同一密码即可还原；发给别人也需要用本工具打开。',
  process: async (files, v, ctx) => {
    if (!v.pwd) return { error: '先设密码' };
    if (!files.length) return { error: '先选 PDF' };
    const enc = new TextEncoder(), outs = [], logs = [];
    for (const f of files) {
      const raw = new Uint8Array(await f.arrayBuffer());
      const salt = L.randBytes(16), iv = L.randBytes(12);
      const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, raw));
      const head = L.utf8(`TBX1|${f.name}|${raw.length}|`);
      const out = new Uint8Array(head.length + 28 + ct.length);
      out.set(head, 0); out.set(salt, head.length); out.set(iv, head.length + 16); out.set(ct, head.length + 28);
      outs.push({ name: f.name + '.pdfenc', data: out, mime: 'application/octet-stream' });
      logs.push(`${f.name} → 已加密（${L.humanSize(out.length)}）`);
    }
    return { text: logs.join('\n') + '\n\n还原方式：打开「PDF 解密」→ 拖 .pdfenc → 填同一密码。', copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '加密结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }] };
  } };

S['pdf-diff'] = { kind: 'file', titleIn: '两份 PDF', titleOut: '像素对比', accept: 'application/pdf,.pdf', multiple: true,
  primary: '对比', auto: false, dropTitle: '拖 2 个 PDF 进来',
  fields: [{ id: 'page', label: '对比第几页', type: 'number', default: 1 },
    { id: 'th', label: '像素差异阈值', type: 'range', min: 8, max: 80, step: 4, default: 24 }],
  note: notePDF + ' 把两份 PDF 的指定页渲染到同尺寸 canvas，逐像素比较，差异处标红并给出差异占比。',
  process: async (files, v, ctx) => {
    if (files.length < 2) return { error: '需要两份 PDF' };
    const a = await pdfOpen(await files[0].arrayBuffer()), b = await pdfOpen(await files[1].arrayBuffer());
    const n = Number(v.page) || 1;
    const A = await pdfRenderPage(a, n, 1.2), B = await pdfRenderPage(b, n, 1.2);
    const W = Math.min(A.canvas.width, B.canvas.width), H = Math.min(A.canvas.height, B.canvas.height);
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    const da = A.canvas.getContext('2d').getImageData(0, 0, W, H), db = B.canvas.getContext('2d').getImageData(0, 0, W, H);
    const out = g.createImageData(W, H); let diff = 0; const th = Number(v.th) || 24;
    for (let i = 0; i < W * H; i++) {
      const p = i * 4, d = Math.abs(da.data[p] - db.data[p]) + Math.abs(da.data[p + 1] - db.data[p + 1]) + Math.abs(da.data[p + 2] - db.data[p + 2]);
      const isDiff = d > th * 3;
      if (isDiff) diff++;
      out.data[p] = isDiff ? 220 : 240; out.data[p + 1] = isDiff ? 60 : 238; out.data[p + 2] = isDiff ? 50 : 232; out.data[p + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const rate = diff / (W * H) * 100;
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:320px"><p class="t-hint">红色 = 有差异</p>`,
      text: `第 ${n} 页（A ${a.numPages} 页 / B ${b.numPages} 页）\n渲染尺寸 ${W}×${H}\n差异像素 ${diff} / ${W * H}（${rate.toFixed(2)}%）\n阈值 ${th}`,
      files: [{ name: 'PDF 差异图.png', data: png, mime: 'image/png', label: '下载差异图' }],
      stats: [{ label: '差异', value: rate.toFixed(2) + '%' }, { label: 'A 页数', value: a.numPages }, { label: 'B 页数', value: b.numPages }] };
  } };
