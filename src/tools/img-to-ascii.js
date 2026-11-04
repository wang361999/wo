/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "图片",
  "titleOut": "字符画",
  "accept": "image/*",
  "multiple": true,
  "primary": "生成字符画",
  "auto": false,
  "dropTitle": "拖图片进来",
  "fields": [
    {
      "id": "cols",
      "label": "宽度（字符数）",
      "type": "number",
      "default": 100
    },
    {
      "id": "set",
      "label": "字符集",
      "type": "select",
      "options": [
        "@%#*+=-:. ",
        "█▓▒░ ",
        "MNHQ$OC?7>!:-;. ",
        "自定义"
      ]
    },
    {
      "id": "custom",
      "label": "自定义字符集（自定义时填，从暗到亮）",
      "type": "text",
      "default": "@%#*+=-:. "
    },
    {
      "id": "color",
      "label": "彩色模式",
      "type": "checkbox",
      "default": false
    },
    {
      "id": "invert",
      "label": "反相",
      "type": "checkbox",
      "default": false
    }
  ],
  "note": "按亮度把像素映射到字符集；彩色模式会给每个字符上原色，输出 HTML。批量时打包 TXT。",
  "process": async (files, v, ctx) => {
    if (!files.length) return { error: '先选图片' };
    const set = v.set === '自定义' ? (v.custom || '@%#*+=-:. ') : ({ '@%#*+=-:. ': '@%#*+=-:. ', '█▓▒░ ': '█▓▒░ ', 'MNHQ$OC?7>!:-;. ': 'MNHQ$OC?7>!:-;. ' }[v.set] || '@%#*+=-:. ');
    const cols = L.clamp(Number(v.cols) || 100, 10, 300), outs = [], previews = [];
    for (const f of files.slice(0, 20)) {
      const im = await L.imageFromFile(f);
      const rows = Math.max(1, Math.round(cols * im.naturalHeight / im.naturalWidth * 0.5));
      const cv = L.canvasOf(cols, rows), g = cv.getContext('2d'); g.drawImage(im, 0, 0, cols, rows);
      const d = g.getImageData(0, 0, cols, rows).data;
      let txt = '', html = '<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:7px;line-height:7px;white-space:pre;letter-spacing:0">';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const p = (y * cols + x) * 4, lum = (d[p] * .299 + d[p + 1] * .587 + d[p + 2] * .114) / 255;
          const lv = v.invert ? 1 - lum : lum, idx = L.clamp(Math.floor((1 - lv) * (set.length - 1)), 0, set.length - 1);
          const c = set[idx] || ' '; txt += c;
          html += v.color ? `<span style="color:rgb(${d[p]},${d[p + 1]},${d[p + 2]})">${L.esc(c === ' ' ? '&nbsp;' : c)}</span>` : L.esc(c === ' ' ? '&nbsp;' : c);
        }
        txt += '\n'; html += '<br>';
      }
      html += '</div>';
      outs.push({ name: f.name.replace(/\.[^.]+$/, '') + '.txt', data: L.utf8(txt), mime: 'text/plain' });
      if (!previews.length) previews.push(html);
    }
    return { preview: previews[0] || '', text: L.fromUtf8(outs[0].data).slice(0, 1600), copy: L.fromUtf8(outs[0].data),
      files: outs.map((o) => ({ ...o, label: '下载 ' + o.name })).concat(outs.length > 1 ? [{ name: '字符画.zip', zip: outs, label: '打包下载' }] : []),
      stats: [{ label: '宽度', value: cols }, { label: '文件', value: outs.length }] };
  }
});
