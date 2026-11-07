// 财务与计算类：全部浏览器本地纯计算，不联网、不上传。
// 税率 / 五险一金比例 / 延迟退休 / 打新规则等为内置精简口径，已在各工具说明里标注，不冒充官方实时数据。
// 汇率换算与货币排行走 /api/fx，用实时牌价，不在这个文件里写死。
export const S = {};

S['mortgage'] = { kind: 'form', titleIn: '贷款信息', titleOut: '还款测算', wide: false,
  fields: [
    { id: 'amount', label: '贷款总额', type: 'number', default: 100, unit: '万元' },
    { id: 'rate', label: '商贷年利率', type: 'number', default: 3.1, unit: '%' },
    { id: 'years', label: '贷款年限', type: 'number', default: 30, unit: '年' },
    { id: 'mode', label: '还款方式', type: 'select', options: ['等额本息', '等额本金'] },
    { id: 'type', label: '贷款类型', type: 'select', options: ['商贷', '公积金', '组合贷'] },
    { id: 'fund', label: '其中公积金部分', type: 'number', default: 40, unit: '万元（组合贷时填）' },
    { id: 'fundRate', label: '公积金年利率', type: 'number', default: 2.85, unit: '%' }],
  primary: '复制测算结果', sample: { amount: 100, rate: 3.1, years: 30, fund: 40 },
  hintOut: '等额本金首月月供最高、逐月递减。组合贷按两笔贷款分别摊销后相加。利率请按你手上合同填，结果只作估算。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const n = Math.max(1, Math.round(v.years * 12)), mode = v.mode === '等额本金' ? 'principal' : 'equal';
    const parts = [];
    if (v.type === '组合贷') {
      const f = Math.min(v.amount, Math.max(0, v.fund));
      parts.push({ tag: '公积金', P: f * 10000, r: v.fundRate });
      parts.push({ tag: '商贷', P: (v.amount - f) * 10000, r: v.rate });
    } else parts.push({ tag: v.type, P: v.amount * 10000, r: v.type === '公积金' ? v.fundRate : v.rate });
    let first = 0, last = 0, totalI = 0, totalP = 0;
    const rows = [];
    for (const p of parts) {
      if (p.P <= 0) continue;
      const s = L.loanSchedule(p.P, p.r, n, mode);
      totalI += s.totalInterest; totalP += s.totalPay;
      first += s.rows[0].pay; last += s.rows[n - 1].pay;
      s.rows.slice(0, 12).forEach((x, i) => {
        if (!rows[i]) rows[i] = { i: i + 1, pay: 0, interest: 0, principalPart: 0, rest: 0 };
        rows[i].pay += x.pay; rows[i].interest += x.interest; rows[i].principalPart += x.principalPart; rows[i].rest += x.rest;
      });
    }
    const tbl = `<table class="t-table"><thead><tr><th>期数</th><th>月供</th><th>利息</th><th>本金</th><th>剩余本金</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.i}</td><td>${F(x.pay)}</td><td>${F(x.interest)}</td><td>${F(x.principalPart)}</td><td>${F(x.rest)}</td></tr>`).join('')}</tbody></table>`;
    const text = [
      `贷款总额：${F(v.amount * 10000)} 元（${L.esc(v.type)}）`,
      `首月月供：${F(first)} 元`,
      mode === 'principal' ? `末月月供：${F(last)} 元（等额本金逐月递减约 ${F((first - last) / Math.max(1, n - 1))} 元）` : `每月月供：${F(first)} 元（等额本息固定）`,
      `总利息：${F(totalI)} 元`,
      `总还款：${F(totalP)} 元`,
      `利息占本金：${F(totalI / Math.max(1, v.amount * 10000) * 100)}%`,
    ].join('\n');
    return { text, copy: text, stats: [{ label: '首月月供', value: F(first) + ' 元' }, { label: '总利息', value: F(totalI) + ' 元' }, { label: '总还款', value: F(totalP) + ' 元' }], preview: '<p class="t-hint">前 12 期明细（元）</p>' + tbl };
  } };

S['mortgage-prepay'] = { kind: 'form', titleIn: '现有贷款与提前还款', titleOut: '省息对比',
  fields: [
    { id: 'rest', label: '当前剩余本金', type: 'number', default: 800000, unit: '元' },
    { id: 'rate', label: '年利率', type: 'number', default: 3.1, unit: '%' },
    { id: 'months', label: '剩余期数', type: 'number', default: 240, unit: '月' },
    { id: 'pay', label: '当前月供', type: 'number', default: 4300, unit: '元（可留 0 自动算）' },
    { id: 'prepay', label: '计划提前还款', type: 'number', default: 200000, unit: '元' },
    { id: 'way', label: '方式', type: 'select', options: ['缩短年限（月供不变）', '减少月供（年限不变）'] }],
  primary: '复制对比结果', hintOut: '按等额本息、无违约金测算。实际以银行重新签的还款计划为准；部分银行对提前还款有次数或金额门槛。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = v.rest, n = Math.max(1, Math.round(v.months)), r = v.rate / 1200;
    const M = v.pay > 0 ? v.pay : L.pmt(P, v.rate, n);
    const A = Math.min(v.prepay, P);
    const oldTotal = M * n;
    let newPay = M, newN = n, newTotal = A + M * n, save = 0, detail = '';
    if (v.way.startsWith('缩短')) {
      if (r === 0) newN = Math.max(1, Math.ceil((P - A) / M));
      else { const x = 1 - (P - A) * r / M; newN = x <= 0 ? 1 : Math.ceil(-Math.log(x) / Math.log(1 + r)); }
      newN = Math.min(n, newN);
      newTotal = A + M * newN;
      save = oldTotal - newTotal;
      detail = `月供仍是 ${F(M)} 元，期数从 ${n} 期缩短到 ${newN} 期（少还 ${n - newN} 期，约 ${F((n - newN) / 12, 1)} 年）。`;
    } else {
      newPay = L.pmt(P - A, v.rate, n);
      newTotal = A + newPay * n;
      save = oldTotal - newTotal;
      detail = `期数仍是 ${n} 期，月供从 ${F(M)} 元降到 ${F(newPay)} 元（每月少还 ${F(M - newPay)} 元）。`;
    }
    const text = [
      `原方案：剩余 ${n} 期 × ${F(M)} 元 = ${F(oldTotal)} 元`,
      `提前还款：${F(A)} 元（${L.esc(v.way)}）`,
      detail,
      `新方案总支出：${F(newTotal)} 元（含本次提前还款）`,
      `预计省息：${F(save)} 元`,
    ].join('\n');
    const E2 = L.esc;
    return { text, copy: text,
      stats: [{ label: '预计省息', value: F(save) + ' 元' }, { label: '新月供', value: F(newPay) + ' 元' }, { label: '新期数', value: newN + ' 期' }],
      preview: `<p class="t-hint">${L.esc(detail)} 省息是「少付的利息」的近似值，未计最后一期尾差与违约金。</p>` };
  } };

S['car-loan'] = { kind: 'form', titleIn: '车价与贷款', titleOut: '月供与明细',
  fields: [
    { id: 'price', label: '车价（裸车）', type: 'number', default: 150000, unit: '元' },
    { id: 'down', label: '首付比例', type: 'number', default: 30, unit: '%' },
    { id: 'rate', label: '年利率', type: 'number', default: 4.5, unit: '%' },
    { id: 'months', label: '期数', type: 'number', default: 36, unit: '月' },
    { id: 'fee', label: '手续费 / 服务费', type: 'number', default: 0, unit: '元' }],
  primary: '复制明细', hintOut: '等额本息口径。厂家「零利率」常把利息转成手续费，把手续费填进去才能和全款比真实成本。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = Math.max(0, v.price * (1 - v.down / 100)), n = Math.max(1, Math.round(v.months));
    const s = L.loanSchedule(P, v.rate, n, 'equal');
    const all = v.price + v.fee + s.totalInterest;
    const tbl = `<table class="t-table"><thead><tr><th>期</th><th>月供</th><th>利息</th><th>本金</th><th>剩余</th></tr></thead><tbody>${s.rows.slice(0, 12).map((x) => `<tr><td>${x.i}</td><td>${F(x.pay)}</td><td>${F(x.interest)}</td><td>${F(x.principalPart)}</td><td>${F(x.rest)}</td></tr>`).join('')}</tbody></table>`;
    const text = [`首付：${F(v.price * v.down / 100)} 元，贷款：${F(P)} 元`, `月供：${F(s.monthly)} 元 × ${n} 期`, `总利息：${F(s.totalInterest)} 元`, `手续费：${F(v.fee)} 元`, `落地合计：${F(all)} 元`, `比全款多花：${F(s.totalInterest + v.fee)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '月供', value: F(s.monthly) + ' 元' }, { label: '总利息', value: F(s.totalInterest) + ' 元' }, { label: '落地合计', value: F(all) + ' 元' }], preview: '<p class="t-hint">前 12 期明细（元）</p>' + tbl };
  } };

