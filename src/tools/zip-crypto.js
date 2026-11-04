/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "文件或密码",
  "titleOut": "加密 / 解密结果",
  "multiple": true,
  "primary": "加密 / 解密",
  "auto": false,
  "dropTitle": "拖要加密的文件，或拖 .enc 文件解密",
  "fields": [
    {
      "id": "pwd",
      "label": "密码",
      "type": "text",
      "default": ""
    },
    {
      "id": "mode",
      "label": "模式",
      "type": "select",
      "options": [
        "加密",
        "解密"
      ]
    }
  ],
  "note": "重要：这是本工具自定义的 AES-GCM 加密容器（.enc），不是标准加密 ZIP。用本工具「解密」能还原；发给别人也需要用本工具打开。标准口令 ZIP 请改用本地压缩软件。",
  "process": async (files, v, ctx) => {
    if (!v.pwd) return { error: '先设密码' };
    if (!files.length) return { error: '先选文件' };
    const enc = new TextEncoder();
    const derive = async (salt) => {
      const km = await crypto.subtle.importKey('raw', enc.encode(v.pwd), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    const outs = [], logs = [];
    for (const f of files) {
      try {
        const raw = new Uint8Array(await f.arrayBuffer());
        if (v.mode === '加密') {
          const salt = L.randBytes(16), iv = L.randBytes(12);
          const key = await derive(salt);
          const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, raw));
          const head = L.utf8(`TBX1|${f.name}|${raw.length}|`);
          const out = new Uint8Array(head.length + 16 + 12 + ct.length);
          out.set(head, 0); out.set(salt, head.length); out.set(iv, head.length + 16); out.set(ct, head.length + 28);
          outs.push({ name: f.name + '.enc', data: out, mime: 'application/octet-stream' });
          logs.push(`${f.name} → 加密完成（${L.humanSize(out.length)}）`);
        } else {
          const marker = L.fromUtf8(raw.slice(0, 5));
          if (marker !== 'TBX1|') { logs.push(`${f.name} 不是本工具生成的 .enc 文件`); continue; }
          const end = raw.findIndex((x, i) => i > 4 && x === 124);
          const meta = L.fromUtf8(raw.slice(5, end)).split('|');
          const salt = raw.slice(end + 1, end + 17), iv = raw.slice(end + 17, end + 29), ct = raw.slice(end + 29);
          const key = await derive(salt);
          const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
          outs.push({ name: meta[0] || f.name.replace(/\.enc$/, ''), data: plain, mime: 'application/octet-stream' });
          logs.push(`${f.name} → 解密为 ${meta[0]}（${L.humanSize(plain.length)}），校验通过`);
        }
      } catch (e) { logs.push(`${f.name} 失败：${e.message}（密码不对或文件损坏）`); }
    }
    return { text: logs.join('\n'), copy: logs.join('\n'),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '处理', value: files.length }, { label: '成功', value: outs.length }] };
  }
});
