/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "视频与字符画",
  "titleOut": "实时字符动画",
  "multiple": false,
  "accept": "video/*",
  "dropTitle": "拖入一个视频文件",
  "primary": "播放字符动画",
  "auto": false,
  "fields": [
    {
      "id": "cols",
      "label": "字符列数",
      "type": "number",
      "default": 80,
      "unit": "列"
    },
    {
      "id": "chars",
      "label": "字符集",
      "type": "select",
      "options": [
        " .:-=+*#%@",
        " .·:●",
        " 01",
        " ░▒▓█"
      ]
    },
    {
      "id": "color",
      "label": "彩色模式",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "maxFrames",
      "label": "导出帧数上限",
      "type": "number",
      "default": 60,
      "unit": "帧"
    }
  ],
  "note": "用 video + canvas 逐帧采样亮度转成字符，实时显示并可导出前若干帧为 TXT。纯本地，不上传视频。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选一个视频文件' };
    const f = files[0];
    try {
      const url = URL.createObjectURL(f), vid = document.createElement('video');
      vid.src = url; vid.muted = true; vid.playsInline = true; vid.loop = true;
      await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('视频读不出来')); });
      const cols = L.clamp(Math.round(v.cols), 20, 160), rows = Math.max(8, Math.round(cols * vid.videoHeight / vid.videoWidth / 2));
      const cv = L.canvasOf(cols, rows), g = cv.getContext('2d', { willReadFrequently: true });
      const set = String(v.chars), frames = [];
      ctx.setPreview(`<pre id="va-pre" style="font:9px/9px monospace;letter-spacing:0;white-space:pre;background:#161412;color:#f5efe4;padding:10px;overflow:auto;max-height:340px">准备中…</pre>`);
      const pre = ctx.root.querySelector('#va-pre');
      const frame = () => {
        if (vid.readyState >= 2) {
          g.drawImage(vid, 0, 0, cols, rows); const d = g.getImageData(0, 0, cols, rows).data;
          let s = ''; for (let y = 0; y < rows; y++) { for (let x = 0; x < cols; x++) { const i = (y * cols + x) * 4, lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255; s += set[Math.min(set.length - 1, Math.floor(lum * set.length))]; } s += '\n'; }
          if (pre) pre.textContent = s;
          if (frames.length < v.maxFrames) frames.push(s);
        }
        if (!vid.paused && !vid.ended) requestAnimationFrame(frame);
      };
      await vid.play(); frame();
      return { text: `字符动画已开始（${cols}×${rows}）。已缓存 ${frames.length} 帧用于导出，点上方可下载 TXT。\n浏览器不能直接编码 MP4/H.264，这里用 MediaRecorder 输出 WebM，且必须按素材时长实时播放一遍（不能快进）。大文件会等得久，属正常。`,
        stats: [{ label: '网格', value: cols + '×' + rows }, { label: '原分辨率', value: vid.videoWidth + '×' + vid.videoHeight }],
        files: [{ name: 'video-ascii.txt', data: L.utf8(frames.join('\n\n')), mime: 'text/plain', label: '下载字符帧 TXT' }] };
    } catch (e) { return { error: '处理失败：' + e.message }; }
  }
});
