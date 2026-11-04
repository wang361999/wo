/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "漫画图片",
  "titleOut": "CBZ",
  "accept": "image/*",
  "multiple": true,
  "primary": "打包 CBZ",
  "auto": false,
  "dropTitle": "拖一整套漫画页进来",
  "fields": [
    {
      "id": "title",
      "label": "书名",
      "type": "text",
      "default": "漫画"
    },
    {
      "id": "author",
      "label": "作者",
      "type": "text",
      "default": ""
    },
    {
      "id": "right",
      "label": "日漫右翻",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "zero",
      "label": "文件名补零",
      "type": "number",
      "default": 3
    }
  ],
  "note": "按文件名自然排序，补零重命名后打包成 CBZ（就是 ZIP），并写一份 ComicInfo.xml 元数据，兼容 Tachiyomi / Komga 等阅读器。",
  "process": async (files, v, ctx) => {
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
  }
});
