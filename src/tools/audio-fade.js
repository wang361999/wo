/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与淡入淡出",
  "titleOut": "处理结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "fin",
      "label": "淡入",
      "type": "number",
      "default": 1,
      "unit": "秒"
    },
    {
      "id": "fout",
      "label": "淡出",
      "type": "number",
      "default": 1,
      "unit": "秒"
    },
    {
      "id": "curve",
      "label": "曲线",
      "type": "select",
      "options": [
        "线性",
        "指数（更自然）"
      ]
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels;
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, src.length, rate);
      const ni = Math.floor(v.fin * rate), no = Math.floor(v.fout * rate), n = src.length;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < n; i++) { let g = 1; if (ni > 0 && i < ni) { const p = i / ni; g *= v.curve.startsWith('指数') ? p * p : p; } if (no > 0 && i > n - no) { const p = (n - i) / no; g *= v.curve.startsWith('指数') ? p * p : p; } d[i] = s[i] * g; } }
      const wav = audioToWav(out); ac.close();
      return { text: `淡入 ${v.fin}s / 淡出 ${v.fout}s（${L.esc(v.curve)}曲线），时长不变 ${L.round(src.duration, 2)} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '淡入', value: v.fin + ' 秒' }, { label: '淡出', value: v.fout + ' 秒' }],
        files: [{ name: 'audio-fade.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  }
});
