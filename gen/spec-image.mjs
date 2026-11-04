// 图片类：canvas / 本地二维码与条形码库 / gif.js / OCR
// 注意：qrCanvas / barcodeSvg / svgToPng 由 engines.js 提供，经 generate.mjs 的 HEAD 导入，
// 不要在本文件里重新定义（生成器只序列化函数体，顶层 helper 不会进产物）。
export const S = {};

S['qrcode'] = { kind: 'form', titleIn: '二维码内容', titleOut: '二维码', wide: false,
  fields: [{ id: 'type', label: '类型', type: 'select', options: ['文本 / 网址', 'WiFi', '名片 vCard', '短信', '邮件'] },
    { id: 'text', label: '内容', type: 'textarea', rows: 3, default: 'https://example.com' },
    { id: 'ssid', label: 'WiFi 名称', type: 'text', default: '' }, { id: 'pwd', label: 'WiFi 密码', type: 'text', default: '' },
    { id: 'name', label: '名片姓名', type: 'text', default: '' }, { id: 'tel', label: '名片电话', type: 'text', default: '' },
    { id: 'ec', label: '纠错等级', type: 'select', options: ['L 低', 'M 中', 'Q 较高', 'H 高'] },
    { id: 'dot', label: '码点样式', type: 'select', options: ['方形', '圆点', '圆角'] },
    { id: 'scale', label: '码点像素', type: 'number', default: 8 },
    { id: 'dark', label: '前景色', type: 'color', default: '#2f2b26' }, { id: 'light', label: '背景色', type: 'color', default: '#ffffff' }],
  primary: '复制 SVG', hintOut: '二维码用本地库在浏览器里生成，内容不上传。可导出 PNG / SVG，也能把 Logo 叠在中间（纠错等级调高更稳）。',
  compute: async (v) => {
    let text = String(v.text || '');
    if (v.type === 'WiFi') text = `WIFI:T:WPA;S:${v.ssid || ''};P:${v.pwd || ''};;`;
    else if (v.type === '名片 vCard') text = `BEGIN:VCARD\nVERSION:3.0\nFN:${v.name || ''}\nTEL:${v.tel || ''}\nEND:VCARD`;
    else if (v.type === '短信') text = `SMSTO:${v.tel || ''}:${text}`;
    else if (v.type === '邮件') text = `mailto:${text}`;
    if (!text.trim()) return { error: '内容不能为空' };
    const ec = String(v.ec || 'M')[0];
    const { canvas, count } = await qrCanvas(text, { ec, scale: L.clamp(Number(v.scale) || 8, 2, 20), dark: v.dark, light: v.light, dot: v.dot });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${canvas.toDataURL('image/png')}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
    return { preview: `<img src="${canvas.toDataURL('image/png')}" style="max-width:260px;image-rendering:pixelated">`,
      copy: svg, text: `编码内容：${text}\n版本：${count} × ${count} 模块`, stats: [{ label: '模块', value: count + '×' + count }, { label: '字符', value: text.length }],
      actions: [{ label: '下载 PNG', run: (vv, c) => c.canvasDownload(canvas, '二维码.png') }] };
  } };

