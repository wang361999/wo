/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "要打包的文件",
  "titleOut": "ZIP",
  "multiple": true,
  "primary": "打包下载",
  "dropTitle": "拖多个文件 / 文件夹进来",
  "auto": false,
  "fields": [
    {
      "id": "name",
      "label": "压缩包名",
      "type": "text",
      "default": "打包"
    },
    {
      "id": "level",
      "label": "压缩等级",
      "type": "select",
      "options": [
        "6（均衡）",
        "1（最快）",
        "9（最小）",
        "0（不压缩）"
      ]
    },
    {
      "id": "flat",
      "label": "忽略目录结构，全部放根目录",
      "type": "checkbox",
      "default": false
    }
  ],
  "note": "用本地 JSZip 打包，可选压缩等级；浏览器选文件夹时的相对路径会保留下来。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const JSZip = await vendor('zip'); const zip = new JSZip();
    for (const f of files) {
      const p = (v.flat ? (f.name || 'file') : (f.webkitRelativePath || f.name || 'file'));
      zip.file(p, await f.arrayBuffer());
    }
    const level = Number(String(v.level).match(/^\d/)?.[0] || 6);
    const data = new Uint8Array(await zip.generateAsync({ type: 'uint8array', compression: level ? 'DEFLATE' : 'STORE', compressionOptions: { level } }));
    return { text: `${files.length} 个文件已打包，${L.humanSize(files.reduce((s, f) => s + f.size, 0))} → ${L.humanSize(data.length)}。`,
      files: [{ name: (v.name || '打包') + '.zip', data, mime: 'application/zip', label: '下载 ZIP' }],
      stats: [{ label: '文件', value: files.length }, { label: '压缩后', value: L.humanSize(data.length) }] };
  }
});
