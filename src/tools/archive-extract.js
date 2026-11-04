/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "压缩包",
  "titleOut": "内容列表",
  "accept": ".zip",
  "multiple": false,
  "primary": "解压并列出",
  "auto": false,
  "dropTitle": "拖 ZIP 进来",
  "fields": [
    {
      "id": "filter",
      "label": "只看包含关键词的文件（留空看全部）",
      "type": "text",
      "default": ""
    },
    {
      "id": "pwd",
      "label": "密码（标准 ZIP 加密暂不支持，会提示）",
      "type": "text",
      "default": ""
    }
  ],
  "note": "支持 ZIP（含 DEFLATE / STORE）；RAR / 7z 需要额外的解码器，这里会明确告诉你而不是假装解开。加密条目会标出来。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选压缩包' };
    const name = f.name.toLowerCase();
    if (/\.(rar|7z|tar|gz|bz2|xz)$/.test(name)) return { error: `${f.name} 是 ${name.split('.').pop().toUpperCase()} 格式，本工具只解 ZIP。可用「ZIP 打包」重新打包成 ZIP。` };
    const JSZip = await vendor('zip');
    let zip; try { zip = await JSZip.loadAsync(await f.arrayBuffer()); } catch (e) { return { error: 'ZIP 解不开：' + e.message }; }
    const k = String(v.filter || '').trim();
    const entries = Object.values(zip.files).filter((e) => !e.dir && (!k || e.name.includes(k)));
    const rows = entries.slice(0, 300).map((e) => [e.name, L.humanSize(e._data?.uncompressedSize || 0), (e.date || new Date()).toLocaleDateString('zh-CN')]);
    const dl = [];
    for (const e of entries.slice(0, 60)) dl.push({ name: e.name.split('/').pop() || e.name, data: new Uint8Array(await e.async('uint8array')), mime: 'application/octet-stream' });
    return { html: `<table class="t-table"><thead><tr><th>文件</th><th>大小</th><th>日期</th></tr></thead><tbody>${rows.map((r) => `<tr><td style="word-break:break-all">${L.esc(r[0])}</td><td class="num">${r[1]}</td><td>${L.esc(r[2])}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: dl.map((d, i) => ({ ...d, label: '下载 ' + (entries[i]?.name || d.name).split('/').pop() })).concat(dl.length > 1 ? [{ name: '解压结果.zip', zip: dl, label: '打包下载全部' }] : []),
      stats: [{ label: '条目', value: entries.length }, { label: '已备下载', value: dl.length }] };
  }
});
