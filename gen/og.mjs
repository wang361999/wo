// 生成社交分享用的 1200×630 PNG（og:image）。
// 零依赖：直接用 Node 内置 zlib 手写 PNG，不引图像库、不依赖系统字体。
// 图案是 26×11 = 286 个圆角小方块，正好对应 286 个工具，配色沿用站点的纸张 + 墨 + 橙棕 + 绿。
import fs from 'node:fs';
import zlib from 'node:zlib';

const W = 1200, H = 630;
const PAPER = [251, 249, 244];
const PALETTE = [
  [180, 85, 45],    // 橙棕 accent
  [61, 122, 78],    // 绿
  [139, 166, 184],  // 灰蓝
  [224, 192, 122],  // 麦黄
  [35, 34, 31],     // 墨
  [217, 210, 195],  // 浅灰
  [201, 138, 104],  // 浅橙
];

const RAW = Buffer.alloc(H * (1 + W * 3));
const set = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = y * (1 + W * 3) + 1 + x * 3;
  RAW[o] = c[0]; RAW[o + 1] = c[1]; RAW[o + 2] = c[2];
};
const fill = (x0, y0, x1, y1, c) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c);
};
const roundRect = (x, y, w, h, r, c) => {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
    const cx = Math.min(dx, w - 1 - dx), cy = Math.min(dy, h - 1 - dy);
    if (cx < r && cy < r && (r - cx) ** 2 + (r - cy) ** 2 > r * r) continue;
    set(x + dx, y + dy, c);
  }
};

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, c]);
}

export function writeOgPng(dest) {
  fill(0, 0, W, H, PAPER);

  const cols = 26, rows = 11;
  const left = 68, top = 92, cw = 41, ch = 41, size = 31, r = 7;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const dist = Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2) * 0.6
                 + Math.abs(j - (rows - 1) / 2) / ((rows - 1) / 2) * 0.4;
      const k = (i * 3 + j * 5) % 7;
      // 中心偏品牌色，越往外越淡
      const c = dist < 0.34 ? PALETTE[k % 5]
              : dist < 0.66 ? PALETTE[(k + 1) % 5]
              : PALETTE[5];
      roundRect(left + i * cw + (cw - size) / 2, top + j * ch + (ch - size) / 2, size, size, r, c);
    }
  }
  // 底部一道墨色细条，给图案一个落点
  fill(68, 578, 1132, 583, [35, 34, 31]);
  roundRect(68, 578, 180, 5, 2, [180, 85, 45]);

  for (let y = 0; y < H; y++) RAW[y * (1 + W * 3)] = 0; // filter type 0

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8bit RGB
  fs.writeFileSync(dest, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(RAW, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  return dest;
}
