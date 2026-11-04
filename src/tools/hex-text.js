/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "HEX / 文本",
  "titleOut": "互转结果",
  "fields": [
    {
      "id": "txt",
      "label": "输入",
      "type": "textarea",
      "rows": 5,
      "default": "你好 hello"
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "文本 → HEX",
        "HEX → 文本"
      ]
    },
    {
      "id": "enc",
      "label": "编码",
      "type": "select",
      "options": [
        "UTF-8",
        "GB18030/GBK",
        "UTF-16LE",
        "ISO-8859-1",
        "ASCII"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "带 BOM 会自动识别并去掉；乱码诊断会把不可解码字节标成 . 并给出提示。",
  "compute": (v) => {
    const t = String(v.txt || '').trim();
    if (!t) return { text: '' };
    const enc = ({ 'UTF-8': 'utf-8', 'GB18030/GBK': 'gb18030', 'UTF-16LE': 'utf-16le', 'ISO-8859-1': 'latin1', 'ASCII': 'ascii' })[v.enc] || 'utf-8';
    if (v.dir === 'HEX → 文本') {
      let b; try { b = L.hexToBytes(t); } catch (e) { return { error: e.message }; }
      let bom = '';
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) { bom = 'UTF-8 BOM'; b = b.slice(3); }
      else if (b[0] === 0xff && b[1] === 0xfe) { bom = 'UTF-16LE BOM'; b = b.slice(2); }
      try {
        const s = new TextDecoder(enc, { fatal: false }).decode(b);
        const bad = (s.match(/\ufffd/g) || []).length;
        return { text: s, stats: [{ label: '字节', value: b.length }, { label: '字符', value: Array.from(s).length }, { label: 'BOM', value: bom || '无' }],
          preview: bad ? `<p class="t-hint" style="color:#a63d34">有 ${bad} 个字节无法用 ${v.enc} 解码（显示为 ）。试着切到 GB18030/GBK 或 UTF-8。</p>` : '' };
      } catch (e) { return { error: e.message }; }
    }
    const b = enc === 'utf-8' ? L.utf8(t) : enc === 'utf-16le' ? new Uint8Array(new Uint16Array(Array.from(t).map((c) => c.charCodeAt(0))).buffer) : new Uint8Array(Array.from(t).map((c) => c.charCodeAt(0) & 255));
    return { text: L.bytesToHex(b, ' '), stats: [{ label: '字节', value: b.length }, { label: '编码', value: v.enc }] };
  }
});
