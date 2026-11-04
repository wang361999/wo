/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "JWT",
  "titleOut": "解析结果",
  "fields": [
    {
      "id": "t",
      "label": "粘贴 Token",
      "type": "textarea",
      "rows": 6,
      "default": "",
      "placeholder": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.xxx"
    }
  ],
  "primary": "复制头部与载荷",
  "sample": {
    "t": ""
  },
  "hintOut": "只做本地解析与展示，不校验签名（验签请用「JWT 验签」）。exp / iat / nbf 会换算成本地时间。",
  "compute": (v) => {
    const t = String(v.t || '').trim();
    if (!t) return { text: '粘一个 JWT 进来。' };
    const p = t.split('.');
    if (p.length !== 3) return { error: 'JWT 应该是用两个点隔开的三段' };
    const dec = (s) => { try { return JSON.parse(L.fromUtf8(L.b64ToBytes(s.replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { throw new Error('第 ' + (s === p[0] ? 1 : 2) + ' 段不是合法 JSON'); } };
    let h, pl; try { h = dec(p[0]); pl = dec(p[1]); } catch (e) { return { error: e.message }; }
    const tm = (k) => pl[k] ? `${pl[k]} → ${new Date(pl[k] * 1000).toLocaleString('zh-CN')}` : null;
    const times = ['exp', 'iat', 'nbf'].map(tm).filter(Boolean);
    const expired = pl.exp && pl.exp * 1000 < Date.now();
    return { html: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="tag">Header</span><span class="tag">Payload</span><span class="tag">Signature（${p[2].length} 字符）</span></div>
      <p class="t-label">头部</p><pre class="t-out" style="max-height:150px">${L.esc(JSON.stringify(h, null, 2))}</pre>
      <p class="t-label" style="margin-top:12px">载荷</p><pre class="t-out" style="max-height:220px">${L.esc(JSON.stringify(pl, null, 2))}</pre>
      ${times.length ? `<p class="t-hint">${times.map(L.esc).join('<br>')}${expired ? '<br><b style="color:#a63d34">此 Token 已过期</b>' : ''}</p>` : ''}`,
      copy: `Header:\n${JSON.stringify(h, null, 2)}\n\nPayload:\n${JSON.stringify(pl, null, 2)}`,
      stats: [{ label: '算法', value: h.alg || '—' }, { label: '类型', value: h.typ || '—' }, { label: '声明数', value: Object.keys(pl).length }, { label: '状态', value: expired ? '已过期' : pl.exp ? '有效' : '无有效期' }] };
  }
});
