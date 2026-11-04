/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "文本文件",
  "titleOut": "转换结果",
  "accept": ".txt,.csv,.srt,.md,.json,.xml,.html,.log",
  "multiple": true,
  "primary": "转换",
  "auto": false,
  "dropTitle": "拖文本文件进来",
  "fields": [
    {
      "id": "src",
      "label": "原编码",
      "type": "select",
      "options": [
        "自动探测",
        "UTF-8",
        "GB18030 / GBK",
        "Big5",
        "UTF-16LE",
        "ISO-8859-1"
      ]
    },
    {
      "id": "dst",
      "label": "目标编码",
      "type": "select",
      "options": [
        "UTF-8（无 BOM）",
        "UTF-8（带 BOM，Excel 不乱码）",
        "UTF-16LE（带 BOM）"
      ]
    },
    {
      "id": "eol",
      "label": "换行符",
      "type": "select",
      "options": [
        "保持不变",
        "LF（\\n）",
        "CRLF（\\r\\n）"
      ]
    }
  ],
  "note": "用浏览器 TextDecoder 解码、TextEncoder 输出；原编码猜错时会出现替换字符，切到 GB18030 再试。导出仍是文本文件。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      let s = '', used = v.src;
      let body = b, bom = '';
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) { bom = 'UTF-8 BOM'; body = b.slice(3); used = 'UTF-8'; }
      else if (b[0] === 0xff && b[1] === 0xfe) { bom = 'UTF-16LE BOM'; body = b.slice(2); used = 'UTF-16LE'; }
      const encMap = { 'UTF-8': 'utf-8', 'GB18030 / GBK': 'gb18030', 'Big5': 'big5', 'UTF-16LE': 'utf-16le', 'ISO-8859-1': 'latin1' };
      if (v.src === '自动探测') {
        try { s = new TextDecoder('utf-8', { fatal: true }).decode(body); used = 'UTF-8'; }
        catch (e) { s = new TextDecoder('gb18030').decode(body); used = 'GB18030'; }
      } else s = new TextDecoder(encMap[v.src] || 'utf-8').decode(body);
      if (v.eol === 'LF（\\n）') s = s.replace(/\r\n?/g, '\n');
      if (v.eol === 'CRLF（\\r\\n）') s = s.replace(/\r?\n/g, '\r\n');
      const bad = (s.match(/\ufffd/g) || []).length;
      let data;
      if (v.dst.startsWith('UTF-16LE')) {
        const u16 = new Uint16Array(Array.from(s).flatMap((c) => { const n = c.codePointAt(0); return n > 0xffff ? [0xd800 + ((n - 0x10000) >> 10), 0xdc00 + (n & 0x3ff)] : [n]; }));
        data = new Uint8Array(2 + u16.length * 2); data[0] = 0xff; data[1] = 0xfe; new Uint8Array(data.buffer).set(new Uint8Array(u16.buffer), 2);
      } else data = L.utf8((v.dst.includes('带 BOM') ? '\ufeff' : '') + s);
      outs.push({ name: f.name, data, mime: 'text/plain' });
      logs.push(`${f.name}：${bom || '无 BOM'}，按 ${used} 解码，${bad ? `⚠ ${bad} 个替换字符` : '解码正常'} → ${v.dst}`);
    }
    return { text: logs.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0].data).slice(0, 900), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '转码结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  }
});
