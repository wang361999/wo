/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与速度",
  "titleOut": "变速结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "speed",
      "label": "速度",
      "type": "range",
      "min": 25,
      "max": 400,
      "default": 125,
      "unit": "%（100=原速）"
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。 这里用重采样实现变速，音调会跟着变（快放变尖、慢放变沉）。保持音调不变的 time-stretch 需要相位声码器，静态页未内置，不假装支持。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels, k = 100 / Math.max(1, v.speed);
      const n = Math.floor(src.length * k), AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, n, rate);
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < n; i++) { const p = i / k, j = Math.floor(p), t = p - j; d[i] = (s[j] || 0) * (1 - t) + (s[j + 1] || 0) * t; } }
      const wav = audioToWav(out); ac.close();
      return { text: `速度 ${v.speed}%，时长从 ${L.round(src.duration, 2)}s 变成 ${L.round(out.duration, 2)}s\n注意：音调随速度变化（${v.speed > 100 ? '变尖' : '变沉'}）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '速度', value: v.speed + '%' }, { label: '新时长', value: L.round(out.duration, 2) + ' 秒' }],
        files: [{ name: 'audio-tempo.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  }
});
