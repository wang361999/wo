import { formTool, esc } from '/kit.js';
export default formTool({
  fields: [
    { id: 'names', label: '名单 / 选项（一行一个）', type: 'textarea', rows: 8, placeholder: '张三\n李四\n王五\n赵六' },
    { id: 'count', label: '抽几个', type: 'number', default: 1, step: 1 },
    { id: 'unique', label: '不重复', type: 'checkbox', default: true },
  ],
  titleIn: '抽签设置', titleOut: '抽签结果', primary: '复制结果',
  sample: { names: '张三\n李四\n王五\n赵六\n钱七', count: 2, unique: true },
  actions: [{ label: '开始抽签', run(v, ctx) {
    const list = String(v.names || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const n = Math.max(1, Math.min(list.length, Number(v.count) || 1));
    if (!list.length) { ctx.setError('名单是空的，先填几个名字。'); return; }
    if (v.unique && n > list.length) { ctx.setError('不重复模式下，抽取数量不能超过名单人数。'); return; }
    const pool = [...list]; const picked = [];
    const a = new Uint32Array(n); crypto.getRandomValues(a);
    for (let i = 0; i < n; i++) {
      const idx = a[i] % pool.length;
      picked.push(pool[idx]);
      if (v.unique) pool.splice(idx, 1);
    }
    const html = picked.map((x, i) =>
      `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line-2)">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto">${i + 1}</span>
        <b style="font-size:18px">${esc(x)}</b></div>`).join('');
    ctx.setError(''); ctx.setOut(html); ctx.setStats([{ label: '候选', value: list.length }, { label: '抽中', value: n }]);
    ctx.toast('抽好了');
  } }],
  compute(v) {
    const list = String(v.names || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!list.length) return { text: '填好名单后，点下面的「开始抽签」。', copy: '' };
    return { text: `名单共 ${list.length} 项：${list.slice(0, 8).join('、')}${list.length > 8 ? '…' : ''}\n\n点「开始抽签」出结果。`, copy: '',
      stats: [{ label: '候选', value: list.length }] };
  },
});
