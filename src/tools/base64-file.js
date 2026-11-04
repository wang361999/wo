/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "选文件",
  "titleOut": "Base64 / Data URL",
  "multiple": false,
  "accept": "",
  "primary": "转换",
  "dropTitle": "拖一个文件进来（或粘贴）",
  "fields": [
    {
      "id": "mode",
      "label": "方向",
      "type": "select",
      "options": [
        "文件 → Base64 / Data URL",
        "Base64 → 文件"
      ]
    },
    {
      "id": "text",
      "label": "Base64 文本（反向时填）",
      "type": "textarea",
      "rows": 3,
      "placeholder": "把 Base64 或 data:...;base64,... 粘这里"
    }
  ],
  "note": "反向转换时不用选文件，直接粘文本再点「转换」。大文件会生成很长的字符串，浏览器里复制可能较慢。",
  "auto": false,
  "process": async (files, v, ctx) => {
    if (v.mode.startsWith('Base64')) {
      const t = String(v.text || '').trim();
      if (!t) return { error: '先粘一段 Base64' };
      const mime = (t.match(/^data:([^;,]+);base64,/) || [])[1] || 'application/octet-stream';
      const bytes = L.b64ToBytes(t.replace(/^data:[^,]*,/, ''));
      const name = 'decoded-' + Date.now() + (mime.includes('png') ? '.png' : mime.includes('jpeg') ? '.jpg' : mime.includes('pdf') ? '.pdf' : '.bin');
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      return { text: `已还原 ${bytes.length} 字节\nMIME：${mime}\n前 32 字节：${L.bytesToHex(bytes.slice(0, 32), ' ')}`,
        preview: /^image\//.test(mime) ? `<img src="${url}" style="max-height:260px">` : mime === 'application/pdf' ? `<iframe src="${url}" style="width:100%;height:260px;border:0"></iframe>` : '',
        files: [{ name, data: bytes, mime, label: '下载还原文件' }], stats: [{ label: '大小', value: L.humanSize(bytes.length) }] };
    }
    const f = files[0]; if (!f) return { error: '先选一个文件' };
    const buf = new Uint8Array(await f.arrayBuffer());
    const b64 = L.bytesToB64(buf);
    const du = `data:${f.type || 'application/octet-stream'};base64,${b64}`;
    const url = URL.createObjectURL(f);
    return { text: (v.text && v.text.length > 10 ? '' : du), copy: du,
      preview: /^image\//.test(f.type) ? `<img src="${url}" style="max-height:240px">` : /^audio\//.test(f.type) ? `<audio controls src="${url}"></audio>` : /^video\//.test(f.type) ? `<video controls src="${url}" style="max-height:240px"></video>` : '',
      stats: [{ label: '原大小', value: L.humanSize(f.size) }, { label: 'Base64 长度', value: b64.length }, { label: '膨胀', value: '+33%' }],
      files: [{ name: f.name + '.base64.txt', data: L.utf8(du), mime: 'text/plain', label: '下载 Data URL' }] };
  }
});
