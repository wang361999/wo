/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "查什么",
  "titleOut": "结果",
  "wide": true,
  "fields": [
    {
      "id": "text",
      "label": "汉字 / 编码",
      "type": "textarea",
      "rows": 4,
      "default": "中国 人民 工具箱"
    },
    {
      "id": "dir",
      "label": "方向",
      "type": "select",
      "options": [
        "汉字 → 编码",
        "编码 → 汉字"
      ]
    },
    {
      "id": "ver",
      "label": "版本",
      "type": "select",
      "options": [
        "86 版",
        "98 版（仅列有差异的）"
      ]
    }
  ],
  "primary": "复制结果",
  "hintOut": "内置约 80 个常用字的 86 版精简编码表，够体验正反查与整段批量，不是完整五笔字库。98 版只标注少量差异，未收录的会如实显示「未收录」。",
  "compute": (v) => {
    const M86 = { '一': 'GGLL', '二': 'FGG', '三': 'DGGG', '十': 'FGH', '人': 'W', '大': 'DDDD', '小': 'IHTY', '中': 'KHK', '国': 'LGYI', '工': 'A', '具': 'HWU', '箱': 'TSHF', '民': 'NAV', '日': 'JJJJ', '月': 'EEEE', '水': 'IIII', '火': 'OOOO', '山': 'MMMM', '木': 'SSSS', '金': 'QQQQ', '土': 'FFFF', '上': 'H', '下': 'GHI', '天': 'GDI', '地': 'FBN', '我': 'TRNT', '你': 'WQIY', '他': 'WBN', '们': 'WUN', '的': 'RQYY', '了': 'BNH', '是': 'JGHU', '不': 'GII', '有': 'DEF', '在': 'DHFD', '和': 'TKG', '学': 'IPBF', '生': 'TGD', '文': 'YYGY', '字': 'PBF', '语': 'YGKG', '数': 'OVTY', '书': 'NNHY', '笔': 'TTFN', '电': 'JNV', '话': 'YTDG', '手': 'RTGH', '机': 'SMN', '网': 'MQQI', '站': 'UHKG', '页': 'DMU', '图': 'LTUI', '片': 'THGN', '音': 'UJF', '乐': 'QII', '爱': 'EPDC', '好': 'VBG', '美': 'UGDU', '家': 'PEU', '门': 'UYHN', '路': 'KHTK', '车': 'LGNH', '吃': 'KTNN', '喝': 'KJQN', '看': 'RHF', '听': 'KRH', '说': 'YUKQ', '读': 'YFND', '写': 'PGNG', '开': 'GAK', '关': 'UDU', '来': 'GOI', '去': 'FCU', '多': 'QQU', '少': 'ITR', '高': 'YMKF', '新': 'USRH', '旧': 'HJG', '白': 'RRRR', '黑': 'LFOU', '红': 'XAG', '绿': 'XVIY', '蓝': 'AJTL', '黄': 'AMWU', '春': 'DWJF', '夏': 'DHTU', '秋': 'TOY', '冬': 'TUU', '风': 'MQI', '雨': 'FGHY', '雪': 'FVF', '云': 'FCU', '花': 'AWXB', '草': 'AJJ', '树': 'SCFY', '鸟': 'QYNG', '鱼': 'QGIF', '马': 'CNNG', '牛': 'RHK', '羊': 'UDJ', '猫': 'QTAL', '狗': 'QTQK' };
    const M98 = { '我': 'TRNY', '你': 'WQIY', '不': 'DHI', '是': 'JGHH', '的': 'RQYY', '有': 'DHE', '在': 'DHFD' };
    const M = v.ver.startsWith('98') ? { ...M86, ...M98 } : M86;
    const rev = Object.fromEntries(Object.entries(M).map(([k, x]) => [x, k]));
    const chars = Array.from(String(v.text)).filter((c) => c.trim());
    let out, miss = [];
    if (v.dir.startsWith('编码')) out = L.nonEmptyLines(v.text).map((l) => { const code = l.trim().toUpperCase(); const hit = Object.entries(M).filter(([k, x]) => x.startsWith(code) || x === code).map(([k]) => k); return hit.length ? `${code} → ${hit.join(' ')}` : `${code} → 未收录`; }).join('\n');
    else { out = chars.map((c) => M[c] || c).join(' '); miss = chars.filter((c) => /[\u3400-\u9fff]/.test(c) && !M[c]); }
    const text = [`${L.esc(v.dir)}（${L.esc(v.ver)}，内置 ${Object.keys(M).length} 字）`, '', out, miss.length ? '\n未收录：' + miss.join('') : ''].join('\n');
    const rows = Object.entries(M).slice(0, 60).map(([k, x]) => `<tr><td>${L.esc(k)}</td><td>${L.esc(x)}</td></tr>`).join('');
    return { text, copy: out, stats: [{ label: '表内字数', value: Object.keys(M).length + ' 字' }, { label: '方向', value: L.esc(v.dir.slice(0, 2)) }],
      preview: `<p class="t-hint">内置表前 60 条（汉字 / 编码）</p><table class="t-table"><thead><tr><th>字</th><th>86 编码</th></tr></thead><tbody>${rows}</tbody></table>` };
  }
});
