/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "EPUB / TXT",
  "titleOut": "阅读",
  "accept": ".epub,.txt,text/plain",
  "multiple": false,
  "primary": "打开阅读",
  "dropTitle": "拖 EPUB 或 TXT 进来",
  "auto": false,
  "fields": [
    {
      "id": "font",
      "label": "字号",
      "type": "range",
      "min": 14,
      "max": 26,
      "step": 1,
      "default": 18
    },
    {
      "id": "line",
      "label": "行距",
      "type": "range",
      "min": 1.4,
      "max": 2.4,
      "step": 0.1,
      "default": 1.8
    },
    {
      "id": "width",
      "label": "版面宽度",
      "type": "select",
      "options": [
        "窄（680px）",
        "中（820px）",
        "宽（1000px）"
      ]
    }
  ],
  "note": "EPUB 用本地 ZIP 解包按 spine 顺序读 XHTML；TXT 按空行分段。进度记在浏览器本地，关掉再打开还能接着读。",
  "process": async (files, v, ctx) => {
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
  }
});
