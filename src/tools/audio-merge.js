/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "多段音频（按选择顺序）",
  "titleOut": "合并结果",
  "multiple": true,
  "accept": "audio/*",
  "dropTitle": "拖入多个音频文件",
  "primary": "拼接并导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "gap",
      "label": "段间静音",
      "type": "number",
      "default": 0,
      "unit": "秒"
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。 采样率不同的段会线性重采样到第一段的采样率。",
  "process": async (files, v, ctx) => {
    if (files.length < 2) return { error: '至少选两个音频文件' };
    try {
      const bufs = []; for (const f of files.slice(0, 8)) bufs.push(await decodeAudio(f));
      const rate = bufs[0].sampleRate, ch = Math.min(...bufs.map((b) => b.numberOfChannels));
      const gap = Math.max(0, v.gap) * rate;
      const rs = (arr, from) => { if (from === rate) return arr; const n = Math.floor(arr.length * rate / from), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * from / rate, j = Math.floor(p), t = p - j; o[i] = (arr[j] || 0) * (1 - t) + (arr[j + 1] || 0) * t; } return o; };
      const parts = bufs.map((b) => Array.from({ length: ch }, (_, c) => rs(b.getChannelData(Math.min(c, b.numberOfChannels - 1)), b.sampleRate)));
      const total = parts.reduce((a, p) => a + p[0].length, 0) + gap * (parts.length - 1);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, total, rate);
      for (let c = 0; c < ch; c++) { const d = out.getChannelData(c); let pos = 0; parts.forEach((p, i) => { d.set(p[c], pos); pos += p[c].length; if (i < parts.length - 1) pos += gap; }); }
      const wav = audioToWav(out); ac.close();
      return { text: `已按选择顺序拼接 ${bufs.length} 段，共 ${L.round(out.duration, 2)} 秒\n段间静音 ${v.gap} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '段数', value: bufs.length + ' 段' }, { label: '总时长', value: L.round(out.duration, 2) + ' 秒' }, { label: '大小', value: L.humanSize(wav.length) }],
        files: [{ name: 'audio-merged.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '合并失败：' + e.message }; }
  }
});
