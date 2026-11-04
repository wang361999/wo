/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "文本文件",
  "titleOut": "替换结果",
  "accept": ".txt,.md,.csv,.json,.html,.css,.js,.srt,.log,.xml",
  "multiple": true,
  "primary": "替换并下载",
  "auto": false,
  "dropTitle": "拖多个文本文件进来",
  "fields": [
    {
      "id": "rules",
      "label": "规则（每行 查找 → 替换，支持 /正则/ 与 全词）",
      "type": "textarea",
      "rows": 5,
      "default": "张三 → 李先生\n公司A → 公司B"
    },
    {
      "id": "flags",
      "label": "选项",
      "type": "select",
      "options": [
        "普通替换",
        "区分大小写",
        "全词匹配",
        "正则模式"
      ]
    },
    {
      "id": "enc",
      "label": "原编码",
      "type": "select",
      "options": [
        "自动（UTF-8 / GB18030）",
        "强制 GB18030"
      ]
    }
  ],
  "note": "多条规则一次性对全文生效（不连锁：按原文逐条匹配后统一替换），可处理 GBK 文件并导出 UTF-8。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选文件' };
    const rules = L.nonEmptyLines(v.rules || '').map((l) => { const i = l.indexOf('→'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null; }).filter(Boolean);
    const outs = [], logs = [];
    for (const f of files) {
      const b = new Uint8Array(await f.arrayBuffer());
      let s; try { s = v.enc.startsWith('强制') ? new TextDecoder('gb18030').decode(b) : new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { s = new TextDecoder('gb18030').decode(b); }
      let n = 0; let out = s;
      for (const [a, r] of rules) {
        if (!a) continue;
        const esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const src = v.flags === '正则模式' ? a : esc;
        const pat = v.flags === '全词匹配' ? `\\b${src}\\b` : src;
        let re; try { re = new RegExp(pat, v.flags === '区分大小写' ? 'g' : 'gi'); } catch (e) { continue; }
        out = out.replace(re, (m) => { n++; return r; });
      }
      outs.push({ name: f.name, data: L.utf8(out), mime: 'text/plain' });
      logs.push(`${f.name}：替换 ${n} 处`);
    }
    return { text: logs.join('\n') + '\n\n预览：\n' + L.fromUtf8(outs[0].data).slice(0, 900), copy: logs.join('\n'),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '替换结果.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '规则', value: rules.length }] };
  }
});
