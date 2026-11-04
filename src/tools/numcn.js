import { formTool } from '/kit.js';
const CN = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNIT = ['', '拾', '佰', '仟'];
const BIG = ['', '万', '亿', '兆'];
const TRAD = { 零: '零', 壹: '壹', 贰: '貳', 叁: '參', 肆: '肆', 伍: '伍', 陆: '陸', 柒: '柒', 捌: '捌', 玖: '玖', 拾: '拾', 佰: '佰', 仟: '仟', 万: '萬', 亿: '億', 兆: '兆', 元: '圓', 角: '角', 分: '分', 整: '整', 负: '負' };
function intPart(n) {
  if (n === 0) return '零';
  let out = '', group = 0, zero = false;
  while (n > 0) {
    const g = n % 10000; n = Math.floor(n / 10000);
    let s = '', gZero = false, t = g, pos = 0;
    if (g === 0) { group++; zero = true; continue; }
    while (t > 0) {
      const d = t % 10;
      if (d === 0) { gZero = true; }
      else {
        if (gZero || (zero && s === '')) s = '零' + s;
        s = CN[d] + UNIT[pos] + s; gZero = false;
      }
      t = Math.floor(t / 10); pos++;
    }
    out = s + BIG[group] + (zero && out ? '零' : '') + out;
    zero = false; group++;
  }
  return out.replace(/零+/g, '零').replace(/零$/, '');
}
export default formTool({
  fields: [
    { id: 'amount', label: '金额', type: 'text', default: '12345.67', placeholder: '例如 12345.67' },
    { id: 'trad', label: '繁体字形', type: 'checkbox', default: false },
  ],
  titleIn: '数字金额', titleOut: '人民币大写', primary: '复制大写金额',
  sample: { amount: '12345.67' },
  compute(v) {
    const raw = String(v.amount || '').trim().replace(/[,，\s￥¥]/g, '');
    if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) return { error: '请输入最多两位小数的金额，例如 12345.67。' };
    const neg = raw.startsWith('-');
    const [i, d = ''] = raw.replace('-', '').split('.');
    const n = Number(i);
    if (n > 999999999999) return { error: '数字太大了，超出常规金额范围。' };
    let s = intPart(n) + '元';
    const jiao = d[0] || '0', fen = d[1] || '0';
    if (jiao === '0' && fen === '0') s += '整';
    else {
      if (jiao !== '0') s += CN[Number(jiao)] + '角';
      else if (fen !== '0') s += '零';
      if (fen !== '0') s += CN[Number(fen)] + '分';
    }
    if (neg) s = '负' + s;
    if (v.trad) s = [...s].map((c) => TRAD[c] || c).join('');
    const text = `¥ ${raw}\n${s}`;
    return { text, copy: s, stats: [{ label: '金额', value: '¥' + raw }] };
  },
});
