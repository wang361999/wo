# 一页工具

纯前端、零依赖的在线工具箱静态站。所有计算与图片处理都在浏览器里完成，**没有上传接口、没有第三方脚本、不用登录**。

工具清单与分类参考自 [365工具箱](https://www.toolbox365.cn/) 的公开目录：**286 个工具 / 10 个分类**，一次全量接入注册表；功能按批次实现。当前**已接入 30 个**，每个都有独立网址。

## 跑起来

```bash
node build.mjs        # 生成 dist/
```

零依赖，不需要 `npm install`。本地预览随便起个静态服务指向 `dist/` 即可。

## 结构

```
src/data/catalog.mjs      注册表：10 分类 + 端分级 + 286 条工具（含 status / tier）
src/templates/layout.mjs  全站布局、信任条、端预览切换
src/templates/home.mjs    门面（SSR 输出全部卡片与两套导航）
src/templates/tool.mjs    统一工具页壳（静态 HTML 里就有说明与用法）
src/static/style.css      全站样式：纸质感 + 电脑/手机两套布局
src/static/app.js         门面交互：搜索、两级筛选、计数联动、待接入弹层
src/static/kit.js         工具运行时：formTool 表单引擎 + 复制/下载/吸底等 helper
src/static/tool.js        工具页加载器：按 data-tool 动态 import 模块
src/tools/<id>.js         每个工具一个模块，导出 mount(root)
src/lib/slice.js          canvas 切图与导出（九格切图原成品）
src/lib/zip.js            原生 JS 手写 ZIP（store + CRC32）
build.mjs                 读注册表 → 生成页面 / 资源 / sitemap
```

## 两级分类

- **第一级**：全部 / 电脑端 / 手机端。工具标 `dev`（`pc` / `mobile` / `both`），切一级时二级计数联动。
- **第二级**：10 个功能分类（导航资源、PDF 工具、图片、音频/视频、文本与开发、中文语言、生活与杂务、财务与计算、CSS 生成器、益智游戏）。

电脑端与手机端是**两套布局**：电脑端左侧固定分类栏 + 三列卡片、工具页左右并排；手机端顶部分段 + 分类横滑 + 单列卡片、工具页上下堆叠 + 操作按钮吸底。顶部「看电脑端 / 看手机端 / 自动」可强制切换，方便在电脑上验收两套。

## 加一个工具（三步，壳不用改）

1. `src/data/catalog.mjs`：把该条 `status` 改成 `ready`、`tier` 改成 `1`；
2. `src/tools/<id>.js`：放一个导出 `mount(root)` 的模块。纯表单/计算类用 `formTool(spec)`，复杂交互用 `customTool(render)`；
3. `node build.mjs`：自动生成 `/tools/<id>/` 独立页并加入 sitemap。

构建脚本会检查：标成 `ready` 却没有模块时直接报错退出，避免「卡片能点、页面空白」。

**只给已实现的工具生成独立网址**，未接入的卡片点击后显示它排在第几批——不批量铺没有功能的空壳页。

## 可接入性分级

| 状态 | 含义 |
|---|---|
| `ready` | 已实现，独立页、真能跑 |
| `later` | 零依赖纯前端可做，排在后续批次 |
| `lib` | 要引第三方库或 wasm（PDF、二维码、音视频、EPUB、Excel…） |
| `blocked` | 静态站接不了：外部实时数据、AI 模型、信令服务、大型语料 |

完整 6 批清单见 `工具箱-分批接入计划.md`（交付文档）。

## 部署（Vercel）

`vercel.json` 已配好 `buildCommand: node build.mjs`、`outputDirectory: dist`，导入仓库即可，无需手填构建命令。

`SITE_URL` 不设也行：构建会自动从 `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` 推断，用于 canonical 与 sitemap。建议显式设成自己的域名，避免落到 `xxx.vercel.app`。

`public/` 下放需要直接进产物根目录的自定义文件（目录内有 `.gitkeep` 保证 Git 跟踪；构建会跳过点文件）。

## 数据来源说明

分类结构、工具名称与 `platform` 标记来自参考站公开目录，属事实性索引；卡片描述为改写后的中性功能摘要，未照搬原文案。所有工具的实现均为本站独立编写（canvas / Web API / 原生 JS），未使用参考站代码或资源。
