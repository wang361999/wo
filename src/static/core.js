/* 通用函数库：所有工具共享的纯函数，零依赖、浏览器 ESM。 */
import { crc32 } from '/lib/zip.js';
import { D } from '/data.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const round = (n, d = 2) => { const p = 10 ** d; return Math.round((Number(n) + Number.EPSILON) * p) / p; };
export const fmt = (n, d = 2) => {
  if (!isFinite(n)) return '—';
  return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
};
export const pad = (n, w = 2) => String(n).padStart(w, '0');

/* ---------- 字节与编码 ---------- */
export const utf8 = (s) => new TextEncoder().encode(String(s));
export const fromUtf8 = (b) => new TextDecoder('utf-8').decode(new Uint8Array(b));
export const bytesToB64 = (b) => {
  const u = new Uint8Array(b); let s = '';
  for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  return btoa(s);
};
export const b64ToBytes = (s) => {
  const bin = atob(String(s).replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/'));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
};
export const b64 = (s) => bytesToB64(utf8(s));
export const unb64 = (s) => { try { return fromUtf8(b64ToBytes(s)); } catch (e) { throw new Error('不是合法的 Base64'); } };
export const bytesToHex = (b, sep = '') => Array.from(new Uint8Array(b), (x) => pad(x.toString(16), 2)).join(sep);
export const hexToBytes = (s) => {
  const t = String(s).replace(/[^0-9a-fA-F]/g, '');
  if (t.length % 2) throw new Error('十六进制长度必须为偶数');
  const u = new Uint8Array(t.length / 2);
  for (let i = 0; i < u.length; i++) u[i] = parseInt(t.substr(i * 2, 2), 16);
  return u;
};
export const hex = (s) => bytesToHex(utf8(s));
export const unhex = (s) => fromUtf8(hexToBytes(s));

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', times: '×', divide: '÷', deg: '°', plusmn: '±', micro: 'µ', middot: '·', yen: '¥', euro: '€', pound: '£', cent: '¢', sect: '§', para: '¶', bull: '•', larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', hearts: '♥', spades: '♠', clubs: '♣', diams: '♦' };
export const htmlEncode = (s, full = false) => full
  ? Array.from(String(s)).map((c) => c === '&' ? '&amp;' : `&#${c.codePointAt(0)};`).join('')
  : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export const htmlDecode = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, k) => {
  if (k[0] === '#') { const n = k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10); try { return String.fromCodePoint(n); } catch (e) { return m; } }
  return ENT[k.toLowerCase()] ?? m;
});

export const toEscapes = (s) => Array.from(String(s)).map((c) => {
  const n = c.codePointAt(0);
  return n > 0xffff ? `\\u{${n.toString(16)}}` : `\\u${pad(n.toString(16), 4)}`;
}).join('');
export const fromEscapes = (s) => String(s).replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|&#x([0-9a-f]+);|&#(\d+);|U\+([0-9a-f]{4,6})/gi,
  (m, a, b, c, d, e) => { const n = parseInt(a || b || c || d || e, a || b || c || e ? 16 : 10); try { return String.fromCodePoint(n); } catch (err) { return m; } });

