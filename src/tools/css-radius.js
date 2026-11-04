import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'unit', label: '单位', type: 'chips', options: [
      { value: 'px', label: 'px' }, { value: '%', label: '%' },
    ], default: 'px' },
    { id: 'sym', label: '四角对称', type: 'checkbox', default: true },
    { id: 'tl', label: '左上', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { id: 'tr', label: '右上', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { id: 'br', label: '右下', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { id: 'bl', label: '左下', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { id: 'ratio', label: '纵向半径（椭圆）', type: 'range', min: 0, max: 100, step: 1, default: 20 },
    { id: 'ellipse', label: '启用椭圆（x / y）', type: 'checkbox', default: false },
  ],
  titleIn: '调圆角', titleOut: 'CSS', primary: '复制 CSS',
  sample: { sym: false, tl: 40, tr: 8, br: 40, bl: 8 },
  compute(v) {
    const u = v.unit, n = (x) => `${x}${u}`;
    const a = v.sym ? [v.tl, v.tl, v.tl, v.tl] : [v.tl, v.tr, v.br, v.bl];
    const x = a.map(n).join(' ');
    const css = v.ellipse ? `border-radius: ${x} / ${[v.ratio, v.ratio, v.ratio, v.ratio].map(n).join(' ')};` : `border-radius: ${x};`;
    const radius = v.ellipse ? `${x} / ${[v.ratio, v.ratio, v.ratio, v.ratio].map(n).join(' ')}` : x;
    return { text: css, copy: css,
      preview: `<div style="width:180px;height:150px;background:linear-gradient(135deg,#b4552d,#e8a87c);border-radius:${radius}"></div>` };
  },
});