S['consumer-loan'] = { kind: 'form', titleIn: '借款与报价', titleOut: '真实成本',
  fields: [
    { id: 'amount', label: '借款金额', type: 'number', default: 20000, unit: '元' },
    { id: 'quote', label: '对方怎么报的价', type: 'select', options: ['月利率 %', '日利率 ‰', '名义年利率 %', '每期手续费 %'] },
    { id: 'q', label: '报价数值', type: 'number', default: 0.6, unit: '按上面单位' },
    { id: 'months', label: '期数', type: 'number', default: 12, unit: '月' },
    { id: 'fee', label: '一次性手续费', type: 'number', default: 0, unit: '元' },
    { id: 'repay', label: '还款方式', type: 'select', options: ['等额本息', '等额本金', '先息后本'] }],
  primary: '复制真实年利率', hintOut: '用现金流 IRR 反推真实年利率（APR）。「日息万五」「月费 0.6%」听着少，年化往往 13% 以上。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const P = v.amount, n = Math.max(1, Math.round(v.months));
    let monthlyRate = 0, per = 0;
    if (v.quote === '月利率 %') monthlyRate = v.q / 100;
    else if (v.quote === '日利率 ‰') monthlyRate = v.q / 1000 * 30;
    else if (v.quote === '名义年利率 %') monthlyRate = v.q / 1200;
    else monthlyRate = v.q / 100;
    let flows;
    if (v.repay === '先息后本') { per = P * monthlyRate; flows = [P - v.fee, ...Array.from({ length: n - 1 }, () => -per), -per - P]; }
    else if (v.repay === '等额本金') { flows = [P - v.fee]; let rest = P; for (let i = 1; i <= n; i++) { const pay = P / n + rest * monthlyRate; rest -= P / n; flows.push(-pay); } }
    else { per = L.pmt(P, monthlyRate * 1200, n); flows = [P - v.fee, ...Array.from({ length: n }, () => -per)]; }
    const m = L.irr(flows, 0.01);
    const apr = (Math.pow(1 + m, 12) - 1) * 100;
    const totalPay = flows.slice(1).reduce((a, b) => a - b, 0) + v.fee;
    const text = [`到手金额：${F(P - v.fee)} 元（已扣一次性手续费 ${F(v.fee)} 元）`, `每期约还：${F(per || P / n + P * monthlyRate)} 元`, `累计还款：${F(totalPay)} 元`, `名义报价：${v.q} ${L.esc(v.quote)}，折算名义年化 ${F(monthlyRate * 1200)}%`, `真实年利率（IRR/APR）：${F(apr)}%`, `利息与费用合计：${F(totalPay - P)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '真实年利率', value: F(apr) + '%' }, { label: '名义年化', value: F(monthlyRate * 1200) + '%' }, { label: '多付', value: F(totalPay - P) + ' 元' }],
      preview: `<p class="t-hint">真实年利率按每期现金流折现反推，包含手续费与「本金逐月减少但利息按全额收」的效应。口径为 APR，不是含复利的 APY。</p>` };
  } };

S['loan-rate'] = { kind: 'form', titleIn: '还款计划', titleOut: '反推利率',
  fields: [
    { id: 'got', label: '实际到手', type: 'number', default: 10000, unit: '元' },
    { id: 'per', label: '每期还款', type: 'number', default: 900, unit: '元' },
    { id: 'n', label: '期数', type: 'number', default: 12, unit: '期' },
    { id: 'perMonths', label: '每期间隔', type: 'select', options: ['1 个月', '7 天', '1 年'] }],
  primary: '复制利率结果', hintOut: '只要知道「到手多少、每期还多少、还几期」，就能反推真实利率。 auto 贷款、分期、民间借贷都适用。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const n = Math.max(1, Math.round(v.n));
    const flows = [v.got, ...Array.from({ length: n }, () => -v.per)];
    const r = L.irr(flows, 0.02);
    const perYear = v.perMonths.startsWith('7') ? 365 / 7 : v.perMonths.startsWith('1 年') ? 1 : 12;
    const apr = (Math.pow(1 + r, perYear) - 1) * 100;
    const text = [`到手 ${F(v.got)} 元，${n} 期 × ${F(v.per)} 元，共还 ${F(v.per * n)} 元`, `每期利率：${F(r * 100)}%`, `折算年化（APR）：${F(apr)}%`, `总利息：${F(v.per * n - v.got)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '每期利率', value: F(r * 100) + '%' }, { label: '年化 APR', value: F(apr) + '%' }, { label: '总利息', value: F(v.per * n - v.got) + ' 元' }],
      preview: `<p class="t-hint">年化 = (1+每期利率)^每年期数 − 1。若期数小于 2 或利率不收敛，结果可能异常。</p>` };
  } };

S['rent-vs-buy'] = { kind: 'form', titleIn: '买房与租房参数', titleOut: 'N 年成本对比',
  fields: [
    { id: 'price', label: '房价', type: 'number', default: 3000000, unit: '元' },
    { id: 'down', label: '首付比例', type: 'number', default: 30, unit: '%' },
    { id: 'rate', label: '贷款年利率', type: 'number', default: 3.1, unit: '%' },
    { id: 'years', label: '贷款年限', type: 'number', default: 30, unit: '年' },
    { id: 'rent', label: '现在月租金', type: 'number', default: 5000, unit: '元' },
    { id: 'rentUp', label: '租金年涨幅', type: 'number', default: 2, unit: '%' },
    { id: 'growth', label: '房价年涨幅', type: 'number', default: 0, unit: '%' },
    { id: 'invest', label: '闲钱投资年化', type: 'number', default: 3, unit: '%' },
    { id: 'hold', label: '打算持有', type: 'number', default: 10, unit: '年' }],
  primary: '复制对比结论', hintOut: '简化模型：买房 = 首付机会成本 + 累计月供 − 期末房产净值；租房 = 累计租金 + （首付+月供差额）拿去投资的收益。不含税费、维修、搬家成本。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const H = Math.max(1, Math.round(v.hold)), n = Math.round(v.years * 12);
    const down = v.price * v.down / 100, M = L.pmt(v.price - down, v.rate, n);
    const rows = []; let rentCum = 0, buyCum = 0, rentInv = down, buyPaid = down, cross = null;
    for (let y = 1; y <= H; y++) {
      const r = v.rent * Math.pow(1 + v.rentUp / 100, y - 1) * 12;
      rentCum += r;
      rentInv = rentInv * (1 + v.invest / 100) + Math.max(0, M * 12 - r);
      buyPaid += M * 12;
      const loanRest = (() => { const rr = v.rate / 1200; const k = Math.min(n, y * 12); return rr === 0 ? (v.price - down) * (1 - k / n) : (v.price - down) * (Math.pow(1 + rr, n) - Math.pow(1 + rr, k)) / (Math.pow(1 + rr, n) - 1); })();
      const home = v.price * Math.pow(1 + v.growth / 100, y) - loanRest;
      const buyNet = buyPaid + down * Math.pow(1 + v.invest / 100, y) - home;
      const rentNet = rentCum - (rentInv - down * Math.pow(1 + v.invest / 100, y));
      buyCum = buyNet; rows.push({ y, buy: buyNet, rent: rentNet, home: home });
      if (cross === null && buyNet <= rentNet) cross = y;
    }
    const tbl = `<table class="t-table"><thead><tr><th>年</th><th>买房净成本</th><th>租房净成本</th><th>房产净值</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.y}</td><td>${F(x.buy)}</td><td>${F(x.rent)}</td><td>${F(x.home)}</td></tr>`).join('')}</tbody></table>`;
    const text = [`月供 ${F(M)} 元，首付 ${F(down)} 元`, `持有 ${H} 年：买房净成本 ${F(buyCum)} 元`, `同口径租房净成本 ${F(rows[H - 1].rent)} 元`, cross === null ? `${H} 年内买房始终更贵（按这组假设）` : `约第 ${cross} 年起买房累计成本反超更划算`, `结论强依赖房价涨幅与投资年化，改一个数字可能翻转`].join('\n');
    return { text, copy: text, stats: [{ label: '月供', value: F(M) + ' 元' }, { label: `${H} 年买房`, value: F(buyCum) + ' 元' }, { label: `${H} 年租房`, value: F(rows[H - 1].rent) + ' 元' }], preview: '<p class="t-hint">净成本越小越划算（元）</p>' + tbl };
  } };

S['fire-calc'] = { kind: 'form', titleIn: '现状与目标', titleOut: '自由时间表',
  fields: [
    { id: 'asset', label: '当前可投资资产', type: 'number', default: 500000, unit: '元' },
    { id: 'spend', label: '年支出', type: 'number', default: 120000, unit: '元' },
    { id: 'save', label: '每年可存', type: 'number', default: 150000, unit: '元' },
    { id: 'rate', label: '投资年化', type: 'number', default: 5, unit: '%' },
    { id: 'infl', label: '通胀', type: 'number', default: 2.5, unit: '%' },
    { id: 'swr', label: '安全提取率', type: 'number', default: 4, unit: '%' }],
  primary: '复制测算', hintOut: '4% 法则：目标资产 ≈ 年支出 ÷ 提取率。逐年按「资产×收益 + 新增存款」推演，支出随通胀涨。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const target = v.spend / (v.swr / 100);
    let a = v.asset, hit = null; const rows = [];
    for (let y = 1; y <= 60; y++) {
      a = a * (1 + v.rate / 100) + v.save;
      const need = v.spend * Math.pow(1 + v.infl / 100, y) / (v.swr / 100);
      rows.push({ y, a, need });
      if (hit === null && a >= need) hit = y;
    }
    const tbl = `<table class="t-table"><thead><tr><th>年</th><th>资产</th><th>当年目标</th><th>达成</th></tr></thead><tbody>${rows.filter((x) => x.y <= 20 || x.y === hit).map((x) => `<tr><td>${x.y}</td><td>${F(x.a)}</td><td>${F(x.need)}</td><td>${x.a >= x.need ? '✓' : '—'}</td></tr>`).join('')}</tbody></table>`;
    const text = [`今天的目标资产：${F(target)} 元（${F(v.spend)} ÷ ${v.swr}%）`, hit === null ? '按这组参数 60 年内达不到，试着提高存款或降低支出' : `大约第 ${hit} 年达成，届时资产约 ${F(rows[hit - 1].a)} 元`, `20 年后预计资产：${F(rows[19].a)} 元`, `提示：通胀会让目标逐年变高，别只盯今天的数字`].join('\n');
    return { text, copy: text, stats: [{ label: '目标资产', value: F(target) + ' 元' }, { label: '达成年份', value: hit === null ? '60+ 年' : hit + ' 年' }, { label: '20 年资产', value: F(rows[19].a) + ' 元' }], preview: '<p class="t-hint">资产推演（元）</p>' + tbl };
  } };

S['lying-flat'] = { kind: 'form', titleIn: '本金与开销', titleOut: '能撑多久',
  fields: [
    { id: 'asset', label: '本金', type: 'number', default: 1000000, unit: '元' },
    { id: 'spend', label: '年消费', type: 'number', default: 80000, unit: '元' },
    { id: 'rate', label: '年化收益', type: 'number', default: 3, unit: '%' },
    { id: 'infl', label: '通胀', type: 'number', default: 2.5, unit: '%' }],
  primary: '复制结论', hintOut: '逐年扣掉随通胀上涨的消费，看本金哪年归零。下方热力表是不同本金 × 不同年消费的支撑年数。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const years = (a, s) => { let x = a, y = 0; for (; y < 100; y++) { x = x * (1 + v.rate / 100) - s * Math.pow(1 + v.infl / 100, y); if (x <= 0) return y; } return '100+'; };
    const hit = years(v.asset, v.spend);
    const assets = [30, 50, 80, 100, 150, 200, 300, 500].map((x) => x * 10000);
    const spends = [4, 6, 8, 10, 12, 15, 20, 30, 50].map((x) => x * 10000);
    const tbl = `<table class="t-table"><thead><tr><th>本金＼年消费</th>${spends.map((s) => `<th>${F(s / 10000, 0)}万</th>`).join('')}</tr></thead><tbody>${assets.map((a) => `<tr><td>${F(a / 10000, 0)}万</td>${spends.map((s) => { const y = years(a, s); const bg = typeof y === 'number' ? (y >= 30 ? '#cfe3cf' : y >= 15 ? '#f0e2bd' : '#f2c9bd') : '#cfe3cf'; return `<td style="background:${bg};text-align:center">${y}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    const text = [`本金 ${F(v.asset)} 元，年消费 ${F(v.spend)} 元`, `收益 ${v.rate}% − 通胀 ${v.infl}%`, typeof hit === 'number' ? `大约能撑 ${hit} 年` : '按这组参数可支撑 100 年以上', `点热力表里的格子可回填对应本金与年消费`].join('\n');
    return { text, copy: text, stats: [{ label: '可支撑', value: (typeof hit === 'number' ? hit : '100+') + ' 年' }, { label: '实际收益率', value: F(v.rate - v.infl) + '%' }], preview: '<p class="t-hint">支撑年数速查（行=本金，列=年消费）</p>' + tbl };
  } };

