/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "EPUB",
  "titleOut": "元数据",
  "accept": ".epub",
  "multiple": true,
  "primary": "读元数据 / 写回下载",
  "auto": false,
  "dropTitle": "拖 EPUB 进来",
  "fields": [
    {
      "id": "title",
      "label": "新书名（留空不改）",
      "type": "text",
      "default": ""
    },
    {
      "id": "author",
      "label": "新作者（留空不改）",
      "type": "text",
      "default": ""
    },
    {
      "id": "pub",
      "label": "出版社",
      "type": "text",
      "default": ""
    },
    {
      "id": "series",
      "label": "系列",
      "type": "text",
      "default": ""
    }
  ],
  "note": "非破坏式：只改 content.opf 里的 dc:* 字段，正文、样式、插图原样保留；封面替换可在「EPUB 编辑器」里做。",
  "process": async (files, v, ctx) => {
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
  }
});
