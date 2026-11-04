// 切图核心：把一张图按「正方形取景框 → 网格」切成 N 块。
// 纯函数 + canvas，Node 构建期不用，只跑在浏览器。

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * 取景框：在原图上取一个正方形，zoom=1 时为最大内接正方形（恰好铺满、不裁掉内容），
 * zoom>1 时放大（裁掉四周）。offsetX/offsetY 是归一化 [-1,1] 的拖动偏移。
 * 返回源图坐标下的 sx, sy, side。
 */
export function cropWindow(iw, ih, zoom, offsetX, offsetY) {
  const z = clamp(zoom, 1, 3);
  const side = Math.min(iw, ih) / z;
  const maxX = iw - side;
  const maxY = ih - side;
  const baseX = (iw - side) / 2;
  const baseY = (ih - side) / 2;
  const sx = clamp(baseX + (offsetX * maxX) / 2, 0, maxX);
  const sy = clamp(baseY + (offsetY * maxY) / 2, 0, maxY);
  return { sx, sy, side, maxX, maxY };
}

/**
 * 把窗口等分成 rows×cols 块。每块按「源块比例」输出，长边为 outSize，
 * 直接铺满、不留白、不拉伸——这样 N 块拼回去正好是原图。
 * 3×3 时每块是正方形；1×3 时每块是竖长条。
 */
export function sliceImage(img, rows, cols, win, outSize, bgColor, pad = 0) {
  const { sx, sy, side } = win;
  const cw = side / cols;
  const chh = side / rows;
  const scale = outSize / Math.max(cw, chh);
  const outW = Math.max(1, Math.round(cw * scale));
  const outH = Math.max(1, Math.round(chh * scale));
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas');
      // 留白用「画布外扩」实现，内容比例不变、不会被拉伸
      cv.width = outW + pad * 2;
      cv.height = outH + pad * 2;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(
        img,
        sx + c * cw, sy + r * chh, cw, chh,
        pad, pad, outW, outH
      );
      cells.push({ index: r * cols + c + 1, row: r, col: c, canvas: cv, outW, outH });
    }
  }
  return cells;
}

export function canvasToBytes(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('canvas 导出失败'));
      const fr = new FileReader();
      fr.onload = () => resolve(new Uint8Array(fr.result));
      fr.onerror = () => reject(new Error('读取 blob 失败'));
      fr.readAsArrayBuffer(blob);
    }, type, quality);
  });
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