/* ---------- 文本 ---------- */
export const lines = (s) => String(s ?? '').split(/\r?\n/);
export const nonEmptyLines = (s) => lines(s).map((x) => x.trim()).filter(Boolean);
export const uniq = (arr) => Array.from(new Set(arr));
export const sortUniq = (arr) => uniq(arr).sort((a, b) => a.localeCompare(b, 'zh-CN'));
export const setOp = (a, b, op) => {
  const A = new Set(a), B = new Set(b);
  if (op === 'union') return Array.from(new Set([...A, ...B]));
  if (op === 'inter') return [...A].filter((x) => B.has(x));
  if (op === 'diff') return [...A].filter((x) => !B.has(x));
  return [...new Set([...A, ...B])].filter((x) => !(A.has(x) && B.has(x)));
};
export const wordcount = (s) => {
  const t = String(s ?? '');
  const cn = (t.match(/[\u3400-\u9fff]/g) || []).length;
  const en = (t.match(/[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g) || []).length;
  const digit = (t.match(/\d+/g) || []).length;
  const punct = (t.match(/[，。！？；：、,.!?;:'"“”‘’（）()\[\]【】—…·]/g) || []).length;
  const nonSpace = t.replace(/\s/g, '').length;
  const chars = Array.from(t).length;
  return { cn, en, digit, punct, nonSpace, chars, rows: t ? lines(t).length : 0, words: cn + en + digit, minutes: Math.max(0.1, (cn / 350 + en / 200)) };
};
export const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
const splitWords = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').replace(/([a-zA-Z])([\u4e00-\u9fff])|([\u4e00-\u9fff])([a-zA-Z])/g, '$1$3 $2$4').trim().split(/[\s\u4e00-\u9fff]+|(?<=[\u4e00-\u9fff])/).filter(Boolean);
export const caseCvt = (s, style) => {
  const raw = String(s ?? '').trim();
  const w = splitWords(raw).map((x) => x.toLowerCase());
  if (!w.length) return '';
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  switch (style) {
    case 'camel': return w[0] + w.slice(1).map(cap).join('');
    case 'pascal': return w.map(cap).join('');
    case 'snake': return w.join('_');
    case 'kebab': return w.join('-');
    case 'constant': return w.join('_').toUpperCase();
    case 'dot': return w.join('.');
    case 'title': return w.map(cap).join(' ');
    case 'sentence': return cap(w.join(' '));
    case 'lower': return w.join(' ').toLowerCase();
    case 'upper': return w.join(' ').toUpperCase();
    default: return raw;
  }
};
export const diffLines = (a, b) => {
  const A = lines(a), B = lines(b);
  const m = A.length, n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0; const out = [];
  while (i < m || j < n) {
    if (i < m && j < n && A[i] === B[j]) { out.push(`  ${A[i]}`); i++; j++; }
    else if (j < n && (i === m || dp[i][j + 1] >= dp[i + 1][j])) { out.push(`+ ${B[j++]}`); }
    else { out.push(`- ${A[i++]}`); }
  }
  return out;
};

/* ---------- 摩斯 / 罗马 ---------- */
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '@': '.--.-.', '-': '-....-', '(': '-.--.', ')': '-.--.-', ':': '---...', '=': '-...-', '+': '.-.-.', "'": '.----.' };
const MORSE_R = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
export const morseEnc = (s) => String(s).toUpperCase().split('').map((c) => MORSE[c] || '').filter(Boolean).join(' ');
export const morseDec = (s) => String(s).trim().split(/\s+/).map((x) => MORSE_R[x] || '?').join('');
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export const toRoman = (n) => {
  const x = Number(n);
  if (!Number.isInteger(x) || x < 1 || x > 3999) throw new Error('只支持 1–3999 的整数');
  let r = '', v = x;
  for (const [num, sym] of ROMAN) while (v >= num) { r += sym; v -= num; }
  return r;
};
export const fromRoman = (s) => {
  const t = String(s).trim().toUpperCase();
  if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(t) || !t) throw new Error('不是合法的罗马数字写法');
  let i = 0, n = 0;
  const val = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  while (i < t.length) {
    if (val[t[i + 1]] > val[t[i]]) { n += val[t[i + 1]] - val[t[i]]; i += 2; }
    else { n += val[t[i]]; i++; }
  }
  if (toRoman(n) !== t) throw new Error('写法不标准（如 IIII 应为 IV）');
  return n;
};

/* ---------- 人民币大写 / 简繁 / 拼音 ---------- */
const CN_NUM = '零壹贰叁肆伍陆柒捌玖';
const CN_NUM_S = '零一二三四五六七八九';
const CN_UNIT = ['', '拾', '佰', '仟'];
const CN_BIG = ['', '万', '亿', '万亿'];
export const numCN = (amount, trad = false) => {
  const n = Number(amount);
  if (!isFinite(n)) throw new Error('请输入有效金额');
  if (Math.abs(n) >= 1e15) throw new Error('金额太大');
  const neg = n < 0;
  let x = Math.abs(n);
  const int = Math.floor(x);
  const dec = round(x - int, 2);
  const digits = trad ? '零壹贰叁肆伍陆柒捌玖' : '零一二三四五六七八九';
  const smallUnit = trad ? ['', '拾', '佰', '仟'] : ['', '十', '百', '千'];
  const bigUnit = trad ? ['', '万', '亿', '兆'] : ['', '万', '亿', '兆'];
  const jiao = trad ? '角' : '角', fen = trad ? '分' : '分', yuan = trad ? '圓' : '元', zheng = trad ? '正' : '整';
  const dset = trad ? CN_NUM : CN_NUM_S;
  function group(g) {
    let r = '', zero = false;
    for (let i = 3; i >= 0; i--) {
      const d = Math.floor(g / (10 ** i)) % 10;
      if (d === 0) { if (r) zero = true; }
      else { if (zero) { r += dset[0]; zero = false; } r += dset[d] + smallUnit[i]; }
    }
    return r;
  }
  let s = '';
  if (int === 0) s = dset[0];
  else {
    let v = int, gi = 0; const gs = [];
    while (v > 0) { gs.push(v % 10000); v = Math.floor(v / 10000); gi++; }
    for (let i = gs.length - 1; i >= 0; i--) {
      const g = group(gs[i]);
      if (g) { s += (s && gs[i] < 1000 && i === gs.length - 1 ? dset[0] : '') + g + bigUnit[i]; }
      else if (s && i > 0) { /* 段间零由下一段处理 */ }
    }
    s = s.replace(new RegExp(`${dset[0]}{2,}`, 'g'), dset[0]).replace(new RegExp(`${dset[0]}$`), '');
  }
  s += yuan;
  const cents = Math.round(dec * 100);
  const j = Math.floor(cents / 10), f = cents % 10;
  if (cents === 0) s += zheng;
  else { if (j) s += dset[j] + jiao; else if (int) s += dset[0]; if (f) s += dset[f] + fen; else s += zheng; }
  return (neg ? '负' : '') + s;
};

const ZH_S = '万与专亚产车东乐习书买云亏区历办双发变对开开关无关中国为丰临个丰丽举么义之乌乐乔乡买书也习乡买乱争于亏云亚产亩亲亵亸亿仅从仑仓仪们众优伙会伛伞伟传伤伥伦伧伪伫体余佣佥侠侣侥侦侧侨侩侪侬俣俦俨俩俪俭债倾偬偻偾偿傥傧储傩儿兑兖党兰共关兴兹养兽冁内冈册写军农冯冲决况净凉凌减凑凛几凤凫凭凯击凿刍划刘则刚创删别刬刭刳刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勐勒勚匀匦匮区医华协单卖卢卤卧卫却卺厂厅历厉压厌厍厐厓厔厜厝厣厕厤厥厮厫厵县叁参叆叇双发变叙叠叶号叹吓吕吗吣吨听启吴呒呓呕呖呗员呙呛呜咏咔咛咝咤咴咸哌响哑哒哓哔哕哗哙哚哜哝哟唛唝唠唡唢唣唤唿啧啬啭啮啰啴啸喷喽喾嗫嗳嘘嘤颚颉颙颛颟颡颢颧风飏飐飑飒飓飔飕飖飗飘飙飚飞食饥饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饸饹饻饽饿馀馁馂馃馄馅馆馇馈馉馊馋馌馍馎馏馐馑馒馓馔馕马驭驮驯驰驱驲驳驴驵驶驷驸驹驺驻驼驽驾驿骀骁骂骃骄骅骆骇骈骉骊骋验骍骎骏骐骑骒骓骕骖骗骘骙骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋髌鬓魉魍魑鸢鸥鸦鸧鸨鸩鸪鸫鸬鸮鸱鸲鸳鸴鸵鸶鸷鸸鸹鸺鸿鸾鹀鹁鹂鹃鹄鹅鹆鹇鹈鹉鹋鹌鹍鹎鹏鹐鹑鹒鹓鹔鹕鹖鹗鹘鹙鹚鹛鹜鹝鹞鹟鹠鹡鹢鹣鹤鹥鹦鹧鹨鹩鹪鹫鹬鹭鹮鹯鹰鹱鹲鹳鹴鹾麦麸黄黉黩黪黾鼋鼍鼗鼹齄齐齑齿龀龁龂龃龄龅龆龇龈龉龊龋龌龙龚龛龟志制';
const ZH_T = '萬與專亞產車東樂習書買雲虧區歷辦雙發變對開開關無關中國為豐臨個豐麗舉麼義之烏樂喬鄉買書也習鄉買亂爭於虧雲亞產畝親褻嚲億僅從侖倉儀們眾優夥會傴傘偉傳傷倀倫傖偽佇體餘傭僉俠侶僥偵側僑儈儕儂俁儔儼倆儷儉債傾傯僂僨償儻儐儲儺兒兌兗黨蘭共關興茲養獸囅內岡冊寫軍農馮沖決況淨涼凌減湊凜幾鳳鳧憑凱擊鑿芻劃劉則剛創刪別剗剄刳劌剴劑剮劍剝劇勸辦務勱動勵勁勞勢勳勐勒勩勻匭匱區醫華協單賣盧鹵臥衛卻巹廠廳歷厲壓厭厙龐厓厔厜厝厴廁厤厥廝厫厵縣叁參靉靆雙發變敘疊葉號嘆嚇呂嗎唚噸聽啟吳嘸囈嘔嚦唄員咼嗆嗚詠咔嚀噝吒咴鹹哌響啞噠嘵嗶噦嘩噲哚嚌噥喲嘜嗊嘮啢嗩唣喚唿嘖嗇囀齧囉嘽嘯噴嘍嚳囁噯噓嚶顎頡顒顓顢顙顥顴風颺颭颮颯颶颸颼颻飀飄飆飚飛食飢飥餳飩餼飪飫飭飯飲餞飾飽飼飿飴餌饒餉餄餎餻餑餓餘餒餕餜餛餡館餷饋餶餿饞饁饃餺餾饈饉饅饊饌饢馬馭馱馴馳驅馹駁驢駔駛駟駙駒騶駐駝駑駕驛駘驍罵駰驕驊駱駭駢驫驪騁驗騂駸駿騏騎騍騅驌驂騙騭騤騷騖驁騮騫騸驃騾驄驏驟驥驦驤髏髖髕鬢魎魍魑鳶鷗鴉鶬鴇鴆鴣鶇鸕鴞鴟鴝鴛鴬鴕鷥鷙鴯鴰鵂鴻鸞鵐鵓鸝鵑鵠鵝鵒鷴鵜鵡鶓鵪鵾鵎鵬鵐鶉鶊鵷鷫鶘鶡鶚鶻鶖鶿鶥鶩鷊鷂鶟鶠鶺鷁鶼鶴鷥鸚鷓鷯鷦鷲鷸鷺鹮鸇鷹鸌鸏鸛鸘鹺麥麩黃黌黷黲黽黿鼉鞀鼴齇齊齏齒齔齕齗齟齡齙齠齜齦齬齪齲齷龍龔龕龜志製';
const zhPair = (() => { const m = {}; for (let i = 0; i < ZH_S.length; i++) m[ZH_S[i]] = ZH_T[i] || ZH_S[i]; return m; })();
const zhPairR = (() => { const m = {}; for (let i = 0; i < ZH_S.length; i++) m[ZH_T[i] || ZH_S[i]] = ZH_S[i]; return m; })();
export const zhConv = (s, dir = 's2t') => String(s).replace(/./g, (c) => (dir === 's2t' ? zhPair : zhPairR)[c] || c);

const PY = '一yi 二er 三san 四si 五wu 六liu 七qi 八ba 九jiu 十shi 零ling 百bai 千qian 万wan 亿yi 中zhong 国guo 人ren 大da 小xiao 天tian 地di 日ri 月yue 水shui 火huo 山shan 木mu 金jin 土tu 上shang 下xia 左zuo 右you 前qian 后hou 东dong 南nan 西xi 北bei 春chun 夏xia 秋qiu 冬dong 风feng 雨yu 雪xue 云yun 花hua 草cao 树shu 鸟niao 鱼yu 马ma 牛niu 羊yang 猫mao 狗gou 爱ai 好hao 美mei 学xue 生sheng 老lao 师shi 书shu 字zi 文wen 语yu 数shu 名ming 字zi 家jia 门men 路lu 车che 吃chi 喝he 睡shui 走zou 跑pao 看kan 听ting 说shuo 读du 写xie 开kai 关guan 来lai 去qu 出chu 入ru 多duo 少shao 高gao 长chang 新xin 旧jiu 白bai 黑hei 红hong 绿lv 蓝lan 黄huang 我wo 你ni 他ta 她ta 它ta 们men 这zhe 那na 是shi 不bu 有you 无wu 在zai 和he 与yu 的de 了le 吗ma 呢ne 啊a 请qing 谢xie 对dui 错cuo 工gong 作zuo 时shi 间jian 年nian 今jin 明ming 昨zuo 早zao 晚wan 午wu 分fen 秒miao 点dian 号hao 电dian 话hua 手shou 机ji 网wang 站zhan 页ye 图tu 片pian 音yin 乐le 影ying 视shi 朋peng 友you 心xin 情qing 快kuai 乐le 慢man 冷leng 热re 安an 全quan 平ping 方fang 法fa 问wen 题ti 答da 案an 结jie 果guo 开kai 始shi 结jie 束shu 世shi 界jie 生sheng 活huo 工gong 具ju 箱xiang 一yi 页ye';
const PY_MAP = (() => { const m = {}; PY.split(' ').forEach((x) => { if (!m[x[0]]) m[x[0]] = x.slice(1); }); return m; })();
export const pinyin = (s, mode = 'tone') => {
  const out = Array.from(String(s)).map((c) => {
    const p = PY_MAP[c];
    if (!p) return /[\u3400-\u9fff]/.test(c) ? c : c;
    if (mode === 'first') return p[0];
    if (mode === 'num') return p.replace(/[āáǎà]/g, 'a1').replace(/[ēéěè]/g, 'e1').replace(/[īíǐì]/g, 'i1').replace(/[ōóǒò]/g, 'o1').replace(/[ūúǔù]/g, 'u1');
    return p;
  });
  return mode === 'first' ? out.join('') : out.join(' ');
};

/* ---------- 数值 / 进制 ---------- */
export const radixCvt = (s, from, to) => {
  const t = String(s).trim().replace(/\s/g, '');
  if (!t) return '';
  let n;
  try { n = BigInt(from === 10 ? t : (from === 16 ? (t.startsWith('0x') ? t : '0x' + t) : from === 2 ? '0b' + t : from === 8 ? '0o' + t : t)); }
  catch (e) { throw new Error('输入的数字与所选进制不符'); }
  return n.toString(to).toUpperCase();
};
export const toRadixAll = (s, from) => ({ 2: radixCvt(s, from, 2), 8: radixCvt(s, from, 8), 10: radixCvt(s, from, 10), 16: radixCvt(s, from, 16) });

/* ---------- 哈希（同步纯 JS 实现） ---------- */
function md5(str) {
  const b = utf8(str), len = b.length;
  const withPad = new Uint8Array(((len + 8) >> 6) + 1 << 6);
  withPad.set(b); withPad[len] = 0x80;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 8, len * 8, true);
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const X = new Uint32Array(16);
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) X[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const tmp = D; D = C; C = B;
      B = (B + (((A + F + K[i] + X[g]) >>> 0) << S[i] | (A + F + K[i] + X[g]) >>> (32 - S[i]))) >>> 0;
      A = tmp;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return [a0, b0, c0, d0].map((x) => { const v = new Uint8Array(4); new DataView(v.buffer).setUint32(0, x, true); return bytesToHex(v); }).join('');
}
function sha256(str) {
  const b = utf8(str), len = b.length;
  const padded = new Uint8Array(((len + 9) >> 6) + 1 << 6);
  padded.set(b); padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  const bitLen = BigInt(len) * 8n;
  dv.setUint32(padded.length - 8, Number(bitLen & 0xffffffffn), false);
  dv.setUint32(padded.length - 4, Number(bitLen >> 32n), false);
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) { const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3); const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0; }
    let [a, b2, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b2) ^ (a & c) ^ (b2 & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b2; b2 = a; a = (t1 + t2) >>> 0;
    }
    H = H.map((x, i) => (x + [a, b2, c, d, e, f, g, h][i]) >>> 0);
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}
function sha1(str) {
  const b = utf8(str), len = b.length;
  const padded = new Uint8Array(((len + 9) >> 6) + 1 << 6);
  padded.set(b); padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  const bitLen = BigInt(len) * 8n;
  dv.setUint32(padded.length - 8, Number(bitLen >> 32n), false);
  dv.setUint32(padded.length - 4, Number(bitLen & 0xffffffffn), false);
  let H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Uint32Array(80);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 80; i++) w[i] = ((w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]) << 1 | (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]) >>> 31) >>> 0;
    let [a, b2, c, d, e] = H;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b2 & c) | (~b2 & d); k = 0x5a827999; }
      else if (i < 40) { f = b2 ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b2 & c) | (b2 & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b2 ^ c ^ d; k = 0xca62c1d6; }
      const t = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = ((b2 << 30) | (b2 >>> 2)) >>> 0; b2 = a; a = t;
    }
    H = H.map((x, i) => (x + [a, b2, c, d, e][i]) >>> 0);
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}
export const hash = (s, algo = 'md5') => {
  if (algo === 'md5') return md5(s);
  if (algo === 'sha1') return sha1(s);
  if (algo === 'sha256') return sha256(s);
  throw new Error('仅支持 MD5 / SHA-1 / SHA-256');
};
export { crc32 };