S['tax-calc'] = { kind: 'form', titleIn: '收入与扣除', titleOut: '个税测算',
  fields: [
    { id: 'monthly', label: '税前月薪', type: 'number', default: 20000, unit: '元' },
    { id: 'si', label: '五险一金个人部分/月', type: 'number', default: 3000, unit: '元' },
    { id: 'special', label: '专项附加扣除/月', type: 'number', default: 2000, unit: '元' },
    { id: 'bonus', label: '年终奖', type: 'number', default: 60000, unit: '元' }],
  primary: '复制测算', hintOut: '综合所得按年累计预扣法简化为「月薪×12」；年终奖给「单独计税」与「并入综合所得」两种口径对比。专项附加扣除为内置表，实际以 App 填报为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const r = L.incomeTax(v.monthly, 5000 + v.si, v.special, v.bonus);
    const merged = L.incomeTax(v.monthly + v.bonus / 12, 5000 + v.si, v.special, 0);
    const text = [`应纳税所得额（月）：${F(r.taxable)} 元`, `适用税率：${F(r.rate * 100, 0)}%，速算扣除数按内置级距`, `月薪个税（月）：${F(r.monthlyTax)} 元，全年 ${F(r.yearlyTax)} 元`, `年终奖单独计税：${F(r.bonusTax)} 元`, `年终奖并入综合所得：全年个税 ${F(merged.yearlyTax)} 元（比单独计税的合计 ${F(r.yearlyTax + r.bonusTax)} 元）`, `结论：${r.yearlyTax + r.bonusTax <= merged.yearlyTax ? '单独计税更省' : '并入综合所得更省'}，差额约 ${F(Math.abs(merged.yearlyTax - r.yearlyTax - r.bonusTax))} 元`, `年到手（不含年终奖）：${F((v.monthly - r.monthlyTax - v.si) * 12)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '月个税', value: F(r.monthlyTax) + ' 元' }, { label: '年终奖税', value: F(r.bonusTax) + ' 元' }, { label: '年到手', value: F((v.monthly - r.monthlyTax - v.si) * 12) + ' 元' }],
      preview: `<p class="t-hint">级距来自内置精简表（${L.esc(String(D.tax.length))} 档）。年终奖单独计税政策与专项附加扣除标准会调整，报税以税务机关口径为准。</p>` };
  } };

S['si-fund'] = { kind: 'form', titleIn: '缴费基数与比例', titleOut: '五险一金明细',
  fields: [
    { id: 'base', label: '缴费基数', type: 'number', default: 12000, unit: '元/月' },
    { id: 'pension', label: '养老 个人 / 单位', type: 'number', default: 8, unit: '% / 单位固定 16%' },
    { id: 'medical', label: '医疗 个人 / 单位', type: 'number', default: 2, unit: '% / 单位固定 8%' },
    { id: 'unemp', label: '失业 个人 / 单位', type: 'number', default: 0.5, unit: '% / 单位固定 0.5%' },
    { id: 'fund', label: '公积金 个人 / 单位', type: 'number', default: 12, unit: '%（单位同比例）' },
    { id: 'salary', label: '税前月薪', type: 'number', default: 20000, unit: '元' }],
  primary: '复制明细', hintOut: '单位部分一般不进工资条，但属于用人成本。各地比例与基数上下限不同，这里按可改的通用值算。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const p = v.pension, m = v.medical, u = v.unemp, g = v.fund;
    const items = [['养老', v.base * p / 100, v.base * 16 / 100], ['医疗', v.base * m / 100, v.base * 8 / 100], ['失业', v.base * u / 100, v.base * 0.5 / 100], ['工伤', 0, v.base * 0.4 / 100], ['生育', 0, v.base * 0.8 / 100], ['公积金', v.base * g / 100, v.base * g / 100]];
    const mine = items.reduce((a, x) => a + x[1], 0), comp = items.reduce((a, x) => a + x[2], 0);
    const tbl = `<table class="t-table"><thead><tr><th>险种</th><th>个人</th><th>单位</th></tr></thead><tbody>${items.map((x) => `<tr><td>${x[0]}</td><td>${F(x[1])}</td><td>${F(x[2])}</td></tr>`).join('')}<tr><td><b>合计</b></td><td><b>${F(mine)}</b></td><td><b>${F(comp)}</b></td></tr></tbody></table>`;
    const text = [`个人每月合计：${F(mine)} 元（占月薪 ${F(mine / Math.max(1, v.salary) * 100)}%）`, `单位每月合计：${F(comp)} 元`, `单位用人总成本：${F(v.salary + comp)} 元/月`, `个人年度合计：${F(mine * 12)} 元`, `单位年度合计：${F(comp * 12)} 元`, `缴费基数：${F(v.base)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '个人/月', value: F(mine) + ' 元' }, { label: '单位/月', value: F(comp) + ' 元' }, { label: '单位总成本', value: F(v.salary + comp) + ' 元' }], preview: '<p class="t-hint">分项明细（元）</p>' + tbl };
  } };

