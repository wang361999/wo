/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "HTML / 元信息",
  "titleOut": "社交卡片预览",
  "fields": [
    {
      "id": "html",
      "label": "粘贴网页 <head> 或完整 HTML",
      "type": "textarea",
      "rows": 8,
      "default": "<meta property=\"og:title\" content=\"一页工具\"><meta property=\"og:description\" content=\"打开就能用的小工具箱\"><meta name=\"twitter:card\" content=\"summary_large_image\"><title>一页工具</title>"
    },
    {
      "id": "plat",
      "label": "平台样式",
      "type": "select",
      "options": [
        "Twitter / X",
        "微信",
        "Facebook",
        "微博"
      ]
    }
  ],
  "primary": "复制标签",
  "hintOut": "纯前端解析 og: / twitter: / 标准 meta，不发起网络请求；粘 HTML 就能看到卡片长什么样。",
  "compute": (v) => {
    const doc = new DOMParser().parseFromString(String(v.html || ''), 'text/html');
    const get = (sel, attr) => [...doc.querySelectorAll(sel)].map((el) => el.getAttribute(attr)).filter(Boolean);
    const meta = {};
    doc.querySelectorAll('meta').forEach((m) => { const k = m.getAttribute('property') || m.getAttribute('name'); if (k) meta[k.toLowerCase()] = m.getAttribute('content') || ''; });
    const title = meta['og:title'] || meta['twitter:title'] || doc.title || '（缺标题）';
    const desc = meta['og:description'] || meta['description'] || meta['twitter:description'] || '（缺描述）';
    const img = meta['og:image'] || meta['twitter:image'] || '';
    const url = meta['og:url'] || '';
    const missing = ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card'].filter((k) => !meta[k]);
    const card = `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden;max-width:420px;background:#fff">
      ${img ? `<img src="${L.esc(img)}" style="width:100%;height:170px;object-fit:cover;display:block" onerror="this.style.display='none'">` : ''}
      <div style="padding:12px 14px"><div style="font-size:11px;color:#8a7c68">${L.esc(url || 'example.com')}</div>
      <div style="font-size:15px;font-weight:700;margin:4px 0">${L.esc(title)}</div>
      <div style="font-size:12.5px;color:#6b6152;line-height:1.6">${L.esc(desc)}</div></div></div>`;
    return { preview: card + (missing.length ? `<p class="t-hint" style="margin-top:10px;color:#a63d34">建议补上：${L.esc(missing.join('、'))}</p>` : ''),
      html: `<table class="t-table"><tbody>${Object.entries(meta).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${L.esc(x)}</td></tr>`).join('')}</tbody></table>`,
      copy: Object.entries(meta).map(([k, x]) => `${k}: ${x}`).join('\n'), stats: [{ label: 'meta', value: Object.keys(meta).length }, { label: '缺失', value: missing.length }] };
  }
});
