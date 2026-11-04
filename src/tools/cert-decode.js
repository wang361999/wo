/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "PEM / DER",
  "titleOut": "证书内容",
  "wide": false,
  "fields": [
    {
      "id": "pem",
      "label": "粘贴 PEM（-----BEGIN CERTIFICATE-----）或 CSR / 公钥",
      "type": "textarea",
      "rows": 8,
      "default": ""
    }
  ],
  "primary": "复制报告",
  "hintOut": "本地解析 ASN.1 DER：版本、序列号、签名算法、签发者、主体、有效期、公钥算法与 SAN；指纹用 SHA-256 / SHA-1 本地算。",
  "compute": async (v) => {
    const t = String(v.pem || '').trim(); if (!t) return { text: '粘一段 PEM 证书进来。' };
    let der;
    try { der = L.b64ToBytes(t.replace(/-----[^-]+-----|\s/g, '')); }
    catch (e) { return { error: 'Base64 解不开：' + e.message }; }
    const fp = async (alg) => L.bytesToHex(await crypto.subtle.digest(alg, der)).toUpperCase();
    const OIDs = { '1.2.840.113549.1.1.1': 'RSA', '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption', '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption', '1.2.840.10045.2.1': 'EC', '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256', '2.5.4.3': 'CN 通用名', '2.5.4.6': 'C 国家', '2.5.4.8': 'ST 省份', '2.5.4.7': 'L 城市', '2.5.4.10': 'O 组织', '2.5.4.11': 'OU 部门', '2.5.29.17': 'subjectAltName SAN', '2.5.29.19': 'basicConstraints', '2.5.29.15': 'keyUsage', '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption' };
    const oid = (b, p, len) => { if (!len || p + len > b.length) return ''; const a = []; let first = b[p]; a.push(Math.floor(first / 40), first % 40); let n = 0n; for (let i = 1; i < len; i++) { n = (n << 7n) | BigInt(b[p + i] & 0x7f); if (!(b[p + i] & 0x80)) { a.push(Number(n)); n = 0n; } } return a.join('.'); };
    const tlv = (b, p) => {
      if (p + 2 > b.length) return null;
      const tag = b[p++]; let len = b[p++];
      if (len & 0x80) { const n = len & 0x7f; len = 0; for (let i = 0; i < n; i++) len = (len << 8) | b[p++]; }
      return { tag, len, start: p, end: Math.min(b.length, p + len) };
    };
    const strings = []; const oids = []; let serial = '', dates = [];
    const walk = (p, end, depth = 0) => {
      if (depth > 12) return;
      while (p < end) {
        const n = tlv(der, p); if (!n || n.end <= p) break;
        if (n.tag === 0x06) { const o = oid(der, n.start, n.len); if (o) oids.push(OIDs[o] || o); }
        if ([0x0c, 0x13, 0x16, 0x17, 0x18, 0x14, 0x1a].includes(n.tag)) { const s = L.fromUtf8(der.slice(n.start, n.end)).trim(); if (s && /^[\x20-\x7e\u4e00-\u9fff.:/@_-]+$/.test(s)) strings.push(s); }
        if (n.tag === 0x17 || n.tag === 0x18) { const s = L.fromUtf8(der.slice(n.start, n.end)); if (/^\d{10,14}Z?$/.test(s)) dates.push(s); }
        if (n.tag === 0x02 && !serial) serial = L.bytesToHex(der.slice(n.start, n.end)).toUpperCase();
        if (n.tag === 0x30 || n.tag === 0x31) walk(n.start, n.end, depth + 1);
        p = n.end;
      }
    };
    walk(0, der.length);
    const dns = strings.filter((s) => /^[a-z0-9.*-]+\.[a-z]{2,}$/i.test(s) || s.includes('@'));
    return { text: [`解析到 ${strings.length} 个字符串、${oids.length} 个 OID`, `序列号：${serial || '—'}`, `有效期字段：${dates.join(' / ') || '—'}`,
      `算法 / 用途：${[...new Set(oids)].slice(0, 14).join('、') || '—'}`, `SAN / 域名：${[...new Set(dns)].slice(0, 20).join(', ') || '—'}`,
      `主体相关字符串：${[...new Set(strings)].slice(0, 24).join(' | ')}`, '',
      `SHA-256 指纹：${await fp('SHA-256')}`, `SHA-1 指纹：${await fp('SHA-1')}`, '',
      '说明：这是按 ASN.1 结构做的轻量解析，能读出主要字段，不替代 openssl x509 -text。'].join('\n'),
      stats: [{ label: 'DER 字节', value: der.length }, { label: 'OID', value: oids.length }, { label: 'SAN', value: dns.length }] };
  }
});
