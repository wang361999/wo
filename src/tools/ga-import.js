/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "密钥列表",
  "titleOut": "迁移二维码",
  "fields": [
    {
      "id": "rows",
      "label": "每行：名称|Base32密钥|发行方（可省）",
      "type": "textarea",
      "rows": 6,
      "default": "GitHub|JBSWY3DPEHPK3PXP|GitHub\nGoogle|JBSWY3DPEHPK3PXP|Google"
    },
    {
      "id": "batch",
      "label": "每批几个账号（多了会自动分张）",
      "type": "number",
      "default": 10
    }
  ],
  "primary": "复制 otpauth URI",
  "hintOut": "生成 Google Authenticator「导出账号」格式的迁移二维码，用手机上的 Authenticator 扫一下即可批量导入。二维码用本地库绘制，不联网。",
  "compute": async (v) => {
    const items = L.nonEmptyLines(v.rows || '').map((l) => l.split('|').map((x) => x.trim())).filter((r) => r[0] && r[1]);
    if (!items.length) return { error: '至少填一行 名称|密钥' };
    const per = Math.max(1, Math.min(20, Number(v.batch) || 10));
    const groups = []; for (let i = 0; i < items.length; i += per) groups.push(items.slice(i, i + per));
    const qrc = await vendor('qr');
    const svgs = groups.map((g, gi) => {
      let payload = [];
      g.forEach((r) => {
        const secretBytes = b32(r[1]);
        let p = [];
        p.push(...pbLen(1, Array.from(secretBytes)));
        p.push(...pbLen(2, Array.from(L.utf8(r[0]))));
        p.push(...pbLen(3, Array.from(L.utf8(r[2] || r[0]))));
        p.push(...pbNum(4, 1)); p.push(...pbNum(5, 1)); p.push(...pbNum(6, 2));
        payload.push(...pbLen(1, p));
      });
      payload.push(...pbNum(2, 1), ...pbNum(3, g.length), ...pbNum(4, 1), ...pbNum(5, g.length));
      const uri = 'otpauth-migration://offline?data=' + encodeURIComponent(L.bytesToB64(new Uint8Array(payload)));
      const q = qrc(0, 'M'); q.addData(uri); q.make();
      return `<div style="margin:8px 0"><p class="t-hint">第 ${gi + 1} 张 · ${g.length} 个账号</p><div style="background:#fff;padding:10px;display:inline-block">${q.createSvgTag(3, 0).replace(/<svg/, '<svg style="width:210px;height:210px"')}</div></div>`;
    }).join('');
    const uris = items.map((r) => otpUri(r[1], r[0], r[2] || r[0])).join('\n');
    return { preview: svgs, copy: uris, text: '', stats: [{ label: '账号', value: items.length }, { label: '二维码', value: groups.length }] };
  }
});
