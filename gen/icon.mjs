// 生成 PWA 安装图标（192 / 512 PNG）。零依赖，直接写 PNG 字节，不进版本库。
// 图形沿用站里的红色方章：红底 + 白色田字线 + 三个纸色方块，右下留朱。
// 印章只占中间约 56%，四周留红，裁成 maskable 圆角也不会切掉笔画。
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RED = [176, 53, 40];
const PAPER = [253, 248, 236];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encode(w, h, px) {
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter: none
    px.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function fill(px, size, x0, y0, w, h, color) {
  const xa = Math.max(0, Math.round(x0)), ya = Math.max(0, Math.round(y0));
  const xb = Math.min(size, Math.round(x0 + w)), yb = Math.min(size, Math.round(y0 + h));
  for (let y = ya; y < yb; y++) {
    for (let x = xa; x < xb; x++) {
      const i = (y * size + x) * 4;
      px[i] = color[0]; px[i + 1] = color[1]; px[i + 2] = color[2]; px[i + 3] = 255;
    }
  }
}

function make(size) {
  const px = Buffer.alloc(size * size * 4);
  fill(px, size, 0, 0, size, size, RED);
  const pad = Math.round(size * 0.22);
  const s = size - pad * 2;
  const line = Math.max(2, Math.round(s * 0.036));
  fill(px, size, pad + (s - line) / 2, pad, line, s, PAPER);
  fill(px, size, pad, pad + (s - line) / 2, s, line, PAPER);
  const cell = s / 2, inset = Math.round(cell * 0.21), side = cell - inset * 2;
  for (const [cx, cy] of [[0, 0], [1, 0], [0, 1]]) {
    fill(px, size, pad + cx * cell + inset, pad + cy * cell + inset, side, side, PAPER);
  }
  return encode(size, size, px);
}

export function writeIcons(distDir) {
  const a = make(192), b = make(512);
  fs.writeFileSync(path.join(distDir, 'icon-192.png'), a);
  fs.writeFileSync(path.join(distDir, 'icon-512.png'), b);
  return a.length + b.length;
}
