/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"circle-area","name":"圆形面积","cat":"math","icon":"⭕","desc":"按半径算圆面积，顺带给出周长与直径","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"r~半径~cm~3","p2":"面积:Math.PI*r*r;周长:2*Math.PI*r;直径:2*r","p3":"单位随输入，结果保留 6 位有效数字"});