S['retire'] = { kind: 'form', titleIn: '个人信息', titleOut: '退休时间推算',
  fields: [
    { id: 'birth', label: '出生年月', type: 'text', default: '1985-06', placeholder: 'YYYY-MM' },
    { id: 'kind', label: '身份口径', type: 'select', options: ['男职工', '女职工（原 55 岁）', '女工人（原 50 岁）'] },
    { id: 'start', label: '参加工作年月', type: 'text', default: '2008-07', placeholder: 'YYYY-MM' },
    { id: 'paid', label: '已缴费年限', type: 'number', default: 17, unit: '年' }],
  primary: '复制推算', hintOut: '按 2024-09《关于实施渐进式延迟法定退休年龄的决定》口径做简化推算：男 60→63、女 55→58 每 4 个月延 1 个月，女 50→55 每 2 个月延 1 个月；最低缴费年限 2030 年起由 15 年逐步提到 20 年。实际以社保经办机构核定为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const m = String(v.birth || '').match(/(\d{4})-(\d{1,2})/);
    if (!m) return { error: '出生年月填成 YYYY-MM，比如 1985-06' };
    const by = Number(m[1]), bm = Number(m[2]);
    const male = v.kind === '男职工', w55 = v.kind.includes('55'), base = male ? 60 : w55 ? 55 : 50;
    const startY = male ? 1965 : w55 ? 1970 : 1975, step = (male || w55) ? 4 : 2, cap = male ? 36 : w55 ? 36 : 60;
    const elapsed = (by - startY) * 12 + (bm - 1);
    const delay = L.clamp(Math.ceil(Math.max(0, elapsed) / step), 0, cap);
    const age = base + delay / 12;
    const retireY = by + Math.floor(age), retireM = bm + Math.round((age - Math.floor(age)) * 12);
    const ry = retireY + (retireM > 12 ? 1 : 0), rm = retireM > 12 ? retireM - 12 : retireM;
    const minYears = ry < 2030 ? 15 : L.clamp(15 + (ry - 2029) * 0.5, 15, 20);
    const sm = String(v.start || '').match(/(\d{4})-(\d{1,2})/);
    const workedTotal = sm ? (ry - Number(sm[1])) + (rm - Number(sm[2])) / 12 : v.paid;
    const need = Math.max(0, minYears - workedTotal);
    const text = [`出生 ${by}-${L.pad(bm)}，身份：${L.esc(v.kind)}`, `原法定退休年龄 ${base} 岁，按新规延迟 ${delay} 个月`, `推算退休年龄：${F(age, 1)} 岁（约 ${ry}-${L.pad(rm)}）`, `届时最低缴费年限：${F(minYears, 1)} 年`, need > 0 ? `按当前参保节奏还差约 ${F(need, 1)} 年，需延长缴费或补缴` : '按当前节奏缴费年限已够', '弹性提前/延后最多 3 年，但不得低于原法定年龄，也不得低于当年最低缴费年限'].join('\n');
    return { text, copy: text, stats: [{ label: '退休年龄', value: F(age, 1) + ' 岁' }, { label: '延迟', value: delay + ' 个月' }, { label: '最低缴费', value: F(minYears, 1) + ' 年' }] };
  } };

S['severance-calc'] = { kind: 'form', titleIn: '劳动关系', titleOut: '补偿金测算',
  fields: [
    { id: 'start', label: '入职日期', type: 'text', default: '2015-03-01', placeholder: 'YYYY-MM-DD' },
    { id: 'end', label: '离职日期', type: 'text', default: '2026-06-30', placeholder: 'YYYY-MM-DD' },
    { id: 'wage', label: '离职前 12 个月平均月薪', type: 'number', default: 20000, unit: '元' },
    { id: 'avg', label: '当地上年度职工月平均工资', type: 'number', default: 12000, unit: '元' },
    { id: 'way', label: '解除情形', type: 'select', options: ['协商/无过失解除 N', '未提前 30 天通知 N+1', '违法解除赔偿 2N', '仅看三种对比'] }],
  primary: '复制测算', hintOut: 'N 按工作年限：每满 1 年给 1 个月工资，满 6 个月不满 1 年按 1 年，不满 6 个月按半个月。月工资高于当地社平 3 倍的按 3 倍封顶且年限最多 12 年。2008-01-01 前后分段是简化处理，个案以劳动法与当地口径为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const a = new Date(v.start), b = new Date(v.end);
    if (isNaN(a) || isNaN(b) || b <= a) return { error: '日期填成 YYYY-MM-DD，且离职要晚于入职' };
    const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() >= a.getDate() ? 0 : -1);
    const yearsRaw = months / 12;
    let N = Math.floor(yearsRaw); const rem = yearsRaw - N;
    if (rem >= 0.5) N += 1; else if (rem > 0) N += 0.5;
    const cap = v.avg * 3, over = v.wage > cap;
    const base = over ? cap : v.wage, years = over ? Math.min(N, 12) : N;
    const n = base * years;
    const text = [`工作年限：${F(yearsRaw, 2)} 年 → 计 ${F(N, 1)} 个月工资`, over ? `月薪 ${F(v.wage)} 元超过社平 3 倍（${F(cap)} 元），按 ${F(cap)} 元封顶，年限封顶 12 年 → 实际 ${F(years, 1)} 个月` : `未触及社平 3 倍封顶`, `N（经济补偿）：${F(n)} 元`, `N+1（代通知金）：${F(n + v.wage)} 元`, `2N（违法解除赔偿）：${F(n * 2)} 元`, `2008 年前后分段：本工具按统一年限简化，涉及 2008 年前工龄的旧规封顶请咨询当地仲裁口径`].join('\n');
    const chosen = v.way.includes('2N') ? n * 2 : v.way.includes('N+1') ? n + v.wage : n;
    return { text, copy: text, stats: [{ label: 'N', value: F(n) + ' 元' }, { label: 'N+1', value: F(n + v.wage) + ' 元' }, { label: '2N', value: F(n * 2) + ' 元' }],
      preview: `<p class="t-hint">当前选「${L.esc(v.way)}」，对应 ${F(chosen)} 元。</p>` };
  } };

/* 升级：原先是 2024 年写死的 10 个汇率，页面还自称「离线参考值」。现在经同源 /api/fx
   取公开牌价（约 160 个币种），服务端缓存 6 小时并每天存一次快照，走势图画的是真实累积数据。
   compute 是 async：工具运行时的 run() 本来就 await 它。缓存挂在 window 上，两个汇率工具共用一份请求。 */
S['currency'] = { kind: 'form', titleIn: '金额与币种', titleOut: '换算结果',
  fields: [
    { id: 'amount', label: '金额', type: 'number', default: 100 },
    { id: 'from', label: '从', type: 'select', options: ['CNY 人民币', 'USD 美元', 'EUR 欧元', 'JPY 日元', 'HKD 港币', 'GBP 英镑', 'KRW 韩元', 'THB 泰铢', 'SGD 新元', 'AUD 澳元', 'CAD 加元', 'CHF 瑞士法郎', 'TWD 新台币', 'MYR 林吉特', 'VND 越南盾', 'INR 印度卢比', 'RUB 俄罗斯卢布', 'AED 迪拉姆', 'KWD 第纳尔', 'BRL 雷亚尔'] },
    { id: 'to', label: '到', type: 'select', options: ['CNY 人民币', 'USD 美元', 'EUR 欧元', 'JPY 日元', 'HKD 港币', 'GBP 英镑', 'KRW 韩元', 'THB 泰铢', 'SGD 新元', 'AUD 澳元', 'CAD 加元', 'CHF 瑞士法郎', 'TWD 新台币', 'MYR 林吉特', 'VND 越南盾', 'INR 印度卢比', 'RUB 俄罗斯卢布', 'AED 迪拉姆', 'KWD 第纳尔', 'BRL 雷亚尔'] }],
  primary: '复制换算', hintOut: '实时汇率经本站同源接口取回，服务端缓存 6 小时；上游数据为中间价，实际以银行 / 换汇平台牌价为准。上游不可用时会明确提示，不会拿旧数据冒充实时。',
  compute: async (v) => {
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
        '<svg viewBox="0 0 420 76" width="100%" height="76" role="img" aria-label="美元兑人民币走势"><polyline points="' + line + '" fill="none" stroke="#2f5bd7" stroke-width="2" stroke-linejoin="round"/><circle cx="' + xy[xy.length - 1][0].toFixed(1) + '" cy="' + xy[xy.length - 1][1].toFixed(1) + '" r="3" fill="#2f5bd7"/></svg>';
    }
    return { text, copy: text, stats: [{ label: '换算结果', value: F(out) + ' ' + t }, { label: '折人民币', value: F(cny, 2) + ' 元' }, { label: '牌价时间', value: when.slice(5, 16) }],
      preview: '<p class="t-hint">1 单位该币种 ≈ 人民币；第三列是把当前金额换成该币种</p>' +
        '<table class="t-table"><thead><tr><th>币种</th><th>≈ CNY</th><th>可换</th></tr></thead><tbody>' + rows + '</tbody></table>' + spark };
  } };

S['currency-rank'] = { kind: 'form', titleIn: '查看方式', titleOut: '货币价值排行',
  fields: [{ id: 'way', label: '榜单', type: 'select', options: ['最值钱（1 单位折人民币最高）', '最不值钱（最低）', '全部对照（前 60）'] }],
  primary: '复制整表', hintOut: '按「1 单位本币折多少人民币」用实时牌价排序，共约 160 个币种。币值高低不等于国力强弱；上游不可用时页面会明确标注，不拿旧数据冒充实时。',
  compute: async (v) => {
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
  } };

