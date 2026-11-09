// 生成社交分享用的 1200×630 PNG（og:image）。
// 零依赖：直接用 Node 内置 zlib 手写 PNG，不引图像库、不依赖系统字体。
// 「工具辞典」构图：纸色底 + 左侧大方印（2×2 缺一角）+ 右侧词条行（朱点 + 墨条），
// 上沿文武线收头。不用文字，全靠版式传达辞典感。
import fs from 'node:fs';
import zlib from 'node:zlib';

const W = 1200, H = 630;
const PAPER = [244, 239, 225];
const INK = [34, 30, 18];
const INK_2 = [92, 85, 64];
const INK_3 = [142, 134, 108];
const LINE = [217, 209, 182];
const RED = [176, 53, 40];

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
  fill(0, 0, W, H, PAPER);

  // 上沿文武线：粗墨线 + 细墨线
  fill(80, 66, 1120, 70, INK);
  fill(80, 78, 1120, 80, INK);
  // 左端一小段朱砂，压住线头
  fill(80, 66, 214, 70, RED);

  // 左侧大方印：2×2 田字，缺右下角（品牌母题）
  const sx = 104, sy = 152, ss = 320;
  fill(sx, sy, sx + ss, sy + ss, RED);
  const mid = 7; // 田字分隔线宽
  fill(sx + ss / 2 - mid / 2, sy, sx + ss / 2 + mid / 2, sy + ss, PAPER);
  fill(sx, sy + ss / 2 - mid / 2, sx + ss, sy + ss / 2 + mid / 2, PAPER);
  // 三个印面：左上 / 右上 / 左下填纸色方；右下留朱，是品牌母题的「空位」
  const pad = 38, cell = ss / 2 - pad;
  fill(sx + pad, sy + pad, sx + pad + cell, sy + pad + cell, PAPER);
  fill(sx + ss / 2 + pad / 2, sy + pad, sx + ss / 2 + pad / 2 + cell, sy + pad + cell, PAPER);
  fill(sx + pad, sy + ss / 2 + pad / 2, sx + pad + cell, sy + ss / 2 + pad / 2 + cell, PAPER);

  // 右侧词条行：朱点（前 3 条大朱点）+ 墨条词头 + 浅色释义条；收在底部分隔线以上
  const ex = 508, ey0 = 152, rowH = 34, rows = 11;
  for (let i = 0; i < rows; i++) {
    const y = ey0 + i * rowH;
    // 朱点
    const d = i < 3 ? 12 : 8;
    const dc = i < 3 ? RED : INK_3;
    fill(ex, y + 8 - (d - 8) / 2, ex + d, y + 8 + d - (d - 8) / 2, dc);
    // 词头条（墨）
    const wHead = 150 + ((i * 53) % 5) * 34;
    fill(ex + 26, y, ex + 26 + wHead, y + 13, i < 3 ? INK : INK_2);
    // 释义条（浅）
    const wDesc = 260 + ((i * 97) % 6) * 40;
    fill(ex + 26, y + 20, ex + 26 + wDesc, y + 28, LINE);
  }

  // 下沿：细墨线 + 左段朱线呼应上沿
  fill(80, 552, 1120, 553, INK);
  fill(80, 560, 1120, 563, RED);
  // 底部小方印（页脚章）
  fill(1076, 574, 1120, 618, RED);
  fill(1087, 585, 1097, 595, PAPER);
  fill(1103, 585, 1113, 595, PAPER);
  fill(1087, 601, 1097, 611, PAPER);

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