/* ---------- 随机 ---------- */
export const uuid = () => {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export const randBytes = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; };
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const randStr = (len, set = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*') => {
  let s = ''; const b = randBytes(len);
  for (let i = 0; i < len; i++) s += set[b[i] % set.length];
  return s;
};
export const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (arr) => arr[randInt(0, arr.length - 1)];

/* ---------- 日期 ---------- */
export const parseDate = (s) => {
  const t = String(s).trim().replace(/[年月/\.]/g, '-').replace(/日/g, '');
  const d = new Date(t);
  if (isNaN(d.getTime())) throw new Error('日期格式不对，试试 2026-01-01');
  return d;
};
export const fmtDate = (d, withTime = false) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${withTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` : ''}`;
export const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
export const addMonths = (d, n) => { const x = new Date(d.getTime()); x.setMonth(x.getMonth() + n); return x; };
export const diffDays = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const weekdayCN = (d) => '日一二三四五六'[d.getDay()];
export const zodiac = (y) => '鼠牛虎兔龙蛇马羊猴鸡狗猪'[(y - 1900 + 12) % 12];
export const constellation = (m, d) => {
  const t = [[1, 20, '水瓶'], [2, 19, '双鱼'], [3, 21, '白羊'], [4, 20, '金牛'], [5, 21, '双子'], [6, 22, '巨蟹'], [7, 23, '狮子'], [8, 23, '处女'], [9, 23, '天秤'], [10, 24, '天蝎'], [11, 23, '射手'], [12, 22, '摩羯']];
  return (t.find((x) => x[0] === m && d < x[1]) || t.find((x) => x[0] === m) || ['摩羯'])[2] || '摩羯';
};
export const ageDetail = (birth, at = new Date()) => {
  const b = parseDate(birth);
  let y = at.getFullYear() - b.getFullYear(), m = at.getMonth() - b.getMonth(), d = at.getDate() - b.getDate();
  if (d < 0) { m--; const prev = new Date(at.getFullYear(), at.getMonth(), 0); d += prev.getDate(); }
  if (m < 0) { y--; m += 12; }
  const next = new Date(at.getFullYear(), b.getMonth(), b.getDate());
  if (next < at) next.setFullYear(at.getFullYear() + 1);
  return { years: y, months: m, days: d, totalDays: diffDays(b, at), nextBirthday: fmtDate(next), daysToBirthday: diffDays(at, next), zodiac: zodiac(b.getFullYear()), constellation: constellation(b.getMonth() + 1, b.getDate()) };
};
export const workdays = (a, b) => {
  let n = 0; const d = new Date(a), e = new Date(b);
  while (d <= e) { if (d.getDay() !== 0 && d.getDay() !== 6) n++; d.setDate(d.getDate() + 1); }
  return n;
};
export const lunarLite = (d) => {
  // 简易农历：以 1900-01-31 (庚子年正月初一) 为基准的常用算法（1900–2100）
  const info = [0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63];
  const base = Date.UTC(1900, 0, 31);
  const cur = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  let offset = Math.floor((cur - base) / 86400000);
  if (offset < 0 || d.getFullYear() > 2100) return '（超出农历范围）';
  let i = 0, year = 1900, days = 0;
  for (; year < 2101 && offset > 0; year++) {
    let sum = 348;
    for (let m = 0x8000; m > 0x8; m >>= 1) sum += (info[year - 1900] & m) ? 1 : 0;
    const leap = info[year - 1900] & 0xf;
    if (leap) sum += (info[year - 1900] & 0x10000) ? 30 : 29;
    if (offset < sum) break;
    offset -= sum; i++;
  }
  const leap = info[year - 1900] & 0xf;
  const isLeap = false;
  let m = 0, monthDays = 0;
  for (; m < 12 && offset >= 0; m++) {
    monthDays = (info[year - 1900] & (0x10000 >> m)) ? 30 : 29;
    if (leap && m === leap && !isLeap) { monthDays = (info[year - 1900] & 0x10000) ? 30 : 29; }
    if (offset < monthDays) break;
    offset -= monthDays;
  }
  const mn = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'][m] || '正';
  const dn = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'][offset] || '';
  return `${zodiac(year)}年 ${mn}月${dn}`;
};

/* ---------- 财务 ---------- */
export const pmt = (principal, annualRate, months) => {
  const r = annualRate / 12 / 100, P = principal;
  if (!r) return P / months;
  return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
};
export const loanSchedule = (principal, annualRate, months, mode = 'equal') => {
  const r = annualRate / 12 / 100;
  let rest = principal, totalInterest = 0; const rows = [];
  for (let i = 1; i <= months; i++) {
    const interest = rest * r;
    const principalPart = mode === 'equal' ? pmt(principal, annualRate, months) - interest : principal / months;
    const pay = interest + principalPart;
    rest = Math.max(0, rest - principalPart);
    totalInterest += interest;
    rows.push({ i, pay, interest, principalPart, rest });
  }
  return { rows, totalInterest, totalPay: principal + totalInterest, monthly: mode === 'equal' ? pmt(principal, annualRate, months) : principal / months + principal * r };
};
export const irr = (cashflows, guess = 0.01) => {
  let r = guess;
  for (let k = 0; k < 200; k++) {
    let f = 0, df = 0;
    cashflows.forEach((c, i) => { f += c / Math.pow(1 + r, i); df -= i * c / Math.pow(1 + r, i + 1); });
    if (Math.abs(df) < 1e-12) break;
    const nr = r - f / df;
    if (!isFinite(nr)) break;
    if (Math.abs(nr - r) < 1e-10) { r = nr; break; }
    r = nr;
  }
  return r;
};
export const compound = (principal, rate, years, monthly = 0, infl = 0) => {
  let v = principal, rows = [];
  for (let y = 1; y <= years; y++) {
    v = v * (1 + rate / 100) + monthly * 12;
    rows.push({ y, nominal: v, real: infl ? v / Math.pow(1 + infl / 100, y) : v });
  }
  return { final: v, real: infl ? v / Math.pow(1 + infl / 100, years) : v, contributed: principal + monthly * 12 * years, rows };
};
export const incomeTax = (monthly, special = 5000, deductions = 0, bonus = 0) => {
  const taxable = Math.max(0, monthly - special - deductions);
  const yearly = taxable * 12;
  let tax = 0, rate = 0, quick = 0;
  for (const [lo, hi, r, q] of D.tax.map((x) => [Number(x[0]), x[1] === 'Infinity' ? Infinity : Number(x[1]), Number(x[2]) / 100, Number(x[3])])) {
    if (yearly > lo) { rate = r; quick = q; }
  }
  tax = Math.max(0, yearly * rate - quick);
  let bonusTax = 0;
  if (bonus > 0) {
    const m = bonus / 12;
    let br = 0, bq = 0;
    for (const [lo, hi, r, q] of D.tax.map((x) => [Number(x[0]) / 12, x[1] === 'Infinity' ? Infinity : Number(x[1]) / 12, Number(x[2]) / 100, Number(x[3]) / 12])) if (m > lo) { br = r; bq = q; }
    bonusTax = Math.max(0, bonus * br - bq);
  }
  return { monthlyTax: tax / 12, yearlyTax: tax, rate, bonusTax, total: tax + bonusTax, taxable, after: monthly - tax / 12 - deductions };
};

/* ---------- 单位 ---------- */
export const unitGroups = D.units;
export const convertUnit = (value, from, to, group) => {
  const table = D.units[group];
  if (!table) throw new Error('找不到单位组');
  const f = table.find((x) => x[0] === from), t = table.find((x) => x[0] === to);
  if (!f || !t) throw new Error('单位名不存在');
  return Number(value) * Number(f[1]) / Number(t[1]);
};

/* ---------- 颜色 ---------- */
export const hex2rgb = (h) => {
  let s = String(h).trim().replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
export const rgb2hex = (r, g, b) => '#' + [r, g, b].map((x) => pad(clamp(Math.round(x), 0, 255).toString(16))).join('');
export const rgb2hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0; const l = (max + min) / 2;
  if (d) { s = l > .5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};
export const hsl2rgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)].map(Math.round);
};
export const luminance = (rgb) => {
  const [r, g, b] = rgb.map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
  return .2126 * r + .7152 * g + .0722 * b;
};
export const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

