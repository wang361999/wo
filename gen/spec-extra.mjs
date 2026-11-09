// 把 extra.mjs 里的 286 个工具编译成浏览器模块。
// 这些工具共用的是 /x-core.js 里的引擎，模块本身只有一行注册表数据，
// 所以新增工具不需要再复制一遍 UI 代码。
import { EXTRA } from '../src/data/extra.mjs';

export const S = {};
for (const d of EXTRA) {
  const payload = JSON.stringify(d);
  S[d.id] = {
    kind: 'code',
    code: `/* 由 gen/generate.mjs 生成，勿手改。 */\nimport { makeTool } from '/x-core.js';\nexport default makeTool(${payload});\n`,
  };
}
