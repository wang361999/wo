# 九格切图

一个只做一件事的在线工具：把一张图切成九宫格（也能切四宫格、横三连、竖三连或自定义行列），拖动调整取景，实时预览，一键打包成按 `01`、`02`… 编号的图片，按顺序发朋友圈 / 小红书。

**纯前端、零依赖、零后端。** 图片全程只在浏览器里用 canvas 处理，页面没有任何上传接口，不经过服务器。ZIP 打包也是本地用原生 JS 拼的，没有引入压缩库。

## 本地跑

```bash
node build.mjs     # 把 src/ 复制成 dist/，生成 sitemap / robots
npm run dev        # 构建 + 本地预览 http://localhost:4173
```

## 目录

| 路径 | 作用 |
|---|---|
| `src/index.html` | 单页结构与页面文案 |
| `src/app.js` | 交互：上传 / 拖动 / 缩放 / 预览 / 下载 |
| `src/slice.js` | 取景框计算与 canvas 切图 |
| `src/zip.js` | 原生 JS 的 ZIP 打包（store 模式 + CRC32） |
| `src/style.css` | 样式 |
| `build.mjs` | 构建：复制静态资源、替换域名占位、生成 sitemap |

## 部署

导入 Vercel 即可，`vercel.json` 已配好 `framework: null` / `buildCommand: node build.mjs` / `outputDirectory: dist`，导入时不用手填。

建议在 Vercel 项目里设环境变量 `SITE_URL` 为你的域名，用于 canonical 与 sitemap；不设的话会自动取 Vercel 注入的生产域名。

## 支持

- 输入：点选文件、拖拽、直接 `Ctrl/⌘ + V` 粘贴截图
- 网格：3×3 / 2×2 / 1×3 / 3×1 / 2×3 / 1×2，或自填 1–8 行列
- 调整：预览图上拖动移动取景，滚轮 / 滑块缩放（1–3×），可还原
- 输出：每格长边 720 / 1080 / 1440 px 或跟随原图；可选留白边距、背景色（白/米/黑）、PNG / JPG
- 导出：单张保存，或打包下载全部（按发布顺序命名）

浏览器需支持 `canvas.toBlob`、`OffscreenCanvas` 无关、`roundRect`（现代 Chromium / Safari / Firefox 均可）。
