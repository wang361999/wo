/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与时间段",
  "titleOut": "剪辑结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "裁切并导出 WAV",
  "auto": false,
  "fields": [
    {
      "id": "start",
      "label": "开始",
      "type": "number",
      "default": 0,
      "unit": "秒"
    },
    {
      "id": "end",
      "label": "结束（0=到末尾）",
      "type": "number",
      "default": 0,
      "unit": "秒"
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]);
      const rate = src.sampleRate, ch = src.numberOfChannels;
      const s = Math.max(0, Math.min(v.start, src.duration - 0.01)), e = v.end > 0 ? Math.min(v.end, src.duration) : src.duration;
      if (e <= s) return { error: '结束时间要晚于开始时间' };
      const n = Math.max(1, Math.floor((e - s) * rate)), off = Math.floor(s * rate);
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const out = ac.createBuffer(ch, n, rate);
      for (let c = 0; c < ch; c++) out.getChannelData(c).set(src.getChannelData(c).slice(off, off + n));
      const wav = audioToWav(out); ac.close();
      return { text: `已裁切 ${L.round(s, 2)}s → ${L.round(e, 2)}s（${L.round(e - s, 2)} 秒，${ch} 声道 / ${rate} Hz）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '时长', value: L.round(e - s, 2) + ' 秒' }, { label: '采样率', value: rate + ' Hz' }, { label: '声道', value: ch }],
        files: [{ name: 'audio-trim.wav', data: wav, mime: 'audio/wav', label: '下载 WAV' }] };
    } catch (e) { return { error: '解码失败：' + e.message + '（这个格式浏览器可能不支持）' }; }
  }
});
