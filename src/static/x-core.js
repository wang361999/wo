/* 第二批工具的共享运行时：把注册表里的紧凑描述编译成真实可交互的工具。
   公式只在本地求值，数据表来自 x-data.js，交互类算子在 x-ops.js / x-custom.js。 */
import { formTool, customTool, esc, $, $$ } from '/kit.js';
import * as L from '/core.js';
import { dataset } from '/x-data.js';
import { TEXT, CODEC, RAND, COLOR } from '/x-ops.js';
import { CUSTOM } from '/x-custom.js';

export const fnum = (x) => {
  if (typeof x !== 'number') return String(x);
  if (Number.isNaN(x)) return '无实数解';
  if (!Number.isFinite(x)) return '超出范围';
  const n = Number(x.toPrecision(10));
  return String(n);
};
const lines = (s) => String(s ?? '').split(/\r?\n/);
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const outTable = (cols, rows, max = 400) => {
  const head = cols.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = rows.slice(0, max).map((r) => '<tr>' + r.map((c, i) =>
    `<td${i === 0 ? '' : ''}>${esc(c ?? '')}</td>`).join('') + '</tr>').join('');
  return `<div style="width:100%;max-height:430px;overflow:auto"><table class="t-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
};
const srcField = (label, ph, val = '', rows = 7) => ({ id: 'src', label, type: 'textarea', rows, default: val, placeholder: ph });
const numField = (id, label, def, unit = '') => ({ id, label, unit, type: 'number', default: def, step: 'any' });
const selField = (id, label, options, def) => ({ id, label, type: 'select', options, default: def ?? options[0] });
const txtField = (id, label, ph, def = '') => ({ id, label, type: 'text', default: def, placeholder: ph });

/* ---------- 公式计算 ---------- */
function calcSpec(d) {
  const fields = d.p1.split(';').filter(Boolean).map((s) => {
    const [id, label, unit, def] = s.split('~');
    return numField(id, label, Number(def || 0), unit || '');
  });
  const exprs = d.p2.split(';').filter(Boolean).map((s) => {
    const i = s.indexOf(':');
    return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  });
  // 公式是仓库里自己写的常量，不是用户输入；仍做一次字符白名单，挡住意外注入。
  for (const [, e] of exprs) {
    if (/[\[\]{}"'`;=]|=>/.test(e)) throw new Error('非法公式：' + e);
  }
  const sample = Object.fromEntries(fields.map((f) => [f.id, f.default]));
  return {
    titleIn: '填入数值', titleOut: '计算结果', sample, hintOut: d.p3 || '',
    fields,
    compute: (v) => {
      for (const f of fields) if (!Number.isFinite(v[f.id])) return { error: `${f.label} 请填一个数字` };
      const keys = fields.map((f) => f.id);
      const out = [], first = [];
      for (const [label, e] of exprs) {
        let r;
        try { r = new Function(...keys, 'return (' + e + ');')(...keys.map((k) => v[k])); }
        catch (err) { return { error: '公式计算失败：' + err.message }; }
        const s = typeof r === 'number' ? fnum(r) : String(r);
        out.push(`${label}：${s}`);
        first.push(s);
      }
      return {
        text: out.join('\n'), copy: out.join('\n'),
        stats: [{ label: exprs[0]?.[0] || '结果', value: first[0] || '—' }],
      };
    },
  };
}

/* ---------- 单位换算 ---------- */
function unitSpec(d) {
  const units = d.p1.split(';').filter(Boolean).map((s) => {
    const [id, label, f] = s.split('~');
    return { id, label, f: Number(f) };
  });
  const opts = units.map((u) => ({ value: u.id, label: u.label }));
  return {
    titleIn: '数值与单位', titleOut: '换算结果', hintOut: d.p2 || '',
    sample: { value: 1 },
    fields: [
      numField('value', '数值', 1),
      selField('from', '原单位', opts, units[0].id),
      selField('to', '目标单位', opts, units[1]?.id || units[0].id),
      txtField('q', '筛选单位（可留空）', '输入单位名只看对应行'),
    ],
    primary: '复制结果',
    actions: [{ label: '下载 CSV', run: (v, ctx) => {
      const a = units.find((u) => u.id === v.from);
      ctx.download('单位换算.csv', '\uFEFF' + ['单位', '数值'].join(',') + '\n' +
        units.map((u) => `${u.label},${fnum(v.value * a.f / u.f)}`).join('\n'), 'text/csv;charset=utf-8');
    } }],
    compute: (v) => {
      const a = units.find((u) => u.id === v.from), b = units.find((u) => u.id === v.to);
      if (!a || !b || !Number.isFinite(v.value)) return { error: '请填数值并选择单位' };
      const r = v.value * a.f / b.f;
      const q = clean(v.q).toLowerCase();
      const rows = units.filter((u) => !q || (u.label + u.id).toLowerCase().includes(q))
        .map((u) => [u.label, fnum(v.value * a.f / u.f)]);
      return {
        text: `${fnum(v.value)} ${a.label} = ${fnum(r)} ${b.label}`,
        copy: fnum(r),
        stats: [{ label: b.label, value: fnum(r) }, { label: '参与换算的单位', value: String(units.length) }],
        preview: outTable(['单位', '换算结果'], rows, 100),
      };
    },
  };
}

