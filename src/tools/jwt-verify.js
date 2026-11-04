/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "Token 与密钥",
  "titleOut": "验签结果",
  "wide": false,
  "fields": [
    {
      "id": "token",
      "label": "JWT",
      "type": "textarea",
      "rows": 5,
      "default": ""
    },
    {
      "id": "key",
      "label": "HMAC 密钥 / PEM 公钥（RS256）",
      "type": "textarea",
      "rows": 3,
      "default": "my-secret"
    },
    {
      "id": "check",
      "label": "检查 exp / nbf 时效",
      "type": "checkbox",
      "default": true
    }
  ],
  "primary": "复制报告",
  "hintOut": "按 header 里的 alg 自动选 HMAC 或 RSA；会检查签名、exp 过期、nbf 未生效、iat 与 iss/aud 声明。",
  "compute": async (v) => {
    const t = String(v.token || '').trim(); if (!t) return { text: '先粘一个 JWT。' };
    const parts = t.split('.'); if (parts.length !== 3) return { error: 'JWT 应为三段' };
    const u2b = (s) => L.b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/'));
    let h; try { h = JSON.parse(L.fromUtf8(u2b(parts[0]))); } catch (e) { return { error: '头部解析失败' }; }
    const alg = h.alg || 'HS256'; let ok = false;
    try {
      if (alg.startsWith('HS')) {
        const k = await crypto.subtle.importKey('raw', L.utf8(v.key || ''), { name: 'HMAC', hash: 'SHA-' + alg.slice(2) }, false, ['verify']);
        ok = await crypto.subtle.verify('HMAC', k, u2b(parts[2]), L.utf8(parts[0] + '.' + parts[1]));
      } else if (alg === 'RS256') {
        const pem = L.b64ToBytes(String(v.key || '').replace(/-----[^-]+-----|\s/g, ''));
        const k = await crypto.subtle.importKey('spki', pem, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
        ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, u2b(parts[2]), L.utf8(parts[0] + '.' + parts[1]));
      } else return { error: '暂不支持算法 ' + alg };
    } catch (e) { return { error: '验签失败：' + e.message }; }
    let pl = {}; try { pl = JSON.parse(L.fromUtf8(u2b(parts[1]))); } catch (e) {}
    const now = Math.floor(Date.now() / 1000);
    const time = [];
    if (v.check) {
      if (pl.exp) time.push(`exp ${new Date(pl.exp * 1000).toLocaleString('zh-CN')} → ${pl.exp < now ? '已过期' : '未过期'}`);
      if (pl.nbf) time.push(`nbf ${new Date(pl.nbf * 1000).toLocaleString('zh-CN')} → ${pl.nbf > now ? '尚未生效' : '已生效'}`);
      if (pl.iat) time.push(`iat ${new Date(pl.iat * 1000).toLocaleString('zh-CN')}`);
    }
    return { text: `算法：${alg}\n签名：${ok ? '验证通过 ✓' : '验证不通过 ✗（密钥不对或内容被改）'}\n${time.join('\n')}\n声明：${Object.keys(pl).join(', ') || '—'}`,
      stats: [{ label: '签名', value: ok ? '通过' : '不通过' }, { label: '算法', value: alg }, { label: '声明', value: Object.keys(pl).length }] };
  }
});