/* ---------- JSON ---------- */
export const jsonPath = (obj, path) => {
  if (!path || path === '$') return obj;
  return String(path).replace(/^\$\.?/, '').split(/[.\[\]'"]+/).filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), obj);
};
export const flattenJSON = (obj, prefix = '', out = {}) => {
  if (obj && typeof obj === 'object') Object.entries(obj).forEach(([k, v]) => flattenJSON(v, prefix ? `${prefix}.${k}` : k, out));
  else out[prefix] = obj;
  return out;
};
export const inferSchema = (v) => {
  if (v === null) return { type: 'null' };
  if (Array.isArray(v)) return { type: 'array', items: v.length ? inferSchema(v[0]) : {} };
  if (typeof v === 'object') {
    const p = {}, req = [];
    Object.entries(v).forEach(([k, x]) => { p[k] = inferSchema(x); req.push(k); });
    return { type: 'object', properties: p, required: req };
  }
  return { type: typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v === 'boolean' ? 'boolean' : 'string' };
};
export const schemaToTS = (schema, name = 'Root') => {
  const go = (s) => {
    if (!s || !s.type) return 'any';
    if (s.type === 'object') return `{ ${Object.entries(s.properties || {}).map(([k, v]) => `${JSON.stringify(k)}${(s.required || []).includes(k) ? '' : '?'}: ${go(v)};`).join(' ')} }`;
    if (s.type === 'array') return `${go(s.items)}[]`;
    if (s.type === 'integer' || s.type === 'number') return 'number';
    if (s.type === 'boolean') return 'boolean';
    if (s.type === 'null') return 'null';
    return 'string';
  };
  return `export interface ${name} ${go(schema)}`;
};
export const diffJSON = (a, b, path = '') => {
  const out = [];
  if (typeof a !== typeof b || a === null || b === null) { if (a !== b) out.push([path || '$', a, b]); return out; }
  if (typeof a !== 'object') { if (a !== b) out.push([path || '$', a, b]); return out; }
  if (Array.isArray(a) !== Array.isArray(b)) { out.push([path, a, b]); return out; }
  const keys = uniq([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in a)) out.push([p, undefined, b[k]]);
    else if (!(k in b)) out.push([p, a[k], undefined]);
    else out.push(...diffJSON(a[k], b[k], p));
  }
  return out;
};

/* ---------- CSV / 表格 ---------- */
export const parseCSV = (s, sep = ',') => {
  const rows = []; let row = [], cur = '', q = false;
  const t = String(s).replace(/\r/g, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
};
export const toCSV = (rows, sep = ',') => rows.map((r) => r.map((x) => {
  const s = String(x ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(sep)).join('\r\n');

/* ---------- 字幕 ---------- */
export const parseSubtitle = (text) => {
  const t = String(text).replace(/\r/g, '').trim();
  const cues = [];
  const time = (s) => {
    const m = String(s).match(/(\d{1,3}):(\d{1,2}):(\d{1,2})[.,](\d{1,3})|(\d{1,2}):(\d{1,2})[.,](\d{1,3})/);
    if (!m) return 0;
    if (m[1]) return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4].padEnd(3, '0')) / 1000;
    return (+m[5]) * 60 + (+m[6]) + (+m[7].padEnd(3, '0')) / 1000;
  };
  const fmtTime = (sec, fmt = 'srt') => {
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = Math.floor(sec % 60), ms = Math.round((sec % 1) * 1000);
    return fmt === 'vtt' ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}` : `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  };
  if (/-->/.test(t)) {
    t.split(/\n{2,}/).forEach((block) => {
      const ls = block.split('\n').filter(Boolean);
      const idx = ls.findIndex((l) => l.includes('-->'));
      if (idx < 0) return;
      const [a, b] = ls[idx].split(/\s*-->\s*/);
      cues.push({ start: time(a), end: time(b), text: ls.slice(idx + 1).join('\n') });
    });
  } else {
    t.split('\n').forEach((l) => {
      const m = l.match(/^\[(\d+):(\d+)[.:](\d+)\](.*)$/);
      if (m) cues.push({ start: (+m[1]) * 60 + (+m[2]) + (+m[3].padEnd(3, '0')) / 1000, end: 0, text: m[4].trim() });
      else if (l.trim()) cues.push({ start: 0, end: 0, text: l.trim() });
    });
  }
  return { cues, fmtTime };
};

/* ---------- IP / 网络 ---------- */
export const ip2long = (ip) => {
  const p = String(ip).trim().split('.').map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) throw new Error('不是合法的 IPv4 地址');
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
};
export const long2ip = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
export const cidrInfo = (cidr) => {
  const [ip, bits] = String(cidr).trim().split('/');
  const b = Number(bits);
  if (!Number.isInteger(b) || b < 0 || b > 32) throw new Error('掩码位数应为 0–32');
  const base = ip2long(ip), mask = b === 0 ? 0 : (0xffffffff << (32 - b)) >>> 0;
  const net = (base & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
  return { network: long2ip(net), broadcast: long2ip(bc), mask: long2ip(mask), first: long2ip(b === 32 ? net : net + 1), last: long2ip(b === 32 ? bc : bc - 1), hosts: b >= 31 ? 2 ** (32 - b) : 2 ** (32 - b) - 2, bits: b, contains: (x) => ((ip2long(x) & mask) >>> 0) === net };
};

/* ---------- 文件 / 图片 ---------- */
export const readFile = (file, as = 'arrayBuffer') => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result); r.onerror = () => rej(new Error('读取文件失败'));
  if (as === 'text') r.readAsText(file);
  else if (as === 'dataurl') r.readAsDataURL(file);
  else r.readAsArrayBuffer(file);
});
export const loadImage = (src) => new Promise((res, rej) => {
  const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('图片无法解码')); im.src = src;
});
export const imageFromFile = async (file) => loadImage(URL.createObjectURL(file));
export const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const canvasBlob = (c, type = 'image/png', q) => new Promise((res) => c.toBlob(res, type, q));
export const canvasU8 = async (c, type = 'image/png', q) => new Uint8Array(await (await canvasBlob(c, type, q)).arrayBuffer());

