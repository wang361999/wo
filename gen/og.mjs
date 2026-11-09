// 生成社交分享用的 1200×630 PNG（og:image）。
// 零依赖：直接用 Node 内置 zlib 手写 PNG，不引图像库、不依赖系统字体。
// 图案按当前工具总数自适应排成方块网格，一个方块对应一个工具；白底 + 单一蓝色系的深浅层次。
import fs from 'node:fs';
import zlib from 'node:zlib';
import { TOOLS } from '../src/data/catalog.mjs';

const W = 1200, H = 630;
const BG = [255, 255, 255];
const HAIR = [233, 237, 244];
const BLUE = [47, 91, 215];
const BLUE_MID = [96, 133, 226];
const BLUE_LIGHT = [160, 187, 240];
const BLUE_PALE = [211, 224, 250];
const GREY = [234, 238, 245];

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

  // 图案区域固定，工具数量变化只调行列与格子大小，保证一个工具一个方块。
  const left = 68, top = 92, areaW = 1064, areaH = 448;
  const n = Math.max(1, TOOLS.length);
  const cols = Math.max(1, Math.round(Math.sqrt(n * areaW / areaH)));
  const rows = Math.ceil(n / cols);
  const cw = areaW / cols, ch = areaH / rows;
  const size = Math.max(4, Math.floor(Math.min(cw, ch) - 7));
  let drawn = 0;
  for (let j = 0; j < rows && drawn < n; j++) {
    for (let i = 0; i < cols && drawn < n; i++) {
      drawn++;
      const dist = Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2) * 0.62
                 + Math.abs(j - (rows - 1) / 2) / ((rows - 1) / 2) * 0.38;
      const k = (i * 3 + j * 5) % 7;
      // 中心深蓝、越往外越浅，只用同一色系的明度变化，不做杂色
      const c = dist < 0.30 ? BLUE
              : dist < 0.48 ? (k < 3 ? BLUE : BLUE_MID)
              : dist < 0.68 ? (k < 4 ? BLUE_MID : BLUE_LIGHT)
              : dist < 0.86 ? (k < 4 ? BLUE_LIGHT : BLUE_PALE)
              : (k < 3 ? BLUE_PALE : GREY);
      const x0 = Math.round(left + i * cw + (cw - size) / 2);
      const y0 = Math.round(top + j * ch + (ch - size) / 2);
      fill(x0, y0, x0 + size, y0 + size, c);
    }
  }

  // 上沿的短蓝条与下沿的细分隔线，留足白边
  fill(68, 62, 188, 66, BLUE);
  fill(68, 578, 1132, 580, HAIR);
  fill(68, 578, 368, 580, BLUE);

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
