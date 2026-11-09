// 分类视觉主题：工具图标宫格、热度榜、分类入口共用同一套颜色。
// color 用于描边/进度条/强调，soft 用于图标底色，emoji 作为工具图标。
// 色板与全站「工程手册」风一致：暖底色上的降饱和强调色。
export const CAT_THEME = {
  all:      { color: '#2a45c4', soft: '#eaedf9', emoji: '🗂️' },
  nav:      { color: '#3d66d8', soft: '#e9effc', emoji: '🧭' },
  pdf:      { color: '#c4463b', soft: '#faecea', emoji: '📄' },
  image:    { color: '#7b57cd', soft: '#f0ebfa', emoji: '🖼️' },
  media:    { color: '#c5447e', soft: '#fae9f1', emoji: '🎬' },
  dev:      { color: '#4a44c6', soft: '#ebeafb', emoji: '🔧' },
  chinese:  { color: '#b5790f', soft: '#f9efdb', emoji: '🀄' },
  life:     { color: '#13855f', soft: '#e4f3ec', emoji: '🧮' },
  finance:  { color: '#0d82a2', soft: '#e2f2f7', emoji: '💰' },
  css:      { color: '#c93f65', soft: '#fae9ee', emoji: '🎨' },
  puzzle:   { color: '#ae7d0d', soft: '#f9f2d8', emoji: '🧩' },
  math:     { color: '#6d51c5', soft: '#f0ecfa', emoji: '📐' },
  health:   { color: '#13855f', soft: '#e4f3ec', emoji: '🩺' },
  web:      { color: '#2a5cc9', soft: '#e8eefb', emoji: '🌐' },
};

export function catTheme(id) {
  return CAT_THEME[id] || CAT_THEME.all;
}
