/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"sqrt-calc","name":"平方根计算","cat":"math","icon":"√","desc":"算平方根，负数时明确标注无实数解","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"x~数值~~16","p2":"平方根:Math.sqrt(x);平方:x*x","p3":"负数返回 NaN 表示无实数平方根"});
