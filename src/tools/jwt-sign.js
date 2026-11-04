/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "载荷与密钥",
  "titleOut": "Token",
  "wide": false,
  "fields": [
    {
      "id": "head",
      "label": "Header JSON",
      "type": "textarea",
      "rows": 3,
      "default": "{\"alg\":\"HS256\",\"typ\":\"JWT\"}"
    },
    {
      "id": "pl",
      "label": "Payload JSON",
      "type": "textarea",
      "rows": 5,
      "default": "{\"sub\":\"1234567890\",\"name\":\"小明\",\"iat\":1700000000,\"exp\":1900000000}"
    },
    {
      "id": "key",
      "label": "密钥（HS*）或 PEM 私钥（RS*）",
      "type": "textarea",
      "rows": 4,
      "default": "my-secret"
    },
    {
      "id": "alg",
      "label": "算法",
      "type": "select",
      "options": [
        "HS256",
        "HS384",
        "HS512",
        "RS256"
      ]
    }
  ],
  "primary": "复制 Token",
  "hintOut": "HS 系列用 HMAC，RS256 用 RSASSA-PKCS1-v1_5 + PEM PKCS8 私钥；全部在 WebCrypto 本地签名，密钥不离开设备。",
  "compute": async (v) => {
    const b64u = (b) => L.bytesToB64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    let h, p; try { h = JSON.parse(v.head); p = JSON.parse(v.pl); } catch (e) { return { error: 'JSON 解析失败：' + e.message }; }
    const hs = v.alg.startsWith('HS');
    h.alg = v.alg; if (!h.typ) h.typ = 'JWT';
    const signingInput = b64u(L.utf8(JSON.stringify(h))) + '.' + b64u(L.utf8(JSON.stringify(p)));
    let sig;
    try {
      if (hs) {
        const hash = 'SHA-' + v.alg.slice(2);
        const k = await crypto.subtle.importKey('raw', L.utf8(v.key || 'key'), { name: 'HMAC', hash }, false, ['sign']);
        sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, L.utf8(signingInput)));
      } else {
        const pem = L.b64ToBytes(String(v.key || '').replace(/-----[^-]+-----|\s/g, ''));
        const k = await crypto.subtle.importKey('pkcs8', pem, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
        sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, L.utf8(signingInput)));
      }
    } catch (e) { return { error: '签名失败：' + e.message + '（RS256 需要 PKCS8 私钥）' }; }
    const token = signingInput + '.' + b64u(sig);
    return { text: token, stats: [{ label: '算法', value: v.alg }, { label: '长度', value: token.length }] };
  }
});