S['qrcode-batch'] = { kind: 'form', titleIn: '批量内容', titleOut: '打包结果', wide: false,
  fields: [{ id: 'rows', label: '每行：文件名|内容', type: 'textarea', rows: 8, default: '首页|https://example.com\n联系|BEGIN:VCARD\n张三|A-001' },
    { id: 'scale', label: '码点像素', type: 'number', default: 8 }, { id: 'ec', label: '纠错', type: 'select', options: ['M 中', 'L 低', 'Q 较高', 'H 高'] }],
  primary: '复制清单', hintOut: '一次生成多张二维码并打包成 ZIP 下载；文件名会自动补 .png。',
  compute: async (v) => {
    const rows = L.nonEmptyLines(v.rows || '').map((l) => { const i = l.indexOf('|'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['qr-' + Math.random().toString(36).slice(2, 6), l.trim()]; }).filter((r) => r[1]);
    if (!rows.length) return { error: '至少一行 文件名|内容' };
    const outs = [];
    for (const [name, text] of rows.slice(0, 100)) { const { canvas } = await qrCanvas(text, { ec: String(v.ec || 'M')[0], scale: L.clamp(Number(v.scale) || 8, 2, 20) }); outs.push({ name: name.replace(/[\\/:*?"<>|]/g, '_') + '.png', data: await L.canvasU8(canvas, 'image/png'), mime: 'image/png' }); }
    return { text: `生成 ${outs.length} 张：\n${outs.map((o) => o.name).join('\n')}`, copy: rows.map((r) => r.join('|')).join('\n'),
      stats: [{ label: '二维码', value: outs.length }],
      actions: [{ label: '打包 ZIP 下载', run: (vv, c) => c.download('二维码批量.zip', buildZip(outs), 'application/zip') }] };
  } };

S['barcode'] = { kind: 'form', titleIn: '条码内容', titleOut: '条形码', wide: false,
  fields: [{ id: 'text', label: '内容', type: 'text', default: '6901234567892' },
    { id: 'format', label: '码制', type: 'select', options: ['CODE128', 'EAN13', 'EAN8', 'UPC', 'ITF14', 'CODE39', 'MSI', 'pharmacode'] },
    { id: 'w', label: '条宽', type: 'number', default: 2 }, { id: 'h', label: '高度', type: 'number', default: 90 },
    { id: 'color', label: '条色', type: 'color', default: '#2f2b26' }, { id: 'bg', label: '底色', type: 'color', default: '#ffffff' }],
  primary: '复制 SVG', hintOut: 'JsBarcode 本地打包；EAN13 / UPC 需要正确位数的数字，校验位会自动算。',
  compute: async (v) => {
    const t = String(v.text || '').trim(); if (!t) return { error: '内容不能为空' };
    let svg; try { svg = await barcodeSvg(t, { format: v.format, color: v.color, bg: v.bg, w: L.clamp(Number(v.w) || 2, 1, 6), h: L.clamp(Number(v.h) || 90, 30, 200) }); }
    catch (e) { return { error: '生成失败：' + e.message + '（检查码制要求的数据位数）' }; }
    const png = await svgToPng(svg);
    return { preview: svg, copy: svg, text: `${v.format} · ${t}`, stats: [{ label: '码制', value: v.format }, { label: '字符', value: t.length }],
      actions: [{ label: '下载 PNG', run: (vv, c) => c.download('条形码.png', png, 'image/png') }] };
  } };

S['barcode-batch'] = { kind: 'form', titleIn: '批量内容', titleOut: '打包结果', wide: false,
  fields: [{ id: 'rows', label: '每行：文件名|内容', type: 'textarea', rows: 7, default: '商品A|6901234567892\n商品B|6901234567893\n商品C|ABC-12345' },
    { id: 'format', label: '码制', type: 'select', options: ['CODE128', 'CODE39', 'EAN13', 'ITF14'] }],
  primary: '复制清单', hintOut: '一次生成多张条码，打包 ZIP 下载；内容不符合码制时会单独报错并跳过。',
  compute: async (v) => {
    const rows = L.nonEmptyLines(v.rows || '').map((l) => { const i = l.indexOf('|'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['bc-' + Math.random().toString(36).slice(2, 6), l.trim()]; });
    const outs = [], errs = [];
    for (const [name, text] of rows.slice(0, 100)) { try { const svg = await barcodeSvg(text, { format: v.format }); outs.push({ name: name.replace(/[\\/:*?"<>|]/g, '_') + '.png', data: await svgToPng(svg), mime: 'image/png' }); } catch (e) { errs.push(`${name}：${e.message}`); } }
    return { text: `成功 ${outs.length} 张${errs.length ? `，失败 ${errs.length} 张：\n${errs.join('\n')}` : ''}`, copy: rows.map((r) => r.join('|')).join('\n'),
      stats: [{ label: '成功', value: outs.length }, { label: '失败', value: errs.length }],
      actions: [{ label: '打包 ZIP 下载', run: (vv, c) => c.download('条形码批量.zip', buildZip(outs), 'application/zip') }] };
  } };

S['pay-qr-merge'] = { kind: 'file', titleIn: '两张收款码', titleOut: '聚合码', accept: 'image/*', multiple: true,
  primary: '合成下载', auto: false, dropTitle: '拖微信 + 支付宝收款码图片进来',
  fields: [{ id: 'shop', label: '店名 / 备注', type: 'text', default: '扫码付款' },
    { id: 'wlabel', label: '左边标签', type: 'text', default: '微信支付' }, { id: 'alabel', label: '右边标签', type: 'text', default: '支付宝' },
    { id: 'bg', label: '底色', type: 'color', default: '#ffffff' }],
  note: '把两张收款码并排合成一张图，加上店名与标签；扫码时对准对应一侧即可。合成只在本机完成。',
  process: async (files, v, ctx) => {
    if (files.length < 1) return { error: '至少拖一张收款码' };
    const imgs = [];
    for (const f of files.slice(0, 2)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const cell = 320, pad = 24, top = 76;
    const cv = L.canvasOf(pad * 3 + cell * 2, top + cell + 76), g = cv.getContext('2d');
    g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#3d3328'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(v.shop || '扫码付款', cv.width / 2, 42);
    imgs.forEach((im, i) => {
      const x = pad + i * (cell + pad), y = top;
      g.fillStyle = '#fff'; g.fillRect(x, y, cell, cell);
      const s = Math.min(cell / im.naturalWidth, cell / im.naturalHeight);
      g.drawImage(im, x + (cell - im.naturalWidth * s) / 2, y + (cell - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      g.fillStyle = i ? '#1677ff' : '#07c160'; g.font = 'bold 19px sans-serif';
      g.fillText(i ? (v.alabel || '支付宝') : (v.wlabel || '微信'), x + cell / 2, y + cell + 34);
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `已合成 ${imgs.length} 张收款码${imgs.length < 2 ? '（只传了一张，另一格留空）' : ''}。`,
      files: [{ name: '聚合收款码.png', data: png, mime: 'image/png', label: '下载 PNG' }], stats: [{ label: '码', value: imgs.length }] };
  } };

S['image-compress'] = { kind: 'file', titleIn: '图片', titleOut: '压缩结果', accept: 'image/*', multiple: true,
  primary: '压缩下载', auto: false, dropTitle: '拖多张图片进来',
  fields: [{ id: 'fmt', label: '输出格式', type: 'select', options: ['保持原格式', 'JPEG', 'WebP', 'PNG'] },
    { id: 'q', label: '质量', type: 'range', min: 0.3, max: 0.95, step: 0.05, default: 0.8 },
    { id: 'maxw', label: '最大宽度（0 = 不缩放）', type: 'number', default: 0 }],
  note: 'canvas 重新编码，批量打包 ZIP；透明底转 JPEG 时会填白。WebP / AVIF 支持取决于浏览器。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const im = await L.imageFromFile(f);
        let w = im.naturalWidth, h = im.naturalHeight;
        if (Number(v.maxw) > 0 && w > Number(v.maxw)) { h = Math.round(h * Number(v.maxw) / w); w = Number(v.maxw); }
        const cv = L.canvasOf(w, h), g = cv.getContext('2d');
        let type = v.fmt;
        if (type === '保持原格式') type = f.type.includes('png') ? 'PNG' : f.type.includes('webp') ? 'WebP' : 'JPEG';
        if (type === 'JPEG') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
        g.drawImage(im, 0, 0, w, h);
        const mime = { JPEG: 'image/jpeg', WebP: 'image/webp', PNG: 'image/png' }[type];
        const ext = { JPEG: 'jpg', WebP: 'webp', PNG: 'png' }[type];
        const data = await L.canvasU8(cv, mime, Number(v.q) || 0.8);
        outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.' + ext, data, mime });
        logs.push(`${f.name}：${L.humanSize(f.size)} → ${L.humanSize(data.length)}（${(100 - data.length / f.size * 100).toFixed(0)}%）`);
      } catch (e) { logs.push(`${f.name}：失败 ${e.message}`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '压缩结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '成功', value: outs.length }] };
  } };

S['image-convert'] = { kind: 'file', titleIn: '图片', titleOut: '转换结果', accept: 'image/*', multiple: true,
  primary: '转换下载', auto: false, dropTitle: '拖图片进来',
  fields: [{ id: 'fmt', label: '目标格式', type: 'select', options: ['PNG', 'JPEG', 'WebP', 'BMP', 'SVG（内嵌位图）'] },
    { id: 'bg', label: '透明底填充色（转 JPEG/BMP 时用）', type: 'color', default: '#ffffff' }],
  note: '浏览器能解码的格式（PNG/JPEG/WebP/GIF 首帧/BMP）可互转；HEIC / AVIF / TIFF 需要浏览器原生支持或专门的解码器，读不了会明确列出。EXIF 在重绘后会丢失，需要保留请用「照片信息」先另存。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d');
        if (['JPEG', 'BMP'].includes(v.fmt)) { g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(im, 0, 0);
        let data, mime, ext = v.fmt.toLowerCase();
        if (v.fmt === 'SVG（内嵌位图）') { const u = cv.toDataURL('image/png'); data = L.utf8(`<svg xmlns="http://www.w3.org/2000/svg" width="${cv.width}" height="${cv.height}"><image href="${u}" width="100%" height="100%"/></svg>`); mime = 'image/svg+xml'; ext = 'svg'; }
        else if (v.fmt === 'BMP') { data = await L.canvasU8(cv, 'image/bmp'); mime = 'image/bmp'; }
        else { mime = { PNG: 'image/png', JPEG: 'image/jpeg', WebP: 'image/webp' }[v.fmt]; data = await L.canvasU8(cv, mime, 0.92); }
        outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.' + ext, data, mime });
        logs.push(`${f.name} → ${ext.toUpperCase()}（${im.naturalWidth}×${im.naturalHeight}）`);
      } catch (e) { logs.push(`${f.name}：浏览器解不开 ${e.message}`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '格式转换.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '成功', value: outs.length }] };
  } };

S['favicon-generator'] = { kind: 'file', titleIn: '一张方形图', titleOut: '图标包', accept: 'image/*', multiple: false,
  primary: '生成图标包', auto: false, dropTitle: '拖一张 PNG / 方图进来',
  fields: [{ id: 'bg', label: '圆角底填充色', type: 'color', default: '#b4552d' },
    { id: 'radius', label: '圆角比例', type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.22 }],
  note: '一次生成 favicon.ico（16/32/48）、Apple Touch 180、Android 192/512、manifest 与 HTML 引用片段，打包 ZIP 直接放进站点根目录。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选图' };
    const im = await L.imageFromFile(f);
    const mk = async (size, radius = 0) => {
      const cv = L.canvasOf(size, size), g = cv.getContext('2d');
      g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, size, size);
      const s = Math.min(size / im.naturalWidth, size / im.naturalHeight);
      if (radius) { g.save(); g.beginPath(); g.roundRect ? g.roundRect(0, 0, size, size, size * radius) : g.rect(0, 0, size, size); g.clip(); }
      g.drawImage(im, (size - im.naturalWidth * s) / 2, (size - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      if (radius) g.restore();
      return L.canvasU8(cv, 'image/png');
    };
    const r = Number(v.radius) || 0;
    const p16 = await mk(16, r), p32 = await mk(32, r), p48 = await mk(48, r), p180 = await mk(180, r), p192 = await mk(192, r), p512 = await mk(512, r);
    // ICO：目录 + 直接内嵌 PNG（现代浏览器/系统都支持）
    const entries = [{ data: p16 }, { data: p32 }, { data: p48 }];
    const head = new Uint8Array(6 + 16 * entries.length), hv = new DataView(head.buffer);
    hv.setUint16(0, 0, true); hv.setUint16(2, 1, true); hv.setUint16(4, entries.length, true);
    let off = head.length;
    entries.forEach((e, i) => { const o = 6 + i * 16; head[o] = i === 0 ? 16 : i === 1 ? 32 : 48; head[o + 1] = head[o]; head[o + 2] = 0; head[o + 3] = 0; hv.setUint16(o + 4, 1, true); hv.setUint16(o + 6, 32, true); hv.setUint32(o + 8, e.data.length, true); hv.setUint32(o + 12, off, true); off += e.data.length; });
    const ico = new Uint8Array(head.length + entries.reduce((s, e) => s + e.data.length, 0));
    ico.set(head, 0); let o = head.length; entries.forEach((e) => { ico.set(e.data, o); o += e.data.length; });
    const manifest = JSON.stringify({ name: '我的站点', short_name: '站点', icons: [{ src: '/android-192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-512.png', sizes: '512x512', type: 'image/png' }], theme_color: v.bg || '#b4552d', background_color: '#ffffff', display: 'standalone' }, null, 2);
    const html = `<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">`;
    const outs = [{ name: 'favicon.ico', data: ico, mime: 'image/x-icon' }, { name: 'favicon-32.png', data: p32, mime: 'image/png' }, { name: 'apple-touch-icon.png', data: p180, mime: 'image/png' }, { name: 'android-192.png', data: p192, mime: 'image/png' }, { name: 'android-512.png', data: p512, mime: 'image/png' }, { name: 'site.webmanifest', data: L.utf8(manifest), mime: 'application/json' }, { name: '引用代码.html', data: L.utf8(html), mime: 'text/html' }];
    return { preview: `<img src="${URL.createObjectURL(new Blob([p180], { type: 'image/png' }))}" style="width:120px;height:120px;border-radius:14px">`,
      text: `已生成 ${outs.length} 个文件：\n${outs.map((x) => x.name).join('\n')}\n\nHTML 引用：\n${html}`, copy: html,
      files: [{ name: 'favicon 图标包.zip', zip: outs, label: '打包下载全部' }],
      stats: [{ label: '文件', value: outs.length }, { label: '尺寸', value: '6 档' }] };
  } };

S['exif-clean'] = { kind: 'file', titleIn: 'JPG / PNG', titleOut: '清理结果', accept: 'image/jpeg,image/png,.jpg,.jpeg,.png', multiple: true,
  primary: '清理下载', auto: false, dropTitle: '拖 JPG / PNG 进来',
  fields: [{ id: 'keepRotate', label: '保留旋转方向（把 Orientation 归一后重绘）', type: 'checkbox', default: false }],
  note: '字节级处理：JPEG 移除 APP1(EXIF)、APP2、APP13(IPTC)、XMP 与 COM 注释段；PNG 移除 eXIf / tEXt / iTXt / zTXt / tIME 块。不改像素，压缩数据原样保留。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer()); let out = b, removed = 0;
      if (b[0] === 0xff && b[1] === 0xd8) {
        const chunks = [b.slice(0, 2)]; let p = 2;
        while (p + 4 < b.length) {
          if (b[p] !== 0xff) { chunks.push(b.slice(p)); break; }
          const marker = b[p + 1];
          if (marker === 0xda) { chunks.push(b.slice(p)); break; }
          const len = (b[p + 2] << 8) | b[p + 3];
          const seg = b.slice(p, p + 2 + len);
          if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) removed += seg.length;
          else chunks.push(seg);
          p += 2 + len;
        }
        out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0)); let o = 0; chunks.forEach((c) => { out.set(c, o); o += c.length; });
      } else if (L.bytesToHex(b.slice(0, 8)) === '89504e470d0a1a0a') {
        const chunks = [b.slice(0, 8)]; let p = 8;
        const drop = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
        while (p + 12 <= b.length) {
          const len = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
          const type = L.fromUtf8(b.slice(p + 4, p + 8));
          const seg = b.slice(p, p + 12 + len);
          if (drop.has(type)) removed += seg.length; else chunks.push(seg);
          p += 12 + len;
          if (type === 'IEND') break;
        }
        out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0)); let o = 0; chunks.forEach((c) => { out.set(c, o); o += c.length; });
      } else { logs.push(`${f.name}：不是 JPG/PNG，跳过`); continue; }
      outs.push({ name: f.name, data: out, mime: f.type || 'image/jpeg' });
      logs.push(`${f.name}：去掉 ${L.humanSize(removed)} 元数据，${L.humanSize(b.length)} → ${L.humanSize(out.length)}`);
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '清理结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: outs.length }] };
  } };

S['image-mosaic'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>图片打码</h2><span class="hint">拖框选区 · 或按住涂抹</span></div>
    <div class="t-drop" id="drop" style="min-height:80px"><div class="t">拖一张图进来，或点一下选择</div><div class="s">也可以 Ctrl+V 粘贴</div><input type="file" id="file" accept="image/*" hidden></div>
    <div class="t-row" style="margin:12px 0">
      <select class="t-select" id="mode" style="width:auto"><option>马赛克</option><option>高斯模糊</option><option>纯色块</option></select>
      <input class="t-range" type="range" id="size" min="6" max="60" value="18" style="width:130px"><span class="t-hint" id="sv" style="margin:0">18 px</span>
      <button class="t-btn" type="button" id="undo">撤销</button><button class="t-btn" type="button" id="reset">还原</button><button class="t-btn primary" type="button" id="dl" style="width:auto">下载 PNG</button>
    </div>
    <canvas id="cv" width="720" height="480" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;cursor:crosshair;touch-action:none"></canvas>
    <p class="t-hint">在图上按住鼠标拖一个矩形，松开即对该区域打码；多选区可叠加。</p>
  </section></div>`;
  const $ = (s) => root.querySelector(s), cv = $('#cv'), g = cv.getContext('2d');
  let orig = null, drawing = false, a = null;
  const setImg = async (f) => {
    const im = await L.imageFromFile(f);
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    g.drawImage(im, 0, 0); orig = g.getImageData(0, 0, cv.width, cv.height);
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) * cv.width / r.width), y: Math.round((e.clientY - r.top) * cv.height / r.height) }; };
  const apply = (p1, p2) => {
    if (!orig) return;
    const x = L.clamp(Math.min(p1.x, p2.x), 0, cv.width), y = L.clamp(Math.min(p1.y, p2.y), 0, cv.height);
    const w = L.clamp(Math.abs(p2.x - p1.x), 1, cv.width - x), h = L.clamp(Math.abs(p2.y - p1.y), 1, cv.height - y);
    if (w < 3 || h < 3) return;
    const cell = Number($('#size').value) || 18, mode = $('#mode').value;
    const tmp = L.canvasOf(w, h), tg = tmp.getContext('2d');
    tg.putImageData(orig, -x, -y);
    if (mode === '高斯模糊') { tg.filter = `blur(${Math.max(2, cell / 2)}px)`; tg.drawImage(tmp, 0, 0); tg.filter = 'none'; }
    else if (mode === '纯色块') { tg.fillStyle = '#3d3328'; tg.fillRect(0, 0, w, h); }
    else { const small = L.canvasOf(Math.max(1, Math.ceil(w / cell)), Math.max(1, Math.ceil(h / cell))); small.getContext('2d').drawImage(tmp, 0, 0, small.width, small.height); tg.imageSmoothingEnabled = false; tg.clearRect(0, 0, w, h); tg.drawImage(small, 0, 0, w, h); }
    g.drawImage(tmp, x, y);
  };
  cv.addEventListener('pointerdown', (e) => { if (!orig) return; drawing = true; a = pt(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (drawing) { const p = pt(e); g.putImageData(orig, 0, 0); const r = cv.getBoundingClientRect(); } });
  cv.addEventListener('pointerup', (e) => { if (drawing) { drawing = false; apply(a, pt(e)); } });
  $('#size').oninput = () => { $('#sv').textContent = $('#size').value + ' px'; };
  $('#undo').onclick = () => { if (orig) g.putImageData(orig, 0, 0); };
  $('#reset').onclick = () => { if (orig) g.putImageData(orig, 0, 0); };
  $('#dl').onclick = () => { if (orig) K.canvasDownload(cv, '打码.png'); };
  $('#file').onchange = () => $('#file').files[0] && setImg($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && setImg(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) setImg(f); });
  K.setAction('下载 PNG', () => $('#dl').click());
} };

S['image-crop'] = { kind: 'custom', render: (root, K) => {
  root.innerHTML = `<div class="t-work"><section class="t-panel wide">
    <div class="t-head"><h2><span class="step">1</span>裁剪 / 旋转</h2><span class="hint">本地 canvas</span></div>
    <div class="t-drop" id="drop" style="min-height:76px"><div class="t">拖一张图进来</div><div class="s">点一下选择，或 Ctrl+V</div><input type="file" id="file" accept="image/*" hidden></div>
    <div class="t-row" style="margin:12px 0;flex-wrap:wrap">
      <select class="t-select" id="ratio" style="width:auto"><option value="0">自由</option><option value="1">1:1 方图</option><option value="0.75">3:4</option><option value="1.3333">4:3</option><option value="0.5625">9:16</option><option value="1.7778">16:9</option></select>
      <button class="t-btn" type="button" id="rotL">↺ 左转</button><button class="t-btn" type="button" id="rotR">↻ 右转</button>
      <button class="t-btn" type="button" id="flipH">⇋ 水平</button><button class="t-btn" type="button" id="flipV">⇅ 垂直</button>
      <button class="t-btn" type="button" id="round">圆形裁剪</button><button class="t-btn primary" type="button" id="dl" style="width:auto">下载裁剪图</button>
    </div>
    <canvas id="cv" width="720" height="480" style="width:100%;height:auto;border:1px solid var(--line);border-radius:8px;cursor:crosshair;touch-action:none"></canvas>
    <p class="t-hint">拖一个框选裁剪区域，松开后右侧出预览；圆形裁剪会把四角变透明（导出 PNG）。</p>
  </section><section class="t-panel"><div class="t-head"><h2><span class="step">2</span>裁剪预览</h2></div><div class="t-preview" id="prev">等待框选</div></section></div>`;
  const $ = (s) => root.querySelector(s), cv = $('#cv'), g = cv.getContext('2d');
  let im = null, rot = 0, fh = false, fv = false, box = null, drawing = false, a = null, circle = false;
  const draw = () => {
    if (!im) return;
    const w = im.naturalWidth, h = im.naturalHeight;
    const swap = rot % 180 !== 0;
    cv.width = swap ? h : w; cv.height = swap ? w : h;
    g.save(); g.translate(cv.width / 2, cv.height / 2); g.rotate(rot * Math.PI / 180); g.scale(fh ? -1 : 1, fv ? -1 : 1);
    g.drawImage(im, -w / 2, -h / 2); g.restore();
    if (box) { g.strokeStyle = '#b4552d'; g.lineWidth = 2; g.strokeRect(box.x, box.y, box.w, box.h); }
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) * cv.width / r.width), y: Math.round((e.clientY - r.top) * cv.height / r.height) }; };
  const preview = () => {
    if (!box || !im) return;
    let { x, y, w, h } = box;
    const ratio = Number($('#ratio').value);
    if (ratio) { const r = ratio; if (w / h > r) { const nw = h * r; x += (w - nw) / 2; w = nw; } else { const nh = w / r; y += (h - nh) / 2; h = nh; } }
    const c2 = L.canvasOf(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), g2 = c2.getContext('2d');
    g2.drawImage(cv, x, y, w, h, 0, 0, c2.width, c2.height);
    if (circle) { g2.globalCompositeOperation = 'destination-in'; g2.beginPath(); g2.arc(c2.width / 2, c2.height / 2, Math.min(c2.width, c2.height) / 2, 0, Math.PI * 2); g2.fill(); g2.globalCompositeOperation = 'source-over'; }
    $('#prev').innerHTML = ''; const out = L.canvasOf(c2.width, c2.height); out.getContext('2d').drawImage(c2, 0, 0);
    const img = new Image(); img.src = c2.toDataURL('image/png'); img.style.maxHeight = '260px'; $('#prev').appendChild(img);
    root._out = out;
  };
  const setImg = async (f) => { im = await L.imageFromFile(f); rot = 0; fh = fv = false; box = null; draw(); };
  cv.addEventListener('pointerdown', (e) => { if (!im) return; drawing = true; a = pt(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pt(e); box = { x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w: Math.abs(p.x - a.x), h: Math.abs(p.y - a.y) }; draw(); });
  cv.addEventListener('pointerup', () => { drawing = false; preview(); });
  $('#rotL').onclick = () => { rot = (rot + 270) % 360; box = null; draw(); };
  $('#rotR').onclick = () => { rot = (rot + 90) % 360; box = null; draw(); };
  $('#flipH').onclick = () => { fh = !fh; draw(); };
  $('#flipV').onclick = () => { fv = !fv; draw(); };
  $('#round').onclick = () => { circle = !circle; K.toast(circle ? '圆形裁剪已开' : '已关闭'); preview(); };
  $('#ratio').onchange = preview;
  $('#dl').onclick = () => { if (root._out) K.canvasDownload(root._out, '裁剪.png'); else K.canvasDownload(cv, '裁剪.png'); };
  $('#file').onchange = () => $('#file').files[0] && setImg($('#file').files[0]);
  $('#drop').onclick = () => $('#file').click();
  $('#drop').ondragover = (e) => e.preventDefault();
  $('#drop').ondrop = (e) => { e.preventDefault(); e.dataTransfer.files[0] && setImg(e.dataTransfer.files[0]); };
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) setImg(f); });
  K.setAction('下载裁剪图', () => $('#dl').click());
} };

S['img-watermark'] = { kind: 'file', titleIn: '图片', titleOut: '水印结果', accept: 'image/*', multiple: true,
  primary: '加水印下载', auto: false, dropTitle: '拖图片进来',
  fields: [{ id: 'text', label: '水印文字', type: 'text', default: '© 我的作品' },
    { id: 'style', label: '样式', type: 'select', options: ['斜向铺满', '右下角单个', '居中单个'] },
    { id: 'size', label: '字号', type: 'number', default: 28 },
    { id: 'opacity', label: '透明度', type: 'range', min: 0.1, max: 0.9, step: 0.05, default: 0.35 },
    { id: 'color', label: '颜色', type: 'color', default: '#ffffff' }],
  note: 'canvas 叠加文字水印，批量打包下载。需要图片水印（Logo）可把 Logo 图也一起拖进来，会自动取第二张平铺。',
  process: async (files, v, ctx) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return { error: '先选图片' };
    const logo = imgs.length > 1 ? await L.imageFromFile(imgs[imgs.length - 1]) : null;
    const targets = logo ? imgs.slice(0, -1) : imgs;
    const outs = [];
    for (const f of targets) {
      const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d');
      g.drawImage(im, 0, 0);
      g.save(); g.globalAlpha = Number(v.opacity) || 0.35; g.fillStyle = v.color || '#fff'; g.font = `bold ${Number(v.size) || 28}px sans-serif`; g.textAlign = 'center';
      if (v.style === '斜向铺满') { g.translate(cv.width / 2, cv.height / 2); g.rotate(-Math.PI / 6); const step = (Number(v.size) || 28) * 5; for (let y = -cv.height; y < cv.height; y += step) for (let x = -cv.width; x < cv.width; x += step * 3) g.fillText(v.text || '', x, y); }
      else if (v.style === '右下角单个') g.fillText(v.text || '', cv.width - 130, cv.height - 24);
      else g.fillText(v.text || '', cv.width / 2, cv.height / 2);
      g.restore();
      if (logo) { g.globalAlpha = Math.max(0.2, (Number(v.opacity) || 0.35) * 0.8); const s = Math.min(120, cv.width / 6); for (let y = 20; y < cv.height; y += s * 2) for (let x = 20; x < cv.width; x += s * 2) g.drawImage(logo, x, y, s, s * logo.naturalHeight / logo.naturalWidth); g.globalAlpha = 1; }
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '-水印.png', data: await L.canvasU8(cv, 'image/png'), mime: 'image/png' });
    }
    return { preview: `<img src="${URL.createObjectURL(new Blob([outs[0].data], { type: 'image/png' }))}" style="max-height:280px">`,
      text: `已给 ${outs.length} 张图加水印${logo ? '，并平铺了 Logo' : ''}。`,
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '水印结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '图片', value: outs.length }] };
  } };

S['long-image'] = { kind: 'file', titleIn: '多张图', titleOut: '长图', accept: 'image/*', multiple: true,
  primary: '拼接下载', auto: false, dropTitle: '拖多张图进来，按文件名顺序拼',
  fields: [{ id: 'dir', label: '方向', type: 'select', options: ['竖向', '横向'] },
    { id: 'gap', label: '间距', unit: 'px', type: 'number', default: 0 },
    { id: 'bg', label: '背景色', type: 'color', default: '#ffffff' },
    { id: 'align', label: '对齐', type: 'select', options: ['拉伸同宽/同高', '居中不拉伸'] },
    { id: 'width', label: '统一宽度（0 = 用第一张）', type: 'number', default: 0 }],
  note: '按文件名自然排序拼接；竖向会自动统一宽度（可设置），横向统一高度。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const imgs = []; for (const f of list) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片都解不开' };
    const vert = v.dir === '竖向', gap = Number(v.gap) || 0, w0 = Number(v.width) || imgs[0].naturalWidth, h0 = Number(v.width) ? 0 : imgs[0].naturalHeight;
    const dims = imgs.map((im) => vert ? { w: w0, h: Math.round(im.naturalHeight * w0 / im.naturalWidth) } : { w: Math.round(im.naturalWidth * h0 / im.naturalHeight), h: h0 || im.naturalHeight });
    const total = vert ? dims.reduce((s, d) => s + d.h, 0) + gap * (imgs.length - 1) : dims.reduce((s, d) => s + d.w, 0) + gap * (imgs.length - 1);
    const W = vert ? Math.max(...dims.map((d) => d.w)) : total, H = vert ? total : Math.max(...dims.map((d) => d.h));
    const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, W, H);
    let off = 0;
    imgs.forEach((im, i) => {
      const d = dims[i];
      if (v.align === '居中不拉伸') { const s = Math.min(d.w / im.naturalWidth, d.h / im.naturalHeight); const dw = im.naturalWidth * s, dh = im.naturalHeight * s; g.drawImage(im, vert ? (W - dw) / 2 : off + (d.w - dw) / 2, vert ? off + (d.h - dh) / 2 : (H - dh) / 2, dw, dh); }
      else g.drawImage(im, vert ? 0 : off, vert ? off : 0, d.w, d.h);
      off += (vert ? d.h : d.w) + gap;
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `${imgs.length} 张图 → ${W}×${H} 长图。`, files: [{ name: '长图拼接.png', data: png, mime: 'image/png', label: '下载长图' }],
      stats: [{ label: '图片', value: imgs.length }, { label: '尺寸', value: `${W}×${H}` }] };
  } };

S['photo-collage'] = { kind: 'file', titleIn: '1–9 张图', titleOut: '拼图', accept: 'image/*', multiple: true,
  primary: '拼图下载', auto: false, dropTitle: '拖 1–9 张图进来',
  fields: [{ id: 'layout', label: '模板', type: 'select', options: ['2×2 网格', '1 大 + 2 小', '1 大 + 4 小', '3×3 九宫', '横向三连', '竖向三连', '1 左 + 2 右'] },
    { id: 'ratio', label: '画布比例', type: 'select', options: ['1:1', '4:3', '3:4', '16:9'] },
    { id: 'gap', label: '间距', type: 'number', default: 10 }, { id: 'radius', label: '圆角', type: 'number', default: 8 },
    { id: 'bg', label: '背景色', type: 'color', default: '#f2eee5' }],
  note: '按模板切格子，图片居中裁切填满；可调间距、圆角与画布比例，导出 PNG。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const imgs = []; for (const f of files.slice(0, 9)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const R = { '1:1': 1, '4:3': 4 / 3, '3:4': 0.75, '16:9': 16 / 9 }[v.ratio] || 1;
    const W = 1200, H = Math.round(W / R), gap = Number(v.gap) || 0, rad = Number(v.radius) || 0;
    const layouts = {
      '2×2 网格': [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]],
      '1 大 + 2 小': [[0, 0, .62, 1], [.62, 0, .38, .5], [.62, .5, .38, .5]],
      '1 大 + 4 小': [[0, 0, .6, 1], [.6, 0, .4, .25], [.6, .25, .4, .25], [.6, .5, .4, .25], [.6, .75, .4, .25]],
      '3×3 九宫': Array.from({ length: 9 }, (_, i) => [(i % 3) / 3, Math.floor(i / 3) / 3, 1 / 3, 1 / 3]),
      '横向三连': [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
      '竖向三连': [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
      '1 左 + 2 右': [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]],
    };
    const cells = layouts[v.layout] || layouts['2×2 网格'];
    const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = v.bg || '#f2eee5'; g.fillRect(0, 0, W, H);
    cells.forEach((c, i) => {
      const im = imgs[i % imgs.length]; const x = c[0] * W + gap / 2, y = c[1] * H + gap / 2, w = c[2] * W - gap, h = c[3] * H - gap;
      g.save(); g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, rad) : g.rect(x, y, w, h); g.clip();
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      g.drawImage(im, x + (w - im.naturalWidth * s) / 2, y + (h - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      g.restore();
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `${imgs.length} 张图按「${v.layout}」拼成 ${W}×${H}。`, files: [{ name: '拼图.png', data: png, mime: 'image/png', label: '下载拼图' }],
      stats: [{ label: '格子', value: cells.length }, { label: '图片', value: imgs.length }] };
  } };

S['gif-maker'] = { kind: 'file', titleIn: '多张图', titleOut: 'GIF', accept: 'image/*,.gif', multiple: true,
  primary: '生成 GIF', auto: false, dropTitle: '拖多张图（或 1 个 GIF 拆帧）进来',
  fields: [{ id: 'delay', label: '每帧间隔', unit: 'ms', type: 'number', default: 200 },
    { id: 'size', label: '最大宽度（0 = 用第一张）', type: 'number', default: 480 },
    { id: 'quality', label: '质量（越小越好但越慢）', type: 'range', min: 5, max: 20, step: 1, default: 10 },
    { id: 'mode', label: '模式', type: 'select', options: ['多图合 GIF', 'GIF 拆帧'] }],
  note: 'gif.js 本地打包，worker 也在 /vendor/；GIF 拆帧只取首帧与元信息（完整逐帧解码需要额外解码器）。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const GIF = await vendor('gif');
    if (v.mode === 'GIF 拆帧') { const f = files[0]; return { text: `${f.name}（${L.humanSize(f.size)}）\n提示：浏览器只能直接显示 GIF 首帧，完整逐帧拆分请用本地 ffmpeg：ffmpeg -i in.gif frame%03d.png`, preview: `<img src="${URL.createObjectURL(f)}" style="max-height:260px">` }; }
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const imgs = []; for (const f of list.slice(0, 60)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const W = Number(v.size) || imgs[0].naturalWidth, H = Math.round(W * imgs[0].naturalHeight / imgs[0].naturalWidth);
    const gif = new GIF({ workers: 2, quality: Number(v.quality) || 10, workerScript: '/vendor/gif.worker.js', width: W, height: H, repeat: 0 });
    for (const im of imgs) { const cv = L.canvasOf(W, H), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); const s = Math.min(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); gif.addFrame(cv, { delay: Number(v.delay) || 200, copy: true }); }
    const blob = await new Promise((res, rej) => { gif.on('finished', res); gif.on('abort', () => rej(new Error('生成中断'))); gif.render(); });
    const data = new Uint8Array(await blob.arrayBuffer());
    return { preview: `<img src="${URL.createObjectURL(blob)}" style="max-height:260px">`, text: `${imgs.length} 帧 → ${W}×${H}，间隔 ${v.delay} ms，${L.humanSize(data.length)}。`,
      files: [{ name: '动画.gif', data, mime: 'image/gif', label: '下载 GIF' }], stats: [{ label: '帧', value: imgs.length }, { label: '大小', value: L.humanSize(data.length) }] };
  } };

S['comic-pack'] = { kind: 'file', titleIn: '漫画图片', titleOut: 'CBZ', accept: 'image/*', multiple: true,
  primary: '打包 CBZ', auto: false, dropTitle: '拖一整套漫画页进来',
  fields: [{ id: 'title', label: '书名', type: 'text', default: '漫画' }, { id: 'author', label: '作者', type: 'text', default: '' },
    { id: 'right', label: '日漫右翻', type: 'checkbox', default: true }, { id: 'zero', label: '文件名补零', type: 'number', default: 3 }],
  note: '按文件名自然排序，补零重命名后打包成 CBZ（就是 ZIP），并写一份 ComicInfo.xml 元数据，兼容 Tachiyomi / Komga 等阅读器。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    const z = Number(v.zero) || 3, outs = [];
    for (let i = 0; i < list.length; i++) { const f = list[i]; const ext = (f.name.match(/\.[^.]+$/) || ['.jpg'])[0]; outs.push({ name: `page-${String(i + 1).padStart(z, '0')}${ext}`, data: new Uint8Array(await f.arrayBuffer()), mime: f.type }); }
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <Title>${L.esc(v.title || '漫画')}</Title>\n  <Writer>${L.esc(v.author || '')}</Writer>\n  <Manga>YesAndRightToLeft</Manga>\n  <PageCount>${outs.length}</PageCount>\n</ComicInfo>`;
    outs.push({ name: 'ComicInfo.xml', data: L.utf8(xml), mime: 'application/xml' });
    return { text: `${list.length} 页 → ${(v.title || 'comic')}.cbz\n${v.right ? '已标记日漫右翻（Manga=YesAndRightToLeft）' : '左翻'}\n\n前 10 个文件名：\n${outs.slice(0, 10).map((o) => o.name).join('\n')}`,
      copy: outs.map((o) => o.name).join('\n'),
      files: [{ name: (v.title || 'comic') + '.cbz', zip: outs, label: '下载 CBZ' }],
      stats: [{ label: '页', value: list.length }, { label: '元数据', value: 'ComicInfo.xml' }] };
  } };

S['photo-info'] = { kind: 'file', titleIn: 'JPG 照片', titleOut: 'EXIF 信息', accept: 'image/jpeg,.jpg,.jpeg', multiple: false,
  primary: '读取信息', auto: false, dropTitle: '拖一张 JPG 照片进来',
  fields: [{ id: 'map', label: 'GPS 输出', type: 'select', options: ['度分秒 + 十进制', '只给十进制'] }],
  note: '手写解析 JPEG APP1 里的 TIFF/EXIF：相机型号、镜头、光圈快门 ISO、拍摄时间、GPS。PNG / WebP 的 EXIF 需要另外的容器解析。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 JPG' };
    const b = new Uint8Array(await f.arrayBuffer());
    if (b[0] !== 0xff || b[1] !== 0xd8) return { error: '不是 JPEG' };
    let p = 2, exif = null, orientation = 1;
    while (p + 4 < b.length && b[p] === 0xff) {
      const marker = b[p + 1]; if (marker === 0xda) break;
      const len = (b[p + 2] << 8) | b[p + 3];
      if (marker === 0xe1 && L.fromUtf8(b.slice(p + 4, p + 10)) === 'Exif\0\0') { exif = b.slice(p + 10, p + 2 + len); break; }
      p += 2 + len;
    }
    if (!exif) return { text: `${f.name}（${L.humanSize(f.size)}）\n没有 EXIF 段：可能被「图片信息清理」处理过，或本来就是截图/网络图。`, stats: [{ label: 'EXIF', value: '无' }] };
    const dv = new DataView(exif.buffer, exif.byteOffset, exif.byteLength);
    const le = L.fromUtf8(exif.slice(0, 2)) === 'II';
    const u16 = (o) => dv.getUint16(o, le), u32 = (o) => dv.getUint32(o, le);
    const tags = {};
    const TAGS = { 0x010f: '厂商', 0x0110: '相机型号', 0x0112: '方向', 0x0132: '拍摄时间', 0x829a: '曝光时间', 0x829d: '光圈 F 值', 0x8827: 'ISO', 0x9003: '原始时间', 0x920a: '焦距', 0xa434: '镜头型号', 0xa002: '像素宽', 0xa003: '像素高', 0x011a: 'X 分辨率', 0x0131: '软件' };
    const readIFD = (off) => {
      if (off + 2 > exif.length) return;
      const n = u16(off);
      for (let i = 0; i < n; i++) {
        const o = off + 2 + i * 12; if (o + 12 > exif.length) break;
        const tag = u16(o), type = u16(o + 2), count = u32(o + 4), valOff = o + 8;
        let val = '';
        const size = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 })[type] || 1;
        const at = count * size <= 4 ? valOff : u32(valOff);
        if (type === 2) val = L.fromUtf8(exif.slice(at, at + count)).replace(/\0/g, '').trim();
        else if (type === 3) val = String(u16(at));
        else if (type === 4) val = String(u32(at));
        else if (type === 5) val = count ? `${u32(at)}/${u32(at + 4)}` : '';
        else val = L.bytesToHex(exif.slice(at, at + Math.min(16, count * size)), ' ');
        if (TAGS[tag]) tags[TAGS[tag]] = val;
        if (tag === 0x0112) orientation = Number(val) || 1;
        if (tag === 0x8769 || tag === 0x8825) { const sub = u32(valOff); if (sub && sub < exif.length) readIFD(sub); }
      }
    };
    try { readIFD(u32(4)); } catch (e) { return { error: 'EXIF 解析出错：' + e.message }; }
    if (tags['曝光时间'] && tags['曝光时间'].includes('/')) { const [a, bb] = tags['曝光时间'].split('/').map(Number); tags['曝光时间'] = bb / a >= 1 ? `1/${Math.round(bb / a)} s` : `${(a / bb).toFixed(1)} s`; }
    if (tags['光圈 F 值']?.includes('/')) { const [a, bb] = tags['光圈 F 值'].split('/').map(Number); tags['光圈 F 值'] = 'f/' + (a / bb).toFixed(1); }
    if (tags['焦距']?.includes('/')) { const [a, bb] = tags['焦距'].split('/').map(Number); tags['焦距'] = (a / bb).toFixed(0) + ' mm'; }
    const rows = [['文件', f.name], ['大小', L.humanSize(f.size)], ['方向', String(orientation)], ...Object.entries(tags)];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '字段', value: Object.keys(tags).length }, { label: 'EXIF', value: L.humanSize(exif.length) }] };
  } };

S['img-to-ascii'] = { kind: 'file', titleIn: '图片', titleOut: '字符画', accept: 'image/*', multiple: true,
  primary: '生成字符画', auto: false, dropTitle: '拖图片进来',
  fields: [{ id: 'cols', label: '宽度（字符数）', type: 'number', default: 100 },
    { id: 'set', label: '字符集', type: 'select', options: ['@%#*+=-:. ', '█▓▒░ ', 'MNHQ$OC?7>!:-;. ', '自定义'] },
    { id: 'custom', label: '自定义字符集（自定义时填，从暗到亮）', type: 'text', default: '@%#*+=-:. ' },
    { id: 'color', label: '彩色模式', type: 'checkbox', default: false },
    { id: 'invert', label: '反相', type: 'checkbox', default: false }],
  note: '按亮度把像素映射到字符集；彩色模式会给每个字符上原色，输出 HTML。批量时打包 TXT。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const set = v.set === '自定义' ? (v.custom || '@%#*+=-:. ') : ({ '@%#*+=-:. ': '@%#*+=-:. ', '█▓▒░ ': '█▓▒░ ', 'MNHQ$OC?7>!:-;. ': 'MNHQ$OC?7>!:-;. ' }[v.set] || '@%#*+=-:. ');
    const cols = L.clamp(Number(v.cols) || 100, 10, 300), outs = [], previews = [];
    for (const f of files.slice(0, 20)) {
      const im = await L.imageFromFile(f);
      const rows = Math.max(1, Math.round(cols * im.naturalHeight / im.naturalWidth * 0.5));
      const cv = L.canvasOf(cols, rows), g = cv.getContext('2d'); g.drawImage(im, 0, 0, cols, rows);
      const d = g.getImageData(0, 0, cols, rows).data;
      let txt = '', html = '<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:7px;line-height:7px;white-space:pre;letter-spacing:0">';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p = (y * cols + x) * 4, lum = (d[p] * .299 + d[p + 1] * .587 + d[p + 2] * .114) / 255;
          const lv = v.invert ? 1 - lum : lum, idx = L.clamp(Math.floor((1 - lv) * (set.length - 1)), 0, set.length - 1);
          const c = set[idx] || ' '; txt += c;
          html += v.color ? `<span style="color:rgb(${d[p]},${d[p + 1]},${d[p + 2]})">${L.esc(c === ' ' ? '&nbsp;' : c)}</span>` : L.esc(c === ' ' ? '&nbsp;' : c);
        }
        txt += '\n'; html += '<br>';
      }
      html += '</div>';
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.txt', data: L.utf8(txt), mime: 'text/plain' });
      if (!previews.length) previews.push(html);
    }
    return { preview: previews[0] || '', text: L.fromUtf8(outs[0].data).slice(0, 1600), copy: L.fromUtf8(outs[0].data),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '字符画.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '宽度', value: cols }, { label: '文件', value: outs.length }] };
  } };

