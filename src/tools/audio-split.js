/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "音频与切分",
  "titleOut": "分段结果",
  "multiple": false,
  "accept": "audio/*",
  "dropTitle": "拖入一个音频文件",
  "primary": "切分并打包 ZIP",
  "auto": false,
  "fields": [
    {
      "id": "way",
      "label": "方式",
      "type": "select",
      "options": [
        "按固定时长",
        "按时间点列表"
      ]
    },
    {
      "id": "len",
      "label": "每段时长",
      "type": "number",
      "default": 30,
      "unit": "秒"
    },
    {
      "id": "points",
      "label": "时间点（逗号分隔，秒）",
      "type": "text",
      "default": "30,90,150"
    }
  ],
  "note": "浏览器能解码 MP3/WAV/M4A/FLAC/OGG，但静态页没有本地 MP3/AAC 编码器，所以统一导出无损 WAV。要 MP3 请用桌面工具再转一次。文件只在本机处理，不上传。 分段用 ZIP 打包下载。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个音频文件' };
    try {
      const src = await decodeAudio(files[0]), rate = src.sampleRate, ch = src.numberOfChannels;
      const total = src.length;
      const cuts = v.way.startsWith('按固定') ? Array.from({ length: Math.ceil(src.duration / Math.max(0.1, v.len)) - 1 }, (_, i) => (i + 1) * v.len) : String(v.points).split(/[,，\s]+/).map(Number).filter((x) => isFinite(x) && x > 0 && x < src.duration).sort((a, b) => a - b);
      const bounds = [0, ...cuts.map((x) => Math.floor(x * rate)), total];
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const entries = [];
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1], n = b - a; if (n <= 0) continue;
        const o = ac.createBuffer(ch, n, rate);
        for (let c = 0; c < ch; c++) o.getChannelData(c).set(src.getChannelData(c).slice(a, b));
        entries.push({ name: `${String(i + 1).padStart(2, '0')}.wav`, data: audioToWav(o) });
      }
      ac.close();
      return { text: `切成 ${entries.length} 段（${L.round(src.duration, 2)} 秒 / ${rate} Hz）\n• 所有处理都在浏览器内存里完成，不上传音源。`,
        stats: [{ label: '分段', value: entries.length + ' 段' }, { label: '总时长', value: L.round(src.duration, 2) + ' 秒' }],
        files: [{ name: 'audio-split.zip', zip: entries, mime: 'application/zip', label: '下载 ZIP（全部段）' }] };
    } catch (e) { return { error: '切分失败：' + e.message }; }
  }
});
