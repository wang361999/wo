// 分类视觉主题：工具词条宫格、热度榜、分类检字表共用同一套颜色。
// color 用于强调/进度条，soft 用于部首底色，emoji 作为工具图标。
// 色板取传统矿彩：朱砂、赭石、石青、藤黄、松绿……压低饱和落在纸色上。
export const CAT_THEME = {
  all:      { color: '#b03528', soft: '#f1e7d6', emoji: '🗂️' },
  nav:      { color: '#46609c', soft: '#e8eaf2', emoji: '🧭' },
  pdf:      { color: '#a4472f', soft: '#f2e3dc', emoji: '📄' },
  image:    { color: '#7a4a75', soft: '#efe6ee', emoji: '🖼️' },
  media:    { color: '#a83e5e', soft: '#f3e3e7', emoji: '🎬' },
  dev:      { color: '#40558c', soft: '#e7eaf4', emoji: '🔧' },
  chinese:  { color: '#8a6a2f', soft: '#f2ead7', emoji: '🀄' },
  life:     { color: '#4f7a45', soft: '#e9efdf', emoji: '🧮' },
  finance:  { color: '#3f7d72', soft: '#e3efec', emoji: '💰' },
  css:      { color: '#b04a55', soft: '#f4e4e5', emoji: '🎨' },
  puzzle:   { color: '#b3862e', soft: '#f5ecd6', emoji: '🧩' },
  math:     { color: '#6e5a96', soft: '#ece8f3', emoji: '📐' },
  health:   { color: '#5b7d3e', soft: '#eaefdd', emoji: '🩺' },
  web:      { color: '#2e6b8e', soft: '#e2edf3', emoji: '🌐' },
};

export function catTheme(id) {
  return CAT_THEME[id] || CAT_THEME.all;
}
