/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "照片与信息",
  "titleOut": "寻宠海报",
  "multiple": false,
  "accept": "image/*",
  "dropTitle": "拖入宠物照片（或粘贴）",
  "primary": "生成海报",
  "auto": false,
  "fields": [
    {
      "id": "name",
      "label": "宠物名字",
      "type": "text",
      "default": "豆豆"
    },
    {
      "id": "kind",
      "label": "种类 / 特征",
      "type": "text",
      "default": "橘猫，胸前有白毛，戴蓝色项圈"
    },
    {
      "id": "place",
      "label": "走失地点与时间",
      "type": "text",
      "default": "6 月 20 日晚，XX 小区南门附近"
    },
    {
      "id": "reward",
      "label": "酬金",
      "type": "text",
      "default": "当面酬谢 2000 元"
    },
    {
      "id": "phone",
      "label": "联系电话",
      "type": "text",
      "default": "13800000000"
    },
    {
      "id": "mask",
      "label": "电话脱敏",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "生成 A4 竖版 PNG，可直接打印。电话默认中间四位打码，避免被骚扰电话爬走；照片只在本机处理。",
  "process": async (files, v, ctx) => {
    const W = 1240, H = 1754, cv = L.canvasOf(W, H), g = cv.getContext('2d');
    g.fillStyle = '#fbf7ef'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#b4552d'; g.fillRect(0, 0, W, 190);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 88px sans-serif'; g.fillText('寻 宠 启 事', W / 2, 130);
    let ph = String(v.phone || '').trim();
    if (v.mask && ph.length >= 7) ph = ph.slice(0, 3) + '****' + ph.slice(-4);
    if (files.length) {
      try { const im = await L.imageFromFile(files[0]); const box = 900, x = (W - box) / 2, y = 240;
        g.fillStyle = '#fff'; g.fillRect(x - 10, y - 10, box + 20, box + 20);
        const r = Math.min(box / im.naturalWidth, box / im.naturalHeight), dw = im.naturalWidth * r, dh = im.naturalHeight * r;
        g.drawImage(im, x + (box - dw) / 2, y + (box - dh) / 2, dw, dh); g.strokeStyle = '#ded5c8'; g.strokeRect(x, y, box, box);
      } catch (e) { return { error: '照片读不出来：' + e.message }; }
    } else { g.fillStyle = '#e9e1d4'; g.fillRect(170, 240, 900, 900); g.fillStyle = '#a49a8c'; g.font = '30px sans-serif'; g.fillText('（没放照片，这里留白可手贴）', W / 2, 700); }
    g.fillStyle = '#2f2b26'; g.textAlign = 'left'; g.font = 'bold 48px sans-serif';
    const lines = [`名字：${v.name}`, `特征：${v.kind}`, `走失：${v.place}`, `酬谢：${v.reward}`, `联系：${ph}`];
    lines.forEach((l, i) => { g.font = i === 0 ? 'bold 52px sans-serif' : '38px sans-serif'; g.fillText(l.slice(0, 22), 110, 1240 + i * 82); });
    g.fillStyle = '#b4552d'; g.font = 'bold 44px sans-serif'; g.fillText('看到请立刻联系，万分感谢！', 110, 1680);
    const u8 = await L.canvasU8(cv, 'image/png'), url = URL.createObjectURL(new Blob([u8], { type: 'image/png' }));
    return { text: `海报已生成（A4 竖版 ${W}×${H}px）。电话${v.mask ? '已脱敏为 ' + ph : '未脱敏'}。`, preview: `<img src="${url}" style="max-height:420px;border:1px solid #ddd">`,
      stats: [{ label: '尺寸', value: 'A4 竖版' }, { label: '电话', value: ph }], files: [{ name: '寻宠启事.png', data: u8, mime: 'image/png', label: '下载 PNG' }] };
  }
});
