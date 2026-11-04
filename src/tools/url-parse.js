/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "URL",
  "titleOut": "拆解与参数",
  "fields": [
    {
      "id": "u",
      "label": "整条网址",
      "type": "text",
      "default": "https://user:pass@example.com:8080/a/b?x=1&x=2&name=%E5%B0%8F%E6%98%8E#top"
    },
    {
      "id": "edit",
      "label": "改参数（key=value，每行一条）",
      "type": "textarea",
      "rows": 4,
      "default": "x=9\nnew=hello"
    }
  ],
  "primary": "复制拼回的 URL",
  "hintOut": "上半部分是拆解结果；下半部分按你填的参数重新拼一条 URL，重复 key 会保留为数组。",
  "compute": (v) => {
    let u; try { u = new URL(v.u); } catch (e) { return { error: 'URL 不合法：' + e.message }; }
    const params = [...u.searchParams.entries()];
    const rebuilt = new URL(v.u);
    const rules = L.nonEmptyLines(v.edit || '');
    for (const r of rules) { const i = r.indexOf('='); if (i < 0) continue; const k = r.slice(0, i).trim(), val = r.slice(i + 1); if (!k) continue; if (val === '') rebuilt.searchParams.delete(k); else rebuilt.searchParams.set(k, val); }
    const rows = [['protocol', u.protocol], ['username', u.username], ['password', u.password], ['hostname', u.hostname], ['port', u.port], ['pathname', u.pathname], ['hash', u.hash], ['origin', u.origin]];
    return { html: `<table class="t-table"><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${L.esc(r[1] || '（空）')}</td></tr>`).join('')}</tbody></table>
      <p class="t-label" style="margin-top:14px">查询参数（${params.length}）</p><table class="t-table"><tbody>${params.map((p) => `<tr><td>${L.esc(p[0])}</td><td>${L.esc(p[1])}</td></tr>`).join('') || '<tr><td colspan="2">无参数</td></tr>'}</tbody></table>
      <p class="t-label" style="margin-top:14px">拼回的 URL</p><div class="t-out" style="word-break:break-all">${L.esc(rebuilt.href)}</div>`,
      copy: rebuilt.href, stats: [{ label: '参数', value: params.length }, { label: '端口', value: u.port || '默认' }] };
  }
});
