/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "两份 PDF",
  "titleOut": "像素对比",
  "accept": "application/pdf,.pdf",
  "multiple": true,
  "primary": "对比",
  "auto": false,
  "dropTitle": "拖 2 个 PDF 进来",
  "fields": [
    {
      "id": "page",
      "label": "对比第几页",
      "type": "number",
      "default": 1
    },
    {
      "id": "th",
      "label": "像素差异阈值",
      "type": "range",
      "min": 8,
      "max": 80,
      "step": 4,
      "default": 24
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 把两份 PDF 的指定页渲染到同尺寸 canvas，逐像素比较，差异处标红并给出差异占比。",
  "process": async (files, v, ctx) => {
    if (files.length < 2) return { error: '需要两份 PDF' };
    const a = await pdfOpen(await files[0].arrayBuffer()), b = await pdfOpen(await files[1].arrayBuffer());
    const n = Number(v.page) || 1;
    const A = await pdfRenderPage(a, n, 1.2), B = await pdfRenderPage(b, n, 1.2);
    const W = Math.min(A.canvas.width, B.canvas.width), H = Math.min(A.canvas.height, B.canvas.height);
    const cv = L.canvasOf(W, H), g = cv.getContext('2d');
    const da = A.canvas.getContext('2d').getImageData(0, 0, W, H), db = B.canvas.getContext('2d').getImageData(0, 0, W, H);
    const out = g.createImageData(W, H); let diff = 0; const th = Number(v.th) || 24;
    for (let i = 0; i < W * H; i++) {
      const p = i * 4, d = Math.abs(da.data[p] - db.data[p]) + Math.abs(da.data[p + 1] - db.data[p + 1]) + Math.abs(da.data[p + 2] - db.data[p + 2]);
      const isDiff = d > th * 3;
      if (isDiff) diff++;
      out.data[p] = isDiff ? 220 : 240; out.data[p + 1] = isDiff ? 60 : 238; out.data[p + 2] = isDiff ? 50 : 232; out.data[p + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const rate = diff / (W * H) * 100;
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:320px"><p class="t-hint">红色 = 有差异</p>`,
      text: `第 ${n} 页（A ${a.numPages} 页 / B ${b.numPages} 页）\n渲染尺寸 ${W}×${H}\n差异像素 ${diff} / ${W * H}（${rate.toFixed(2)}%）\n阈值 ${th}`,
      files: [{ name: 'PDF 差异图.png', data: png, mime: 'image/png', label: '下载差异图' }],
      stats: [{ label: '差异', value: rate.toFixed(2) + '%' }, { label: 'A 页数', value: a.numPages }, { label: 'B 页数', value: b.numPages }] };
  }
});
