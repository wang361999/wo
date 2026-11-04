/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "拆分结果",
  "accept": "application/pdf,.pdf",
  "multiple": false,
  "primary": "拆分下载",
  "auto": false,
  "dropTitle": "拖一个 PDF 进来",
  "fields": [
    {
      "id": "mode",
      "label": "方式",
      "type": "select",
      "options": [
        "按页码范围",
        "每页一个文件",
        "按固定页数分段"
      ]
    },
    {
      "id": "range",
      "label": "页码范围（如 1-3,5,8-10）",
      "type": "text",
      "default": "1-3"
    },
    {
      "id": "step",
      "label": "每段几页",
      "type": "number",
      "default": 5
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 每页独立时会打包成 ZIP，方便一次拿走。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 PDF' };
    const { PDFDocument } = await vendor('pdf');
    const src = await PDFDocument.load(await f.arrayBuffer());
    const n = src.getPageCount();
    const groups = [];
    if (v.mode === '每页一个文件') for (let i = 0; i < n; i++) groups.push([i]);
    else if (v.mode === '按固定页数分段') { const s = Math.max(1, Number(v.step) || 5); for (let i = 0; i < n; i += s) groups.push(Array.from({ length: Math.min(s, n - i) }, (_, j) => i + j)); }
    else {
      for (const seg of String(v.range || '').split(/[,，]/)) {
        const m = seg.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) continue;
        const a = L.clamp(Number(m[1]), 1, n), b = L.clamp(Number(m[2] || m[1]), 1, n);
        groups.push(Array.from({ length: Math.max(0, b - a + 1) }, (_, j) => a - 1 + j));
      }
    }
    if (!groups.length) return { error: '没解析出有效页码' };
    const outs = [];
    for (let i = 0; i < groups.length; i++) {
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, groups[i].filter((x) => x >= 0 && x < n));
      pages.forEach((p) => doc.addPage(p));
      if (!pages.length) continue;
      outs.push({ name: `${f.name.replace(/\.pdf$/i, '')}-${i + 1}.pdf`, data: await doc.save(), mime: 'application/pdf' });
    }
    return { text: `原 PDF ${n} 页，拆成 ${outs.length} 份。`, copy: outs.map((o) => o.name).join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '拆分结果.zip', zip: outs, label: '打包下载全部' }] : []),
      stats: [{ label: '原页数', value: n }, { label: '拆出', value: outs.length }] };
  }
});
