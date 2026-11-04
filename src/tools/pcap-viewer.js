/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "PCAP",
  "titleOut": "包列表",
  "accept": ".pcap,.pcapng,.cap",
  "multiple": false,
  "primary": "解析",
  "auto": false,
  "dropTitle": "拖 .pcap / .pcapng 进来",
  "fields": [
    {
      "id": "filter",
      "label": "过滤（IP / 端口 / 协议关键字）",
      "type": "text",
      "default": ""
    }
  ],
  "note": "解析 pcap 全局头与包记录，拆 Ethernet / IPv4 / TCP / UDP / ICMP，能看到 SNI、DNS 查询名与 HTTP 请求行（未加密部分）。pcapng 按增强包块简化解析。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选抓包文件' };
    const b = new Uint8Array(await f.arrayBuffer()); const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const magic = L.bytesToHex(b.slice(0, 4));
    const pcapng = magic === '0a0d0d0a';
    const le = magic === 'd4c3b2a1' || magic === '4d3cb2a1';
    let p = pcapng ? 0 : 24, rows = [], n = 0;
    const ip = (o) => [b[o], b[o + 1], b[o + 2], b[o + 3]].join('.');
    const u16 = (o) => dv.getUint16(o, !le), u32 = (o) => dv.getUint32(o, !le);
    const add = (time, src, dst, proto, len, info) => { rows.push([String(++n), time, src, dst, proto, String(len), info]); };
    while (p + 16 < b.length && n < 500) {
      let capLen = 0, ts = '', data;
      if (pcapng) {
        const type = u32(p), blockLen = u32(p + 4);
        if (blockLen < 12 || p + blockLen > b.length) break;
        if (type === 0x00000006) { const cap = u32(p + 20); capLen = cap; ts = `${Number(dv.getBigUint64(p + 12, true) / 1000n)} (pcapng)`; data = p + 28; }
        p += blockLen; if (!capLen) continue;
      } else {
        const sec = u32(p), usec = u32(p + 4); capLen = u32(p + 8);
        if (capLen > 65535 || p + 16 + capLen > b.length) break;
        ts = new Date(sec * 1000).toLocaleTimeString('zh-CN') + '.' + String(usec).padStart(6, '0');
        data = p + 16; p += 16 + capLen;
      }
      const off = data;
      if (capLen < 34) continue;
      const ethType = (b[off + 12] << 8) | b[off + 13];
      if (ethType !== 0x0800) { if (ethType === 0x0806) add(ts, L.bytesToHex(b.slice(off + 6, off + 12), ':'), '广播', 'ARP', capLen, '地址解析'); continue; }
      const ipOff = off + 14, ihl = (b[ipOff] & 15) * 4;
      const proto = b[ipOff + 9], src = ip(ipOff + 12), dst = ip(ipOff + 16);
      const tOff = ipOff + ihl; let info = '', pname = String(proto);
      if (proto === 6) { pname = 'TCP'; const sp = (b[tOff] << 8) | b[tOff + 1], dp = (b[tOff + 2] << 8) | b[tOff + 3]; const flags = b[tOff + 13]; info = `${src}:${sp} → ${dst}:${dp} [${(flags & 2 ? 'S' : '')}${(flags & 16 ? 'A' : '')}${(flags & 1 ? 'F' : '')}]`;
        const pay = tOff + ((b[tOff + 12] >> 4) * 4);
        const ascii = L.fromUtf8(b.slice(pay, Math.min(pay + 120, off + capLen))).replace(/[^\x20-\x7e]/g, '');
        if (/^(GET|POST|PUT|DELETE|HTTP\/|Host:)/m.test(ascii)) info += ' ' + ascii.split(/\r?\n/)[0].slice(0, 60);
        if (/[\x16\x17]\x03/.test(ascii)) { const sni = (ascii.match(/[\x00]([a-z0-9.-]+\.[a-z]{2,})/) || [])[1]; info += sni ? ` TLS SNI=${sni}` : ' TLS'; }
      } else if (proto === 17) { pname = 'UDP'; const sp = (b[tOff] << 8) | b[tOff + 1], dp = (b[tOff + 2] << 8) | b[tOff + 3]; info = `${src}:${sp} → ${dst}:${dp}`;
        if (sp === 53 || dp === 53) { const q = L.fromUtf8(b.slice(tOff + 20, Math.min(tOff + 60, off + capLen))).replace(/[^\x20-\x7e]/g, '.'); info += ' DNS ' + q.slice(0, 40); } }
      else if (proto === 1) { pname = 'ICMP'; info = `type=${b[tOff]}`; }
      add(ts, src, dst, pname, capLen, info);
      if (!pcapng) { /* p advanced above */ }
    }
    const k = String(v.filter || '').toLowerCase();
    const show = rows.filter((r) => !k || r.join(' ').toLowerCase().includes(k));
    return { html: `<table class="t-table"><thead><tr><th>#</th><th>时间</th><th>源</th><th>目的</th><th>协议</th><th>长度</th><th>摘要</th></tr></thead><tbody>${show.slice(0, 300).map((r) => `<tr>${r.map((x, i) => `<td${i === 4 ? ' class="num"' : ''}>${L.esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
      copy: show.map((r) => r.join('\t')).join('\n'),
      files: [{ name: 'pcap-摘要.csv', data: L.utf8('\ufeff' + L.toCSV([['#', '时间', '源', '目的', '协议', '长度', '摘要'], ...show])), mime: 'text/csv', label: '导出 CSV' }],
      stats: [{ label: '包', value: rows.length }, { label: '格式', value: pcapng ? 'pcapng' : 'pcap' }] };
  }
});
