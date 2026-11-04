/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "两点校准",
  "titleOut": "校准结果",
  "wide": true,
  "fields": [
    {
      "id": "src",
      "label": "字幕文本",
      "type": "textarea",
      "rows": 8,
      "default": "1\n00:00:10,000 --> 00:00:12,000\n第一句\n\n2\n00:01:00,000 --> 00:01:02,000\n中间\n\n3\n00:02:00,000 --> 00:02:03,000\n最后"
    },
    {
      "id": "a0",
      "label": "第一点：字幕里的时间",
      "type": "number",
      "default": 10,
      "unit": "秒"
    },
    {
      "id": "a1",
      "label": "第一点：实际应是",
      "type": "number",
      "default": 12,
      "unit": "秒"
    },
    {
      "id": "b0",
      "label": "第二点：字幕里的时间",
      "type": "number",
      "default": 120,
      "unit": "秒"
    },
    {
      "id": "b1",
      "label": "第二点：实际应是",
      "type": "number",
      "default": 126,
      "unit": "秒"
    },
    {
      "id": "fps",
      "label": "帧率换算（0=不用）",
      "type": "select",
      "options": [
        "0",
        "23.976",
        "25",
        "29.97",
        "30"
      ]
    },
    {
      "id": "shift",
      "label": "额外整体偏移",
      "type": "number",
      "default": 0,
      "unit": "秒"
    }
  ],
  "primary": "复制校准后字幕",
  "hintOut": "字幕越往后越不同步，通常是帧率差（23.976 ↔ 25）。用前后两个点对解出线性变换 新 = (旧 − a0) × 倍率 + a1，再套到全部条目。帧率换算给的是常见比值参考。",
  "compute": (v) => {
    const { cues } = L.parseSubtitle(v.src);
    if (!cues.length) return { error: '没解析出字幕条目' };
    const den = v.b0 - v.a0;
    if (Math.abs(den) < 0.001) return { error: '两个校准点的原时间不能相同' };
    const k = (v.b1 - v.a1) / den;
    const f = (x) => Math.max(0, (x - v.a0) * k + v.a1 + v.shift);
    const T = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${L.pad(h)}:${L.pad(m)}:${L.pad(sec)},${L.pad(ms, 3)}`; };
    const out = cues.map((c, i) => `${i + 1}\n${T(f(c.start))} --> ${T(f(c.end || c.start + 2))}\n${String(c.text).replace(/<[^>]+>/g, '')}`).join('\n\n');
    const ratio = Number(v.fps) > 0 ? L.round(25 / Number(v.fps), 5) : null;
    const text = [`解出拉伸倍率 k = ${L.round(k, 6)}（${k > 1 ? '字幕偏慢，需要拉长' : k < 1 ? '字幕偏快，需要压缩' : '无拉伸，只有整体偏移'}）`, `变换：新 = (旧 − ${v.a0}) × ${L.round(k, 6)} + ${v.a1} + ${v.shift}`, ratio ? `参考：25fps 与 ${v.fps}fps 的比值约 ${ratio}（可对照你解出的 k）` : '', '', out].filter(Boolean).join('\n');
    return { text, copy: out, stats: [{ label: '倍率 k', value: L.round(k, 5) }, { label: '条目', value: cues.length + ' 条' }],
      preview: `<p class="t-hint">前 3 条对照</p><table class="t-table"><thead><tr><th>#</th><th>原起</th><th>新起</th></tr></thead><tbody>${cues.slice(0, 3).map((c, i) => `<tr><td>${i + 1}</td><td>${T(c.start)}</td><td>${T(f(c.start))}</td></tr>`).join('')}</tbody></table>` };
  }
});
