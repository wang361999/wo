/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "二维码内容",
  "titleOut": "二维码",
  "wide": false,
  "fields": [
    {
      "id": "type",
      "label": "类型",
      "type": "select",
      "options": [
        "文本 / 网址",
        "WiFi",
        "名片 vCard",
        "短信",
        "邮件"
      ]
    },
    {
      "id": "text",
      "label": "内容",
      "type": "textarea",
      "rows": 3,
      "default": "https://example.com"
    },
    {
      "id": "ssid",
      "label": "WiFi 名称",
      "type": "text",
      "default": ""
    },
    {
      "id": "pwd",
      "label": "WiFi 密码",
      "type": "text",
      "default": ""
    },
    {
      "id": "name",
      "label": "名片姓名",
      "type": "text",
      "default": ""
    },
    {
      "id": "tel",
      "label": "名片电话",
      "type": "text",
      "default": ""
    },
    {
      "id": "ec",
      "label": "纠错等级",
      "type": "select",
      "options": [
        "L 低",
        "M 中",
        "Q 较高",
        "H 高"
      ]
    },
    {
      "id": "dot",
      "label": "码点样式",
      "type": "select",
      "options": [
        "方形",
        "圆点",
        "圆角"
      ]
    },
    {
      "id": "scale",
      "label": "码点像素",
      "type": "number",
      "default": 8
    },
    {
      "id": "dark",
      "label": "前景色",
      "type": "color",
      "default": "#2f2b26"
    },
    {
      "id": "light",
      "label": "背景色",
      "type": "color",
      "default": "#ffffff"
    }
  ],
  "primary": "复制 SVG",
  "hintOut": "二维码用本地库在浏览器里生成，内容不上传。可导出 PNG / SVG，也能把 Logo 叠在中间（纠错等级调高更稳）。",
  "compute": async (v) => {
    let text = String(v.text || '');
    if (v.type === 'WiFi') text = `WIFI:T:WPA;S:${v.ssid || ''};P:${v.pwd || ''};;`;
    else if (v.type === '名片 vCard') text = `BEGIN:VCARD\nVERSION:3.0\nFN:${v.name || ''}\nTEL:${v.tel || ''}\nEND:VCARD`;
    else if (v.type === '短信') text = `SMSTO:${v.tel || ''}:${text}`;
    else if (v.type === '邮件') text = `mailto:${text}`;
    if (!text.trim()) return { error: '内容不能为空' };
    const ec = String(v.ec || 'M')[0];
    const { canvas, count } = await qrCanvas(text, { ec, scale: L.clamp(Number(v.scale) || 8, 2, 20), dark: v.dark, light: v.light, dot: v.dot });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${canvas.toDataURL('image/png')}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
    return { preview: `<img src="${canvas.toDataURL('image/png')}" style="max-width:260px;image-rendering:pixelated">`,
      copy: svg, text: `编码内容：${text}\n版本：${count} × ${count} 模块`, stats: [{ label: '模块', value: count + '×' + count }, { label: '字符', value: text.length }],
      actions: [{ label: '下载 PNG', run: (vv, c) => c.canvasDownload(canvas, '二维码.png') }] };
  }
});
