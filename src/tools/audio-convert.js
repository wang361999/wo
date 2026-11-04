/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与输出设置",
  "titleOut": "转换结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "mono",
      "label": "转为单声道",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "rate",
      "label": "目标采样率",
      "type": "select",
      "options": [
        "保持原样",
        "22050",
        "44100",
        "48000"
      ]
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      let data = Array.from({ length: src.numberOfChannels }, (_, c) => src.getChannelData(c));
      const from = src.sampleRate, to = v.rate === '保持原样' ? from : Number(v.rate);
      const rs = (arr) => { if (from === to) return arr; const n = Math.floor(arr.length * to / from), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * from / to, j = Math.floor(p), t = p - j; o[i] = (arr[j] || 0) * (1 - t) + (arr[j + 1] || 0) * t; } return o; };
      if (v.mono) { const mixed = new Float32Array(Math.max(...data.map((d) => d.length))); data.forEach((d) => d.forEach((x, i) => { mixed[i] += x / data.length; })); data = [rs(mixed)]; } else data = data.map(rs);
      const out = ac.createBuffer(data.length, data[0].length, to);
      data.forEach((d, c) => out.getChannelData(c).set(d));
      const wav = audioToWav(out); ac.close();
      return { text: `已转换：${data.length} 声道 / ${to} Hz / ${L.round(out.duration, 2)} 秒\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '声道', value: data.length }, { label: '采样率', value: to + ' Hz' }, { label: '大小', value: L.humanSize(wav.length) }],
        files: [{ name: 'audio-converted.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '解码失败：' + e.message }; }
  }
});
