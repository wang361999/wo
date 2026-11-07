// 分类视觉主题：工具图标宫格、热度榜、分类入口共用同一套颜色。
// color 用于描边/进度条/强调，soft 用于图标底色，emoji 作为工具图标。
export const CAT_THEME = {
  all:      { color: '#2563eb', soft: '#eaf1ff', emoji: '🗂️' },
  nav:      { color: '#3b82f6', soft: '#e8f2ff', emoji: '🧭' },
  pdf:      { color: '#e0453b', soft: '#ffeded', emoji: '📄' },
  image:    { color: '#8b5cf6', soft: '#f2ecff', emoji: '🖼️' },
  media:    { color: '#db3f86', soft: '#ffeaf4', emoji: '🎬' },
  dev:      { color: '#4f46e5', soft: '#ecebff', emoji: '🔧' },
  chinese:  { color: '#e08a12', soft: '#fff3df', emoji: '🀄' },
  life:     { color: '#0e9f6e', soft: '#e4f7f0', emoji: '🧮' },
  finance:  { color: '#0891b2', soft: '#e3f6fb', emoji: '💰' },
  css:      { color: '#e0446d', soft: '#ffeaf0', emoji: '🎨' },
  puzzle:   { color: '#c58a0b', soft: '#fff6da', emoji: '🧩' },
};

export function catTheme(id) {
  return CAT_THEME[id] || CAT_THEME.all;
}
