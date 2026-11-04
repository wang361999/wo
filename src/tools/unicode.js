/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "文本或转义",
  "titleOut": "互转与检视",
  "fields": [
    {
      "id": "txt",
      "label": "输入",
      "type": "textarea",
      "rows": 5,
      "default": "你好 A 😀"
    },
    {
      "id": "mode",
      "label": "输出格式",
      "type": "select",
      "options": [
        "\\u 转义",
        "&#x; 实体",
        "U+ 码位",
        "UTF-8 字节 hex",
        "JSON \\u",
        "字符检视表"
      ]
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "编码",
        "解码"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "支持 \\uXXXX / \\u{XXXXX} / &#x...; / &#...; / U+XXXX 混合解码，以及 NFC / NFD 归一化。",
  "compute": (v) => {
    const t = String(v.txt || '');
    if (v.dir === '解码') return { text: L.fromEscapes(t), stats: [{ label: '字符数', value: Array.from(L.fromEscapes(t)).length }] };
    const cps = Array.from(t).map((c) => c.codePointAt(0));
    if (v.mode === '字符检视表') {
      return { html: `<table class="t-table"><thead><tr><th>字符</th><th>码位 U+</th><th>UTF-8</th><th>NFC</th><th>NFD</th></tr></thead><tbody>${Array.from(t).slice(0, 200).map((c) => `<tr><td>${L.esc(c)}</td><td class="num">${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}</td><td>${L.bytesToHex(L.utf8(c), ' ')}</td><td>${L.esc(c.normalize('NFC'))}</td><td>${L.esc(c.normalize('NFD'))}</td></tr>`).join('')}</tbody></table>`,
        copy: Array.from(t).map((c) => `${c}\tU+${c.codePointAt(0).toString(16).toUpperCase()}\t${L.bytesToHex(L.utf8(c), ' ')}`).join('\n') };
    }
    const map = {
      '\\u 转义': () => Array.from(t).map((c) => c.codePointAt(0) > 0xffff ? `\\u{${c.codePointAt(0).toString(16)}}` : `\\u${c.codePointAt(0).toString(16).padStart(4, '0')}`).join(''),
      '&#x; 实体': () => cps.map((n) => `&#x${n.toString(16)};`).join(''),
      'U+ 码位': () => cps.map((n) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`).join(' '),
      'UTF-8 字节 hex': () => L.bytesToHex(L.utf8(t), ' '),
      'JSON \\u': () => JSON.stringify(t).slice(1, -1),
    };
    return { text: (map[v.mode] || map['\\u 转义'])(), stats: [{ label: '字符', value: cps.length }, { label: '字节', value: L.utf8(t).length }] };
  }
});
