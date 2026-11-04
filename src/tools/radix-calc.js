/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "输入与运算",
  "titleOut": "各进制与位运算",
  "fields": [
    {
      "id": "num",
      "label": "数值",
      "type": "text",
      "default": "255"
    },
    {
      "id": "from",
      "label": "源进制",
      "type": "select",
      "options": [
        "10 十进制",
        "2 二进制",
        "8 八进制",
        "16 十六进制"
      ]
    },
    {
      "id": "op",
      "label": "位运算",
      "type": "select",
      "options": [
        "不运算",
        "AND",
        "OR",
        "XOR",
        "左移 <<",
        "右移 >>",
        "取反 ~"
      ]
    },
    {
      "id": "b",
      "label": "第二个数 / 移位位数",
      "type": "text",
      "default": "3"
    }
  ],
  "primary": "复制全部结果",
  "hintOut": "用 BigInt 算，不受 32 位限制。取反按 32 位有符号展示，IEEE754 一栏是双精度浮点数的原始位。",
  "compute": (v) => {
    const rad = Number(String(v.from).split(' ')[0]);
    let n;
    try { n = BigInt(rad === 10 ? String(v.num).trim() : L.radixCvt(String(v.num).trim(), rad, 10)); } catch (e) { return { error: '数值与所选进制对不上：' + e.message }; }
    const r2 = n.toString(2), r8 = n.toString(8), r10 = n.toString(10), r16 = n.toString(16).toUpperCase();
    let bit = '未运算';
    try {
      const m = BigInt(rad === 10 ? String(v.b).trim() : L.radixCvt(String(v.b).trim(), rad, 10));
      if (v.op === 'AND') bit = (n & m).toString(10);
      else if (v.op === 'OR') bit = (n | m).toString(10);
      else if (v.op === 'XOR') bit = (n ^ m).toString(10);
      else if (v.op.startsWith('左移')) bit = (n << m).toString(10);
      else if (v.op.startsWith('右移')) bit = (n >> m).toString(10);
      else if (v.op.startsWith('取反')) bit = '~' + n.toString(10) + ' = ' + (~Number(n & 0xffffffffn)).toString();
    } catch (e) { bit = '运算出错：' + e.message; }
    const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, Number(n), false);
    const bits = L.bytesToHex(new Uint8Array(dv.buffer), ' ');
    const text = [`十进制：${r10}`, `二进制：${r2}`, `八进制：${r8}`, `十六进制：${r16}`, `位运算（${L.esc(v.op)}）：${bit}`, `IEEE754 双精度位（大端）：${bits}`, `二进制位数：${r2.replace('-', '').length} bit`].join('\n');
    return { text, copy: text, stats: [{ label: 'DEC', value: r10 }, { label: 'HEX', value: r16 }, { label: 'BIN', value: r2.length > 18 ? r2.slice(0, 18) + '…' : r2 }] };
  }
});
