/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "文本 / 密钥",
  "titleOut": "结果",
  "wide": false,
  "fields": [
    {
      "id": "txt",
      "label": "文本 / 密文（Base64）",
      "type": "textarea",
      "rows": 4,
      "default": "你好 RSA"
    },
    {
      "id": "pem",
      "label": "PEM 密钥（留空则自动生成一对 2048 位密钥）",
      "type": "textarea",
      "rows": 4,
      "default": ""
    },
    {
      "id": "op",
      "label": "操作",
      "type": "select",
      "options": [
        "生成密钥对",
        "公钥加密 → 私钥解密",
        "私钥签名 → 公钥验签"
      ]
    },
    {
      "id": "hash",
      "label": "签名哈希",
      "type": "select",
      "options": [
        "SHA-256",
        "SHA-1",
        "SHA-512"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "WebCrypto 原生 RSA-OAEP / RSASSA-PKCS1-v1_5；PEM 支持 PKCS8 私钥与 SPKI 公钥。密钥只在本地生成，不上传。",
  "compute": async (v) => {
    const pem2buf = (s) => L.b64ToBytes(s.replace(/-----[^-]+-----|\s/g, ''));
    if (v.op === '生成密钥对') {
      const kp = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
      const pub = await crypto.subtle.exportKey('spki', kp.publicKey), pri = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
      const wrap = (b, label) => `-----BEGIN ${label}-----\n${L.bytesToB64(b).match(/.{1,64}/g).join('\n')}\n-----END ${label}-----\n`;
      return { text: wrap(pub, 'PUBLIC KEY') + '\n' + wrap(pri, 'PRIVATE KEY'), stats: [{ label: '位数', value: '2048' }, { label: '用途', value: '加解密' }] };
    }
    if (v.op === '公钥加密 → 私钥解密') {
      if (v.pem.trim()) {
        const isPriv = v.pem.includes('PRIVATE');
        const key = await crypto.subtle.importKey(isPriv ? 'pkcs8' : 'spki', pem2buf(v.pem), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [isPriv ? 'decrypt' : 'encrypt']);
        if (isPriv) { const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, L.b64ToBytes(v.txt.trim())); return { text: new TextDecoder().decode(plain) }; }
        const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(v.txt)); return { text: L.bytesToB64(new Uint8Array(ct)) };
      }
      const kp = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
      const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, kp.publicKey, new TextEncoder().encode(v.txt));
      const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, kp.privateKey, ct);
      return { text: `自测通过：\n密文 Base64：${L.bytesToB64(new Uint8Array(ct)).slice(0, 120)}…\n解密还原：${new TextDecoder().decode(plain)}\n\n（想 persistent 使用，请填自己的 PEM 密钥）`, stats: [{ label: '结果', value: '自测通过' }] };
    }
    const h = v.hash || 'SHA-256';
    const alg = { name: 'RSASSA-PKCS1-v1_5', hash: h, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };
    let kp;
    if (v.pem.trim()) {
      const isPriv = v.pem.includes('PRIVATE');
      kp = { privateKey: isPriv ? await crypto.subtle.importKey('pkcs8', pem2buf(v.pem), { name: 'RSASSA-PKCS1-v1_5', hash: h }, true, ['sign']) : null,
        publicKey: !isPriv ? await crypto.subtle.importKey('spki', pem2buf(v.pem), { name: 'RSASSA-PKCS1-v1_5', hash: h }, true, ['verify']) : null };
      if (!kp.privateKey || !kp.publicKey) return { error: '签名需要私钥、验签需要公钥，用「生成密钥对」拿一对再分别填' };
    } else kp = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(v.txt)));
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', kp.publicKey, sig, new TextEncoder().encode(v.txt));
    return { text: `签名（Base64）：\n${L.bytesToB64(sig)}\n\n验签结果：${ok ? '通过 ✓' : '不通过'}`, stats: [{ label: '哈希', value: h }, { label: '验签', value: ok ? '通过' : '失败' }] };
  }
});
