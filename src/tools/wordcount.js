import { formTool } from '/kit.js';
export default formTool({
  fields: [
    { id: 'text', label: '要统计的文本', type: 'textarea', rows: 10, placeholder: '把文章粘进来…' },
    { id: 'wpm', label: '阅读速度', type: 'number', default: 300, unit: '字/分钟' },
  ],
  titleIn: '文本', titleOut: '统计结果', primary: '复制统计',
  sample: { text: '一页工具，打开就能用。\n所有计算都在浏览器本地完成，文件不会上传。\nTools run locally in your browser.', wpm: 300 },
  compute(v) {
    const s = v.text || '';
    const cn = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    const en = (s.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length;
    const num = (s.match(/\d+(?:\.\d+)?/g) || []).length;
    const punct = (s.match(/[，。！？、；：""''《》（）,.!?;:()\-—…]/g) || []).length;
    const lines = s ? s.split(/\r\n|\r|\n/).length : 0;
    const chars = s.replace(/\s/g, '').length;
    const minutes = chars / Math.max(1, v.wpm);
    const time = minutes < 1 ? '不到 1 分钟' : `${Math.round(minutes)} 分钟`;
    return {
      text: [
        `中文汉字：${cn}`, `英文单词：${en}`, `数字：${num}`, `标点：${punct}`,
        `不计空白字符：${chars}`, `行数：${lines}`, `预估阅读：${time}（按 ${v.wpm} 字/分钟）`,
      ].join('\n'),
      stats: [
        { label: '汉字', value: cn }, { label: '英文词', value: en },
        { label: '总字符', value: chars }, { label: '阅读', value: time },
      ],
    };
  },
});
