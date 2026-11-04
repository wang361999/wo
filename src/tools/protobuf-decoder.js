/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "HEX / Base64",
  "titleOut": "字段结构",
  "fields": [
    {
      "id": "txt",
      "label": "protobuf 二进制",
      "type": "textarea",
      "rows": 5,
      "default": "0a 05 68 65 6c 6c 6f 10 2a 1a 03 61 62 63"
    },
    {
      "id": "fmt",
      "label": "输入格式",
      "type": "select",
      "options": [
        "HEX（可带空格）",
        "Base64"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "无 schema 也能按 wire type 拆出 tag / varint / 长度分隔字段；长度字段会尝试当字符串或嵌套消息递归解析。",
  "compute": (v) => {
    let b; try { b = v.fmt === 'Base64' ? L.b64ToBytes(String(v.txt || '').trim()) : L.hexToBytes(v.txt); } catch (e) { return { error: e.message }; }
    const fields = pbDecode(b);
    const flat = (arr, ind = '') => arr.map((f) => {
      let val = Array.isArray(f.val) ? '\n' + flat(f.val, ind + '  ') : String(f.val);
      return `${ind}#${f.field} (wire ${f.wt}) = ${val}${f.hex ? `  [${f.hex}]` : ''}`;
    }).join('\n');
    const wtName = { 0: 'varint', 1: '64bit', 2: 'length-delimited', 5: '32bit' };
    return { html: `<table class="t-table"><thead><tr><th>字段号</th><th>Wire</th><th>值</th><th>原始字节</th></tr></thead><tbody>${fields.map((f) => `<tr><td class="num">${f.field}</td><td>${wtName[f.wt] || f.wt}</td><td style="word-break:break-all">${L.esc(Array.isArray(f.val) ? `嵌套 ${f.val.length} 个字段` : String(f.val))}</td><td style="font-size:11px">${L.esc(f.hex)}</td></tr>`).join('')}</tbody></table>`,
      copy: flat(fields), stats: [{ label: '字节', value: b.length }, { label: '顶层字段', value: fields.length }] };
  }
});
