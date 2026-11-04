import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'type', label: '类型', type: 'chips', options: [
      { value: 'linear', label: '线性' }, { value: 'radial', label: '径向' }, { value: 'conic', label: '锥形' },
    ], default: 'linear' },
    { id: 'angle', label: '角度', type: 'range', min: 0, max: 360, step: 1, default: 135, unit: '°（线性/锥形用）' },
    { id: 'c1', label: '起始色', type: 'color', default: '#b4552d' },
    { id: 'c2', label: '中间色', type: 'color', default: '#e8a87c' },
    { id: 'c3', label: '结束色', type: 'color', default: '#f6e9e1' },
    { id: 'use3', label: '用三个色标', type: 'checkbox', default: true },
  ],
  titleIn: '调渐变', titleOut: 'CSS', primary: '复制 CSS',
  sample: { type: 'linear', angle: 135 },
  compute(v) {
    const stops = v.use3 ? `${v.c1}, ${v.c2}, ${v.c3}` : `${v.c1}, ${v.c3}`;
    let g;
    if (v.type === 'linear') g = `linear-gradient(${v.angle}deg, ${stops})`;
    else if (v.type === 'radial') g = `radial-gradient(circle at 50% 50%, ${stops})`;
    else g = `conic-gradient(from ${v.angle}deg at 50% 50%, ${stops})`;
    const css = `background: ${g};`;
    return { text: css, copy: css,
      preview: `<div style="width:100%;height:190px;border-radius:10px;background:${g};box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)"></div>` };
  },
});
