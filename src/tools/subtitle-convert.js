/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "字幕与设置",
  "titleOut": "转换结果",
  "wide": true,
  "fields": [
    {
      "id": "src",
      "label": "字幕文本（SRT / VTT / LRC / ASS）",
      "type": "textarea",
      "rows": 9,
      "default": "1\n00:00:01,000 --> 00:00:03,500\n第一句\n\n2\n00:00:04,000 --> 00:00:06,000\n第二句 带<i>标签</i>"
    },
    {
      "id": "to",
      "label": "输出格式",
      "type": "select",
      "options": [
        "SRT",
        "VTT",
        "LRC",
        "ASS",
        "纯文本"
      ]
    },
    {
      "id": "shift",
      "label": "整体偏移",
      "type": "number",
      "default": 0,
      "unit": "秒，可负"
    },
    {
      "id": "clean",
      "label": "清理样式标签",
      "type": "checkbox",
      "default": true
    }
  ],
  "primary": "复制结果",
  "actions": [
    {
      "label": "下载字幕文件",
      "run": (v, ctx) => { const el = ctx.root.querySelector('[data-out]'); const ext = { SRT: 'srt', VTT: 'vtt', LRC: 'lrc', ASS: 'ass', '纯文本': 'txt' }[v.to]; ctx.download('subtitle.' + ext, el.textContent, 'text/plain;charset=utf-8'); }
    }
  ],
  "hintOut": "用内置解析器读 SRT/VTT 时间轴与 LRC 标签，再按目标格式重写。ASS 只输出基础 Dialogue 行，不还原复杂样式。GBK 乱码请先用「文件编码转换」转成 UTF-8。",
  "compute": (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目，检查格式' };
    const T = (s, type) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return type === 'vtt' ? `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)}.${L.pad(ms, 3)}` : `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const TA = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), cs = Math.floor((s % 1) * 100); return `${h}:${L.pad(m)}:${L.pad(sec)}.${L.pad(cs, 2)}`; };
    const clean = (s) => v.clean ? String(s).replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '') : String(s);
    const list = cues.map((c) => ({ start: Math.max(0, c.start + v.shift), end: c.end ? Math.max(0, c.end + v.shift) : c.start + v.shift + 2, text: clean(c.text) }));
    let out = '';
    if (v.to === 'SRT' || v.to === 'VTT') { if (v.to === 'VTT') out = 'WEBVTT\n\n'; out += list.map((c, i) => `${i + 1}\n${T(c.start, v.to.toLowerCase())} --> ${T(c.end, v.to.toLowerCase())}\n${c.text}`).join('\n\n'); }
    else if (v.to === 'LRC') out = list.map((c) => `[${L.pad(Math.floor(c.start / 60))}:${L.pad(Math.floor(c.start % 60))}.${L.pad(Math.round((c.start % 1) * 100), 2)}]${c.text.replace(/\n/g, ' ')}`).join('\n');
    else if (v.to === 'ASS') out = '[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize\nStyle: Default, Sans, 20\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n' + list.map((c) => `Dialogue: 0,${TA(c.start)},${TA(c.end)},Default,,0,0,0,,${c.text.replace(/\n/g, '\\N')}`).join('\n');
    else out = list.map((c) => c.text).join('\n');
    return { text: out, copy: out, stats: [{ label: '条目', value: list.length + ' 条' }, { label: '输出', value: L.esc(v.to) }, { label: '偏移', value: v.shift + ' 秒' }] };
  }
});
