// 共享工具函数：同时被 Node 构建期和浏览器运行时 import，零依赖
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 可复现伪随机
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

export const int = (r, min, max) => min + Math.floor(r() * (max - min + 1));
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 把题目数组渲染成可打印网格
export function questionGrid(items, cols = 4, withBlank = true) {
  const cells = items.map((q, i) => {
    const body = withBlank
      ? `${esc(q.text)} = <span class="q-blank"></span>`
      : `${esc(q.text)} = <span class="ans">${esc(q.answer)}</span>`;
    return `<div class="q-item">${i + 1}. ${body}</div>`;
  }).join('');
  return `<div class="q-grid cols-${cols}">${cells}</div>`;
}

// 答案折叠块（内容仍在 HTML 里，搜索引擎可读）
export function answerBlock(items, cols = 6) {
  const cells = items.map((q, i) => `<div>${i + 1}. ${esc(q.answer)}</div>`).join('');
  return `<details class="answer-block" open><summary>参考答案（打印时可单独成页）</summary>
    <div class="answer-grid" style="grid-template-columns: repeat(${cols}, 1fr)">${cells}</div>
  </details>`;
}

export function sheetTitle(text, meta) {
  return `<p class="sheet-title">${esc(text)}</p><p class="sheet-meta">${esc(meta)}</p>`;
}

// 汉字页 slug：拼音-笔画数，天然区分同音字（田 tian-5 / 天 tian-4）
export function hanziSlug(pinyin, strokes) {
  return `${pinyin}-${strokes}`;
}
