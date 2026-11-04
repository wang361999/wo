/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default fileTool({
  "titleIn": "HAR 文件",
  "titleOut": "请求分析",
  "accept": ".har,.json",
  "multiple": false,
  "primary": "分析",
  "auto": false,
  "dropTitle": "拖 .har 进来",
  "fields": [
    {
      "id": "filter",
      "label": "过滤（URL / 状态 / 类型）",
      "type": "text",
      "default": ""
    },
    {
      "id": "mask",
      "label": "导出时脱敏 Cookie / Authorization / Token 参数",
      "type": "checkbox",
      "default": true
    }
  ],
  "note": "解析 HAR 1.2：请求列表、状态码、耗时、瀑布条、详情查看；导出可脱敏，全程本地解析。",
  "process": async (files, v, ctx) => {
    const f = files[0]; if (!f) return { error: '先选 HAR' };
    let j; try { j = JSON.parse(await L.readFile(f, 'text')); } catch (e) { return { error: 'HAR 解析失败：' + e.message }; }
    const entries = j.log?.entries || [];
    const k = String(v.filter || '').toLowerCase();
    const rows = entries.filter((e) => !k || `${e.request?.url} ${e.response?.status} ${e.response?.content?.mimeType}`.toLowerCase().includes(k));
    const max = Math.max(1, ...rows.map((e) => e.time || 0));
    const table = rows.slice(0, 200).map((e, i) => {
      const url = e.request?.url || ''; const status = e.response?.status || 0; const ms = Math.round(e.time || 0);
      const mt = (e.response?.content?.mimeType || '').split(';')[0];
      return `<tr><td class="num">${i + 1}</td><td style="word-break:break-all;max-width:340px">${L.esc(url.slice(0, 130))}</td><td class="num" style="color:${status >= 400 ? '#a63d34' : '#2f6b3a'}">${status}</td><td class="num">${ms} ms</td><td style="min-width:110px"><div style="height:9px;background:var(--accent);border-radius:5px;width:${Math.max(3, ms / max * 100)}%"></div></td><td>${L.esc(mt)}</td></tr>`;
    }).join('');
    const clean = v.mask ? JSON.stringify(rows.map((e) => ({ ...e, request: { ...e.request, headers: (e.request?.headers || []).map((h) => /cookie|auth|token|key/i.test(h.name) ? { ...h, value: '***' } : h), url: (e.request?.url || '').replace(/([?&])(token|key|auth|sign)=[^&]+/gi, '$1$2=***') }, response: { ...e.response, headers: (e.response?.headers || []).map((h) => /set-cookie|auth|token/i.test(h.name) ? { ...h, value: '***' } : h) } })), null, 2) : JSON.stringify(rows, null, 2);
    return { html: `<table class="t-table"><thead><tr><th>#</th><th>URL</th><th>状态</th><th>耗时</th><th>瀑布</th><th>类型</th></tr></thead><tbody>${table}</tbody></table>`,
      copy: rows.map((e) => [e.request?.method, e.request?.url, e.response?.status, Math.round(e.time || 0)].join('\t')).join('\n'),
      files: [{ name: f.name.replace(/\.har$/i, '') + '-脱敏.har', data: L.utf8(clean), mime: 'application/json', label: '导出脱敏 HAR' }],
      stats: [{ label: '请求', value: entries.length }, { label: '筛选后', value: rows.length }, { label: '总耗时', value: Math.round(rows.reduce((s, e) => s + (e.time || 0), 0)) + ' ms' }] };
  }
});
