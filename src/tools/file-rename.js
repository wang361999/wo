/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "要改名的文件",
  "titleOut": "改名预览",
  "multiple": true,
  "primary": "预览 / 打包下载",
  "auto": false,
  "dropTitle": "拖多个文件进来",
  "fields": [
    {
      "id": "mode",
      "label": "规则",
      "type": "select",
      "options": [
        "序号前缀",
        "查找替换",
        "正则替换",
        "大小写",
        "加日期前缀"
      ]
    },
    {
      "id": "find",
      "label": "查找内容 / 正则",
      "type": "text",
      "default": "IMG_"
    },
    {
      "id": "rep",
      "label": "替换为",
      "type": "text",
      "default": "照片_"
    },
    {
      "id": "start",
      "label": "起始序号",
      "type": "number",
      "default": 1
    },
    {
      "id": "digits",
      "label": "序号补零位数",
      "type": "number",
      "default": 3
    },
    {
      "id": "case",
      "label": "大小写",
      "type": "select",
      "options": [
        "保持",
        "全小写",
        "全大写"
      ]
    }
  ],
  "note": "浏览器无法真的改你磁盘上的文件名，这里按规则生成新名字并打包成 ZIP 下载；预览满意再下载。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const pad = L.clamp(Number(v.digits) || 3, 1, 8), st = Number(v.start) || 1;
    const date = L.fmtDate(new Date()).replace(/-/g, '');
    const rows = files.map((f, i) => {
      const dot = f.name.lastIndexOf('.'), base = dot > 0 ? f.name.slice(0, dot) : f.name, ext = dot > 0 ? f.name.slice(dot) : '';
      let name = base;
      if (v.mode === '序号前缀') name = String(st + i).padStart(pad, '0') + '_' + base;
      else if (v.mode === '查找替换') name = base.split(v.find || '').join(v.rep || '');
      else if (v.mode === '正则替换') { try { name = base.replace(new RegExp(v.find || '', 'g'), v.rep || ''); } catch (e) { name = base; } }
      else if (v.mode === '加日期前缀') name = date + '_' + base;
      if (v.case === '全小写') name = name.toLowerCase(); if (v.case === '全大写') name = name.toUpperCase();
      return [f.name, name + ext, L.humanSize(f.size)];
    });
    const map = Object.fromEntries(files.map((f, i) => [f.name, rows[i][1]]));
    const z = [];
    for (const f of files) z.push({ name: map[f.name], data: new Uint8Array(await f.arrayBuffer()), mime: f.type || 'application/octet-stream' });
    return { html: `<table class="t-table"><thead><tr><th>原名</th><th>新名</th><th>大小</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${L.esc(r[0])}</td><td class="num">${L.esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`,
      copy: rows.map((r) => r.join('\t')).join('\n'),
      files: [{ name: '改名结果.zip', zip: z, label: '打包下载（新名字）' }], stats: [{ label: '文件', value: files.length }] };
  }
});
