/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "两张收款码",
  "titleOut": "聚合码",
  "accept": "image/*",
  "multiple": true,
  "primary": "合成下载",
  "auto": false,
  "dropTitle": "拖微信 + 支付宝收款码图片进来",
  "fields": [
    {
      "id": "shop",
      "label": "店名 / 备注",
      "type": "text",
      "default": "扫码付款"
    },
    {
      "id": "wlabel",
      "label": "左边标签",
      "type": "text",
      "default": "微信支付"
    },
    {
      "id": "alabel",
      "label": "右边标签",
      "type": "text",
      "default": "支付宝"
    },
    {
      "id": "bg",
      "label": "底色",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "note": "把两张收款码并排合成一张图，加上店名与标签；扫码时对准对应一侧即可。合成只在本机完成。",
  "process": async (files, v, ctx) => {
    if (files.length < 1) return { error: '至少拖一张收款码' };
    const imgs = [];
    for (const f of files.slice(0, 2)) { try { imgs.push(await L.imageFromFile(f)); } catch (e) {} }
    if (!imgs.length) return { error: '图片解不开' };
    const cell = 320, pad = 24, top = 76;
    const cv = L.canvasOf(pad * 3 + cell * 2, top + cell + 76), g = cv.getContext('2d');
    g.fillStyle = v.bg || '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#3d3328'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(v.shop || '扫码付款', cv.width / 2, 42);
    imgs.forEach((im, i) => {
      const x = pad + i * (cell + pad), y = top;
      g.fillStyle = '#fff'; g.fillRect(x, y, cell, cell);
      const s = Math.min(cell / im.naturalWidth, cell / im.naturalHeight);
      g.drawImage(im, x + (cell - im.naturalWidth * s) / 2, y + (cell - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      g.fillStyle = i ? '#1677ff' : '#07c160'; g.font = 'bold 19px sans-serif';
      g.fillText(i ? (v.alabel || '支付宝') : (v.wlabel || '微信'), x + cell / 2, y + cell + 34);
    });
    const png = await L.canvasU8(cv, 'image/png');
    return { preview: `<img src="${URL.createObjectURL(new Blob([png], { type: 'image/png' }))}" style="max-height:300px">`,
      text: `已合成 ${imgs.length} 张收款码${imgs.length < 2 ? '（只传了一张，另一格留空）' : ''}。`,
      files: [{ name: '聚合收款码.png', data: png, mime: 'image/png', label: '下载 PNG' }], stats: [{ label: '码', value: imgs.length }] };
  }
});
