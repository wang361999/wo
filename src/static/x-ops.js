/* 第二批工具的文本类算子：真正做计算/转换，不做「点一下弹个结果」的空壳。 */
import { esc, clean, lines, outTable, L } from '/x-core.js';
export { CODEC, RAND, COLOR } from '/x-ops2.js';

const sel = (id, label, options, def) => ({ id, label, type: 'select', options, default: def ?? options[0] });
const num = (id, label, def, unit = '') => ({ id, label, unit, type: 'number', default: def, step: 'any' });
const txt = (id, label, ph, def = '') => ({ id, label, type: 'text', default: def, placeholder: ph });
const area = (id, label, ph, def = '', rows = 5) => ({ id, label, type: 'textarea', rows, default: def, placeholder: ph });
const chk = (id, label, def = false) => ({ id, label, type: 'checkbox', default: def });
const ok = (text, extra = {}) => ({ text, copy: text, stats: [{ label: '字符数', value: String(String(text).length) }], ...extra });
const numList = (s) => String(s).split(/[\s,，、;；]+/).map((x) => x.trim()).filter(Boolean).map(Number);
const pad2 = (n) => String(n).padStart(2, '0');
const dstr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addD = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const parseD = (s, fallback = new Date()) => { const d = new Date(String(s).replace(/[年月]/g, '-').replace(/日/g, '')); return isNaN(d) ? fallback : d; };

const CN_NUM = '零一二三四五六七八九';
const GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥', SX = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
const CONSTELLATION = [[1, 20, '水瓶座'], [2, 19, '双鱼座'], [3, 21, '白羊座'], [4, 20, '金牛座'], [5, 21, '双子座'], [6, 22, '巨蟹座'], [7, 23, '狮子座'], [8, 23, '处女座'], [9, 23, '天秤座'], [10, 24, '天蝎座'], [11, 23, '射手座'], [12, 22, '摩羯座']];
const constellation = (m, d) => {
  let r = '摩羯座';
  for (const [mm, dd, name] of CONSTELLATION) if (m < mm || (m === mm && d < dd)) break; else r = name;
  return r;
};
const gz = (n) => GAN[((n % 10) + 10) % 10] + ZHI[((n % 12) + 12) % 12];
const gzYear = (y) => gz(y - 4);
/* 以 1900-01-31 为甲戌日推算日柱，1900–2100 内与常见万年历一致 */
const gzDay = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + 10;

