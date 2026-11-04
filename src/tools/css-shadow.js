import { formTool } from '/kit.js';
const hexA = (hex, a) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
export default formTool({
  fields: [
    { id: 'layers', label: '层数', type: 'chips', options: [
      { value: '1', label: '1 层' }, { value: '2', label: '2 层' }, { value: '3', label: '3 层' },
    ], default: '2' },
    { id: 'x', label: '水平偏移', type: 'range', min: -40, max: 40, step: 1, default: 0 },
    { id: 'y', label: '垂直偏移', type: 'range', min: -40, max: 40, step: 1, default: 8 },
    { id: 'blur', label: '模糊', type: 'range', min: 0, max: 80, step: 1, default: 24 },
    { id: 'spread', label: '扩散', type: 'range', min: -20, max: 40, step: 1, default: 0 },
    { id: 'color', label: '颜色', type: 'color', default: '#40352c' },
    { id: 'alpha', label: '不透明度', type: 'range', min: 0.05, max: 0.8, step: 0.05, default: 0.22 },
    { id: 'inset', label: '内阴影', type: 'checkbox', default: false },
  ],
  titleIn: '调阴影', titleOut: 'CSS', primary: '复制 CSS',
  sample: { layers: '2', x: 0, y: 8, blur: 24, spread: 0, alpha: 0.22 },
  compute(v) {
    const n = Number(v.layers);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const k = i + 1;
      parts.push(`${v.inset ? 'inset ' : ''}${Math.round(v.x * k / n)}px ${Math.round(v.y * k / n)}px ${Math.round(v.blur / Math.sqrt(k))}px ${Math.round(v.spread / k)}px ${hexA(v.color, (v.alpha / Math.sqrt(k)).toFixed(2))}`);
    }
    const css = `box-shadow: ${parts.join(',\n              ')};`;
    return { text: css, copy: css,
      preview: `<div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%">
        <div style="width:170px;height:110px;border-radius:14px;background:#fff;box-shadow:${parts.join(',')}"></div></div>` };
  },
});
