/* 由 gen/generate.mjs 生成，勿手改。 */
import { formTool, customTool, esc as escHTML, $, $$ } from '/kit.js';
import { L, D, refTool, fileTool, loadLib, vendor, gamePanel, buildZip, LIB_NOTE, pngFromCanvas, epubBase, makeEpub, pbDecode, b32, hotp, totpNow, pbVar, pbLen, pbNum, otpUri, pdfOpen, pdfRenderPage, pdfText, decodeAudio, audioToWav, bufferToWav, qrCanvas, barcodeSvg, svgToPng } from '/engines.js';

export default formTool({
  "titleIn": "名单与规则",
  "titleOut": "分组结果",
  "wide": true,
  "fields": [
    {
      "id": "names",
      "label": "名单（每行一个，可写 姓名,属性）",
      "type": "textarea",
      "rows": 8,
      "default": "小明,男\n小红,女\n小刚,男\n小丽,女\n小强,男\n小美,女\n小军,男\n小娜,女"
    },
    {
      "id": "way",
      "label": "怎么分",
      "type": "select",
      "options": [
        "固定组数",
        "每组固定人数"
      ]
    },
    {
      "id": "n",
      "label": "组数 / 每组人数",
      "type": "number",
      "default": 3
    },
    {
      "id": "balance",
      "label": "按属性均衡",
      "type": "checkbox",
      "default": true
    },
    {
      "id": "ban",
      "label": "禁止同组（逗号分隔人名）",
      "type": "text",
      "default": ""
    }
  ],
  "primary": "复制分组",
  "hintOut": "先洗牌再按「属性均衡」轮转分配，尽量让各组人数与属性比例接近。禁止同组的约束会做有限次重试，冲突太多时会如实提示。",
  "compute": (v) => {
    const E = L.esc, list = L.nonEmptyLines(v.names).map((l) => { const p = l.split(/[,，\t]/).map((x) => x.trim()); return { name: p[0] || '未命名', attr: p[1] || '' }; });
    if (list.length < 2) return { error: '名单至少两个人' };
    const k = v.way === '固定组数' ? L.clamp(Math.round(v.n), 1, list.length) : Math.ceil(list.length / L.clamp(Math.round(v.n), 1, list.length));
    const ban = String(v.ban || '').split(/[,，\s]+/).filter(Boolean);
    const ok = (groups) => ban.length < 2 ? true : groups.every((g) => !ban.every((b) => g.some((x) => x.name === b)));
    let groups = [], good = false;
    for (let attempt = 0; attempt < 60 && !good; attempt++) {
      const shuffled = L.shuffle(list);
      groups = Array.from({ length: k }, () => []);
      if (v.balance) { const buckets = {}; shuffled.forEach((x) => { const a = x.attr || '_'; (buckets[a] = buckets[a] || []).push(x); }); let gi = 0; Object.values(buckets).forEach((arr) => arr.forEach((x) => { groups[gi % k].push(x); gi++; })); }
      else shuffled.forEach((x, i) => groups[i % k].push(x));
      good = ok(groups);
    }
    const text = [`${list.length} 人分成 ${groups.length} 组${good ? '' : '（禁止同组约束没能完全满足，已尽量避开）'}`, '', ...groups.map((g, i) => `第 ${i + 1} 组（${g.length} 人）：${g.map((x) => E(x.name)).join('、')}`)].join('\n');
    return { text, copy: text, stats: [{ label: '组数', value: groups.length + ' 组' }, { label: '人数', value: list.length + ' 人' }, { label: '约束', value: good ? '已满足' : '部分满足' }],
      preview: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">${groups.map((g, i) => `<div style="background:#f3eee6;border-radius:8px;padding:10px"><b>第 ${i + 1} 组 · ${g.length} 人</b><div style="margin-top:6px;font-size:13px">${g.map((x) => E(x.name) + (x.attr ? `<small style="opacity:.6">(${E(x.attr)})</small>` : '')).join('　')}</div></div>`).join('')}</div>` };
  }
});