S['asset-heatmap'] = { kind: 'form', titleIn: '持仓明细', titleOut: '资产结构', wide: true,
  fields: [
    { id: 'rows', label: '每行：名称,金额,类别', type: 'textarea', rows: 8, default: '招商银行活期,120000,现金\n沪深300ETF,350000,权益\n国债,200000,固收\n自住房,2000000,房产\n黄金ETF,80000,商品' },
    { id: 'unit', label: '金额单位', type: 'select', options: ['元', '万元'] }],
  primary: '复制汇总', hintOut: '按金额占比画方块（treemap 近似），并给分类汇总。纯本地解析，不上传任何持仓信息。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const k = v.unit === '万元' ? 10000 : 1;
    const items = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', amt: Number(p[1]) * k || 0, cat: p[2] || '未分类' }; }).filter((x) => x.amt > 0);
    if (!items.length) return { error: '至少填一行，格式：名称,金额,类别' };
    const total = items.reduce((a, x) => a + x.amt, 0);
    const byCat = {}; items.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amt; });
    const colors = ['#b4552d', '#c98a4b', '#7d9a76', '#6b8fa8', '#9b7aa0', '#c0a062', '#8c8c8c', '#a35d5d'];
    const cats = Object.keys(byCat);
    const blocks = items.slice().sort((a, b) => b.amt - a.amt).map((x, i) => `<div style="flex:${Math.max(0.6, x.amt / total * 100)};min-width:74px;background:${colors[cats.indexOf(x.cat) % colors.length]};color:#fff;border-radius:8px;padding:12px;margin:3px;overflow:hidden"><div style="font-size:12px;opacity:.9">${L.esc(x.name)}</div><div style="font-weight:700;margin-top:4px">${F(x.amt / total * 100, 1)}%</div><div style="font-size:11px;opacity:.85">${L.esc(x.cat)} · ${F(x.amt)}</div></div>`).join('');
    const text = [`总资产：${F(total)} 元（${items.length} 项）`, ...Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, a]) => `${c}：${F(a)} 元（${F(a / total * 100, 1)}%）`), `最大单项：${items.slice().sort((a, b) => b.amt - a.amt)[0].name}（${F(Math.max(...items.map((x) => x.amt)) / total * 100, 1)}%）`].join('\n');
    return { text, copy: text, stats: [{ label: '总资产', value: F(total) + ' 元' }, { label: '类别数', value: cats.length + ' 类' }], preview: `<div style="display:flex;flex-wrap:wrap">${blocks}</div>` };
  } };

S['asset-liability'] = { kind: 'form', titleIn: '家庭账本', titleOut: '现金流体检', wide: true,
  fields: [
    { id: 'rows', label: '每行：项目,金额,类型,月现金流', type: 'textarea', rows: 8, default: '自住房,2000000,资产,0\n出租房,1200000,资产,3500\n指数基金,300000,资产,0\n房贷,900000,负债,-4300\n车贷,80000,负债,-2000\n银行存款,200000,资产,300' },
    { id: 'expense', label: '每月生活支出', type: 'number', default: 8000, unit: '元' }],
  primary: '复制体检结果', hintOut: '借用「现金流象限」口径：能往口袋里放钱的算资产，往外掏钱的算负债。自住房不产生租金就归在「不生息资产」里单列。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const items = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', amt: Number(p[1]) || 0, type: p[2] || '资产', cf: Number(p[3]) || 0 }; });
    if (!items.length) return { error: '至少填一行：项目,金额,类型,月现金流' };
    const assets = items.filter((x) => x.type.includes('资产')), debts = items.filter((x) => x.type.includes('负债'));
    const A = assets.reduce((a, x) => a + x.amt, 0), D = debts.reduce((a, x) => a + Math.abs(x.amt), 0);
    const passive = items.reduce((a, x) => a + (x.cf > 0 ? x.cf : 0), 0), outflow = items.reduce((a, x) => a + (x.cf < 0 ? -x.cf : 0), 0);
    const netCF = passive - outflow, cover = (outflow + v.expense) > 0 ? passive / (outflow + v.expense) * 100 : 0;
    const idle = assets.filter((x) => x.cf <= 0).reduce((a, x) => a + x.amt, 0);
    const text = [`总资产 ${F(A)} 元，总负债 ${F(D)} 元，净资产 ${F(A - D)} 元`, `负债率：${F(D / Math.max(1, A) * 100, 1)}%`, `每月被动收入 ${F(passive)} 元，每月刚性流出 ${F(outflow + v.expense)} 元`, `月净现金流：${F(netCF)} 元`, `被动收入覆盖率：${F(cover, 1)}%${cover >= 100 ? '（已覆盖，财务自由口径达成）' : ''}`, `不生息资产（自住/闲置）${F(idle)} 元，占总资产 ${F(idle / Math.max(1, A) * 100, 1)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '净资产', value: F(A - D) + ' 元' }, { label: '月净现金流', value: F(netCF) + ' 元' }, { label: '覆盖率', value: F(cover, 1) + '%' }],
      preview: `<p class="t-hint">${L.esc('分类：')}${assets.map((x) => L.esc(x.name) + (x.cf > 0 ? '（生息）' : '（不生息）')).join('、')}</p>` };
  } };

S['purchasing-power-ancient'] = { kind: 'form', titleIn: '朝代与银两', titleOut: '折合成今天',
  fields: [
    { id: 'dyn', label: '朝代', type: 'select', options: ['汉', '唐', '宋', '明', '清（康乾）', '清末'] },
    { id: 'silver', label: '银两', type: 'number', default: 1, unit: '两' }],
  primary: '复制折算', hintOut: '用米价做锚：内置各朝「一两银子能买多少石米」的精简学术口径，再按今日米价折人民币。不同学者差好几倍，这里只给体感量级，不是严谨考据结论。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const T = { '汉': 2.5, '唐': 6, '宋': 3, '明': 4, '清（康乾）': 2, '清末': 1.2 };
    const shi = T[v.dyn] || 2, jin = shi * 0.0005;
    const kg = shi * 60, rmb = kg * 5.5, days = rmb / 200, goldCNY = jin * 1000 * 550;
    const text = [`${L.esc(v.dyn)} · ${F(v.silver, 2)} 两银子`, `可买米约 ${F(shi * v.silver, 1)} 石（${F(kg * v.silver, 0)} 公斤）`, `按今日米价约折人民币 ${F(rmb * v.silver, 0)} 元`, `约合工匠 ${F(days * v.silver, 1)} 天工钱`, `按银价本身只值 ${F(v.silver * 37.3 * 8, 0)} 元（1 两≈37.3 克，银料价约 8 元/克）`, '「一两银子值多少钱」没有标准答案：按米价、按工资、按银料会差出十倍'].join('\n');
    const rows = Object.entries(T).map(([d, s]) => `<tr><td>${L.esc(d)}</td><td>${F(s, 1)} 石</td><td>${F(s * 60 * 5.5, 0)} 元</td></tr>`).join('');
    return { text, copy: text, stats: [{ label: '折米', value: F(shi * v.silver, 1) + ' 石' }, { label: '折人民币', value: F(rmb * v.silver, 0) + ' 元' }, { label: '工匠工钱', value: F(days * v.silver, 1) + ' 天' }],
      preview: `<p class="t-hint">各朝 1 两银子的米价口径（离线精简）</p><table class="t-table"><thead><tr><th>朝</th><th>可买米</th><th>折今</th></tr></thead><tbody>${rows}</tbody></table>` };
  } };

S['job-worth'] = { kind: 'form', titleIn: '工作投入', titleOut: '真实时薪',
  fields: [
    { id: 'salary', label: '税后月薪', type: 'number', default: 15000, unit: '元' },
    { id: 'days', label: '每月工作日', type: 'number', default: 21.75, unit: '天' },
    { id: 'work', label: '每天在岗', type: 'number', default: 8, unit: '小时' },
    { id: 'commute', label: '每天通勤往返', type: 'number', default: 1.5, unit: '小时' },
    { id: 'ot', label: '每天无偿加班', type: 'number', default: 1, unit: '小时' },
    { id: 'extra', label: '每月通勤/置装等支出', type: 'number', default: 600, unit: '元' }],
  primary: '复制时薪', hintOut: '把通勤、加班和为了上班多花的钱全算进去，得到「这份工作真正值多少钱一小时」。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const nominal = v.salary / (v.days * v.work), hours = v.days * (v.work + v.commute + v.ot);
    const real = (v.salary - v.extra) / Math.max(1, hours);
    const loss = v.salary - real * v.work * v.days;
    const text = [`名义时薪（只算在岗）：${F(nominal)} 元/小时`, `每月总投入：${F(hours, 1)} 小时（含通勤 ${F(v.commute * v.days, 1)}h、加班 ${F(v.ot * v.days, 1)}h）`, `真实时薪：${F(real)} 元/小时`, `通勤 + 加班 + 额外支出，每月折损约 ${F(loss)} 元`, `折损相当于月薪的 ${F(loss / Math.max(1, v.salary) * 100, 1)}%`, `每秒约 ${F(real / 3600, 4)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '名义时薪', value: F(nominal) + ' 元' }, { label: '真实时薪', value: F(real) + ' 元' }, { label: '月折损', value: F(loss) + ' 元' }],
      preview: `<p class="t-hint">真实时薪比名义时薪低 ${F((1 - real / Math.max(0.01, nominal)) * 100, 1)}%。涨薪 20% 与通勤少 1 小时，哪个更划算可以自己改数字比。</p>` };
  } };

