/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "字幕与排版",
  "titleOut": "文字稿",
  "wide": true,
  "fields": [
    {
      "id": "src",
      "label": "字幕文本",
      "type": "textarea",
      "rows": 9,
      "default": "1\n00:00:01,000 --> 00:00:02,000\n大家好，\n\n2\n00:00:02,000 --> 00:00:03,200\n今天我们聊聊工具。\n\n3\n00:00:03,200 --> 00:00:04,000\n今天我们聊聊工具。"
    },
    {
      "id": "merge",
      "label": "按标点合并断句",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "dedup",
      "label": "去掉滚动重复",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "stamp",
      "label": "每段保留时间戳",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "gap",
      "label": "合并最大间隔",
      "type": "number",
      "default": 1.5,
      "unit": "秒"
    }
  ],
  "primary": "复制文字稿",
  "hintOut": "把逐句字幕拼成能读的稿子：断句按标点合并、去掉卡拉OK式滚动重复、可留段落起始时间。纯文本处理，不上传。",
  "compute": (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目' };
    let list = cues.map((c) => ({ start: c.start, end: c.end, text: String(c.text).replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim() })).filter((x) => x.text);
    if (v.dedup) { const seen = []; list = list.filter((x) => { if (seen.length && (seen[seen.length - 1].text === x.text || x.text.startsWith(seen[seen.length - 1].text) || seen[seen.length - 1].text.startsWith(x.text))) { seen[seen.length - 1].end = x.end; return false; } seen.push(x); return true; }); }
    let paras = [];
    if (v.merge) {
      let cur = null;
      list.forEach((x) => {
        const joinable = cur && (x.start - cur.end <= v.gap || !/[。！？.!?]$/.test(cur.text));
        if (joinable) { cur.text += (/[，,、；;]$/.test(cur.text) ? '' : '') + x.text; cur.end = x.end; }
        else { if (cur) paras.push(cur); cur = { start: x.start, end: x.end, text: x.text }; }
      });
      if (cur) paras.push(cur);
    } else paras = list;
    const T = (s) => `${L.pad(Math.floor(s / 60))}:${L.pad(Math.floor(s % 60))}`;
    const out = paras.map((p) => (v.stamp ? `[${T(p.start)}] ` : '') + p.text).join('\n\n');
    return { text: out, copy: out, stats: [{ label: '原条目', value: cues.length + ' 条' }, { label: '成段', value: paras.length + ' 段' }, { label: '字数', value: out.replace(/\s/g, '').length + ' 字' }] };
  }
});