S['chart-maker'] = { kind: 'form', titleIn: '数据（第一行表头，之后每行一条）', titleOut: '图表', wide: false,
  fields: [{ id: 'data', label: 'CSV / 从 Excel 粘贴（Tab 分隔也行）', type: 'textarea', rows: 8, default: '月份,销售额,成本\n1月,120,60\n2月,150,72\n3月,180,80\n4月,140,70\n5月,210,96' },
    { id: 'type', label: '图表类型', type: 'select', options: ['柱状图', '折线图', '面积图', '饼图', '横向条形', '散点图'] },
    { id: 'title', label: '标题', type: 'text', default: '月度销售' },
    { id: 'theme', label: '配色', type: 'select', options: ['暖纸', '青蓝', '多彩'] }],
  primary: '复制 SVG', hintOut: '本地 canvas 绘制，导出 SVG / PNG；多列数值会画成多组系列。',
  compute: (v) => {
    const rows = L.parseCSV(v.data || '', (v.data || '').includes('\t') ? '\t' : ',');
    if (rows.length < 2) return { error: '至少要有表头和一行数据' };
    const head = rows[0], data = rows.slice(1).map((r) => [r[0], ...r.slice(1).map((x) => Number(x) || 0)]);
    const themes = { '暖纸': ['#b4552d', '#d8a05f', '#8a9a6b'], '青蓝': ['#2b7a9b', '#5aa9b8', '#7c8fa8'], '多彩': ['#b4552d', '#4a7c59', '#3f6ea5', '#c08a3e', '#8a5a83'] }[v.theme] || ['#b4552d'];
    const W = 720, H = 400, P = 52, pw = W - P * 2, ph = H - P * 2;
    const max = Math.max(1, ...data.flatMap((r) => r.slice(1)));
    const n = data.length, series = head.length - 1;
    const bw = pw / n / (series + 0.4);
    const yOf = (val) => P + ph - val / max * ph;
    const parts = [`<rect width="${W}" height="${H}" fill="#fff"/>`, `<text x="${W / 2}" y="28" text-anchor="middle" font-size="17" font-weight="700" fill="#3d3328">${L.esc(v.title || '')}</text>`];
    for (let i = 0; i <= 4; i++) { const y = P + ph - i / 4 * ph; parts.push(`<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="#e6e0d4"/>`, `<text x="${P - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#8a7c68">${L.round(max * i / 4, 0)}</text>`); }
    data.forEach((r, i) => {
      const x0 = P + i * pw / n;
      parts.push(`<text x="${x0 + pw / n / 2}" y="${H - 18}" text-anchor="middle" font-size="11" fill="#6b5a3f">${L.esc(r[0])}</text>`);
      r.slice(1).forEach((val, s) => {
        const c = themes[s % themes.length], x = x0 + pw / n / 2 - (series * bw) / 2 + s * bw;
        if (v.type === '柱状图' || v.type === '横向条形') parts.push(`<rect x="${x}" y="${yOf(val)}" width="${bw - 2}" height="${P + ph - yOf(val)}" rx="2" fill="${c}"/>`);
        if (v.type === '饼图' && s === 0) { const total = data.reduce((a, d2) => a + d2[1], 0); let ang = -Math.PI / 2; const cx = W / 2, cy = H / 2, rad = Math.min(pw, ph) / 2.6; data.forEach((d2, j) => { const a2 = ang + d2[1] / total * Math.PI * 2; const p1 = [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)], p2 = [cx + rad * Math.cos(a2), cy + rad * Math.sin(a2)]; parts.push(`<path d="M${cx},${cy} L${p1[0]},${p1[1]} A${rad},${rad} 0 ${a2 - ang > Math.PI ? 1 : 0},1 ${p2[0]},${p2[1]} Z" fill="${themes[j % themes.length]}" stroke="#fff" stroke-width="2"/>`); ang = a2; }); }
      });
      if (['折线图', '面积图', '散点图'].includes(v.type)) for (let s = 0; s < series; s++) {
        const pts = data.map((d2, j) => [P + (j + .5) * pw / n, yOf(d2[s + 1])]);
        if (v.type === '面积图') parts.push(`<polygon points="${P + pw / n / 2},${P + ph} ${pts.map((p) => p.join(',')).join(' ')} ${P + (n - .5) * pw / n},${P + ph}" fill="${themes[s]}" opacity=".18"/>`);
        if (v.type !== '散点图') parts.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${themes[s]}" stroke-width="2.5"/>`);
        pts.forEach((p) => parts.push(`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${themes[s]}"/>`));
      }
    });
    const legend = head.slice(1).map((h, s) => `<rect x="${P + s * 110}" y="${H - 6}" width="10" height="10" fill="${themes[s]}"/><text x="${P + s * 110 + 15}" y="${H + 3}" font-size="11" fill="#6b5a3f">${L.esc(h)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 12}" style="width:100%">${parts.join('')}${legend}</svg>`;
    return { preview: svg, copy: svg, text: `${data.length} 行 × ${series} 个系列，最大 ${max}。`, stats: [{ label: '数据行', value: data.length }, { label: '系列', value: series }] };
  } };

