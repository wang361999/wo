/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "识别文字",
  "accept": "image/*",
  "multiple": false,
  "primary": "开始识别",
  "auto": false,
  "dropTitle": "拖一张含文字的图片进来",
  "fields": [
    {
      "id": "lang",
      "label": "语言",
      "type": "select",
      "options": [
        "中英混排 chi_sim+eng",
        "仅英文 eng",
        "简体中文 chi_sim"
      ]
    }
  ],
  "note": "tesseract.js 主程序已本地打包；首次使用需要联网下载对应语言模型（约几 MB），图片本身只在浏览器里处理。识别中文建议图清晰、字大。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选图片' };
    const T = await vendor('tesseract');
    const lang = v.lang.includes('仅英文') ? 'eng' : v.lang.includes('简体中文') ? 'chi_sim' : 'chi_sim+eng';
    ctx.setBusy('加载语言模型…（首次可能要等几十秒）');
    try {
      const r = await T.recognize(f, lang, { logger: (m) => { if (m.status === 'recognizing text') ctx.setBusy(`识别中 ${Math.round(m.progress * 100)}%`); } });
      const text = r.data.text || '';
      return { text: text || '没识别出文字，试试把图片放大或换更清晰的图。', copy: text,
        files: [{ name: f.name.replace(/\.[^.]+$/, '') + '.txt', data: L.utf8(text), mime: 'text/plain', label: '下载 TXT' }],
        stats: [{ label: '字符', value: text.length }, { label: '置信度', value: (r.data.confidence || 0).toFixed(0) + '%' }] };
    } catch (e) { return { error: '识别失败：' + e.message + '。多数是语言模型下载被网络拦住了，换个网络再试；也可以用「PDF 提取文字」处理带文字层的 PDF。' }; }
  }
});
