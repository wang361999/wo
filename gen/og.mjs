// 生成社交分享用的 1200×630 PNG（og:image）。
// 零依赖：直接用 Node 内置 zlib 手写 PNG，不引图像库、不依赖系统字体。
// 图案是 26×11 = 286 个硬边小方块，对应 286 个工具；深色工作台 + 荧光酸绿信号色。
import fs from 'node:fs';
import zlib from 'node:zlib';

const W = 1200, H = 630;
const BG = [11, 14, 18];
const GRID = [27, 33, 40];
const ACID = [198, 244, 50];
const PALETTE = [
  [198, 244, 50],  // 荧光酸绿
  [122, 162, 255], // 冰蓝
  [126, 224, 161], // 薄荷
  [147, 184, 39],  // 暗绿
  [235, 242, 246], // 白
  [43, 50, 60],    // 边线灰
  [88, 102, 116],  // 中灰
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
  fill(0, 0, W, H, BG);

  // 背景细网格，与站点 hero 的网格呼应
  for (let x = 0; x < W; x += 50) fill(x, 0, x + 1, H, GRID);
  for (let y = 0; y < H; y += 50) fill(0, y, W, y + 1, GRID);

  const cols = 26, rows = 11;
  const left = 68, top = 92, cw = 41, ch = 41, size = 31;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const dist = Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2) * 0.6
                 + Math.abs(j - (rows - 1) / 2) / ((rows - 1) / 2) * 0.4;
      const k = (i * 3 + j * 5) % 7;
      // 中心偏信号色，越往外越暗，形成一块「被点亮的索引」
      const c = dist < 0.28 ? ACID
              : dist < 0.48 ? PALETTE[k % 5]
              : dist < 0.72 ? PALETTE[(k + 2) % 5]
              : PALETTE[5];
      fill(left + i * cw + (cw - size) / 2, top + j * ch + (ch - size) / 2,
           left + i * cw + (cw - size) / 2 + size, top + j * ch + (ch - size) / 2 + size, c);
    }
  }

  // 上沿与下沿的信号条
  fill(68, 62, 1132, 66, ACID);
  fill(68, 578, 1132, 582, GRID);
  fill(68, 578, 300, 582, ACID);
  // 四角定位标记
  for (const [x, y] of [[68, 62], [1116, 62], [68, 566], [1116, 566]]) fill(x, y, x + 16, y + 3, ACID);

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
