/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "金额与币种",
  "titleOut": "换算结果",
  "fields": [
    {
      "id": "amount",
      "label": "金额",
      "type": "number",
      "default": 100
    },
    {
      "id": "from",
      "label": "从",
      "type": "select",
      "options": [
        "CNY 人民币",
        "USD 美元",
        "EUR 欧元",
        "JPY 日元",
        "HKD 港币",
        "GBP 英镑",
        "KRW 韩元",
        "THB 泰铢",
        "SGD 新元",
        "AUD 澳元",
        "CAD 加元",
        "CHF 瑞士法郎",
        "TWD 新台币",
        "MYR 林吉特",
        "VND 越南盾",
        "INR 印度卢比",
        "RUB 俄罗斯卢布",
        "AED 迪拉姆",
        "KWD 第纳尔",
        "BRL 雷亚尔"
      ]
    },
    {
      "id": "to",
      "label": "到",
      "type": "select",
      "options": [
        "CNY 人民币",
        "USD 美元",
        "EUR 欧元",
        "JPY 日元",
        "HKD 港币",
        "GBP 英镑",
        "KRW 韩元",
        "THB 泰铢",
        "SGD 新元",
        "AUD 澳元",
        "CAD 加元",
        "CHF 瑞士法郎",
        "TWD 新台币",
        "MYR 林吉特",
        "VND 越南盾",
        "INR 印度卢比",
        "RUB 俄罗斯卢布",
        "AED 迪拉姆",
        "KWD 第纳尔",
        "BRL 雷亚尔"
      ]
    }
  ],
  "primary": "复制换算",
  "hintOut": "实时汇率经本站同源接口取回，服务端缓存 6 小时；上游数据为中间价，实际以银行 / 换汇平台牌价为准。上游不可用时会明确提示，不会拿旧数据冒充实时。",
  "compute": async (v) => {
    const F = (n, d = 4) => L.fmt(L.round(n, d), d);
    const c = window.__OP_FX__ || (window.__OP_FX__ = { data: null, at: 0, pending: null });
    const load = () => {
      if (c.data && Date.now() - c.at < 300000) return Promise.resolve(c.data);
      if (c.pending) return c.pending;
      c.pending = fetch('/api/fx').then((r) => r.json()).then((j) => {
        if (!j.ok || !j.rates) throw new Error(j.error || '汇率服务暂不可用');
        c.data = j; c.at = Date.now(); c.pending = null; return j;
      }).catch((e) => { c.pending = null; throw e; });
      return c.pending;
    };
    let fx;
    try { fx = await load(); } catch (e) { return { error: '实时汇率读取失败：' + e.message + '，请稍后重试' }; }
    const R = fx.rates, N = fx.names || {};
    const f = String(v.from).split(' ')[0], t = String(v.to).split(' ')[0];
    if (!R[f] || !R[t]) return { error: f + ' / ' + t + ' 暂时没有牌价' };
    const amt = Number(v.amount) || 0;
    const rate = R[t] / R[f], out = amt * rate, cny = amt * (R.CNY / R[f]);
    const when = fx.updated ? new Date(fx.updated).toLocaleString('zh-CN', { hour12: false }) : '—';
    const text = [amt + ' ' + f + ' → ' + F(out) + ' ' + t,
      '实时中间价：1 ' + f + ' = ' + F(rate, 6) + ' ' + t,
      '折合人民币 ' + F(cny, 2) + ' 元',
      '牌价时间 ' + when + (fx.stale ? '（上游暂不可用，为上一次成功结果）' : '') + ' · 来源 ' + (fx.source || '公开数据源'),
      '约 ' + fx.count + ' 个币种可用；实际换汇以银行牌价为准'].join('\n');
    const major = ['CNY', 'USD', 'EUR', 'JPY', 'HKD', 'GBP', 'KRW', 'THB', 'SGD', 'AUD', 'CAD', 'CHF'];
    const rows = major.filter((k) => R[k]).map((k) => '<tr><td style="white-space:nowrap">' + L.esc(k) + ' <span style="color:var(--ink-3)">' + L.esc(N[k] || '') + '</span></td><td style="white-space:nowrap">' + F(R.CNY / R[k], 6) + '</td><td style="white-space:nowrap">' + F(amt * R[k] / R[f], 2) + '</td></tr>').join('');
    const pts = (fx.series || []).filter((x) => x.CNY).slice(-30);
    let spark = '<p class="t-hint">每天记一次快照，攒够两天后这里会出现 USD → CNY 的真实走势曲线。</p>';
    if (pts.length >= 2) {
      const vals = pts.map((x) => x.CNY), lo = Math.min(...vals), hi = Math.max(...vals);
      const xy = vals.map((n, i) => [(i / (vals.length - 1)) * 420, 68 - ((n - lo) / (hi - lo || 1)) * 60]);
      const line = xy.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      spark = '<p class="t-hint" style="margin-top:14px">USD → CNY 每日快照（最近 ' + pts.length + ' 天，' + F(lo, 4) + ' ~ ' + F(hi, 4) + '）</p>' +
        '<svg viewBox="0 0 420 76" width="100%" height="76" role="img" aria-label="美元兑人民币走势"><polyline points="' + line + '" fill="none" stroke="#2a45c4" stroke-width="2" stroke-linejoin="round"/><circle cx="' + xy[xy.length - 1][0].toFixed(1) + '" cy="' + xy[xy.length - 1][1].toFixed(1) + '" r="3" fill="#2a45c4"/></svg>';
    }
    return { text, copy: text, stats: [{ label: '换算结果', value: F(out) + ' ' + t }, { label: '折人民币', value: F(cny, 2) + ' 元' }, { label: '牌价时间', value: when.slice(5, 16) }],
      preview: '<p class="t-hint">1 单位该币种 ≈ 人民币；第三列是把当前金额换成该币种</p>' +
        '<table class="t-table"><thead><tr><th>币种</th><th>≈ CNY</th><th>可换</th></tr></thead><tbody>' + rows + '</tbody></table>' + spark };
  }
});
