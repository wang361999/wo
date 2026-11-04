export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 稳定伪随机（可复现，便于调试与静态生成）
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

export function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
export function int(rand, min, max) { return min + Math.floor(rand() * (max - min + 1)); }
