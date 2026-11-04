/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "批量内容",
  "titleOut": "打包结果",
  "wide": false,
  "fields": [
    {
      "id": "rows",
      "label": "每行：文件名|内容",
      "type": "textarea",
      "rows": 8,
      "default": "首页|https://example.com\n联系|BEGIN:VCARD\n张三|A-001"
    },
    {
      "id": "scale",
      "label": "码点像素",
      "type": "number",
      "default": 8
    },
    {
      "id": "ec",
      "label": "纠错",
      "type": "select",
      "options": [
        "M 中",
        "L 低",
        "Q 较高",
        "H 高"
      ]
    }
  ],
  "primary": "复制清单",
  "hintOut": "一次生成多张二维码并打包成 ZIP 下载；文件名会自动补 .png。",
  "compute": async (v) => {
    const rows = L.nonEmptyLines(v.rows || '').map((l) => { const i = l.indexOf('|'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['qr-' + Math.random().toString(36).slice(2, 6), l.trim()]; }).filter((r) => r[1]);
    if (!rows.length) return { error: '至少一行 文件名|内容' };
    const outs = [];
    for (const [name, text] of rows.slice(0, 100)) { const { canvas } = await qrCanvas(text, { ec: String(v.ec || 'M')[0], scale: L.clamp(Number(v.scale) || 8, 2, 20) }); outs.push({ name: name.replace(/[\\/:*?"<>|]/g, '_') + '.png', data: await L.canvasU8(canvas, 'image/png'), mime: 'image/png' }); }
    return { text: `生成 ${outs.length} 张：\n${outs.map((o) => o.name).join('\n')}`, copy: rows.map((r) => r.join('|')).join('\n'),
      stats: [{ label: '二维码', value: outs.length }],
      actions: [{ label: '打包 ZIP 下载', run: (vv, c) => c.download('二维码批量.zip', buildZip(outs), 'application/zip') }] };
  }
});
