/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "主副两条字幕",
  "titleOut": "合并结果",
  "wide": true,
  "fields": [
    {
      "id": "main",
      "label": "主轨字幕",
      "type": "textarea",
      "rows": 6,
      "default": "1\n00:00:01,000 --> 00:00:03,000\nHello world\n\n2\n00:00:05,000 --> 00:00:07,000\nSecond line"
    },
    {
      "id": "sub",
      "label": "副轨字幕",
      "type": "textarea",
      "rows": 6,
      "default": "1\n00:00:01,100 --> 00:00:03,100\n你好，世界\n\n2\n00:00:05,200 --> 00:00:07,200\n第二行"
    },
    {
      "id": "order",
      "label": "顺序",
      "type": "select",
      "options": [
        "主在上 / 副在下",
        "副在上 / 主在下"
      ]
    },
    {
      "id": "sep",
      "label": "分隔",
      "type": "select",
      "options": [
        "换行",
        "斜杠 /",
        "竖线 |"
      ]
    },
    {
      "id": "tol",
      "label": "配对容差",
      "type": "number",
      "default": 1.5,
      "unit": "秒"
    }
  ],
  "primary": "复制合并字幕",
  "hintOut": "按时间重叠配对，不是按序号硬凑：给主轨每条找时间最接近、偏差在容差内的副轨条目。输出 SRT，可改主副顺序与分隔符。",
  "compute": (v) => {
    const A = L.parseSubtitle(v.main).cues, B = L.parseSubtitle(v.sub).cues;
    if (!A.length) return { error: '主轨没解析出条目' };
    const T = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const sep = v.sep === '换行' ? '\n' : v.sep.includes('斜杠') ? ' / ' : ' | ';
    const clean = (s) => String(s).replace(/<[^>]+>/g, '').trim();
    let matched = 0;
    const rows = A.map((a) => {
      let best = null, d = Infinity;
      B.forEach((b) => { const overlap = Math.min(a.end || a.start + 2, b.end || b.start + 2) - Math.max(a.start, b.start); const dist = overlap >= 0 ? 0 : Math.abs(b.start - a.start); if (dist < d) { d = dist; best = b; } });
      if (best && d <= v.tol) { matched++; const up = v.order.startsWith('主') ? clean(a.text) : clean(best.text), dn = v.order.startsWith('主') ? clean(best.text) : clean(a.text); return { start: a.start, end: a.end || a.start + 2, text: up + sep + dn }; }
      return { start: a.start, end: a.end || a.start + 2, text: clean(a.text) };
    });
    const out = rows.map((r, i) => `${i + 1}\n${T(r.start)} --> ${T(r.end)}\n${r.text}`).join('\n\n');
    return { text: out, copy: out, stats: [{ label: '主轨', value: A.length + ' 条' }, { label: '副轨', value: B.length + ' 条' }, { label: '成功配对', value: matched + ' 条' }] };
  }
});
