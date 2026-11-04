# 一页纸 · 学生用的可打印工具页

一个纯静态站点：每一页只解决一个具体的小问题，结果已经生成好，打开就能用、能打印。零依赖、零后端，Vercel 免费套餐直接托管。

## 本地跑起来

```bash
node build.mjs          # 生成 dist/
npm run dev             # 构建 + 本地预览 http://localhost:4173
```

构建脚本是 `build.mjs`，只读 `src/data/` 里的数据，输出静态 HTML 到 `dist/`。**没有 npm 依赖**，不需要 `npm install`。

## 部署到 Vercel

1. 把这个仓库导入 Vercel，框架选 Other（或让它自动识别），`vercel.json` 已经配好：
   - Build Command：`node build.mjs`
   - Output Directory：`dist`
2. 在 Vercel 项目设置里加一个环境变量 **`SITE_URL`** = 你的域名（如 `https://www.example.com`，不带结尾斜杠）。
   它用于生成 canonical 标签和 `sitemap.xml`。不设的话会用 `https://example.com` 占位。
3. 绑定自己的域名即可。

> 说明：Hobby 套餐仅限个人非商业用途，且中国大陆直连 `*.vercel.app` 不稳定，绑定自有域名是必须的（你已经有域名了）。

## 怎么加一页（这就是「乘法」）

**加一个工具：**
1. 在 `src/data/tools.mjs` 的 `tools` 数组里加一条（slug、title=用户会搜的那句原话、desc、keywords、related）。
2. 在 `src/tools/<slug>/` 下放一个 `render.mjs`，导出三个东西：
   - `defaultOpts`：默认选项
   - `controls()`：结果下方的控件 HTML（用 `data-opt` 标记选项）
   - `render(seed, opts)`：返回**结果区 HTML 字符串**（纯函数，Node 和浏览器都能跑）
   - 可选 `readOpts(root)`：从控件读选项（浏览器端用）
3. 跑 `node build.mjs`。首页、该工具页、sitemap 全部自动出现。

`render.mjs` 会被复制到 `dist/tools/<slug>/`，浏览器端由 `/tool-client.mjs` 动态加载，点「换一批」时重新调用同一个 `render()`。**同一份逻辑既生成静态 HTML、又支撑交互**，所以搜索引擎抓到的每页都有真实内容，不是空壳。

**加一个生字：** 在 `src/data/hanzi.mjs` 里加一行（`c` 字、`p` 拼音、`n` 笔画数、`r` 部首、`s` 结构、`seq` 笔顺、`w` 组词、`tip` 小提示）。构建时会自动生成一个 `/hanzi/<拼音-笔画>/` 单字页，并同步到汉字查询表和首页生字表。

## 目录结构

```
build.mjs              生成全部页面 + sitemap，零依赖
vercel.json            Vercel 构建与静态托管配置
src/
  data/tools.mjs       工具注册表（加工具改这里）
  data/hanzi.mjs       一年级常用字（加生字改这里）
  templates/           页面模板：首页 / 工具页 / 单字页 / 布局
  tools/common.mjs     共享函数（随机、网格、答案块）
  tools/<slug>/        每个工具的 render.mjs
  static/              style.css / app.js / tool-client.mjs / favicon.svg
dist/                  构建产物（Vercel 托管这个目录，不进 git）
```

## 内容原则

- 标题就是用户会搜的那句原话，每页一个独立网址。
- **结果顶置**：静态 HTML 里就有真实题目 / 表格 / 字帖，不靠 JS 渲染空壳。
- 每页有别的页面拿不到的东西（随机生成的一套题、这个字的笔顺），避免批量站常见的薄内容问题。
- 打印样式单独做了 A4：隐藏导航和按钮，答案单独成页。
