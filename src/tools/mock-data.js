/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "字段与数量",
  "titleOut": "生成的数据",
  "fields": [
    {
      "id": "fields",
      "label": "字段（逗号分隔）",
      "type": "text",
      "default": "name,phone,idcard,email,city,company,date"
    },
    {
      "id": "n",
      "label": "条数",
      "type": "number",
      "default": 20
    },
    {
      "id": "fmt",
      "label": "输出格式",
      "type": "select",
      "options": [
        "JSON",
        "JSONL",
        "CSV",
        "SQL INSERT"
      ]
    }
  ],
  "primary": "复制数据",
  "hintOut": "内置 15 种字段：name/phone/idcard/bankcard/carplate/uscc/email/city/company/date/ip/uuid/amount/age/word。生成的是格式合法的测试数据，不是真实个人信息。",
  "compute": (v) => {
    const fields = String(v.fields || '').split(/[,，\s]+/).filter(Boolean);
    const n = Math.max(1, Math.min(10000, Number(v.n) || 20));
    const S = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '陈', '刘', '林', '杨', '黄', '徐'];
    const G = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超'];
    const CITY = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '长沙'];
    const CO = ['星辰科技', '远山贸易', '青禾设计', '云舟网络', '南风文化', '木石数据', '白鹭传媒', '合川实业'];
    const WORDS = L.D.coca.slice(0, 400);
    const rnd = (a, b) => L.randInt(a, b);
    const gen = (f) => {
      switch (f) {
        case 'name': return L.pick(S) + L.pick(G);
        case 'phone': return '1' + L.pick(['3', '5', '7', '8', '9']) + String(rnd(0, 9)) + String(rnd(10000000, 99999999));
        case 'idcard': { const y = rnd(1970, 2005), m = L.pad(rnd(1, 12)), d = L.pad(rnd(1, 28)); const body = `110101${y}${m}${d}${L.pad(rnd(0, 999), 3)}`; const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]; const chk = '10X98765432'; return body + chk[body.split('').reduce((s, c, i) => s + Number(c) * w[i], 0) % 11]; }
        case 'bankcard': return '62' + String(rnd(100000000000000, 999999999999999));
        case 'carplate': return L.pick(['京', '沪', '粤', '浙', '苏', '川']) + String.fromCharCode(65 + rnd(0, 25)) + String(rnd(10000, 99999));
        case 'uscc': return '91' + String(rnd(1000000000000000, 9999999999999999));
        case 'email': return L.pick(WORDS) + rnd(1, 999) + '@' + L.pick(['qq.com', '163.com', 'gmail.com', 'outlook.com']);
        case 'city': return L.pick(CITY);
        case 'company': return L.pick(CITY) + L.pick(CO);
        case 'date': return `${rnd(2020, 2026)}-${L.pad(rnd(1, 12))}-${L.pad(rnd(1, 28))}`;
        case 'ip': return `${rnd(1, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
        case 'uuid': return L.uuid();
        case 'amount': return L.round(rnd(100, 999999) / 100, 2);
        case 'age': return rnd(18, 65);
        case 'word': return L.pick(WORDS);
        default: return f + '_' + rnd(1000, 9999);
      }
    };
    const rows = Array.from({ length: n }, () => Object.fromEntries(fields.map((f) => [f, gen(f)])));
    let out;
    if (v.fmt === 'JSON') out = JSON.stringify(rows, null, 2);
    else if (v.fmt === 'JSONL') out = rows.map((r) => JSON.stringify(r)).join('\n');
    else if (v.fmt === 'CSV') out = L.toCSV([fields, ...rows.map((r) => fields.map((f) => r[f]))]);
    else out = rows.map((r) => `INSERT INTO mock_data (${fields.join(', ')}) VALUES (${fields.map((f) => typeof r[f] === 'number' ? r[f] : `'${String(r[f]).replace(/'/g, "''")}'`).join(', ')});`).join('\n');
    return { text: out, stats: [{ label: '条数', value: n }, { label: '字段', value: fields.length }, { label: '字符', value: out.length }] };
  }
});
