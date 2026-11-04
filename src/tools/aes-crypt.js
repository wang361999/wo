/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "明文 / 密文",
  "titleOut": "结果",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "文本",
      "type": "textarea",
      "rows": 5,
      "default": "这是一段需要加密的文字"
    },
    {
      "id": "key",
      "label": "密钥（任意长度，会 SHA-256 派生成 256 位）",
      "type": "text",
      "default": "my-secret"
    },
    {
      "id": "mode",
      "label": "模式",
      "type": "select",
      "options": [
        "AES-GCM",
        "AES-CBC",
        "AES-CTR"
      ]
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "加密",
        "解密"
      ]
    },
    {
      "id": "fmt",
      "label": "密文格式",
      "type": "select",
      "options": [
        "Base64",
        "HEX"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "WebCrypto 原生实现；GCM 带认证标签，CBC/CTR 用 PKCS7 填充。密文头部含随机 IV/盐，同样的明文每次结果都不同。ECB 模式不安全，浏览器也不提供，故不做。",
  "compute": async (v) => {
    const enc = new TextEncoder();
    const keyBuf = await crypto.subtle.digest('SHA-256', enc.encode(v.key || 'key'));
    const baseKey = await crypto.subtle.importKey('raw', keyBuf, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const parse = (s) => v.fmt === 'HEX' ? L.hexToBytes(s) : L.b64ToBytes(s);
    if (v.dir === '加密') {
      const iv = L.randBytes(v.mode === 'AES-GCM' ? 12 : 16);
      const alg = { name: v.mode, iv };
      const key = await crypto.subtle.importKey('raw', keyBuf, v.mode, false, ['encrypt']);
      const ct = new Uint8Array(await crypto.subtle.encrypt(alg, key, enc.encode(v.txt || '')));
      const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
      return { text: v.fmt === 'HEX' ? L.bytesToHex(out) : L.bytesToB64(out), stats: [{ label: '模式', value: v.mode }, { label: 'IV', value: iv.length + 'B' }, { label: '长度', value: out.length }] };
    }
    let all; try { all = parse(String(v.txt || '').trim()); } catch (e) { return { error: e.message }; }
    const ivLen = v.mode === 'AES-GCM' ? 12 : 16;
    if (all.length <= ivLen) return { error: '密文太短' };
    const iv = all.slice(0, ivLen), ct = all.slice(ivLen);
    try {
      const key = await crypto.subtle.importKey('raw', keyBuf, v.mode, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name: v.mode, iv }, key, ct);
      return { text: new TextDecoder().decode(plain), stats: [{ label: '模式', value: v.mode }, { label: '解密', value: '成功' }] };
    } catch (e) { return { error: '解密失败：密钥不对、模式选错或密文被改动' }; }
  }
});
