/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "一张方形图",
  "titleOut": "图标包",
  "accept": "image/*",
  "multiple": false,
  "primary": "生成图标包",
  "auto": false,
  "dropTitle": "拖一张 PNG / 方图进来",
  "fields": [
    {
      "id": "bg",
      "label": "圆角底填充色",
      "type": "color",
      "default": "#b4552d"
    },
    {
      "id": "radius",
      "label": "圆角比例",
      "type": "range",
      "min": 0,
      "max": 0.5,
      "step": 0.05,
      "default": 0.22
    }
  ],
  "note": "一次生成 favicon.ico（16/32/48）、Apple Touch 180、Android 192/512、manifest 与 HTML 引用片段，打包 ZIP 直接放进站点根目录。",
  "process": async (files, v, ctx) => {
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
  }
});