S['stardew-food-card'] = { kind: 'file', titleIn: '美食图', titleOut: '像素信息卡', accept: 'image/*', multiple: false,
  primary: '生成卡片', auto: false, dropTitle: '拖一张美食照片进来',
  fields: [{ id: 'name', label: '菜名', type: 'text', default: '南瓜汤' },
    { id: 'cat', label: '品类', type: 'select', options: ['料理', '甜点', '饮品', '鱼类', '农作物', '采集品'] },
    { id: 'desc', label: '一句描述', type: 'text', default: '暖乎乎的，适合下雨天。' },
    { id: 'energy', label: '能量值', type: 'number', default: 120 }, { id: 'price', label: '售价', type: 'number', default: 250 }],
  note: '像素风信息卡：上传照片 + 菜名 / 品类 / 能量 / 售价，本地导出 PNG。像素字用系统等宽字体渲染，不是 Fusion Pixel 字体文件。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选一张图' };
    const im = await L.imageFromFile(f), W = 480, H = 320;
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    const colors = { '料理': '#c0782f', '甜点': '#c86a8a', '饮品': '#3f8a9b', '鱼类': '#4a7c9b', '农作物': '#6a9a4a', '采集品': '#8a6b4a' };
    const c = colors[v.cat] || '#b4552d';
    g.fillStyle = '#f4e8c8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d8c49a'; for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 16) if ((x / 16 + y / 16) % 2) g.fillRect(x, y, 16, 16);
    g.fillStyle = '#3a2f22'; g.fillRect(12, 12, W - 24, H - 24); g.fillStyle = c; g.fillRect(16, 16, W - 32, H - 32); g.fillStyle = '#f7efd6'; g.fillRect(20, 20, W - 40, H - 40);
    const s = Math.min(200 / im.naturalWidth, 200 / im.naturalHeight); g.drawImage(im, 32 + (200 - im.naturalWidth * s) / 2, 56 + (200 - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
    g.fillStyle = '#3a2f22'; g.font = 'bold 24px monospace'; g.fillText(v.name || '料理', 252, 78);
    g.font = '14px monospace'; g.fillText(`【${v.cat}】`, 252, 108);
    g.font = '13px monospace'; (v.desc || '').slice(0, 16).split('').forEach((ch, i) => g.fillText(ch, 252 + (i % 12) * 15, 142 + Math.floor(i / 12) * 20));
    g.fillStyle = c; g.fillRect(252, 196, 180, 34); g.fillStyle = '#fff'; g.font = 'bold 15px monospace'; g.fillText(`能量 +${v.energy || 0}`, 260, 218);
    g.fillStyle = '#3a2f22'; g.font = 'bold 15px monospace'; g.fillText(`售价 ${v.price || 0} g`, 252, 256);
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-width:100%">`,
      text: `已生成「${v.name}」的${v.cat}信息卡。`, files: [{ name: (v.name || '料理') + '.png', data: png, mime: 'image/png', label: '下载 PNG' }], stats: [{ label: '尺寸', value: '480×320' }] };
  } };