S['discount'] = { kind: 'form', titleIn: '购物车与规则', titleOut: '凑单建议',
  fields: [
    { id: 'cur', label: '当前商品金额', type: 'number', default: 268, unit: '元' },
    { id: 'rules', label: '阶梯满减（每行 门槛-减）', type: 'textarea', rows: 4, default: '200-30\n300-50\n500-100' },
    { id: 'every', label: '每满减（0 表示没有）', type: 'number', default: 0, unit: '元，如 每满 200 减 30 填 200' },
    { id: 'everyCut', label: '每满减多少', type: 'number', default: 30, unit: '元' }],
  primary: '复制凑单方案', hintOut: '阶梯满减与「每满减」通常二选一，这里按你填的规则分别算，并给出凑到下一档是否划算。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const rules = L.nonEmptyLines(v.rules).map((l) => l.split(/[-\-—]/).map((x) => Number(String(x).trim()))).filter((x) => x.length >= 2 && isFinite(x[0]) && isFinite(x[1])).sort((a, b) => a[0] - b[0]);
    const best = rules.filter((r) => v.cur >= r[0]).pop() || [0, 0];
    const ev = v.every > 0 ? Math.floor(v.cur / v.every) * v.everyCut : 0;
    const useEvery = ev > best[1];
    const cut = useEvery ? ev : best[1];
    const text0 = [`当前 ${F(v.cur)} 元`, `阶梯满减命中：满 ${F(best[0])} 减 ${F(best[1])}`, v.every > 0 ? `每满 ${F(v.every)} 减 ${F(v.everyCut)}：可减 ${F(ev)}` : '', `采用：${useEvery ? '每满减' : '阶梯满减'}，共减 ${F(cut)} 元`, `实付 ${F(v.cur - cut)} 元，等效 ${F((v.cur - cut) / Math.max(1, v.cur) * 10, 2)} 折`].filter(Boolean).join('\n');
    const next = rules.find((r) => r[0] > v.cur);
    let advice = '已经是最高档了';
    if (next) { const add = next[0] - v.cur, gain = next[1] - cut; advice = `再凑 ${F(add)} 元到 ${F(next[0])} 档，多减 ${F(gain)} 元 → ${gain > add ? '不划算（多花比多减多）' : gain === add ? '刚好持平' : '划算'}`; }
    const text = text0 + '\n' + advice;
    return { text, copy: text, stats: [{ label: '已减', value: F(cut) + ' 元' }, { label: '实付', value: F(v.cur - cut) + ' 元' }, { label: '等效', value: F((v.cur - cut) / Math.max(1, v.cur) * 10, 2) + ' 折' }],
      preview: `<p class="t-hint">${L.esc(advice)}。别为了凑单买用不上的东西。</p>` };
  } };

S['aa-split'] = { kind: 'form', titleIn: '账单与参与人', titleOut: '结算清单', wide: true,
  fields: [
    { id: 'rows', label: '每行：姓名,垫付金额', type: 'textarea', rows: 7, default: '小明,480\n小红,120\n小刚,0\n小丽,0' },
    { id: 'people', label: '参与人均摊（留空=全部人）', type: 'text', default: '', placeholder: '逗号分隔，如 小明,小红,小刚,小丽' }],
  primary: '复制结算清单', hintOut: '按参与人数均摊总账，算出谁该收、谁该付，再用贪心合并出尽量少的转账笔数。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d), E = L.esc;
    const rows = L.nonEmptyLines(v.rows).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0], paid: Number(p[1]) || 0 }; });
    if (!rows.length) return { error: '至少填一行：姓名,垫付金额' };
    const names = String(v.people || '').trim() ? String(v.people).split(/[,，\s]+/).filter(Boolean) : rows.map((x) => x.name);
    const total = rows.reduce((a, x) => a + x.paid, 0), share = total / Math.max(1, names.length);
    const bal = {}; names.forEach((n) => { bal[n] = -share; }); rows.forEach((x) => { bal[x.name] = (bal[x.name] || 0) + x.paid; });
    const creditors = Object.entries(bal).filter(([, b]) => b > 0.005).map(([n, b]) => ({ n, b })).sort((a, b) => b.b - a.b);
    const debtors = Object.entries(bal).filter(([, b]) => b < -0.005).map(([n, b]) => ({ n, b: -b })).sort((a, b) => b.b - a.b);
    const transfers = []; let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) { const x = Math.min(debtors[i].b, creditors[j].b); transfers.push(`${L.esc(debtors[i].n)} → ${L.esc(creditors[j].n)}　${F(x)} 元`); debtors[i].b -= x; creditors[j].b -= x; if (debtors[i].b < 0.005) i++; if (creditors[j].b < 0.005) j++; }
    const text = [`总账 ${F(total)} 元，${names.length} 人均摊，每人 ${F(share)} 元`, ...Object.entries(bal).map(([n, b]) => `${L.esc(n)}：垫付 ${F(rows.find((x) => x.name === n)?.paid || 0)}，应担 ${F(share)}，${b >= 0 ? '应收回' : '应付出'} ${F(Math.abs(b))}`), '', '最少转账：', ...(transfers.length ? transfers : ['（已平，不用转）'])].join('\n');
    return { text, copy: text, stats: [{ label: '总账', value: F(total) + ' 元' }, { label: '人均', value: F(share) + ' 元' }, { label: '转账笔数', value: transfers.length + ' 笔' }],
      preview: `<p class="t-hint">${L.esc('金额大写：')}${L.numCN(total)}</p>` };
  } };

S['ipo-quota'] = { kind: 'form', titleIn: '持仓市值', titleOut: '可申购额度',
  fields: [
    { id: 'sh', label: '沪市日均市值', type: 'number', default: 50000, unit: '元' },
    { id: 'sz', label: '深市日均市值', type: 'number', default: 30000, unit: '元' },
    { id: 'board', label: '板块', type: 'select', options: ['沪市主板', '科创板', '深市主板/创业板', '北交所'] },
    { id: 'price', label: '发行价', type: 'number', default: 15, unit: '元/股' }],
  primary: '复制额度', hintOut: '离线精简规则：沪市 1 万元市值 = 1000 股，深市 1 万元 = 1000 股（500 股起），科创板 1 万元 = 1000 股，北交所按比例配售不占市值。市值按 T-2 日前 20 个交易日日均算，实际以券商 App 显示为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let mkt = v.sh, unit = 10000, per = 1000, min = 1000, name = '沪市主板';
    if (v.board === '科创板') { mkt = v.sh; per = 1000; min = 500; name = '科创板'; }
    else if (v.board.startsWith('深市')) { mkt = v.sz; per = 1000; min = 500; name = '深市主板/创业板'; }
    else if (v.board === '北交所') { mkt = 0; name = '北交所（现金申购、比例配售，不占市值）'; }
    const quota = mkt > 0 ? Math.floor(mkt / unit) * per : 0;
    const nums = quota > 0 ? Math.floor(quota / 500) : 0;
    const text = [`${L.esc(name)}，按 ${F(mkt)} 元市值`, mkt === 0 ? '北交所为全额缴款、比例配售，没有市值额度' : `可申购额度：${F(quota, 0)} 股`, `配号数：约 ${nums} 个（沪市 1000 股/号，深市 500 股/号）`, `顶格申购需缴款：${F(quota * v.price)} 元`, `顶格所需市值：${mkt > 0 ? F(Math.ceil(10000 / per * unit), 0) : '—'}`].join('\n');
    return { text, copy: text, stats: [{ label: '可申购', value: (mkt > 0 ? F(quota, 0) : '—') + ' 股' }, { label: '顶格缴款', value: F(quota * v.price) + ' 元' }, { label: '配号', value: nums + ' 个' }],
      preview: `<p class="t-hint">市值是「日均」不是「某一天」，且沪深不互通。规则会调整，申购前以券商与交易所公告为准。</p>` };
  } };

