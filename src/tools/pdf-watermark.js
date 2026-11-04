/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "加水印",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "加水印下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "text",
      "label": "水印文字",
      "type": "text",
      "default": "仅供内部使用"
    },
    {
      "id": "style",
      "label": "样式",
      "type": "select",
      "options": [
        "斜向铺满",
        "单个居中",
        "页脚一行"
      ]
    },
    {
      "id": "opacity",
      "label": "透明度",
      "type": "range",
      "min": 0.05,
      "max": 0.6,
      "step": 0.05,
      "default": 0.18
    },
    {
      "id": "size",
      "label": "字号",
      "type": "number",
      "default": 32
    },
    {
      "id": "color",
      "label": "颜色",
      "type": "color",
      "default": "#b4552d"
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 用 pdf-lib 的 drawText 叠加矢量文字水印，保留原文字层；中文用内置标准字体可能显示为方块，建议先用英文/数字水印或换字体方案。",
  "process": async (files, v, ctx) => {
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
  }
});
