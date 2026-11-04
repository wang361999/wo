/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "去页码",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "覆盖并下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "side",
      "label": "区域",
      "type": "select",
      "options": [
        "页脚",
        "页眉",
        "自定义坐标"
      ]
    },
    {
      "id": "x",
      "label": "X（pt，从左下角）",
      "type": "number",
      "default": 0
    },
    {
      "id": "y",
      "label": "Y（pt）",
      "type": "number",
      "default": 0
    },
    {
      "id": "w",
      "label": "宽（pt，0 = 整页宽）",
      "type": "number",
      "default": 0
    },
    {
      "id": "h",
      "label": "高（pt）",
      "type": "number",
      "default": 32
    },
    {
      "id": "color",
      "label": "填充色（取页面底色）",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 在指定坐标画一个同底色矩形把页码盖住，对每一页生效；纯扫描件底色不匀时会留痕。",
  "process": async (files, v, ctx) => {
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
  }
});
