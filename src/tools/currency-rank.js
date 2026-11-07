/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "查看方式",
  "titleOut": "货币价值排行",
  "fields": [
    {
      "id": "way",
      "label": "榜单",
      "type": "select",
      "options": [
        "最值钱（1 单位折人民币最高）",
        "最不值钱（最低）",
        "全部对照（前 60）"
      ]
    }
  ],
  "primary": "复制整表",
  "hintOut": "按「1 单位本币折多少人民币」用实时牌价排序，共约 160 个币种。币值高低不等于国力强弱；上游不可用时页面会明确标注，不拿旧数据冒充实时。",
  "compute": async (v) => {
    const F = (n, d = 6) => L.fmt(L.round(n, d), d);
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
    if (!R.CNY) return { error: '上游暂时没有人民币牌价' };
    const all = Object.keys(R).filter((k) => R[k] > 0).map((k) => ({ code: k, name: N[k] || k, cny: R.CNY / R[k] }));
    all.sort((a, b) => b.cny - a.cny);
    const strongest = all[0] ? all[0].code : '—', weakest = all.length ? all[all.length - 1].code : '—';
    let arr = all.slice();
    if (v.way.startsWith('最不值钱')) arr = all.slice().reverse();
    arr = arr.slice(0, 60);
    const when = fx.updated ? new Date(fx.updated).toLocaleString('zh-CN', { hour12: false }) : '—';
    const note = '<p class="t-hint">' + (fx.stale ? '上游暂不可用，以下是上一次成功的结果。' : '实时牌价，服务端缓存 6 小时。') +
      '更新时间 ' + L.esc(when) + ' · 来源 ' + L.esc(fx.source || '公开数据源') + ' · 共 ' + all.length + ' 个币种</p>';
    const tbl = '<table class="t-table"><thead><tr><th>#</th><th>币种</th><th>1 单位 ≈ CNY</th></tr></thead><tbody>' +
      arr.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + L.esc(x.code) + ' ' + L.esc(x.name) + '</td><td>' + F(x.cny) + '</td></tr>').join('') + '</tbody></table>';
    const text = arr.map((x, i) => (i + 1) + '. ' + x.code + ' ' + x.name + '　1 单位 ≈ ' + F(x.cny) + ' 元').join('\n') + '\n\n' +
      '牌价时间 ' + when + (fx.stale ? '（非实时）' : '') + '，来源 ' + (fx.source || '公开数据源');
    return { text, copy: text, stats: [{ label: '收录币种', value: all.length + ' 种' }, { label: '最值钱', value: strongest }, { label: '最不值钱', value: weakest }], preview: tbl + note };
  }
});
