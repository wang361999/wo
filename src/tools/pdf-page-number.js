/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "加页码",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "加页码下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "pos",
      "label": "位置",
      "type": "select",
      "options": [
        "页脚居中",
        "页脚右侧",
        "页眉居中",
        "页眉右侧"
      ]
    },
    {
      "id": "fmt",
      "label": "格式",
      "type": "select",
      "options": [
        "1 / 3",
        "第 1 页 / 共 3 页",
        "1",
        "- 1 -",
        "Page 1 of 3"
      ]
    },
    {
      "id": "skip",
      "label": "跳过前几页（封面）",
      "type": "number",
      "default": 0
    },
    {
      "id": "size",
      "label": "字号",
      "type": "number",
      "default": 10
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 在页眉/页脚叠加矢量文字，原文字层保留；中文格式含汉字时标准字体不支持，会自动回退成数字格式。",
  "process": async (files, v, ctx) => {
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
  }
});
