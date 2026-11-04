/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PDF",
  "titleOut": "加密结果",
  "accept": "application/pdf,.pdf",
  "multiple": true,
  "primary": "加密下载",
  "auto": false,
  "dropTitle": "拖 PDF 进来",
  "fields": [
    {
      "id": "pwd",
      "label": "密码",
      "type": "text",
      "default": ""
    }
  ],
  "note": "重要：浏览器端没有可用的标准 PDF 口令加密引擎，这里用 AES-GCM 把 PDF 包成本工具自定义的 .pdfenc 容器（PBKDF2 15 万次派生 + 随机盐与 IV）。用「PDF 解密」填同一密码即可还原；发给别人也需要用本工具打开。",
  "process": async (files, v, ctx) => {
    if (!v.pwd) return { error: '先设密码' };
    if (!files.length) return { error: '先选 PDF' };
    const enc = new TextEncoder(), outs = [], logs = [];
    for (const f of files) {
      const raw = new Uint8Array(await f.arrayBuffer());
      const salt = L.randBytes(16), iv = L.randBytes(12);
      const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, raw));
      const head = L.utf8(`TBX1|${f.name}|${raw.length}|`);
      const out = new Uint8Array(head.length + 28 + ct.length);
      out.set(head, 0); out.set(salt, head.length); out.set(iv, head.length + 16); out.set(ct, head.length + 28);
      outs.push({ name: f.name + '.pdfenc', data: out, mime: 'application/octet-stream' });
      logs.push(`${f.name} → 已加密（${L.humanSize(out.length)}）`);
    }
    return { text: logs.join('\n') + '\n\n还原方式：打开「PDF 解密」→ 拖 .pdfenc → 填同一密码。', copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '加密结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }] };
  }
});
