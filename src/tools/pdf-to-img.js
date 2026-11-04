/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "图片",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "导出图片",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "range",
      "label": "页码范围（留空全部）",
      "type": "text",
      "default": ""
    },
    {
      "id": "scale",
      "label": "清晰度",
      "type": "select",
      "options": [
        "1×",
        "2×",
        "3×"
      ]
    },
    {
      "id": "fmt",
      "label": "格式",
      "type": "select",
      "options": [
        "PNG",
        "JPG"
      ]
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 用 pdf.js 逐页渲染到 canvas，再导出 PNG / JPG；页数多时会打包成 ZIP。",
  "process": async (files, v, ctx) => {
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
  }
});