/* ---------- 离线速查表 ---------- */
function tableSpec(d) {
  const data = dataset(d.p1);
  if (!data) return { fields: [], compute: () => ({ error: '数据表未找到：' + d.p1 }) };
  return {
    titleIn: '筛选', titleOut: d.name, primary: '复制表格', hintOut: d.p3 || data.note || '',
    fields: [txtField('q', '搜索关键词', '输入名称、代码或说明里的任意字'),
      selField('limit', '最多显示', ['100', '200', '400', '1000'], '200')],
    actions: [{ label: '下载 CSV', run: (v, ctx) => {
      const q = clean(v.q).toLowerCase();
      const rows = data.rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q));
      ctx.download(d.p1 + '.csv', '\uFEFF' + [data.cols.join(','), ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n'), 'text/csv;charset=utf-8');
    } }],
    compute: (v) => {
      const q = clean(v.q).toLowerCase();
      const rows = data.rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q));
      const cap = Number(v.limit) || 200;
      return {
        stats: [{ label: '总条目', value: String(data.rows.length) }, { label: '当前匹配', value: String(rows.length) }],
        preview: rows.length ? outTable(data.cols, rows, cap) : '<p class="t-hint">没有匹配项，换个关键词试试。</p>',
        html: rows.length
          ? `<p class="t-hint">共 ${data.rows.length} 条，匹配 ${rows.length} 条${rows.length > cap ? `，下表显示前 ${cap} 条` : ''}。点右上角按钮复制或下载。</p>`
          : '<p class="t-hint">没有匹配项。</p>',
        copy: [data.cols.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n'),
      };
    },
  };
}

/* ---------- 文本 / 编码 / 随机 / 颜色：算子注册表 ---------- */
function opSpec(d, registry, baseFields) {
  const op = registry[d.p1];
  if (!op) return { fields: [], compute: () => ({ error: '算子未实现：' + d.p1 }) };
  const extra = typeof op.fields === 'function' ? op.fields(d) : (op.fields || []);
  return {
    titleIn: op.titleIn || '输入', titleOut: op.titleOut || '结果',
    primary: op.primary || '复制结果', hintOut: d.p3 || op.hint || '',
    sample: op.sample,
    fields: [...baseFields(op, d), ...extra],
    actions: op.actions,
    compute: (v, ctx) => {
      try { return op.run(v, ctx, d) || {}; }
      catch (e) { return { error: e.message || String(e) }; }
    },
  };
}

const textBase = (op) => op.noSrc ? [] : [srcField('原文', op.placeholder || '把内容粘进来…', op.sample?.src ?? '', op.rows || 7)];
const codecBase = (op) => [
  srcField('内容', op.placeholder || '要处理的文本…', op.sample?.src ?? '', 6),
  selField('dir', '方向', op.dirs || ['编码', '解码'], op.dirs?.[0] || '编码'),
];
const randBase = () => [numField('n', '生成数量', 1)];

/* ---------- 入口 ---------- */
export function makeTool(d) {
  let spec;
  switch (d.kind) {
    case 'calc': spec = calcSpec(d); break;
    case 'unit': spec = unitSpec(d); break;
    case 'table': spec = tableSpec(d); break;
    case 'text': spec = opSpec(d, TEXT, textBase); break;
    case 'codec': spec = opSpec(d, CODEC, codecBase); break;
    case 'rand': spec = opSpec(d, RAND, randBase); break;
    case 'color': spec = opSpec(d, COLOR, () => []); break;
    case 'custom': {
      const fn = CUSTOM[d.p1];
      return customTool((root, K) => {
        if (fn) return fn(root, K, d);
        root.innerHTML = '<div class="t-panel wide"><p class="t-hint">这个工具还在接入中。</p></div>';
      });
    }
    default: spec = { fields: [], compute: () => ({ error: '未知工具类型：' + d.kind }) };
  }
  return formTool(spec);
}

/* 给算子复用的小工具，避免每个算子重复写。 */
export { esc, $, $$, L, clean, lines, outTable, srcField, numField, selField, txtField };
