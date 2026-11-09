/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"npow-calc","name":"N 次方计算","cat":"math","icon":"🔢","desc":"底数与指数任意组合，给出反向开方","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"x~底数~~2;n~指数~~10","p2":"N 次方:Math.pow(x,n);反向 N 次根:Math.pow(Math.pow(x,n),1/n)","p3":""});