/* ---------- 其它 ---------- */
export const csvEscape = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
export const humanSize = (n) => { const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++; } return `${round(n, 2)} ${u[i]}`; };
export const lcsSimilarity = (a, b) => {
  const A = Array.from(a), B = Array.from(b);
  const dp = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = 1; i <= A.length; i++) for (let j = 1; j <= B.length; j++) dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[A.length][B.length]) / (A.length + B.length || 1);
};
export const csvToObjects = (s, sep = ',') => {
  const rows = parseCSV(s, sep);
  if (!rows.length) return [];
  const h = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ''])));
};

export { D };

/* ---------- 国密 SM3 摘要 / SM4 分组加密（纯 JS，本地运行） ---------- */
const SM4_SBOX = [0xd6,0x90,0xe9,0xfe,0xcc,0xe1,0x3d,0xb7,0x16,0xb6,0x14,0xc2,0x28,0xfb,0x2c,0x05,0x2b,0x67,0x9a,0x76,0x2a,0xbe,0x04,0xc3,0xaa,0x44,0x13,0x26,0x49,0x86,0x06,0x99,0x9c,0x42,0x50,0xf4,0x91,0xef,0x98,0x7a,0x33,0x54,0x0b,0x43,0xed,0xcf,0xac,0x62,0xe4,0xb3,0x1c,0xa9,0xc9,0x08,0xe8,0x95,0x80,0xdf,0x94,0xfa,0x75,0x8f,0x3f,0xa6,0x47,0x07,0xa7,0xfc,0xf3,0x73,0x17,0xba,0x83,0x59,0x3c,0x19,0xe6,0x85,0x4f,0xa8,0x68,0x6b,0x81,0xb2,0x71,0x64,0xda,0x8b,0xf8,0xeb,0x0f,0x4b,0x70,0x56,0x9d,0x35,0x1e,0x24,0x0e,0x5e,0x63,0x58,0xd1,0xa2,0x25,0x22,0x7c,0x3b,0x01,0x21,0x78,0x87,0xd4,0x00,0x46,0x57,0x9f,0xd3,0x27,0x52,0x4c,0x36,0x02,0xe7,0xa0,0xc4,0xc8,0x9e,0xea,0xbf,0x8a,0xd2,0x40,0xc7,0x38,0xb5,0xa3,0xf7,0xf2,0xce,0xf9,0x61,0x15,0xa1,0xe0,0xae,0x5d,0xa4,0x9b,0x34,0x1a,0x55,0xad,0x93,0x32,0x30,0xf5,0x8c,0xb1,0xe3,0x1d,0xf6,0xe2,0x2e,0x82,0x66,0xca,0x60,0xc0,0x29,0x23,0xab,0x0d,0x53,0x4e,0x6f,0xd5,0xdb,0x37,0x45,0xde,0xfd,0x8e,0x2f,0x03,0xff,0x6a,0x72,0x6d,0x6c,0x5b,0x51,0x8d,0x1b,0xaf,0x92,0xbb,0xdd,0xbc,0x7f,0x11,0xd9,0x5c,0x41,0x1f,0x10,0x5a,0xd8,0x0a,0xc1,0x31,0x88,0xa5,0xcd,0x7b,0xbd,0x2d,0x74,0xd0,0x12,0xb8,0xe5,0xb4,0xb0,0x89,0x69,0x97,0x4a,0x0c,0x96,0x77,0x7e,0x65,0xb9,0xf1,0x09,0xc5,0x6e,0xc6,0x84,0x18,0xf0,0x7d,0xec,0x3a,0xdc,0x4d,0x20,0x79,0xee,0x5f,0x3e,0xd7,0xcb,0x39,0x48];
const SM4_CK = [0x00070e15,0x1c232a31,0x383f464d,0x545b6269,0x70777e85,0x8c939aa1,0xa8afb6bd,0xc4cbd2d9,0xe0e7eef5,0xfc030a11,0x181f262d,0x343b4249,0x50575e65,0x6c737a81,0x888f969d,0xa4abb2b9,0xc0c7ced5,0xdce3eaf1,0xf8ff060d,0x141b2229,0x30373e45,0x4c535a61,0x686f767d,0x848b9299,0xa0a7aeb5,0xbcc3cad1,0xd8dfe6ed,0xf4fb0209,0x10171e25,0x2c333a41,0x484f565d,0x646b7279];
const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
const tau = (a) => { let o = 0; for (let i = 0; i < 4; i++) o |= SM4_SBOX[(a >>> (24 - i * 8)) & 255] << (24 - i * 8); return o >>> 0; };
export function sm4Crypt(input, key, enc = true) {
  const keyBytes = typeof key === 'string' ? utf8(key) : new Uint8Array(key);
  if (keyBytes.length !== 16) throw new Error('SM4 密钥必须是 16 字节');
  const K = new Uint32Array(4);
  const dv = new DataView(new ArrayBuffer(16));
  for (let i = 0; i < 16; i++) dv.setUint8(i, keyBytes[i]);
  for (let i = 0; i < 4; i++) K[i] = dv.getUint32(i * 4, false);
  const FK = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];
  const rk = new Uint32Array(32);
  let x = [K[0] ^ FK[0], K[1] ^ FK[1], K[2] ^ FK[2], K[3] ^ FK[3]];
  for (let i = 0; i < 32; i++) {
    const t = (x[1] ^ x[2] ^ x[3] ^ SM4_CK[i]) >>> 0;
    const y = (t ^ rotl(t, 13) ^ rotl(t, 23)) >>> 0;
    rk[i] = (x[0] ^ y) >>> 0;
    x = [x[1], x[2], x[3], rk[i]];
  }
  const words = enc ? rk : Array.from(rk).reverse();
  const block = (b) => {
    const d = new DataView(new ArrayBuffer(16));
    for (let i = 0; i < 16; i++) d.setUint8(i, b[i]);
    let X = [0, 1, 2, 3].map((i) => d.getUint32(i * 4, false));
    for (let i = 0; i < 32; i++) {
      const t = (tau((X[1] ^ X[2] ^ X[3] ^ words[i]) >>> 0));
      const y = (t ^ rotl(t, 2) ^ rotl(t, 10) ^ rotl(t, 18) ^ rotl(t, 24)) >>> 0;
      X = [X[1], X[2], X[3], (X[0] ^ y) >>> 0];
    }
    const out = new Uint8Array(16); const od = new DataView(out.buffer);
    [X[3], X[2], X[1], X[0]].forEach((w, i) => od.setUint32(i * 4, w, false));
    return out;
  };
  let data = typeof input === 'string' ? utf8(input) : new Uint8Array(input);
  if (enc) {
    const pad = 16 - (data.length % 16);
    const padded = new Uint8Array(data.length + pad); padded.set(data); padded.fill(pad, data.length);
    data = padded;
  } else if (data.length % 16) throw new Error('密文长度必须是 16 的倍数');
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 16) out.set(block(data.slice(i, i + 16)), i);
  if (!enc) { const p = out[out.length - 1]; if (p < 1 || p > 16) throw new Error('填充不对，密钥可能错了'); return out.slice(0, out.length - p); }
  return out;
}
export function sm3(msg) {
  const b = typeof msg === 'string' ? utf8(msg) : new Uint8Array(msg);
  const len = b.length;
  const padded = new Uint8Array(((len + 9) >> 6) + 1 << 6);
  padded.set(b); padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  const bits = BigInt(len) * 8n;
  dv.setUint32(padded.length - 8, Number(bits >> 32n), false);
  dv.setUint32(padded.length - 4, Number(bits & 0xffffffffn), false);
  const IV = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e];
  const W = new Uint32Array(68), W1 = new Uint32Array(64);
  let V = IV.slice();
  const tj = (j) => j < 16 ? 0x79cc4519 : 0x7a879d8a;
  const ff = (x, y, z, j) => j < 16 ? x ^ y ^ z : (x & y) | (x & z) | (y & z);
  const gg = (x, y, z, j) => j < 16 ? x ^ y ^ z : (x & y) | (~x & z);
  const p0 = (x) => x ^ rotl(x, 9) ^ rotl(x, 17);
  const p1 = (x) => x ^ rotl(x, 15) ^ rotl(x, 23);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 68; i++) W[i] = (p1(W[i - 16] ^ W[i - 9] ^ rotl(W[i - 3], 15)) ^ rotl(W[i - 13], 7) ^ W[i - 6]) >>> 0;
    for (let i = 0; i < 64; i++) W1[i] = (W[i] ^ W[i + 4]) >>> 0;
    let [A, B, C, D, E, F, G, H] = V;
    for (let j = 0; j < 64; j++) {
      const ss1 = rotl((rotl(A, 12) + E + rotl(tj(j), j)) >>> 0, 7);
      const ss2 = (ss1 ^ rotl(A, 12)) >>> 0;
      const tt1 = (ff(A, B, C, j) + D + ss2 + W1[j]) >>> 0;
      const tt2 = (gg(E, F, G, j) + H + ss1 + W[j]) >>> 0;
      D = C; C = rotl(B, 9); B = A; A = tt1;
      H = G; G = rotl(F, 19); F = E; E = p0(tt2);
    }
    V = V.map((x, i) => (x ^ [A, B, C, D, E, F, G, H][i]) >>> 0);
  }
  return V.map((x) => x.toString(16).padStart(8, '0')).join('');
}
