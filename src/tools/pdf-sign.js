/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF + 签名图",
  "titleOut": "签名结果",
  "accept": "application/pdf,.pdf,image/*",
  "multiple": true,
  "primary": "盖章下载",
  "auto": false,
  "dropTitle": "拖 1 个 PDF + 1 张签名/印章 PNG",
  "fields": [
    {
      "id": "page",
      "label": "放到第几页（0 = 每页）",
      "type": "number",
      "default": 1
    },
    {
      "id": "x",
      "label": "X 位置（pt，从左下角算）",
      "type": "number",
      "default": 380
    },
    {
      "id": "y",
      "label": "Y 位置（pt）",
      "type": "number",
      "default": 90
    },
    {
      "id": "w",
      "label": "宽度（pt）",
      "type": "number",
      "default": 140
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 签名图请传透明底 PNG（可用「手绘白板」写好导出，或手写拍照后抠白底）；没有传图时会生成一份示例签名框。",
  "process": async (files, v, ctx) => {
    const pdfFile = files.find((f) => /\.pdf$/i.test(f.name));
    if (!pdfFile) return { error: '需要一个 PDF 文件' };
    const { PDFDocument } = await vendor('pdf');
    const doc = await PDFDocument.load(await pdfFile.arrayBuffer());
    const signFile = files.find((f) => f.type.startsWith('image/') && f !== pdfFile);
    let img;
    if (signFile) {
      const buf = await signFile.arrayBuffer();
      try { img = await doc.embedPng(buf); } catch (e) { img = await doc.embedJpg(buf); }
    }
    const pages = doc.getPages(), target = Number(v.page) || 0;
    const w = Number(v.w) || 140, h = img ? w * img.height / img.width : w * 0.4;
    for (let i = 0; i < pages.length; i++) {
      if (target && i + 1 !== target) continue;
      const p = pages[i];
      if (img) p.drawImage(img, { x: Number(v.x) || 380, y: Number(v.y) || 90, width: w, height: h });
      else { p.drawRectangle({ x: Number(v.x) || 380, y: Number(v.y) || 90, width: w, height: h, borderWidth: 1, borderColor: (await vendor('pdf')).rgb(0.7, 0.35, 0.2) }); }
    }
    const bytes = await doc.save();
    return { text: `${signFile ? '已嵌入签名图 ' + signFile.name : '未传签名图，已画一个占位签名框'}，作用于${target ? `第 ${target} 页` : '每一页'}。`,
      files: [{ name: pdfFile.name.replace(/\.pdf$/i, '') + '-签名.pdf', data: bytes, mime: 'application/pdf', label: '下载签名 PDF' }],
      stats: [{ label: '页数', value: pages.length }, { label: '加盖', value: target ? 1 : pages.length }] };
  }
});
