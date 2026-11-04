/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "IP / CIDR",
  "titleOut": "计算结果",
  "fields": [
    {
      "id": "cidr",
      "label": "IP 或 CIDR",
      "type": "text",
      "default": "192.168.1.0/24"
    },
    {
      "id": "check",
      "label": "检查某 IP 是否在此网段（可选）",
      "type": "text",
      "default": "192.168.1.42"
    }
  ],
  "primary": "复制结果",
  "hintOut": "支持 IPv4 的 CIDR 计算、子网包含判断、进制互转与私网地址判定；反向 DNS 需要联网查询，这里不猜。",
  "compute": (v) => {
    const c = String(v.cidr || '').trim();
    try {
      if (c.includes('/')) {
        const i = L.cidrInfo(c);
        const inside = v.check ? (() => { try { return i.contains(String(v.check).trim()) ? '在网段内 ✓' : '不在网段内'; } catch (e) { return e.message; } })() : '—';
        const rows = [['网络地址', i.network], ['广播地址', i.broadcast], ['子网掩码', i.mask], ['可用首地址', i.first], ['可用末地址', i.last], ['可用主机数', L.fmt(i.hosts, 0)], ['掩码位数', '/' + i.bits], ['检查 IP', inside]];
        return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1])}</td></tr>`).join('')}</tbody></table>`, copy: rows.map((r) => r.join('：')).join('\n'), stats: [{ label: '主机数', value: L.fmt(i.hosts, 0) }, { label: '掩码', value: '/' + i.bits }] };
      }
      const n = L.ip2long(c);
      const priv = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)/.test(c);
      return { text: [`十进制：${n}`, `十六进制：0x${n.toString(16).toUpperCase().padStart(8, '0')}`, `二进制：${n.toString(2).padStart(32, '0').match(/.{8}/g).join('.')}`, `还原：${L.long2ip(n)}`, `类型：${priv ? '私有/保留地址' : '公网地址'}`].join('\n'),
        stats: [{ label: '十进制', value: String(n) }, { label: '类型', value: priv ? '私有' : '公网' }] };
    } catch (e) { return { error: e.message }; }
  }
});
