/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与增益",
  "titleOut": "调整结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "db",
      "label": "增益",
      "type": "number",
      "default": 0,
      "unit": "dB（+6 约翻倍）"
    },
    {
      "id": "norm",
      "label": "响度归一化（按 RMS 到 -18 dBFS）",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "limit",
      "label": "防爆音限幅",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。 归一化是简单的 RMS 目标，不等于广播级 LUFS。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), ch = src.numberOfChannels, rate = src.sampleRate;
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, src.length, rate);
      let sum = 0, cnt = 0, peakBefore = 0;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c); for (let i = 0; i < s.length; i++) { sum += s[i] * s[i]; cnt++; peakBefore = Math.max(peakBefore, Math.abs(s[i])); } }
      const rms = Math.sqrt(sum / Math.max(1, cnt));
      let gain = Math.pow(10, v.db / 20);
      if (v.norm) gain *= Math.pow(10, -18 / 20) / Math.max(1e-5, rms);
      let clipped = 0;
      for (let c = 0; c < ch; c++) { const s = src.getChannelData(c), d = out.getChannelData(c); for (let i = 0; i < s.length; i++) { let x = s[i] * gain; if (v.limit && Math.abs(x) > 0.99) { x = Math.sign(x) * 0.99; clipped++; } d[i] = x; } }
      const wav = audioToWav(out); ac.close();
      return { text: `增益 ${v.db} dB${v.norm ? ' + RMS 归一化' : ''}，原峰值 ${L.round(20 * Math.log10(Math.max(1e-5, peakBefore)), 1)} dBFS\n限幅削到 ${clipped} 个采样点\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '增益', value: v.db + ' dB' }, { label: '原峰值', value: L.round(20 * Math.log10(Math.max(1e-5, peakBefore)), 1) + ' dBFS' }, { label: '限幅点', value: clipped }],
        files: [{ name: 'audio-volume.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  }
});
