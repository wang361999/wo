/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "解密结果",
  "accept": "application/pdf,.pdf,.enc",
  "multiple": false,
  "primary": "解密 / 去限制",
  "auto": false,
  "dropTitle": "拖 PDF 或本工具生成的 .pdfenc",
  "fields": [
    {
      "id": "pwd",
      "label": "密码（自定义 .pdfenc 容器必填）",
      "type": "text",
      "default": ""
    }
  ],
  "note": "处理库已随站点打包在本地（/vendor/），首次使用只是加载脚本；PDF 文件本身不会上传。 标准「打开密码」PDF 需要 qpdf 引擎，浏览器端不做假装；这里能处理的是①无打开密码但带复制/打印限制的 PDF（重存即解除）②本工具「PDF 加密」生成的 .pdfenc 容器。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选文件' };
    const buf = new Uint8Array(await f.arrayBuffer());
    if (/\.pdfenc$/i.test(f.name) || /\.enc$/i.test(f.name)) {
      if (!v.pwd) return { error: '这是加密容器，先填密码' };
      try {
        const enc = new TextEncoder();
        const marker = L.fromUtf8(buf.slice(0, 5));
        if (marker !== 'TBX1|') throw new Error('不是本工具生成的容器');
        const end = buf.findIndex((x, i) => i > 4 && x === 124);
        const meta = L.fromUtf8(buf.slice(5, end)).split('|');
        const salt = buf.slice(end + 1, end + 17), iv = buf.slice(end + 17, end + 29), ct = buf.slice(end + 29);
        const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
        return { text: `解密成功：${meta[0]}（${L.humanSize(plain.length)}），AES-GCM 校验通过。`,
          files: [{ name: meta[0] || '解密.pdf', data: plain, mime: 'application/pdf', label: '下载原 PDF' }], stats: [{ label: '结果', value: '成功' }] };
      } catch (e) { return { error: '解密失败：密码不对或文件损坏' }; }
    }
    const { PDFDocument } = await vendor('pdf');
    let doc;
    try { doc = await PDFDocument.load(buf, { ignoreEncryption: true }); }
    catch (e) { return { error: '打不开：' + e.message + '。带「打开密码」的 PDF 请用本地 qpdf：qpdf --decrypt in.pdf out.pdf' }; }
    const bytes = await doc.save();
    return { text: `已重存 ${doc.getPageCount()} 页，去掉了权限限制标志（复制 / 打印 / 编辑）。\n如果原文件要求打开密码，pdf-lib 也读不了，这一步会直接失败并提示。`,
      files: [{ name: f.name.replace(/\.pdf$/i, '') + '-解密.pdf', data: bytes, mime: 'application/pdf', label: '下载无限制 PDF' }],
      stats: [{ label: '页数', value: doc.getPageCount() }, { label: '原', value: L.humanSize(f.size) }, { label: '新', value: L.humanSize(bytes.length) }] };
  }
});