S['ocr'] = { kind: 'file', titleIn: '图片', titleOut: '识别文字', accept: 'image/*', multiple: false,
  primary: '开始识别', auto: false, dropTitle: '拖一张含文字的图片进来',
  fields: [{ id: 'lang', label: '语言', type: 'select', options: ['中英混排 chi_sim+eng', '仅英文 eng', '简体中文 chi_sim'] }],
  note: 'tesseract.js 主程序已本地打包；首次使用需要联网下载对应语言模型（约几 MB），图片本身只在浏览器里处理。识别中文建议图清晰、字大。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选图片' };
    const T = await vendor('tesseract');
    const lang = v.lang.includes('仅英文') ? 'eng' : v.lang.includes('简体中文') ? 'chi_sim' : 'chi_sim+eng';
    ctx.setBusy('加载语言模型…（首次可能要等几十秒）');
    try {
      const r = await T.recognize(f, lang, { logger: (m) => { if (m.status === 'recognizing text') ctx.setBusy(`识别中 ${Math.round(m.progress * 100)}%`); } });
      const text = r.data.text || '';
      return { text: text || '没识别出文字，试试把图片放大或换更清晰的图。', copy: text,
        files: [{ name: f.name.replace(/\.[^.]+$/, '') + '.txt', data: L.utf8(text), mime: 'text/plain', label: '下载 TXT' }],
        stats: [{ label: '字符', value: text.length }, { label: '置信度', value: (r.data.confidence || 0).toFixed(0) + '%' }] };
    } catch (e) { return { error: '识别失败：' + e.message + '。多数是语言模型下载被网络拦住了，换个网络再试；也可以用「PDF 提取文字」处理带文字层的 PDF。' }; }
  } };

