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
      "rows": 7,
      "default": "商品A|6901234567892\n商品B|6901234567893\n商品C|ABC-12345"
    },
    {
      "id": "format",
      "label": "码制",
      "type": "select",
      "options": [
        "CODE128",
        "CODE39",
        "EAN13",
        "ITF14"
      ]
    }
  ],
  "primary": "复制清单",
  "hintOut": "一次生成多张条码，打包 ZIP 下载；内容不符合码制时会单独报错并跳过。",
  "compute": async (v) => {
    const rows = L.nonEmptyLines(v.rows || '').map((l) => { const i = l.indexOf('|'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['bc-' + Math.random().toString(36).slice(2, 6), l.trim()]; });
    const outs = [], errs = [];
    for (const [name, text] of rows.slice(0, 100)) { try { const svg = await barcodeSvg(text, { format: v.format }); outs.push({ name: name.replace(/[\\/:*?"<>|]/g, '_') + '.png', data: await svgToPng(svg), mime: 'image/png' }); } catch (e) { errs.push(`${name}：${e.message}`); } }
    return { text: `成功 ${outs.length} 张${errs.length ? `，失败 ${errs.length} 张：\n${errs.join('\n')}` : ''}`, copy: rows.map((r) => r.join('|')).join('\n'),
      stats: [{ label: '成功', value: outs.length }, { label: '失败', value: errs.length }],
      actions: [{ label: '打包 ZIP 下载', run: (vv, c) => c.download('条形码批量.zip', buildZip(outs), 'application/zip') }] };
  }
});
