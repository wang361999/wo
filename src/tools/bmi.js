import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'height', label: '身高', type: 'number', default: 170, unit: 'cm' },
    { id: 'weight', label: '体重', type: 'number', default: 62, unit: 'kg' },
    { id: 'age', label: '年龄', type: 'number', default: 28, unit: '岁' },
    { id: 'sex', label: '性别（用于代谢估算）', type: 'chips', options: [
      { value: 'm', label: '男' }, { value: 'f', label: '女' },
    ], default: 'm' },
  ],
  titleIn: '身体数据', titleOut: '计算结果', primary: '复制结果',
  sample: { height: 170, weight: 62, age: 28, sex: 'm' },
  compute(v) {
    const h = v.height / 100, w = v.weight;
    if (!(h > 0.5 && h < 2.5 && w > 10 && w < 400)) return { error: '请填有效的身高（cm）和体重（kg）。' };
    const bmi = w / (h * h);
    const level = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
    const range = bmi < 18.5 ? [18.5, 24] : bmi < 24 ? [18.5, 24] : [18.5, 24];
    const healthy = [18.5 * h * h, 24 * h * h];
    // Mifflin-St Jeor
    const bmr = 10 * w + 6.25 * (h * 100) - 5 * v.age + (v.sex === 'm' ? 5 : -161);
    // Deurenberg 体脂率估算
    const fat = 1.2 * bmi + 0.23 * v.age - 10.8 * (v.sex === 'm' ? 1 : 0) - 5.4;
    const text = [
      `BMI：${bmi.toFixed(2)}（${level}）`,
      `正常范围体重：${healthy[0].toFixed(1)} – ${healthy[1].toFixed(1)} kg`,
      `基础代谢 BMR：约 ${Math.round(bmr)} kcal/天`,
      `体脂率估算：约 ${Math.max(3, fat).toFixed(1)}%`,
      `日常总消耗参考（轻度活动）：约 ${Math.round(bmr * 1.375)} kcal/天`,
    ].join('\n');
    return { text, copy: text, stats: [
      { label: 'BMI', value: bmi.toFixed(1) }, { label: '判定', value: level },
      { label: 'BMR', value: Math.round(bmr) }, { label: '健康体重', value: healthy[1].toFixed(0) + 'kg' },
    ] };
  },
});