S['id-photo'] = { kind: 'file', titleIn: '正面照', titleOut: '证件照', accept: 'image/*', multiple: false,
  primary: '生成证件照', auto: false, dropTitle: '拖一张正面照进来',
  fields: [{ id: 'size', label: '规格', type: 'select', options: ['一寸 295×413', '二寸 413×579', '小一寸 260×378', '大一寸 390×567', '签证 354×472'] },
    { id: 'bg', label: '底色', type: 'select', options: ['白底 #ffffff', '蓝底 #438edb', '红底 #d84b4b'] },
    { id: 'tol', label: '抠图容差（原底色与角落取色的差）', type: 'range', min: 20, max: 130, step: 5, default: 60 },
    { id: 'pack', label: '输出排版（A4 多张，方便打印）', type: 'checkbox', default: false }],
  note: '简化魔棒抠图：按四角取背景色、按容差把相近像素透明化，再换底色、按规格裁切。适合纯色背景的正面照；复杂背景/发丝请用专业抠图工具。',
  process: async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选照片' };
    const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data;
    const W = cv.width, H = cv.height;
    const samples = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const p = (y * W + x) * 4; return [px[p], px[p + 1], px[p + 2]]; });
    const bg0 = samples[0].map((_, i) => Math.round(samples.reduce((s, c) => s + c[i], 0) / samples.length));
    const tol = Number(v.tol) || 60;
    for (let i = 0; i < px.length; i += 4) { const diff = Math.abs(px[i] - bg0[0]) + Math.abs(px[i + 1] - bg0[1]) + Math.abs(px[i + 2] - bg0[2]); if (diff < tol * 3) px[i + 3] = 0; }
    g.putImageData(d, 0, 0);
    const [tw, th] = (v.size.match(/(\d+)×(\d+)/) || []).slice(1).map(Number);
    const W2 = tw || 295, H2 = th || 413;
    const color = v.bg.includes('蓝') ? '#438edb' : v.bg.includes('红') ? '#d84b4b' : '#ffffff';
    const out = L.canvasOf(W2, H2), og = out.getContext('2d'); og.fillStyle = color; og.fillRect(0, 0, W2, H2);
    const s = Math.min(W2 / W, H2 / H); og.drawImage(cv, (W2 - W * s) / 2, (H2 - H * s) / 2, W * s, H * s);
    const png = await L.canvasU8(out, 'image/png');
    let sheet = null;
    if (v.pack) { const A4 = L.canvasOf(1240, 1754), ag = A4.getContext('2d'); ag.fillStyle = '#fff'; ag.fillRect(0, 0, 1240, 1754); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) ag.drawImage(out, 60 + c * 400, 60 + r * 420, W2 * 0.9, H2 * 0.9); sheet = await L.canvasU8(A4, 'image/png'); }
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="height:220px;border:1px solid var(--line)">`,
      text: `${v.size} · ${v.bg.split(' ')[0]}，抠图容差 ${tol}。${sheet ? '另附 A4 排版（12 张）。' : ''}`,
      files: [{ name: '证件照.png', data: png, mime: 'image/png', label: '下载单张' }].concat(sheet ? [{ name: 'A4 排版.png', data: sheet, mime: 'image/png', label: '下载 A4 排版' }] : []),
      stats: [{ label: '尺寸', value: `${W2}×${H2}` }] };
  } };

S['cutout'] = { kind: 'file', titleIn: '图片', titleOut: '透明底', accept: 'image/*', multiple: true,
  primary: '去背景下载', auto: false, dropTitle: '拖纯色背景的图片进来',
  fields: [{ id: 'tol', label: '容差', type: 'range', min: 15, max: 140, step: 5, default: 55 },
    { id: 'mode', label: '取样方式', type: 'select', options: ['四角自动取背景色', '指定背景色'] },
    { id: 'color', label: '指定背景色', type: 'color', default: '#ffffff' },
    { id: 'feather', label: '边缘柔化', type: 'checkbox', default: true }],
  note: '颜色容差抠图（魔棒），不是 AI 分割模型：适合 Logo、纯色底商品图；人物发丝、复杂背景请配合专业工具。导出透明 PNG。',
  process: async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const specified = L.hex2rgb(v.color) || [255, 255, 255], tol = Number(v.tol) || 55, outs = [];
    for (const f of files) {
      const im = await L.imageFromFile(f), cv = L.canvasOf(im.naturalWidth, im.naturalHeight), g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height), px = d.data, W = cv.width, H = cv.height;
      let bg = specified;
      if (v.mode === '四角自动取背景色') { const s = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const p = (y * W + x) * 4; return [px[p], px[p + 1], px[p + 2]]; }); bg = s[0].map((_, i) => Math.round(s.reduce((a, c) => a + c[i], 0) / s.length)); }
      for (let i = 0; i < px.length; i += 4) {
        const diff = Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
        if (diff < tol * 3) px[i + 3] = 0;
        else if (v.feather && diff < tol * 4.5) px[i + 3] = Math.round(255 * (diff - tol * 3) / (tol * 1.5));
      }
      g.putImageData(d, 0, 0);
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '-透明.png', data: await L.canvasU8(cv, 'image/png'), mime: 'image/png' });
    }
    return { preview: `<div style="background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 50%/16px 16px;padding:8px"><img src="${URL.createObjectURL(new Blob([outs[0].data], { type: 'image/png' }))}" style="max-height:240px"></div>`,
      text: `${outs.length} 张已按容差 ${tol} 去背景，导出透明 PNG。`,
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '透明图.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '图片', value: outs.length }] };
  } };