S['ipo-win-check'] = { kind: 'form', titleIn: '中签号与配号', titleOut: '中签结果',
  fields: [
    { id: 'win', label: '公布的中签号（逗号/换行分隔）', type: 'textarea', rows: 5, default: '1234567, 2345678, 3456789' },
    { id: 'start', label: '你的配号起始', type: 'text', default: '1234560' },
    { id: 'count', label: '你的配号数量', type: 'number', default: 20, unit: '个' },
    { id: 'shares', label: '每签股数', type: 'number', default: 500, unit: '股' },
    { id: 'price', label: '发行价', type: 'number', default: 15, unit: '元' }],
  primary: '复制中签结果', hintOut: '逐个配号与中签号按「末 N 位」比对（N 取最短中签号长度）。中签号末几位相同即算中签，不用手动数。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const wins = String(v.win || '').split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
    if (!wins.length) return { error: '先粘公布的中签号' };
    const len = Math.min(...wins.map((x) => x.length));
    const tail = (x) => String(x).slice(-len);
    const winSet = new Set(wins.map(tail));
    const s = BigInt(String(v.start).trim() || '0'), n = Math.max(0, Math.min(100000, Math.round(v.count)));
    const hit = [];
    for (let i = 0; i < n; i++) { const num = (s + BigInt(i)).toString(); if (winSet.has(tail(num))) hit.push(num); }
    const text = [`中签号 ${wins.length} 个，按末 ${len} 位比对`, `你的配号：${s.toString()} ~ ${(s + BigInt(Math.max(0, n - 1))).toString()}（共 ${n} 个）`, hit.length ? `中签 ${hit.length} 签：${hit.join('、')}` : '未中签', `中签股数：${F(hit.length * v.shares, 0)} 股`, `需缴款：${F(hit.length * v.shares * v.price)} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '中签', value: hit.length + ' 签' }, { label: '股数', value: F(hit.length * v.shares, 0) + ' 股' }, { label: '缴款', value: F(hit.length * v.shares * v.price) + ' 元' }],
      preview: `<p class="t-hint">配号是连续整数序列；可转债每签 10 张（1000 元），把「每签股数」改成 10、发行价改成 100 即可复用。</p>` };
  } };

S['avg-down'] = { kind: 'form', titleIn: '持仓与补仓', titleOut: '摊薄测算',
  fields: [
    { id: 'shares', label: '已持股数', type: 'number', default: 1000, unit: '股' },
    { id: 'cost', label: '成本价', type: 'number', default: 20, unit: '元' },
    { id: 'now', label: '当前价', type: 'number', default: 14, unit: '元' },
    { id: 'addPrice', label: '补仓价', type: 'number', default: 12, unit: '元' },
    { id: 'addShares', label: '补仓股数', type: 'number', default: 1000, unit: '股' },
    { id: 'target', label: '想摊到的目标价', type: 'number', default: 16, unit: '元（用于反推）' }],
  primary: '复制测算', hintOut: '补仓摊薄成本，但不改变浮亏的事实。反推只是数学结果，不构成任何投资建议。',
  compute: (v) => {
    const F = (n, d = 3) => L.fmt(L.round(n, d), d);
    const oldCost = v.shares * v.cost, addCost = v.addShares * v.addPrice;
    const total = v.shares + v.addShares, avg = total > 0 ? (oldCost + addCost) / total : 0;
    const before = v.cost, float = (v.now - avg) * total, rise = avg > 0 ? (avg / v.now - 1) * 100 : 0;
    const need = v.addPrice < v.target && v.target < v.cost ? Math.ceil((v.shares * (v.cost - v.target)) / (v.target - v.addPrice)) : null;
    const text = [`补仓前：${F(v.shares, 0)} 股 @ ${F(v.cost)}，成本 ${F(oldCost)} 元`, `补仓：${F(v.addShares, 0)} 股 @ ${F(v.addPrice)}，投入 ${F(addCost)} 元`, `补仓后：${F(total, 0)} 股，摊薄均价 ${F(avg)} 元（原 ${F(before)} 元）`, `按现价 ${F(v.now)} 元，浮动盈亏 ${F(float)} 元`, `从现价回到均价还需涨 ${F(rise, 2)}%`, need === null ? `目标价 ${F(v.target)} 需在 ${F(v.addPrice)}~${F(v.cost)} 之间才能反推` : `想摊到 ${F(v.target)} 元，需再补约 ${F(need, 0)} 股（约 ${F(need * v.addPrice)} 元）`].join('\n');
    return { text, copy: text, stats: [{ label: '摊薄均价', value: F(avg) + ' 元' }, { label: '回本涨幅', value: F(rise, 2) + '%' }, { label: '浮动盈亏', value: F(float) + ' 元' }],
      preview: `<p class="t-hint">摊薄会把浮亏从 ${F((v.now - v.cost) * v.shares)} 元摊到 ${F(float)} 元，只是分母变大，不是亏损变少。</p>` };
  } };

S['margin-calc'] = { kind: 'form', titleIn: '任填两个', titleOut: '四向互算',
  fields: [
    { id: 'cost', label: '成本（0 表示不填）', type: 'number', default: 60, unit: '元' },
    { id: 'price', label: '售价（0 表示不填）', type: 'number', default: 100, unit: '元' },
    { id: 'margin', label: '毛利率（0 表示不填）', type: 'number', default: 0, unit: '%' },
    { id: 'markup', label: '加价率（0 表示不填）', type: 'number', default: 0, unit: '%' },
    { id: 'fee', label: '平台扣点', type: 'number', default: 0, unit: '%' }],
  primary: '复制结果', hintOut: '毛利率 = 毛利 ÷ 售价；加价率 = 毛利 ÷ 成本。两者容易混：成本 60 卖 100，毛利率 40%，加价率却是 66.7%。任填两个，其余自动推。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let c = v.cost, p = v.price, m = v.margin / 100, k = v.markup / 100;
    if (c > 0 && p > 0) { m = (p - c) / p; k = (p - c) / c; }
    else if (c > 0 && m > 0) { p = c / (1 - m); k = m / (1 - m); }
    else if (c > 0 && k > 0) { p = c * (1 + k); m = (p - c) / p; }
    else if (p > 0 && m > 0) { c = p * (1 - m); k = (p - c) / c; }
    else if (p > 0 && k > 0) { c = p / (1 + k); m = (p - c) / p; }
    else return { error: '至少填「成本 + 售价」或「任一项 + 毛利率/加价率」中的两个' };
    if (!isFinite(p) || !isFinite(c)) return { error: '填的数值推不出结果（毛利率不能 ≥100%）' };
    const gross = p - c, after = p * (1 - v.fee / 100) - c;
    const text = [`成本 ${F(c)} 元，售价 ${F(p)} 元`, `毛利 ${F(gross)} 元`, `毛利率 ${F(m * 100)}%，加价率 ${F(k * 100)}%`, v.fee > 0 ? `扣 ${v.fee}% 平台点后实收 ${F(p * (1 - v.fee / 100))} 元，实际毛利 ${F(after)} 元（${F(after / p * 100)}%）` : '未计平台扣点', `保本售价（含扣点）：${F(c / (1 - v.fee / 100))} 元`].join('\n');
    return { text, copy: text, stats: [{ label: '毛利率', value: F(m * 100) + '%' }, { label: '加价率', value: F(k * 100) + '%' }, { label: '实际毛利', value: F(after) + ' 元' }] };
  } };

S['final-price'] = { kind: 'form', titleIn: '价格与优惠', titleOut: '到手价明细',
  fields: [
    { id: 'price', label: '原价', type: 'number', default: 399, unit: '元' },
    { id: 'discount', label: '折扣', type: 'number', default: 8.5, unit: '折（10 = 不打折）' },
    { id: 'full', label: '满减（门槛-减，多行）', type: 'textarea', rows: 3, default: '300-40' },
    { id: 'coupon', label: '优惠券面额', type: 'number', default: 20, unit: '元' },
    { id: 'red', label: '红包', type: 'number', default: 8, unit: '元' }],
  primary: '复制明细', hintOut: '按「先打折 → 再满减 → 再券 → 再红包」的常见顺序逐步算。平台实际叠加顺序可能不同，以结算页为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const steps = []; let x = v.price;
    const afterDisc = x * v.discount / 10; steps.push(['打折', `${v.discount} 折`, -L.round(x - afterDisc)]); x = afterDisc;
    const rules = L.nonEmptyLines(v.full).map((l) => l.split(/[-\-—]/).map((y) => Number(String(y).trim()))).filter((y) => isFinite(y[0]) && isFinite(y[1])).sort((a, b) => b[0] - a[0]);
    const hit = rules.find((r) => x >= r[0]);
    if (hit) { steps.push([`满 ${F(hit[0])} 减 ${F(hit[1])}`, '', -hit[1]]); x -= hit[1]; }
    const c = Math.min(v.coupon, x); if (c > 0) { steps.push(['优惠券', '', -c]); x -= c; }
    const r = Math.min(v.red, x); if (r > 0) { steps.push(['红包', '', -r]); x -= r; }
    x = Math.max(0, x);
    const saved = v.price - x;
    const text = [`原价 ${F(v.price)} 元`, ...steps.map((s) => `${s[0]} ${s[1]}：${s[2] > 0 ? '+' : ''}${F(s[2])} 元`), `到手价：${F(x)} 元`, `共优惠 ${F(saved)} 元，等效 ${F(x / Math.max(1, v.price) * 10, 2)} 折`].join('\n');
    const tbl = `<table class="t-table"><thead><tr><th>步骤</th><th>变动</th><th>累计</th></tr></thead><tbody>${steps.map((s, i) => `<tr><td>${L.esc(s[0] + ' ' + s[1])}</td><td>${F(s[2])}</td><td>${F(v.price + steps.slice(0, i + 1).reduce((a, z) => a + z[2], 0))}</td></tr>`).join('')}</tbody></table>`;
    return { text, copy: text, stats: [{ label: '到手价', value: F(x) + ' 元' }, { label: '共省', value: F(saved) + ' 元' }, { label: '等效', value: F(x / Math.max(1, v.price) * 10, 2) + ' 折' }], preview: '<p class="t-hint">分步明细（元）</p>' + tbl };
  } };

S['roi-calc'] = { kind: 'form', titleIn: '投放数据', titleOut: '回报测算',
  fields: [
    { id: 'cost', label: '广告花费', type: 'number', default: 10000, unit: '元' },
    { id: 'revenue', label: '带来的收入', type: 'number', default: 30000, unit: '元' },
    { id: 'margin', label: '毛利率', type: 'number', default: 50, unit: '%' },
    { id: 'impr', label: '曝光量', type: 'number', default: 200000, unit: '次' },
    { id: 'clicks', label: '点击量', type: 'number', default: 4000, unit: '次' },
    { id: 'orders', label: '订单数', type: 'number', default: 120, unit: '单' }],
  primary: '复制测算', hintOut: 'ROAS = 收入 ÷ 花费；净 ROI = (毛利 − 花费) ÷ 花费。保本 ROAS = 1 ÷ 毛利率，低于它就是在亏钱。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const roas = v.revenue / Math.max(1, v.cost), gross = v.revenue * v.margin / 100;
    const roi = (gross - v.cost) / Math.max(1, v.cost) * 100, be = v.margin > 0 ? 100 / v.margin : 0;
    const cpm = v.impr > 0 ? v.cost / v.impr * 1000 : 0, cpc = v.clicks > 0 ? v.cost / v.clicks : 0, cpa = v.orders > 0 ? v.cost / v.orders : 0;
    const aov = v.orders > 0 ? v.revenue / v.orders : 0;
    const text = [`ROAS：${F(roas)}（收入 ${F(v.revenue)} ÷ 花费 ${F(v.cost)}）`, `毛利：${F(gross)} 元`, `净 ROI：${F(roi)}%`, `保本 ROAS：${F(be)}，当前 ${roas >= be ? '高于' : '低于'}保本线`, `CPM ${F(cpm)} 元 / CPC ${F(cpc)} 元 / CPA ${F(cpa)} 元`, `客单价 ${F(aov)} 元，转化率 ${F(v.clicks > 0 ? v.orders / v.clicks * 100 : 0)}%`].join('\n');
    return { text, copy: text, stats: [{ label: 'ROAS', value: F(roas) }, { label: '净 ROI', value: F(roi) + '%' }, { label: '保本 ROAS', value: F(be) }],
      preview: `<p class="t-hint">漏斗：曝光 ${F(v.impr, 0)} → 点击 ${F(v.clicks, 0)}（CTR ${F(v.impr > 0 ? v.clicks / v.impr * 100 : 0)}%）→ 成交 ${F(v.orders, 0)}（CVR ${F(v.clicks > 0 ? v.orders / v.clicks * 100 : 0)}%）</p>` };
  } };

S['shop-payback'] = { kind: 'form', titleIn: '开店参数', titleOut: '回本测算',
  fields: [
    { id: 'once', label: '一次性投入（装修/设备/押金）', type: 'number', default: 200000, unit: '元' },
    { id: 'fixed', label: '月固定成本（房租/人工）', type: 'number', default: 30000, unit: '元' },
    { id: 'aov', label: '客单价', type: 'number', default: 35, unit: '元' },
    { id: 'orders', label: '日均单量', type: 'number', default: 120, unit: '单' },
    { id: 'var', label: '变动成本率', type: 'number', default: 40, unit: '%' },
    { id: 'days', label: '月营业天数', type: 'number', default: 30, unit: '天' }],
  primary: '复制测算', hintOut: '月净利 = 客单价×日单量×天数×(1−变动成本率) − 月固定成本。回本月数 = 一次性投入 ÷ 月净利。未计淡旺季与爬坡期。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const rev = v.aov * v.orders * v.days, gross = rev * (1 - v.var / 100), net = gross - v.fixed;
    const back = net > 0 ? v.once / net : null;
    const rows = []; let cum = -v.once;
    for (let m = 1; m <= 36; m++) { cum += net; rows.push({ m, cum }); }
    const tbl = `<table class="t-table"><thead><tr><th>月</th><th>累计现金流</th></tr></thead><tbody>${rows.filter((x) => x.m % 3 === 0 || x.m === 1 || (back !== null && Math.abs(x.m - back) < 1)).map((x) => `<tr><td>${x.m}</td><td style="color:${x.cum >= 0 ? '#7d9a76' : '#a35d5d'}">${F(x.cum)}</td></tr>`).join('')}</tbody></table>`;
    const sens = [0.7, 1, 1.3].map((k) => { const n2 = rev * k * (1 - v.var / 100) - v.fixed; return `${F(k * 100, 0)}% 单量：月净利 ${F(n2)}，${n2 > 0 ? '回本 ' + F(v.once / n2, 1) + ' 个月' : '不回本'}`; });
    const text = [`月营收 ${F(rev)} 元，毛利 ${F(gross)} 元`, `月净利：${F(net)} 元`, net <= 0 ? '当前参数下每月亏损，先降固定成本或提单量' : `回本：约 ${F(back, 1)} 个月`, '敏感度：', ...sens].join('\n');
    return { text, copy: text, stats: [{ label: '月净利', value: F(net) + ' 元' }, { label: '回本', value: back === null ? '不回本' : F(back, 1) + ' 个月' }, { label: '36 月累计', value: F(cum) + ' 元' }], preview: '<p class="t-hint">累计现金流（元，每 3 个月一行）</p>' + tbl };
  } };

S['surtax'] = { kind: 'form', titleIn: '增值税与地区', titleOut: '附加税费',
  fields: [
    { id: 'vat', label: '本期实缴增值税', type: 'number', default: 10000, unit: '元' },
    { id: 'city', label: '城建税率', type: 'select', options: ['市区 7%', '县城/镇 5%', '其他 1%'] },
    { id: 'small', label: '小微企业六税两费减半', type: 'checkbox', default: false },
    { id: 'include', label: '价税分离反推（填含税销售额）', type: 'number', default: 0, unit: '元，0 = 不反推' }],
  primary: '复制明细', hintOut: '城建税 7/5/1% + 教育费附加 3% + 地方教育附加 2%，计税依据都是实缴增值税/消费税。小微「六税两费」减半按 50% 计。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    let vat = v.vat;
    if (v.include > 0) vat = v.include / 1.13 * 0.13;
    const cr = v.city.startsWith('市区') ? 0.07 : v.city.startsWith('县城') ? 0.05 : 0.01;
    const half = v.small ? 0.5 : 1;
    const a = vat * cr * half, b = vat * 0.03 * half, c = vat * 0.02 * half;
    const text = [`计税依据（实缴增值税）：${F(vat)} 元${v.include > 0 ? `（由含税销售额 ${F(v.include)} 元按 13% 反推）` : ''}`, `城建税（${F(cr * 100, 0)}%）：${F(a)} 元`, `教育费附加（3%）：${F(b)} 元`, `地方教育附加（2%）：${F(c)} 元`, `合计：${F(a + b + c)} 元${v.small ? '（已按小微减半）' : ''}`, `综合附加率：${F((a + b + c) / Math.max(1, vat) * 100)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '附加合计', value: F(a + b + c) + ' 元' }, { label: '城建税', value: F(a) + ' 元' }, { label: '综合率', value: F((a + b + c) / Math.max(1, vat) * 100) + '%' }],
      preview: `<p class="t-hint">减免政策有适用期间与主体条件，报税以税务机关口径为准。</p>` };
  } };

