/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "迁移内容",
  "titleOut": "解出的密钥",
  "fields": [
    {
      "id": "uri",
      "label": "粘贴 otpauth-migration://offline?data=... （或只粘 data= 后面那段）",
      "type": "textarea",
      "rows": 6,
      "default": ""
    }
  ],
  "primary": "复制全部 otpauth URI",
  "hintOut": "把「导出账号」二维码用任意扫码工具解成文本粘进来即可；本工具不会调用摄像头，也不会把密钥发出去。",
  "compute": (v) => {
    const t = String(v.uri || '').trim(); if (!t) return { text: '先粘迁移链接。' };
    let b64 = t.includes('data=') ? decodeURIComponent(t.split('data=')[1].split('&')[0]) : t.replace(/^otpauth-migration:\/\/offline\?/, '');
    let b; try { b = L.b64ToBytes(b64); } catch (e) { return { error: 'Base64 解不开：' + e.message }; }
    const top = pbDecode(b);
    const items = [];
    for (const f of top.filter((x) => x.field === 1 && Array.isArray(x.val))) {
      const p = f.val; const secret = p.find((x) => x.field === 1)?.val || 'bytes';
      const name = p.find((x) => x.field === 2)?.val || '账号';
      const issuer = p.find((x) => x.field === 3)?.val || '';
      const hex = p.find((x) => x.field === 1)?.hex || '';
      const bytes = hex ? L.hexToBytes(hex.replace(/\s/g, '')) : new Uint8Array();
      const sec = (() => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', out = ''; for (const x of bytes) bits += x.toString(2).padStart(8, '0'); for (let i = 0; i + 5 <= bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5), 2)]; return out; })();
      items.push({ name: JSON.parse(name), issuer: JSON.parse(issuer), secret: sec });
    }
    if (!items.length) return { error: '没解出 otp_parameters，确认粘的是完整的迁移链接' };
    const uris = items.map((x) => otpUri(x.secret, x.name, x.issuer || x.name)).join('\n');
    return { html: `<table class="t-table"><thead><tr><th>账号</th><th>发行方</th><th>Base32 密钥</th></tr></thead><tbody>${items.map((x) => `<tr><td>${L.esc(x.name)}</td><td>${L.esc(x.issuer)}</td><td class="num">${L.esc(x.secret)}</td></tr>`).join('')}</tbody></table>`,
      copy: uris, text: '', stats: [{ label: '账号', value: items.length }] };
  }
});
