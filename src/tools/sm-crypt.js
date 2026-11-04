/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "国密输入",
  "titleOut": "结果",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "文本 / 密文 HEX",
      "type": "textarea",
      "rows": 5,
      "default": "国密测试 123"
    },
    {
      "id": "key",
      "label": "SM4 密钥（16 字节，不足补零 / 过长截取）",
      "type": "text",
      "default": "0123456789abcde"
    },
    {
      "id": "op",
      "label": "操作",
      "type": "select",
      "options": [
        "SM3 摘要",
        "SM3 HMAC（简化）",
        "SM4 加密（ECB + PKCS7）",
        "SM4 解密"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "SM3 与 SM4 用纯 JS 本地实现（GB/T 标准算法），ECB 模式仅用于教学与兼容旧系统；真实业务请用 CBC/GCM 并注意 IV 管理。",
  "compute": (v) => {
    const key = new Uint8Array(16); const kb = L.utf8(v.key || ''); key.set(kb.slice(0, 16));
    try {
      if (v.op === 'SM3 摘要') return { text: L.sm3(v.txt || ''), stats: [{ label: '算法', value: 'SM3' }, { label: '长度', value: '256 bit' }] };
      if (v.op === 'SM3 HMAC（简化）') { const k = Array.from(key); const inner = new Uint8Array(64 + L.utf8(v.txt).length); inner.fill(0x36, 0, 64); inner.set(L.utf8(v.txt), 64); k.forEach((x, i) => inner[i] ^= x); const outer = new Uint8Array(64 + 32); outer.fill(0x5c, 0, 64); const ih = L.hexToBytes(L.sm3(inner)); outer.set(ih, 64); k.forEach((x, i) => outer[i] ^= x); return { text: L.sm3(outer), stats: [{ label: '算法', value: 'HMAC-SM3' }] }; }
      if (v.op === 'SM4 加密（ECB + PKCS7）') { const out = L.sm4Crypt(L.utf8(v.txt || ''), key, true); return { text: L.bytesToHex(out), stats: [{ label: '分组', value: out.length / 16 }, { label: '模式', value: 'ECB' }] }; }
      const b = L.hexToBytes(String(v.txt || '').trim()); const out = L.sm4Crypt(b, key, false);
      return { text: L.fromUtf8(out), stats: [{ label: '解密', value: '成功' }] };
    } catch (e) { return { error: e.message }; }
  }
});
