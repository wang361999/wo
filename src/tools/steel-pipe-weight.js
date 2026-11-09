/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"steel-pipe-weight","name":"不锈钢圆管重量","cat":"math","icon":"⭕","desc":"外径壁厚与长度算圆管理论重量","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"D~外径~mm~50;T~壁厚~mm~2;L~长度~m~6","p2":"重量:0.02491*T*(D-T)*L","p3":"按 304 密度，单位 kg"});