S['house-tax'] = { kind: 'form', titleIn: '房子与买卖双方', titleOut: '税费清单',
  fields: [
    { id: 'price', label: '成交价（网签价）', type: 'number', default: 3000000, unit: '元' },
    { id: 'origin', label: '卖方当年购入价', type: 'number', default: 1800000, unit: '元' },
    { id: 'years', label: '房产证满几年', type: 'number', default: 3, unit: '年' },
    { id: 'only', label: '满五唯一', type: 'checkbox', default: false },
    { id: 'area', label: '建筑面积', type: 'number', default: 89, unit: '㎡' },
    { id: 'first', label: '买方套数', type: 'select', options: ['首套', '二套', '三套及以上'] }],
  primary: '复制税费清单', hintOut: '内置精简口径：满 2 年免增值税；个税按差额 20% 或全额 1% 二选一（这里取较低）；契税按 140㎡ 分档。2026 起增值税率按 3% 简化。各地细则不同，过户前以当地税务与中介核算为准。',
  compute: (v) => {
    const F = (n, d = 2) => L.fmt(L.round(n, d), d);
    const net = v.price / 1.05;
    const vat = v.years >= 2 ? 0 : net * 0.03;
    const sur = vat * 0.12;
    const diff = Math.max(0, v.price - v.origin);
    const pit = v.only && v.years >= 5 ? 0 : Math.min(diff * 0.2, v.price * 0.01);
    const cr = v.first === '首套' ? (v.area <= 140 ? 0.01 : 0.015) : v.first === '二套' ? (v.area <= 140 ? 0.01 : 0.02) : 0.03;
    const deed = v.price * cr;
    const seller = vat + sur + pit, buyer = deed;
    const text = [`卖方：`, `　增值税（${v.years >= 2 ? '满 2 年免征' : '3%'}）：${F(vat)} 元`, `　附加税（增值税 ×12%）：${F(sur)} 元`, `　个人所得税${v.only && v.years >= 5 ? '（满五唯一免征）' : ''}：${F(pit)} 元（差额 ${F(diff)} 元）`, `　卖方合计：${F(seller)} 元`, `买方：`, `　契税（${F(cr * 100, 2)}%）：${F(deed)} 元`, `双方税费合计：${F(seller + buyer)} 元`, `占成交价 ${F((seller + buyer) / Math.max(1, v.price) * 100)}%`].join('\n');
    return { text, copy: text, stats: [{ label: '卖方税费', value: F(seller) + ' 元' }, { label: '买方契税', value: F(deed) + ' 元' }, { label: '合计', value: F(seller + buyer) + ' 元' }],
      preview: `<p class="t-hint">个税按「差额 20% 与全额 1% 取低」估算；满五唯一需同时满足「满 5 年」且「家庭唯一住房」。</p>` };
  } };

// 说明：本文件不定义任何顶层 helper——generate.mjs 只序列化函数体，
// 顶层变量不会进入产物，所以所有计算逻辑都写在各 compute 函数内部。
