/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "TXT 小说",
  "titleOut": "整理结果",
  "accept": ".txt,text/plain",
  "multiple": true,
  "primary": "整理并下载",
  "dropTitle": "拖 TXT 进来",
  "fields": [
    {
      "id": "enc",
      "label": "原编码",
      "type": "select",
      "options": [
        "自动探测（UTF-8 / GB18030 / UTF-16LE）",
        "强制 UTF-8",
        "强制 GB18030"
      ]
    },
    {
      "id": "ads",
      "label": "去广告水印（正则，每行一条）",
      "type": "textarea",
      "rows": 3,
      "default": "www\\.[\\w.-]+\n.*笔趣阁.*\n.*最新网址.*"
    },
    {
      "id": "zero",
      "label": "去零宽字符 / 不可见控制符",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "chap",
      "label": "统一章节标题与缩进",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "punct",
      "label": "全角标点统一、去多余空行",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "report",
      "label": "做缺章 / 重复章体检",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "用 TextDecoder 探测编码；广告规则按正则逐行删除。导出仍是 TXT，不改章节内容。",
  "auto": false,
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先拖 TXT 进来' };
    const decode = (buf) => {
      let b = buf;
      if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.slice(2));
      if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.slice(3);
      if (v.enc === '强制 GB18030') return new TextDecoder('gb18030').decode(b);
      const u8 = new TextDecoder('utf-8', { fatal: true });
      try { return u8.decode(b); } catch (e) { return new TextDecoder('gb18030').decode(b); }
    };
    const ads = L.nonEmptyLines(v.ads || '').map((s) => { try { return new RegExp(s); } catch (e) { return null; } }).filter(Boolean);
    const clean = (t) => {
      let s = t.replace(/\r\n?/g, '\n');
      if (v.zero) s = s.replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '');
      s = L.lines(s).filter((l) => !ads.some((r) => r.test(l))).join('\n');
      if (v.punct) s = s.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/,{2,}/g, '，').replace(/\.{4,}/g, '……').replace(/([，。！？；：])\1+/g, '$1');
      if (v.chap) s = s.replace(/^\s*(第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇][^\n]{0,40})\s*$/gm, '\n$1\n');
      return s.trim() + '\n';
    };
    const outs = [], reports = [];
    for (const f of files) {
      const raw = new Uint8Array(await f.arrayBuffer());
      const txt = clean(decode(raw));
      outs.push({ name: f.name.replace(/\.txt$/i, '') + '-整理.txt', data: L.utf8('\ufeff' + txt), mime: 'text/plain' });
      if (v.report) {
        const titles = [...txt.matchAll(/^\s*(第[零〇一二三四五六七八九十百千万\d]+[章节回卷篇][^\n]{0,40})\s*$/gm)].map((m) => m[1].trim());
        const dup = titles.filter((x, i) => titles.indexOf(x) !== i);
        const nums = titles.map((t) => (t.match(/第([零〇一二三四五六七八九十百千万\d]+)/) || [])[1]);
        reports.push(`${f.name}：${L.humanSize(raw.length)} → ${L.humanSize(txt.length)}，章节 ${titles.length} 个，重复标题 ${new Set(dup).size} 个，广告行已按 ${ads.length} 条规则清理`);
      }
    }
    return { text: (reports.join('\n') || `已整理 ${files.length} 个文件`) + '\n\n预览（第一个文件前 1200 字）：\n' + L.fromUtf8(outs[0].data).slice(0, 1200),
      files: outs.map((o, i) => ({ ...o, label: '下载 ' + files[i].name })).concat(outs.length > 1 ? [{ name: '全部整理.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '文件', value: files.length }, { label: '输出', value: L.humanSize(outs.reduce((s, o) => s + o.data.length, 0)) }] };
  }
});