export const TEXT = {
  /* ---------- 数列与算法 ---------- */
  gcd: {
    titleIn: '整数列表', placeholder: '例如 24 36 60', sample: { src: '24 36 60' },
    fields: () => [],
    run: (v) => {
      const a = numList(v.src).filter(Number.isInteger);
      if (a.length < 2) return { error: '至少填两个整数，用空格或换行分隔' };
      let r = a.reduce((x, y) => { while (y) { [x, y] = [y, x % y]; } return Math.abs(x); }, 0);
      const steps = a.map((x) => `${x} ÷ ${r} = ${x / r}`).join('\n');
      return ok(`最大公约数：${r}\n\n逐项校验\n${steps}`);
    },
  },
  lcm: {
    titleIn: '整数列表', placeholder: '例如 4 6 15', sample: { src: '4 6 15' },
    fields: () => [],
    run: (v) => {
      const a = numList(v.src).filter(Number.isInteger);
      if (a.length < 2) return { error: '至少填两个整数' };
      const gcd2 = (x, y) => { while (y) { [x, y] = [y, x % y]; } return Math.abs(x); };
      let r = 1;
      for (const x of a) r = Math.abs(r * x) / gcd2(r, x);
      if (!Number.isSafeInteger(r)) return { error: '结果超出安全整数范围，请减少数字个数' };
      return ok(`最小公倍数：${r}\n\n逐项整除校验\n${a.map((x) => `${r} ÷ ${x} = ${r / x}`).join('\n')}`);
    },
  },
  factor: {
    titleIn: '要分解的整数', placeholder: '例如 360', sample: { src: '360' },
    fields: () => [],
    run: (v) => {
      let n = Number(String(v.src).trim());
      if (!Number.isSafeInteger(n) || Math.abs(n) < 2) return { error: '请填一个绝对值大于 1 的整数' };
      const sign = n < 0 ? '-' : ''; n = Math.abs(n);
      const f = []; let x = n;
      for (let p = 2; p * p <= x; p++) { let c = 0; while (x % p === 0) { x /= p; c++; } if (c) f.push([p, c]); }
      if (x > 1) f.push([x, 1]);
      const expr = f.map(([p, c]) => c === 1 ? p : `${p}^${c}`).join(' × ');
      return ok(`${n} = ${expr}\n\n是否质数：${f.length === 1 && f[0][1] === 1 ? '是' : '否'}\n不同质因数个数：${f.length}\n约数个数：${f.reduce((a, b) => a * (b[1] + 1), 1)}`);
    },
  },
  primes: {
    noSrc: true,
    titleIn: '区间', placeholder: '例如 1 到 200', sample: { src: '' },
    fields: () => [num('lo', '起始', 1), num('hi', '结束', 200)],
    run: (v) => {
      const lo = Math.max(2, Math.ceil(Number(v.lo))), hi = Math.floor(Number(v.hi));
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return { error: '结束值要不小于起始值' };
      if (hi - lo > 200000) return { error: '区间太大，请把跨度控制在 20 万以内' };
      const sieve = new Uint8Array(hi + 1);
      for (let i = 2; i * i <= hi; i++) if (!sieve[i]) for (let j = i * i; j <= hi; j += i) sieve[j] = 1;
      const p = []; for (let i = lo; i <= hi; i++) if (!sieve[i]) p.push(i);
      return ok(`找到 ${p.length} 个质数\n\n${p.join(' ')}`, { stats: [{ label: '质数个数', value: String(p.length) }] });
    },
  },
  game24: {
    titleIn: '四个数字', placeholder: '例如 3 3 8 8', sample: { src: '3 3 8 8' },
    fields: () => [],
    run: (v) => {
      const a = numList(v.src);
      if (a.length !== 4 || a.some((x) => !Number.isFinite(x))) return { error: '请填四个数字，用空格分隔' };
      const ops = ['+', '-', '*', '/'], found = new Set();
      const perms = (arr) => arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
      const eval3 = (x, y, o) => o === '+' ? x + y : o === '-' ? x - y : o === '*' ? x * y : x / y;
      for (const p of perms(a)) for (const o1 of ops) for (const o2 of ops) for (const o3 of ops) {
        const forms = [
          [eval3(eval3(eval3(p[0], p[1], o1), p[2], o2), p[3], o3), `((${p[0]}${o1}${p[1]})${o2}${p[2]})${o3}${p[3]}`],
          [eval3(eval3(p[0], eval3(p[1], p[2], o2), o1), p[3], o3), `(${p[0]}${o1}(${p[1]}${o2}${p[2]}))${o3}${p[3]}`],
          [eval3(p[0], eval3(eval3(p[1], p[2], o2), p[3], o3), o1), `${p[0]}${o1}((${p[1]}${o2}${p[2]})${o3}${p[3]})`],
          [eval3(p[0], eval3(p[1], eval3(p[2], p[3], o3), o2), o1), `${p[0]}${o1}(${p[1]}${o2}(${p[2]}${o3}${p[3]}))`],
          [eval3(eval3(p[0], p[1], o1), eval3(p[2], p[3], o3), o2), `(${p[0]}${o1}${p[1]})${o2}(${p[2]}${o3}${p[3]})`],
        ];
        for (const [r, s] of forms) if (Math.abs(r - 24) < 1e-9) found.add(s + ' = 24');
      }
      const list = [...found].slice(0, 60);
      return { text: list.length ? `找到 ${found.size} 个解${found.size > 60 ? '，列出前 60 个' : ''}\n\n` + list.join('\n') : '这四个数用加减乘除凑不出 24。',
        copy: list.join('\n'), stats: [{ label: '解的数量', value: String(found.size) }] };
    },
  },
  ipv6: {
    titleIn: 'IPv6 地址', placeholder: '例如 2001:db8::1', sample: { src: '2001:db8::1' },
    fields: () => [sel('mode', '操作', ['展开为完整写法', '压缩写法', '算网络前缀']), num('prefix', '前缀长度', 64, '位')],
    run: (v) => {
      const s = clean(v.src);
      if (!/^[0-9a-fA-F:.\/]+$/.test(s) || !s.includes(':')) return { error: '不是合法的 IPv6 地址' };
      let full;
      const [addr] = s.split('/');
      const halves = addr.split('::');
      if (halves.length > 2) return { error: '一个地址里只能有一个 ::' };
      const part = (x) => x ? x.split(':').filter(Boolean) : [];
      let left = part(halves[0]), right = halves.length === 2 ? part(halves[1]) : [];
      // IPv4 映射地址尾部按两段处理
      if (right.length && right[right.length - 1].includes('.')) {
        const q = right.pop().split('.').map(Number);
        if (q.length === 4 && q.every((x) => x >= 0 && x <= 255)) right.push(((q[0] << 8) | q[1]).toString(16), ((q[2] << 8) | q[3]).toString(16));
      }
      if (halves.length === 2) {
        const miss = 8 - left.length - right.length;
        if (miss < 1) return { error: '地址段数超过 8 段' };
        full = [...left, ...Array(miss).fill('0'), ...right];
      } else full = left;
      if (full.length !== 8) return { error: '展开后不是 8 段，请检查地址' };
      const g = full.map((x) => x.toLowerCase().replace(/^0+/, '') || '0');
      const expanded = full.map((x) => x.padStart(4, '0')).join(':');
      let bestStart = -1, bestLen = 0;
      for (let i = 0; i < 8;) {
        if (g[i] !== '0') { i++; continue; }
        let j = i; while (j < 8 && g[j] === '0') j++;
        if (j - i > bestLen) { bestStart = i; bestLen = j - i; }
        i = j;
      }
      const compressed = bestLen >= 2
        ? (bestStart === 0 ? '' : g.slice(0, bestStart).join(':')) + '::' + (bestStart + bestLen >= 8 ? '' : g.slice(bestStart + bestLen).join(':'))
        : g.join(':');
      if (v.mode === '压缩写法') return ok(compressed);
      if (v.mode === '算网络前缀') {
        const p = Math.max(0, Math.min(128, Math.floor(Number(v.prefix))));
        const bits = full.map((x) => parseInt(x, 16).toString(2).padStart(16, '0')).join('');
        const net = bits.slice(0, p).padEnd(128, '0').match(/.{16}/g).map((b) => parseInt(b, 2).toString(16)).join(':');
        return ok(`网络地址：${net}/${p}\n完整写法：${expanded}\n地址总数：2^${128 - p}`);
      }
      return ok(expanded);
    },
  },
  ipnum: {
    titleIn: 'IPv4 或整数', placeholder: '例如 192.168.1.1 或 3232235777', sample: { src: '192.168.1.1' },
    fields: () => [],
    run: (v) => {
      const s = clean(v.src);
      if (/^\d+$/.test(s)) {
        const n = Number(s);
        if (!Number.isInteger(n) || n < 0 || n > 4294967295) return { error: '整数需在 0 到 4294967295 之间' };
        return ok(`${[24, 16, 8, 0].map((x) => (n >>> x) & 255).join('.')}\n\n十进制：${n}\n十六进制：0x${n.toString(16).toUpperCase().padStart(8, '0')}`);
      }
      const p = s.split('.').map(Number);
      if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return { error: '不是合法的 IPv4 地址' };
      const n = (p[0] * 16777216) + (p[1] * 65536) + (p[2] * 256) + p[3];
      return ok(`十进制：${n}\n十六进制：0x${n.toString(16).toUpperCase().padStart(8, '0')}\n二进制：${n.toString(2).padStart(32, '0')}`);
    },
  },

  /* ---------- 历法与日期 ---------- */
  retire: {
    noSrc: true,
    titleIn: '出生信息', sample: { src: '' },
    fields: () => [num('y', '出生年份', 1980, '年'), num('m', '出生月份', 6, '月'), sel('kind', '人员类别', ['男职工（原 60 岁）', '女职工 原 55 岁档', '女职工 原 50 岁档'])],
    run: (v) => {
      const y = Math.floor(Number(v.y)), m = Math.floor(Number(v.m));
      if (!Number.isFinite(y) || y < 1940 || y > 2010 || m < 1 || m > 12) return { error: '请填 1940–2010 年与 1–12 月' };
      const isMale = v.kind.startsWith('男'), is55 = v.kind.includes('55');
      const base = isMale ? 60 : is55 ? 55 : 50;
      const target = isMale ? 63 : is55 ? 58 : 55;
      const step = isMale ? 4 : is55 ? 4 : 2;   // 每几个月的出生批次延 1 个月
      const startYear = 1965;
      const monthsFromStart = (y - startYear) * 12 + (m - 1);
      let delay = Math.min((target - base) * 12, Math.max(0, Math.floor(monthsFromStart / step) + 1));
      if (monthsFromStart < 0) delay = 0;
      const total = base * 12 + delay;
      const ry = y + Math.floor((m - 1 + total) / 12);
      const rm = ((m - 1 + total) % 12) + 1;
      return ok(`原法定退休年龄：${base} 岁\n渐进延迟月数：${delay} 个月\n预计退休年龄：${Math.floor(total / 12)} 岁 ${total % 12} 个月\n预计退休时间：${ry} 年 ${rm} 月`,
        { stats: [{ label: '预计退休年龄', value: `${Math.floor(total / 12)}岁` }, { label: '延迟', value: `${delay}个月` }] });
    },
  },
  retiredays: {
    titleIn: '退休日期', placeholder: '例如 2040-06-01', sample: { src: '2040-06-01' },
    fields: () => [],
    run: (v) => {
      const d = parseD(v.src, null);
      if (!d) return { error: '请填日期，例如 2040-06-01' };
      const days = Math.ceil((d - new Date()) / 86400000);
      return { text: `距离退休：${days > 0 ? days + ' 天' : '已经退休'}\n约合 ${(Math.max(0, days) / 365.25).toFixed(2)} 年\n按每年 250 个工作日算约 ${Math.round(Math.max(0, days) * 250 / 365.25)} 个工作日`,
        copy: String(Math.max(0, days)), stats: [{ label: '剩余天数', value: String(Math.max(0, days)) }] };
    },
  },
  babydays: {
    titleIn: '出生日期', placeholder: '例如 2026-01-01', sample: { src: '2026-01-01' },
    fields: () => [],
    run: (v) => {
      const d = parseD(v.src, null);
      if (!d) return { error: '请填出生日期，例如 2026-01-01' };
      const items = [['满月', 30], ['百日', 100], ['半岁', 183], ['周岁', 365], ['两周岁', 730]];
      const s = items.map(([n, k]) => `${n}：${dstr(addD(d, k))}${addD(d, k) < new Date() ? '（已过）' : ''}`).join('\n');
      return ok(s);
    },
  },
  dateupper: {
    titleIn: '公历日期', placeholder: '例如 2026-11-09', sample: { src: '2026-11-09' },
    fields: () => [sel('mode', '形式', ['中文小写', '中文大写（财务）'])],
    run: (v) => {
      const d = parseD(v.src, null);
      if (!d) return { error: '请填日期，例如 2026-11-09' };
      const y = String(d.getFullYear()).split('').map((c) => CN_NUM[+c]).join('');
      const m = d.getMonth() + 1, day = d.getDate();
      const cn = (n) => n <= 10 ? '十' + (n === 10 ? '' : CN_NUM[n]) : n < 20 ? '十' + CN_NUM[n - 10] : CN_NUM[Math.floor(n / 10)] + '十' + (n % 10 ? CN_NUM[n % 10] : '');
      const cnMonth = m === 10 ? '十' : m > 10 ? '十' + CN_NUM[m - 10] : CN_NUM[m];
      if (v.mode.startsWith('中文大写')) {
        const big = '零壹贰叁肆伍陆柒捌玖';
        const Y = String(d.getFullYear()).split('').map((c) => big[+c]).join('');
        const M = m >= 10 ? '壹拾' + (m % 10 ? big[m % 10] : '') : big[m];
        const D = day >= 30 ? '叁拾' : day >= 20 ? '贰拾' + (day % 10 ? big[day % 10] : '') : day >= 10 ? '壹拾' + (day % 10 ? big[day % 10] : '') : big[day];
        return ok(`${Y}年${M}月${D}日`);
      }
      return ok(`${y}年${cnMonth}月${cn(day)}日`);
    },
  },
  dateen: {
    titleIn: '公历日期', placeholder: '例如 2026-11-09', sample: { src: '2026-11-09' },
    fields: () => [],
    run: (v) => {
      const d = parseD(v.src, null);
      if (!d) return { error: '请填日期，例如 2026-11-09' };
      const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const ord = (n) => n + ([11, 12, 13].includes(n % 100) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
      return ok(`美式：${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}\n英式：${ord(d.getDate())} ${M[d.getMonth()]} ${d.getFullYear()}\nISO：${dstr(d)}\n短横线：${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`);
    },
  },
  shichen: {
    titleIn: '时间', placeholder: '例如 14:30', sample: { src: '14:30' },
    fields: () => [],
    run: (v) => {
      const m = clean(v.src).match(/^(\d{1,2})[:：]?(\d{2})?$/);
      if (!m) return { error: '请填时间，例如 14:30' };
      const h = +m[1], mi = +(m[2] || 0);
      if (h > 23 || mi > 59) return { error: '时间超出范围' };
      const names = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'];
      const idx = Math.floor(((h + 1) % 24) / 2);
      const ke = Math.floor(mi / 15) + 1;
      return ok(`${pad2(h)}:${pad2(mi)} 是 ${names[idx]}（${ZHI[idx]}时）\n时辰范围：${pad2((idx * 2 + 23) % 24)}:00 – ${pad2((idx * 2 + 1) % 24)}:59\n约第 ${ke} 刻（一刻 15 分钟）`);
    },
  },
  hour1224: {
    titleIn: '时间', placeholder: '例如 下午 3:25 或 15:25', sample: { src: '15:25' },
    fields: () => [sel('dir', '输入是', ['24 小时制', '12 小时制'])],
    run: (v) => {
      const s = clean(v.src);
      if (v.dir === '24 小时制') {
        const m = s.match(/^(\d{1,2})[:：](\d{2})/);
        if (!m) return { error: '请填 24 小时制时间，例如 15:25' };
        const h = +m[1]; if (h > 23) return { error: '小时需在 0–23' };
        const ap = h < 12 ? '上午' : '下午', h12 = h % 12 || 12;
        return ok(`${ap} ${h12}:${m[2]}　(${h12}:${m[2]} ${h < 12 ? 'AM' : 'PM'})`);
      }
      const m = s.match(/(上午|下午|早上|晚上|AM|PM|am|pm)?\s*(\d{1,2})[:：](\d{2})/i);
      if (!m) return { error: '请填 12 小时制时间，例如 下午 3:25' };
      let h = +m[2] % 12;
      const pm = /下午|晚上|PM/i.test(m[1] || '');
      if (pm) h += 12;
      return ok(`${pad2(h)}:${m[3]}`);
    },
  },
  bazi: {
    noSrc: true,
    titleIn: '出生信息', sample: { src: '' },
    fields: () => [txt('date', '公历生日', '1990-06-15', '1990-06-15'), num('hour', '出生小时', 12, '时')],
    run: (v) => {
      const d = parseD(v.date, null);
      if (!d) return { error: '请填公历生日' };
      const h = Math.max(0, Math.min(23, Math.floor(Number(v.hour))));
      const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      // 月柱按节气月近似：每月 6 日前后交节，这里用「本月 6 日起算下一节月」的常用近似
      const monthIdx = m + (day >= 6 ? 0 : -1);
      const yGZ = gzYear(y + (monthIdx === 1 && day < 6 ? -1 : 0));
      const mGZ = gz(y * 12 + monthIdx + 1);
      const dGZ = gz(gzDay(d));
      const hGZ = gz((gzDay(d) % 5) * 12 + Math.floor((h + 1) / 2));
      return ok(`年柱：${yGZ}　月柱：${mGZ}　日柱：${dGZ}　时柱：${hGZ}\n\n生肖：${SX[((y - 4) % 12 + 12) % 12]}\n说明：按简化节气表推算，月柱以每月 6 日为界，立春前后与精确节气时刻会有偏差。`);
    },
  },
  bazidate: {
    titleIn: '年柱干支', placeholder: '例如 甲子', sample: { src: '甲子' },
    fields: () => [num('from', '查找起始年', 1900, '年'), num('to', '查找结束年', 2100, '年')],
    run: (v) => {
      const s = clean(v.src);
      const gi = GAN.indexOf(s[0]), zi = ZHI.indexOf(s[1]);
      if (gi < 0 || zi < 0 || s.length !== 2 || (gi % 2) !== (zi % 2)) return { error: '请填合法干支，如 甲子（天干地支奇偶须一致）' };
      const from = Math.floor(Number(v.from)), to = Math.floor(Number(v.to));
      const years = [];
      for (let y = from; y <= Math.min(to, from + 500); y++) if (gzYear(y) === s) years.push(y);
      return ok(`${s}年对应的公历年份：\n${years.join('、') || '该范围内没有'}\n\n干支序号：第 ${GAN.indexOf(s[0]) + 1} 位天干 / 第 ${ZHI.indexOf(s[1]) + 1} 位地支，每 60 年一轮。`);
    },
  },
  daoli: {
    titleIn: '公历年份', placeholder: '例如 2026', sample: { src: '2026' },
    fields: () => [],
    run: (v) => {
      const y = Number(clean(v.src));
      if (!Number.isInteger(y) || y < 1 || y > 9999) return { error: '请填 1–9999 的年份' };
      return ok(`公历 ${y} 年 ≈ 道历 ${y + 2697} 年\n\n以黄帝纪元（公元前 2697 年）为元年，部分道派以冬至或立春换年，口径略有差异。`);
    },
  },
  foli: {
    titleIn: '公历年份', placeholder: '例如 2026', sample: { src: '2026' },
    fields: () => [],
    run: (v) => {
      const y = Number(clean(v.src));
      if (!Number.isInteger(y) || y < 1 || y > 9999) return { error: '请填 1–9999 的年份' };
      return ok(`公历 ${y} 年 ≈ 佛历 ${y + 544} 年（南传常用口径）\n汉传部分场合用 ${y + 543} 年，佛诞日后换年。`);
    },
  },
  leapq: {
    titleIn: '年份', placeholder: '例如 2026', sample: { src: '2026' },
    fields: () => [],
    run: (v) => {
      const y = Number(clean(v.src));
      if (!Number.isInteger(y) || y < 1900 || y > 2100) return { error: '内置农历数据覆盖 1900–2100 年' };
      const greg = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const LEAP = { 2020: 4, 2023: 2, 2025: 6, 2028: 5, 2031: 3, 2033: 11, 2036: 6, 2039: 5, 2042: 2, 2044: 7, 2047: 5, 2050: 3, 2052: 8, 2055: 6, 2058: 4, 2061: 3, 2063: 7, 2066: 5, 2069: 4, 2071: 8, 2074: 6, 2077: 4, 2080: 3, 2082: 7, 2085: 5, 2088: 4, 2090: 8, 2093: 6, 2096: 4, 2099: 2 };
      const lm = LEAP[y];
      const years = [];
      for (let k = y - 10; k <= y + 10; k++) if (LEAP[k]) years.push(`${k} 年闰${LEAP[k]}月`);
      return ok(`${y} 年${greg ? '是' : '不是'}公历闰年（2 月 ${greg ? 29 : 28} 天）\n农历闰月：${lm ? `闰${lm}月` : '该年无闰月'}\n\n附近年份的农历闰月：\n${years.join('\n') || '无'}\n\n仅列出常见年份的农历闰月，完整数据请查万年历。`,
        { stats: [{ label: '公历 2 月', value: greg ? '29 天' : '28 天' }] });
    },
  },
  solarterms: {
    titleIn: '年份', placeholder: '例如 2026', sample: { src: '2026' },
    fields: () => [],
    run: (v) => {
      const y = Number(clean(v.src));
      if (!Number.isInteger(y) || y < 1900 || y > 2100) return { error: '请填 1900–2100 年' };
      const names = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
      const C = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 6.925, 22.83, 7.438, 23.13, 7.18, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94];
      const Y = y % 100;
      const rows = names.map((n, i) => {
        const m = i + 1;
        let day = Math.floor(Y * 0.2422 + C[i]) - Math.floor((Y - 1) / 4);
        if ((y === 2026 || y === 1982) && m === 1) day -= 1;  // 个别年份的特殊修正
        return [n, `${y}-${pad2(Math.floor(i / 2) + 1)}-${pad2(day)}`];
      });
      return { text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n'), copy: rows.map((r) => r.join('\t')).join('\n'),
        preview: outTable(['节气', '近似公历日期'], rows), stats: [{ label: '节气数', value: '24' }] };
    },
  },
  zodiac: {
    titleIn: '出生日期', placeholder: '例如 1995-08-20', sample: { src: '1995-08-20' },
    fields: () => [],
    run: (v) => {
      const d = parseD(v.src, null);
      if (!d) return { error: '请填出生日期' };
      const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      return ok(`生肖：${SX[((y - 4) % 12 + 12) % 12]}\n星座：${constellation(m, day)}\n干支年：${gzYear(y)}年\n公历生日：${m} 月 ${day} 日\n\n生肖按农历年界，1 月或 2 月初出生需按立春核对。`);
    },
  },
  shelflife: {
    noSrc: true,
    titleIn: '生产信息', sample: { src: '' },
    fields: () => [txt('date', '生产日期', '2026-11-01', '2026-11-01'), num('days', '保质期天数', 180, '天')],
    run: (v) => {
      const d = parseD(v.date, null), n = Number(v.days);
      if (!d || !Number.isFinite(n) || n < 0) return { error: '请填生产日期与保质期天数' };
      const end = addD(d, n), left = Math.ceil((end - new Date()) / 86400000);
      return ok(`到期日：${dstr(end)}\n剩余：${left > 0 ? left + ' 天' : left === 0 ? '今天到期' : `已过期 ${-left} 天`}\n已过保质期：${Math.max(0, Math.ceil((new Date() - d) / 86400000))} 天`,
        { stats: [{ label: '剩余天数', value: String(Math.max(0, left)) }] });
    },
  },
  gaokao: {
    titleIn: '目标年份', placeholder: '例如 2027', sample: { src: '2027' },
    fields: () => [],
    run: (v) => {
      const y = Number(clean(v.src));
      if (!Number.isInteger(y) || y < 2020 || y > 2100) return { error: '请填 2020–2100 的年份' };
      const d = new Date(y, 5, 7, 9, 0, 0), left = Math.ceil((d - new Date()) / 86400000);
      return ok(`按 ${y} 年 6 月 7 日开考估算：${left > 0 ? `还有 ${left} 天` : '已经过去'}\n约 ${(Math.max(0, left) / 30.44).toFixed(1)} 个月\n\n具体开考日期以当年教育考试院公告为准。`);
    },
  },
  /* ---------- 健康口径 ---------- */
  safety: {
    noSrc: true,
    titleIn: '周期信息', sample: { src: '' },
    fields: () => [txt('date', '末次月经第一天', '2026-11-01', '2026-11-01'), num('cycle', '平均周期天数', 28, '天')],
    run: (v) => {
      const d = parseD(v.date, null), c = Number(v.cycle);
      if (!d || !Number.isFinite(c) || c < 20 || c > 45) return { error: '请填日期与 20–45 天的周期长度' };
      const next = addD(d, c), ovu = addD(next, -14);
      const fertile = [addD(ovu, -5), addD(ovu, 4)];
      const rows = [['下次月经预计', dstr(next)], ['排卵日预计', dstr(ovu)], ['易孕期', `${dstr(fertile[0])} 至 ${dstr(fertile[1])}`], ['月经期', `${dstr(d)} 起约 5 天`]];
      return { text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n') + '\n\n日历法受情绪、疾病与药物影响很大，不能作为避孕依据。',
        copy: rows.map((r) => r.join('\t')).join('\n'), preview: outTable(['项目', '日期'], rows) };
    },
  },
  lungage: {
    noSrc: true,
    titleIn: '自测信息', sample: { src: '' },
    fields: () => [num('age', '实际年龄', 30, '岁'), num('h', '身高', 170, 'cm'), sel('smoke', '吸烟情况', ['不吸烟', '已戒', '偶尔吸', '每天吸']), sel('breath', '爬三层楼', ['不喘', '微喘', '明显喘', '需要停下'])],
    run: (v) => {
      const a = Number(v.age);
      if (!Number.isFinite(a) || a < 10 || a > 100) return { error: '请填 10–100 岁' };
      let delta = ({ '不吸烟': -2, '已戒': 0, '偶尔吸': 4, '每天吸': 10 })[v.smoke];
      delta += ({ '不喘': -1, '微喘': 1, '明显喘': 5, '需要停下': 9 })[v.breath];
      const lung = Math.max(12, Math.round(a + delta));
      return ok(`估算肺龄：约 ${lung} 岁\n与实际年龄差：${lung - a >= 0 ? '+' : ''}${lung - a} 岁\n\n这是问卷式粗略估算，肺功能要看 FEV1 等肺量计指标，请做正规检查。`,
        { stats: [{ label: '估算肺龄', value: lung + '岁' }] });
    },
  },
  bloodtype: {
    noSrc: true,
    titleIn: '父母血型', sample: { src: '' },
    fields: () => [sel('f', '父亲 ABO', ['A', 'B', 'AB', 'O']), sel('m', '母亲 ABO', ['A', 'B', 'AB', 'O'])],
    run: (v) => {
      const G = { A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B'], O: ['O'] };
      const set = new Set(), rows = [];
      for (const x of G[v.f]) for (const y of G[v.m]) {
        const t = [x, y].sort().join('');
        const r = ({ AO: 'A', OA: 'A', AA: 'A', BO: 'B', OB: 'B', BB: 'B', AB: 'AB', OO: 'O' })[t];
        set.add(r); rows.push([`${x} + ${y}`, r]);
      }
      return { text: `${v.f} 型 × ${v.m} 型\n子女可能血型：${[...set].sort().join('、')}\n\n基因组合明细见下表。Rh 阴阳性、孟买型与其它血型系统不在此列。`,
        copy: [...set].sort().join('、'), preview: outTable(['等位基因组合', '表现型'], rows) };
    },
  },
  bloodpressure: {
    noSrc: true,
    titleIn: '血压读数', sample: { src: '' },
    fields: () => [num('hi', '收缩压', 120, 'mmHg'), num('lo', '舒张压', 78, 'mmHg')],
    run: (v) => {
      const a = Number(v.hi), b = Number(v.lo);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 50 || b < 30 || a <= b) return { error: '请填合理的收缩压与舒张压' };
      let level, note;
      if (a < 120 && b < 80) { level = '正常'; note = '保持现状，定期测量。'; }
      else if (a < 130 && b < 85) { level = '正常高值'; note = '注意饮食与运动，定期复查。'; }
      else if (a < 140 || b < 90) { level = '轻度升高'; note = '建议连续多日家庭测量并咨询医生。'; }
      else if (a < 160 || b < 100) { level = '1 级高血压范围'; note = '需就医评估，不要自行用药。'; }
      else if (a < 180 || b < 110) { level = '2 级高血压范围'; note = '尽快就医。'; }
      else { level = '重度升高'; note = '请尽快就医，若伴胸痛气促立即急诊。'; }
      return ok(`${a}/${b} mmHg → ${level}\n脉压差：${a - b} mmHg\n${note}\n\n单次读数不能确诊，需非同日多次测量。`,
        { stats: [{ label: '分级', value: level }] });
    },
  },
  sleepcycle: {
    titleIn: '时间', placeholder: '例如 23:30', sample: { src: '23:30' },
    fields: () => [sel('dir', '按什么算', ['入睡时间 → 推荐起床', '起床时间 → 推荐入睡']), num('cycles', '睡眠周期数', 5, '个')],
    run: (v) => {
      const m = clean(v.src).match(/^(\d{1,2})[:：](\d{2})$/);
      if (!m) return { error: '请填时间，例如 23:30' };
      let mins = +m[1] * 60 + +m[2];
      const n = Math.max(1, Math.min(8, Math.floor(Number(v.cycles))));
      const fall = 15;
      const fmt = (x) => `${pad2(Math.floor(((x % 1440) + 1440) % 1440 / 60))}:${pad2(((x % 60) + 60) % 60)}`;
      const rows = [];
      for (let k = Math.max(3, n - 2); k <= Math.min(8, n + 2); k++) {
        const t = v.dir.startsWith('入睡') ? mins + fall + k * 90 : mins - fall - k * 90;
        rows.push([`${k} 个周期（${(k * 1.5).toFixed(1)} 小时）`, fmt(t)]);
      }
      return { text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n') + '\n\n已计入约 15 分钟入睡时间，每周期按 90 分钟估算。',
        copy: rows.map((r) => r.join('\t')).join('\n'), preview: outTable(['周期数', v.dir.startsWith('入睡') ? '起床时间' : '入睡时间'], rows) };
    },
  },

  /* ---------- 纯文本变换 ---------- */
  reverse: {
    placeholder: '要反转的文本，一行或几行都行', sample: { src: '一页工具\n打开就能用' },
    fields: () => [sel('mode', '反转方式', ['整段按字符反转', '按行倒序', '每行各自反转'])],
    run: (v) => {
      const s = String(v.src);
      if (v.mode === '整段按字符反转') return ok([...s].reverse().join(''));
      if (v.mode === '按行倒序') return ok(lines(s).reverse().join('\n'));
      return ok(lines(s).map((l) => [...l].reverse().join('')).join('\n'));
    },
  },
  repeat: {
    placeholder: '要重复的文本', sample: { src: '重要的事说三遍' },
    fields: () => [num('times', '重复次数', 3, '次'), txt('sep', '连接符', '留空表示直接拼接', '\\n')],
    run: (v) => {
      const n = Math.max(1, Math.min(500, Math.floor(Number(v.times))));
      const sep = String(v.sep).replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      const arr = Array(n).fill(String(v.src));
      const s = arr.join(sep);
      if (s.length > 200000) return { error: '结果太长，请减少重复次数' };
      return ok(s, { stats: [{ label: '重复次数', value: String(n) }, { label: '总字数', value: String(s.length) }] });
    },
  },
  linenum: {
    placeholder: '一行一条内容', sample: { src: '第一项\n第二项\n第三项' },
    fields: () => [num('start', '起始序号', 1), txt('fmt', '格式', '用 {n} 表示序号，例如 {n}. ', '{n}. '), chk('skip', '跳过空行', true)],
    run: (v) => {
      let i = Number(v.start) || 1;
      const f = String(v.fmt || '{n}. ');
      const s = lines(v.src).filter((x) => !v.skip || x.trim()).map((x) => f.replace(/\{n\}/g, String(i++)) + x).join('\n');
      return ok(s, { stats: [{ label: '行数', value: String(i - 1) }] });
    },
  },
  removeblank: {
    placeholder: '含空行的文本', sample: { src: '第一行\n\n   \n第二行   ' },
    fields: () => [chk('trim', '同时去掉每行首尾空格', true), chk('all', '顺带压缩行内连续空格', false)],
    run: (v) => {
      let a = lines(v.src);
      if (v.trim) a = a.map((x) => x.trim());
      if (v.all) a = a.map((x) => x.replace(/[ \t]+/g, ' '));
      a = a.filter((x) => x.trim());
      return ok(a.join('\n'), { stats: [{ label: '保留行数', value: String(a.length) }] });
    },
  },
  sortlines: {
    placeholder: '一行一条', sample: { src: '香蕉\n苹果\n橙子\n苹果' },
    fields: () => [sel('order', '顺序', ['升序', '降序', '按长度', '随机打乱']), chk('uniq', '去重', false), chk('skip', '忽略大小写', true)],
    run: (v) => {
      let a = lines(v.src).map((x) => x.trim()).filter(Boolean);
      if (v.uniq) a = [...new Set(a)];
      const cmp = (x, y) => v.skip ? x.toLowerCase().localeCompare(y.toLowerCase(), 'zh-CN') : x.localeCompare(y, 'zh-CN');
      if (v.order === '升序') a.sort(cmp);
      else if (v.order === '降序') a.sort((x, y) => cmp(y, x));
      else if (v.order === '按长度') a.sort((x, y) => [...x].length - [...y].length);
      else a = L.shuffle(a);
      return ok(a.join('\n'), { stats: [{ label: '行数', value: String(a.length) }] });
    },
  },
  pad: {
    placeholder: '要补齐的文本', sample: { src: '7' },
    fields: () => [num('len', '目标长度', 6, '字符'), txt('ch', '填充字符', '默认空格', '0'), sel('side', '补在哪边', ['左边', '右边', '两边居中'])],
    run: (v) => {
      const n = Math.max(1, Math.min(500, Math.floor(Number(v.len))));
      const ch = String(v.ch || ' ')[0];
      const a = lines(v.src);
      const one = (s) => {
        const need = Math.max(0, n - [...s].length);
        if (v.side === '左边') return ch.repeat(need) + s;
        if (v.side === '右边') return s + ch.repeat(need);
        const l = Math.floor(need / 2);
        return ch.repeat(l) + s + ch.repeat(need - l);
      };
      return ok(a.map(one).join('\n'));
    },
  },
  insert: {
    placeholder: '要插入内容的文本', sample: { src: 'abcdef\n一二三四' },
    fields: () => [txt('ins', '插入内容', '例如 · 或 <br>', '-'), sel('mode', '插入位置', ['每行行首', '每行行尾', '每隔 N 个字符', '每个字符之间']), num('n', '间隔 N', 3)],
    run: (v) => {
      const ins = String(v.ins), n = Math.max(1, Math.floor(Number(v.n) || 1));
      const one = (s) => {
        if (v.mode === '每行行首') return ins + s;
        if (v.mode === '每行行尾') return s + ins;
        if (v.mode === '每个字符之间') return [...s].join(ins);
        return [...s].reduce((a, c, i) => a + (i && i % n === 0 ? ins : '') + c, '');
      };
      return ok(lines(v.src).map(one).join('\n'));
    },
  },
  phones: {
    placeholder: '含手机号的文本', sample: { src: '联系 13800138000 或 15912345678，座机 010-88886666 不算。' },
    fields: () => [chk('uniq', '去重', true)],
    run: (v) => {
      const a = [...String(v.src).matchAll(/(?<!\d)1[3-9]\d{9}(?!\d)/g)].map((m) => m[0]);
      const r = v.uniq ? [...new Set(a)] : a;
      return ok(r.join('\n') || '没有找到手机号', { stats: [{ label: '匹配数量', value: String(r.length) }] });
    },
  },
  emails: {
    placeholder: '含邮箱的文本', sample: { src: '写信到 hello@example.org 与 support@mail.example.com' },
    fields: () => [chk('uniq', '去重', true)],
    run: (v) => {
      const a = [...String(v.src).matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map((m) => m[0]);
      const r = v.uniq ? [...new Set(a)] : a;
      return ok(r.join('\n') || '没有找到邮箱', { stats: [{ label: '匹配数量', value: String(r.length) }] });
    },
  },
  urls: {
    placeholder: '含网址的文本', sample: { src: '看 https://www.gitd.cn/tools/color/ 和 http://localhost:3000/a?b=1' },
    fields: () => [chk('uniq', '去重', true), chk('https', '只要 https', false)],
    run: (v) => {
      let a = [...String(v.src).matchAll(/https?:\/\/[^\s<>"'，。；）】]+/g)].map((m) => m[0].replace(/[.,;!?]+$/, ''));
      if (v.https) a = a.filter((x) => x.startsWith('https'));
      const r = v.uniq ? [...new Set(a)] : a;
      return ok(r.join('\n') || '没有找到网址', { stats: [{ label: '匹配数量', value: String(r.length) }] });
    },
  },
  newline: {
    placeholder: '带字面 \\n 的文本，或带真实换行的文本', sample: { src: '第一行\\n第二行\\n第三行' },
    fields: () => [sel('dir', '方向', ['字面 \\n 转真实换行', '真实换行转字面 \\n'])],
    run: (v) => ok(v.dir.startsWith('字面') ? String(v.src).replace(/\\r\\n|\\n|\\r/g, '\n') : String(v.src).replace(/\r?\n/g, '\\n')),
  },
  enterp: {
    placeholder: '一段或多段文字', sample: { src: '第一段\n\n第二段' },
    fields: () => [txt('cls', 'p 标签 class', '可留空', ''), chk('empty', '空行也生成空段', false)],
    run: (v) => {
      const cls = clean(v.cls) ? ` class="${esc(clean(v.cls))}"` : '';
      const s = lines(v.src).filter((x) => v.empty || x.trim()).map((x) => `<p${cls}>${esc(x.trim())}</p>`).join('\n');
      return ok(s);
    },
  },
  namesort: {
    placeholder: '一行一个姓名', sample: { src: '张三\n李四\n王五\n赵六' },
    fields: () => [sel('mode', '排序依据', ['姓氏拼音', '姓名笔画数（近似）', '原字符串'])],
    run: (v) => {
      const a = lines(v.src).map((x) => x.trim()).filter(Boolean);
      const STROKES = { 一: 1, 乙: 1, 二: 2, 丁: 2, 卜: 2, 人: 2, 三: 3, 于: 3, 王: 4, 李: 7, 张: 7, 刘: 6, 陈: 7, 杨: 7, 赵: 9, 黄: 11, 周: 8, 吴: 7, 徐: 10, 孙: 6, 马: 3, 朱: 6, 胡: 9, 郭: 10, 何: 7, 高: 10, 林: 8, 罗: 8, 郑: 8, 梁: 11, 谢: 12, 宋: 7, 唐: 10, 许: 6, 韩: 12, 冯: 5, 邓: 4, 曹: 11, 彭: 12, 曾: 12 };
      const rows = a.map((x) => [x, v.mode.startsWith('姓名笔画') ? (STROKES[x[0]] ?? '未收录') : x.localeCompare('', 'zh-CN')]);
      const sorted = a.map((x, i) => [x, i]).sort((p, q) => {
        if (v.mode === '原字符串') return p[1] - q[1];
        if (v.mode.startsWith('姓名笔画')) {
          const ka = STROKES[p[0][0]] ?? 99, kb = STROKES[q[0][0]] ?? 99;
          return ka - kb || p[0].localeCompare(q[0], 'zh-CN');
        }
        return p[0].localeCompare(q[0], 'zh-CN');
      }).map((x) => x[0]);
      return { text: sorted.join('\n'), copy: sorted.join('\n'),
        preview: outTable(['姓名', v.mode.startsWith('姓名笔画') ? '姓氏笔画' : '拼音序'], rows),
        stats: [{ label: '姓名数', value: String(a.length) }] };
    },
  },
  articleformat: {
    placeholder: '要排版的中文文章', sample: { src: '  第一段文字,没有空行.\n第二段文字!  ' },
    fields: () => [chk('indent', '段首缩进两个全角空格', true), chk('punct', '英文标点转中文', true), chk('blank', '段落之间加空行', true)],
    run: (v) => {
      let a = lines(v.src).map((x) => x.trim()).filter(Boolean);
      if (v.punct) a = a.map((x) => x.replace(/,(?=\S)/g, '，').replace(/\.(?=\s|$)/g, '。').replace(/!(?=\s|$)/g, '！').replace(/\?(?=\s|$)/g, '？').replace(/:(?=\S)/g, '：').replace(/;(?=\S)/g, '；'));
      if (v.indent) a = a.map((x) => '　　' + x);
      return ok(a.join(v.blank ? '\n\n' : '\n'));
    },
  },
  vertical: {
    placeholder: '要竖排的文字', sample: { src: '床前明月光，疑是地上霜。' },
    fields: () => [num('size', '字号', 22, 'px'), chk('punct', '标点也竖排', true)],
    run: (v) => {
      const s = String(v.src), size = Math.max(12, Math.min(48, Number(v.size)));
      const html = `<div style="writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.35em;line-height:2;font-size:${size}px;min-height:260px;padding:16px;background:#fffdf8;color:#2a2a2a;border:1px solid #e8e2d5;font-family:serif">${esc(s)}</div>`;
      return { text: [...s].join('\n'), copy: [...s].join('\n'), preview: html,
        stats: [{ label: '字数', value: String([...s].length) }] };
    },
  },
  mars: {
    placeholder: '要转换的文字', sample: { src: '我爱一页工具' },
    fields: () => [],
    run: (v) => {
      const M = { 我: '莪', 你: '伱', 他: '祂', 爱: '僾', 不: '吥', 是: '昰', 的: '啲', 了: '孒', 在: '洅', 有: '冇', 好: '恏', 人: '亾', 大: '汏', 小: '尛', 中: 'ф', 文: '妏', 一: '①', 二: '②', 三: '③', 页: '頁', 工: '巭', 具: '俱', 生: '甡', 气: '氣', 什: '什嚒', 么: '嚒', 请: '請', 谢: '謝' };
      const s = [...String(v.src)].map((c) => M[c] || c).join('');
      return ok(s + '\n\n只替换内置常用字，属于娱乐玩法。');
    },
  },
  sensitive: {
    placeholder: '要自查的一段文案', sample: { src: '本产品全网最低价，绝对第一，包治百病，点击立即领取国家级大奖' },
    fields: () => [],
    run: (v) => {
      const WORDS = ['最', '第一', '顶级', '绝对', '全网最低', '包治百病', '根治', '国家级', '最高级', '唯一', '首选', '特效', '完全无副作用', '稳赚', '零风险', '保证收益', '虚假', '山寨', '点击领取', '免费领取', '限时抢购'];
      const s = String(v.src);
      const hits = WORDS.filter((w) => s.includes(w));
      const rows = hits.map((w) => [w, '疑似绝对化用语或高风险表述', String(s.split(w).length - 1) + ' 处']);
      return { text: hits.length ? `发现 ${hits.length} 类疑似表述：${hits.join('、')}\n\n这只是精简词表的自查提示，不构成法律意见，也不覆盖各平台动态规则。` : '内置词表里没有匹配到疑似表述。',
        copy: hits.join('\n'), preview: rows.length ? outTable(['命中词', '提示', '次数'], rows) : '',
        stats: [{ label: '命中类别', value: String(hits.length) }] };
    },
  },
  pinyin2hanzi: {
    placeholder: '拼音音节，例如 zhong 或 zhong guo', sample: { src: 'zhong guo' },
    fields: () => [],
    run: (v) => {
      const D = { zhong: '中众种重钟终忠衷肿仲', guo: '国果过锅裹郭果', yi: '一以已意义议异亦医衣依移疑宜艺', gong: '工公共功攻供宫弓恭躬龚贡', ju: '具局举句据剧巨聚距拒俱', shu: '书数树属术输舒叔熟署鼠束', ren: '人任认仁忍韧刃壬', min: '民敏闽悯皿泯', ai: '爱碍矮哀唉埃挨皑癌艾', hao: '好号豪毫耗浩皓嚎壕', tian: '天田添填甜舔腆', di: '地第低底抵弟帝递敌笛', shang: '上商尚伤赏晌裳', xia: '下夏吓霞侠峡狭厦', wen: '文问闻稳吻蚊纹雯紊', zi: '字自子资紫姿滋孜仔', tools: '工具', hello: '你好' };
      const syl = clean(v.src).toLowerCase().split(/\s+/).filter(Boolean);
      const rows = syl.map((s) => [s, D[s] ? [...D[s]].join(' ') : '未收录该音节']);
      return { text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n'), copy: rows.map((r) => r[1]).join(''),
        preview: outTable(['音节', '常用同音字'], rows), stats: [{ label: '音节数', value: String(syl.length) }] };
    },
  },
  stroke2hanzi: {
    placeholder: '笔画数，例如 4', sample: { src: '4' },
    fields: () => [],
    run: (v) => {
      const D = { 1: '一乙〇', 2: '二人十丁卜八九入几力乃又', 3: '三于干土大口山工女小上下子么之才', 4: '王天木水火日月文中云不无太五开分风', 5: '石田白目生用左右本禾未末立正平米', 6: '字老地同早向光先安好次江衣竹米自', 7: '李张陈吴何我你局言足走男里弟弟', 8: '林明青金空的果和知画事物青雨非', 9: '是星春香重面要看秋风美首南前', 10: '高家 school 时真谁能起海流通', 11: '黄曹梁 常做第着得情望', 12: '谢曾彭朝最等答黑然' };
      const n = Number(clean(v.src));
      if (!Number.isInteger(n) || n < 1 || n > 12) return { error: '内置数据覆盖 1–12 画' };
      const chars = (D[n] || '').replace(/[a-z ]/g, '');
      return ok(`${n} 画的常用字：${[...chars].join(' ')}\n\n笔画以现代规范汉字为准，不同字典对个别字归部略有差异。`,
        { stats: [{ label: '收录字数', value: String([...chars].length) }] });
    },
  },
  filetree: {
    placeholder: '一行一个路径', sample: { src: 'src/index.js\nsrc/utils/a.js\nsrc/utils/b.js\npublic/logo.svg\nREADME.md' },
    fields: () => [txt('sep', '层级符号', '缩进用的字符', '│   ')],
    run: (v) => {
      const paths = lines(v.src).map((x) => x.trim().replace(/^\.\//, '')).filter(Boolean);
      if (!paths.length) return { error: '请填至少一行路径' };
      const root = {};
      for (const p of paths) { let cur = root; for (const seg of p.split('/').filter(Boolean)) cur = (cur[seg] ||= {}); }
      const out = [];
      const walk = (node, prefix) => {
        const keys = Object.keys(node).sort((a, b) => {
          const ea = !Object.keys(node[a]).length, eb = !Object.keys(node[b]).length;
          return ea === eb ? a.localeCompare(b) : ea ? 1 : -1;
        });
        keys.forEach((k, i) => {
          const last = i === keys.length - 1, leaf = !Object.keys(node[k]).length;
          out.push(prefix + (last ? '└── ' : '├── ') + k + (leaf ? '' : '/'));
          if (!leaf) walk(node[k], prefix + (last ? '    ' : String(v.sep || '│   ')));
        });
      };
      walk(root, '');
      return ok('.\n' + out.join('\n'), { stats: [{ label: '路径数', value: String(paths.length) }, { label: '节点数', value: String(out.length) }] });
    },
  },

  /* ---------- 代码与网页格式 ---------- */
  html2js: {
    placeholder: 'HTML 片段', sample: { src: '<div class="box">\n  <span>你好</span>\n</div>' },
    fields: () => [sel('mode', '生成形式', ['每行字符串拼接', '模板字符串', 'document.write 形式'])],
    run: (v) => {
      const a = lines(v.src);
      let s;
      if (v.mode === '模板字符串') s = 'const html = `' + String(v.src).replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`;';
      else if (v.mode === 'document.write 形式') s = a.map((x) => `document.write(${JSON.stringify(x + '\n')});`).join('\n');
      else s = 'const html = [\n' + a.map((x) => '  ' + JSON.stringify(x) + ',').join('\n') + '\n].join("\\n");';
      return ok(s);
    },
  },
  htmlformat: {
    placeholder: 'HTML 源码', sample: { src: '<div><p>你好</p><span>世界</span></div>' },
    fields: () => [sel('dir', '方向', ['格式化', '压缩'])],
    run: (v) => {
      let s = String(v.src);
      if (v.dir === '压缩') return ok(s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim());
      s = s.replace(/>\s*</g, '>\n<').replace(/<!--/g, '\n<!--').replace(/-->/g, '-->\n');
      let depth = 0;
      const out = lines(s).map((l) => l.trim()).filter(Boolean).map((l) => {
        if (/^<\//.test(l)) depth = Math.max(0, depth - 1);
        const r = '  '.repeat(depth) + l;
        if (/^<[^/!?][^>]*[^/]>$/.test(l) && !/^<(br|img|input|meta|link|hr|source)\b/i.test(l)) depth++;
        return r;
      });
      return ok(out.join('\n'));
    },
  },
  jsformat: {
    placeholder: 'JS 源码', sample: { src: 'function add(a,b){return a+b;}const x=add(1,2);' },
    fields: () => [sel('dir', '方向', ['格式化', '压缩'])],
    run: (v) => {
      let s = String(v.src);
      if (v.dir === '压缩') return ok(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\s*([{}();,=+\-*/<>])\s*/g, '$1').replace(/\s{2,}/g, ' ').trim());
      let depth = 0, inStr = false;
      const out = [];
      for (const raw of lines(s)) {
        const l = raw.trim();
        if (!l) { out.push(''); continue; }
        if (/^[}\])]/.test(l)) depth = Math.max(0, depth - 1);
        out.push('  '.repeat(depth) + l);
        const opens = (l.match(/\{/g) || []).length, closes = (l.match(/\}/g) || []).length;
        depth = Math.max(0, depth + opens - closes);
      }
      return ok(out.join('\n'));
    },
  },
  cssformat: {
    placeholder: 'CSS 源码', sample: { src: 'body{margin:0;color:#333}.box{padding:8px}' },
    fields: () => [sel('dir', '方向', ['格式化', '压缩'])],
    run: (v) => {
      let s = String(v.src);
      if (v.dir === '压缩') return ok(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim());
      s = s.replace(/\s*\{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*\}\s*/g, '\n}\n\n');
      return ok(s.split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim());
    },
  },
  sqlformat: {
    placeholder: 'SQL 语句', sample: { src: 'select id,name from users where age>18 order by id desc' },
    fields: () => [sel('dir', '方向', ['格式化', '压缩']), chk('upper', '关键字大写', true)],
    run: (v) => {
      let s = String(v.src).trim();
      if (v.upper) s = s.replace(/\b(select|from|where|and|or|order by|group by|having|join|left join|right join|inner join|on|insert into|values|update|set|delete|limit|offset|as|distinct|create table|alter table|drop table|union|with|case|when|then|else|end)\b/gi, (m) => m.toUpperCase());
      if (v.dir === '压缩') return ok(s.replace(/\s+/g, ' ').trim());
      s = s.replace(/\s+(FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING|JOIN|LEFT JOIN|INNER JOIN|ON|LIMIT|UNION|VALUES|SET)\b/g, '\n$1')
        .replace(/,\s*/g, ',\n  ').replace(/;/g, ';\n');
      return ok(s.trim());
    },
  },
  px2rem: {
    placeholder: 'CSS 源码', sample: { src: '.box { padding: 16px; font-size: 14px; border: 1px solid #ccc; }' },
    fields: () => [num('base', '根字号', 16, 'px'), num('prec', '保留小数位', 4), chk('skip1', '1px 边框保留 px', true)],
    run: (v) => {
      const b = Math.max(1, Number(v.base)), p = Math.max(0, Math.min(6, Number(v.prec)));
      let n = 0;
      const s = String(v.src).replace(/(-?\d*\.?\d+)px\b/gi, (m, x) => {
        if (v.skip1 && Math.abs(Number(x)) === 1) return m;
        n++; return `${(Number(x) / b).toFixed(p).replace(/\.?0+$/, '')}rem`;
      });
      return ok(s, { stats: [{ label: '替换处', value: String(n) }, { label: '根字号', value: b + 'px' }] });
    },
  },
  html2lang: {
    placeholder: 'HTML 源码', sample: { src: '<h1>标题</h1>\n<p>正文</p>' },
    fields: () => [],
    run: (v, ctx, d) => {
      const lang = (d.p3 || '目标语言 PHP').replace('目标语言', '').trim();
      const a = lines(v.src);
      const conf = {
        PHP: ['<?php', "echo '", "';", '\\'],
        ASP: ['<%', 'Response.Write "', '"', '"'],
        JSP: ['<%', 'out.println("', '");', '\\'],
        Perl: ['', 'print qq{', '};', '\\'],
        Java: ['', 'System.out.println("', '");', '\\'],
        'VB.NET': ['', 'Response.Write("', '")', '"'],
      }[lang] || ['', "echo '", "';", '\\'];
      const escq = (s) => s.replace(/'/g, conf[3] + "'").replace(/"/g, conf[3] + '"');
      const body = a.map((x) => `  ${conf[1]}${escq(x)}${conf[2]}`).join('\n');
      return ok((conf[0] ? conf[0] + '\n' : '') + body + (lang === 'PHP' || lang === 'ASP' || lang === 'JSP' ? '\n' + (lang === 'PHP' ? '?>' : '%>') : ''));
    },
  },
  html2ubb: {
    placeholder: 'HTML 源码', sample: { src: '<b>加粗</b> <a href="https://www.gitd.cn/">链接</a>' },
    fields: () => [],
    run: (v) => {
      let s = String(v.src);
      s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?(b|strong)>/gi, (m) => m[1] === '/' ? '[/b]' : '[b]')
        .replace(/<\/?(i|em)>/gi, (m) => m[1] === '/' ? '[/i]' : '[i]')
        .replace(/<\/?u>/gi, (m) => m[1] === '/' ? '[/u]' : '[u]')
        .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, u, t) => `[url=${u}]${t}[/url]`)
        .replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (m, u) => `[img]${u}[/img]`)
        .replace(/<[^>]+>/g, '');
      return ok(s.trim());
    },
  },
  num2en: {
    placeholder: '整数或带两位小数的金额', sample: { src: '12345.67' },
    fields: () => [],
    run: (v) => {
      const s = clean(v.src);
      if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return { error: '请填整数或最多两位小数的数字' };
      const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      const under = (n) => n < 20 ? SMALL[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + SMALL[n % 10] : '') : SMALL[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + under(n % 100) : '');
      const neg = s.startsWith('-');
      const [int, frac] = s.replace('-', '').split('.');
      const n = Number(int);
      if (n > 999999999999) return { error: '数字太大，请控制在万亿以内' };
      const units = [[1000000000, 'billion'], [1000000, 'million'], [1000, 'thousand']];
      let rest = n, parts = [];
      for (const [u, name] of units) { const k = Math.floor(rest / u); if (k) { parts.push(under(k) + ' ' + name); rest %= u; } }
      if (rest || !parts.length) parts.push(under(rest));
      let word = (neg ? 'negative ' : '') + parts.join(', ');
      if (frac) word += ` point ${[...frac].map((c) => SMALL[+c]).join(' ')}`;
      return ok(word);
    },
  },
  metacheck: {
    placeholder: '粘贴网页 HTML 源码', sample: { src: '<html><head><title>示例</title><meta name="description" content="一段页面描述"></head><body></body></html>' },
    fields: () => [],
    run: (v) => {
      const doc = new DOMParser().parseFromString(String(v.src), 'text/html');
      const meta = (selq, attr = 'content') => doc.querySelector(selq)?.getAttribute(attr) || '';
      const rows = [
        ['title', doc.querySelector('title')?.textContent?.trim() || '缺失'],
        ['description', meta('meta[name="description"]') || '缺失'],
        ['keywords', meta('meta[name="keywords"]') || '缺失'],
        ['viewport', meta('meta[name="viewport"]') || '缺失'],
        ['canonical', doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '缺失'],
        ['og:title', meta('meta[property="og:title"]') || '缺失'],
        ['og:description', meta('meta[property="og:description"]') || '缺失'],
        ['og:image', meta('meta[property="og:image"]') || '缺失'],
        ['twitter:card', meta('meta[name="twitter:card"]') || '缺失'],
        ['robots', meta('meta[name="robots"]') || '未设置'],
        ['lang', doc.documentElement.getAttribute('lang') || '缺失'],
        ['h1 数量', String(doc.querySelectorAll('h1').length)],
        ['图片数 / 缺 alt', `${doc.querySelectorAll('img').length} / ${[...doc.querySelectorAll('img')].filter((x) => !x.getAttribute('alt')).length}`],
      ];
      const miss = rows.filter((r) => r[1] === '缺失').map((r) => r[0]);
      return { text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n') + (miss.length ? `\n\n缺失项：${miss.join('、')}` : '\n\n基础元信息齐全。'),
        copy: rows.map((r) => r.join('\t')).join('\n'), preview: outTable(['项目', '检测结果'], rows),
        stats: [{ label: '缺失项', value: String(miss.length) }] };
    },
  },
  htmllinks: {
    placeholder: '粘贴 HTML 源码', sample: { src: '<a href="/a/">A</a><img src="/logo.png"><a href="https://example.org/">外站</a>' },
    fields: () => [sel('kind', '提取类型', ['全部链接', '仅 a 链接', '仅图片', '仅外站链接'])],
    run: (v) => {
      const doc = new DOMParser().parseFromString(String(v.src), 'text/html');
      const base = doc.querySelector('base')?.getAttribute('href') || '';
      const resolve = (u) => { try { return new URL(u, base || location.href).href; } catch (e) { return u; } };
      const a = [...doc.querySelectorAll('a[href]')].map((x) => ['链接', x.getAttribute('href'), x.textContent.trim().slice(0, 40)]);
      const img = [...doc.querySelectorAll('img[src]')].map((x) => ['图片', x.getAttribute('src'), x.getAttribute('alt') || '']);
      let rows = v.kind === '仅 a 链接' ? a : v.kind === '仅图片' ? img : [...a, ...img];
      if (v.kind === '仅外站链接') rows = rows.filter((r) => /^https?:/i.test(r[1]) && resolve(r[1]).startsWith('http') && !resolve(r[1]).includes(location.hostname));
      const urls = rows.map((r) => resolve(r[1]));
      return { text: [...new Set(urls)].join('\n') || '没有提取到链接', copy: [...new Set(urls)].join('\n'),
        preview: outTable(['类型', '原始地址', '文字或 alt'], rows, 300),
        stats: [{ label: '提取数量', value: String(rows.length) }] };
    },
  },
  cookieparse: {
    placeholder: 'Cookie 字符串', sample: { src: 'sid=abc123; theme=light; Path=/; HttpOnly' },
    fields: () => [sel('mode', '输出形式', ['键值表', 'JSON', 'document.cookie 逐条赋值'])],
    run: (v) => {
      const rows = String(v.src).split(';').map((x) => x.trim()).filter(Boolean).map((x) => {
        const i = x.indexOf('=');
        return i < 0 ? ['属性', x, ''] : [x.slice(0, i).trim(), x.slice(i + 1).trim(), ''];
      });
      const kv = rows.filter((r) => r[0] !== '属性');
      if (v.mode === 'JSON') return ok(JSON.stringify(Object.fromEntries(kv.map((r) => [r[0], r[1]])), null, 2));
      if (v.mode === 'document.cookie 逐条赋值') return ok(kv.map((r) => `document.cookie = ${JSON.stringify(r[0] + '=' + r[1] + '; path=/')};`).join('\n'));
      return { text: kv.map((r) => `${r[0]} = ${r[1]}`).join('\n'), copy: String(v.src),
        preview: outTable(['键或属性', '值', '备注'], rows.map((r, i) => [r[0], r[1], r[0] === '属性' ? 'Cookie 属性，不是键值对' : ''])),
        stats: [{ label: '键值对', value: String(kv.length) }] };
    },
  },
  urlbatch: {
    placeholder: '前缀或含 {n} 的模板', sample: { src: 'https://example.org/page/{n}.html' },
    fields: () => [num('from', '起始数字', 1), num('to', '结束数字', 10), num('width', '补零位数', 0)],
    run: (v) => {
      const a = Math.ceil(Number(v.from)), b = Math.floor(Number(v.to)), w = Math.max(0, Math.min(8, Number(v.width)));
      if (!Number.isFinite(a) || !Number.isFinite(b) || b < a || b - a > 2000) return { error: '请填合理区间，最多 2000 条' };
      const tpl = String(v.src).trim();
      if (!tpl) return { error: '请填网址模板，用 {n} 表示数字' };
      const out = [];
      for (let i = a; i <= b; i++) out.push(tpl.replace(/\{n\}/g, String(i).padStart(w, '0')));
      return ok(out.join('\n'), { stats: [{ label: '生成条数', value: String(out.length) }] });
    },
  },
  svg2css: {
    placeholder: 'SVG 源码', sample: { src: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#2f5bd7"/></svg>' },
    fields: () => [sel('mode', '编码方式', ['URL 编码', 'Base64'])],
    run: (v) => {
      const s = String(v.src).trim().replace(/\s{2,}/g, ' ').replace(/\n/g, '');
      if (!/^<svg[\s\S]*<\/svg>$/i.test(s)) return { error: '请粘贴完整的 <svg>…</svg> 源码' };
      const data = v.mode === 'Base64'
        ? 'data:image/svg+xml;base64,' + L.bytesToB64(new TextEncoder().encode(s))
        : 'data:image/svg+xml,' + encodeURIComponent(s).replace(/'/g, '%27').replace(/"/g, "'");
      return ok(`background-image: url("${data}");\nbackground-repeat: no-repeat;\nbackground-size: contain;`,
        { preview: `<div style="width:100%;height:120px;background-color:#f6f8fb;background-position:center;background-image:url('${data.replace(/"/g, '&quot;')}')"></div>` });
    },
  },
  htaccess: {
    placeholder: '.htaccess 内容', sample: { src: 'RewriteEngine On\nRewriteRule ^old$ /new [R=301,L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteRule ^(.*)$ index.php [L]' },
    fields: () => [],
    run: (v) => {
      const out = [];
      for (const raw of lines(v.src)) {
        const l = raw.trim();
        if (!l || l.startsWith('#')) continue;
        if (/^RewriteEngine\s+On/i.test(l)) { out.push('# Nginx 默认开启 rewrite 模块，无需对应指令'); continue; }
        let m = l.match(/^RewriteRule\s+(\S+)\s+(\S+)\s*\[([^\]]*)\]/i);
        if (m) {
          const flags = m[3].split(',').map((x) => x.trim().toLowerCase());
          const perm = flags.some((x) => x.startsWith('r=301')) ? 'permanent' : flags.some((x) => x.startsWith('r=')) ? 'redirect' : '';
          const last = flags.includes('l') ? ' last' : '';
          const from = m[1].replace(/^\^/, '^/').replace(/\$$/, '$');
          const to = m[2].startsWith('/') ? m[2] : '/' + m[2];
          out.push(`rewrite ${from} ${to}${perm ? ' ' + perm : ''}${last ? ';' : ';'}`);
          continue;
        }
        m = l.match(/^RewriteCond\s+(\S+)\s+(\S+)\s*(.*)$/i);
        if (m) {
          if (/!-f/.test(m[2])) out.push('if (!-f $request_filename) {   # 对应 ' + l);
          else if (/!-d/.test(m[2])) out.push('if (!-d $request_filename) {   # 对应 ' + l);
          else out.push('# 条件需人工改写：' + l);
          continue;
        }
        if (/^Deny from all/i.test(l)) { out.push('deny all;'); continue; }
        if (/^Allow from all/i.test(l)) { out.push('allow all;'); continue; }
        out.push('# 需人工改写：' + l);
      }
      return ok(out.join('\n') + '\n\n只转换最常见的重写规则，复杂条件与变量映射需人工核对。');
    },
  },
  supersub: {
    placeholder: '电话号码或数字', sample: { src: '13800138000' },
    fields: () => [sel('mode', '形式', ['上标', '下标'])],
    run: (v) => {
      const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
      const table = v.mode === '上标' ? SUP : SUB;
      const s = [...String(v.src)].map((c) => /\d/.test(c) ? table[+c] : v.mode === '上标' ? ({ '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾' }[c] ?? c) : ({ '+': '₊', '-': '₋', '(': '₍', ')': '₎' }[c] ?? c)).join('');
      return ok(s);
    },
  },
};
