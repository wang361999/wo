/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "TXT 原文",
  "titleOut": "EPUB",
  "accept": ".txt,text/plain",
  "multiple": false,
  "primary": "生成 EPUB",
  "auto": false,
  "dropTitle": "拖 TXT 进来",
  "fields": [
    {
      "id": "title",
      "label": "书名",
      "type": "text",
      "default": ""
    },
    {
      "id": "author",
      "label": "作者",
      "type": "text",
      "default": "佚名"
    },
    {
      "id": "re",
      "label": "章节标题正则",
      "type": "text",
      "default": "^\\s*第[零〇一二三四五六七八九十百千万\\d]+[章节回卷篇].*$"
    }
  ],
  "note": "按中文章节标题自动切章；GBK/UTF-8 自动探测；生成 EPUB 3 并同时写一份兼容目录。封面可用「EPUB 元数据编辑」补。",
  "process": async (files, v, ctx) => {
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
  }
});
