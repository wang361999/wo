/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"brinell-hardness","name":"布氏硬度计算","cat":"math","icon":"🔨","desc":"按试验力、钢球直径与压痕直径算 HBW","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"P~试验力~kgf~3000;D~钢球直径~mm~10;d~压痕直径~mm~4","p2":"布氏硬度:2*P/(Math.PI*D*(D-Math.sqrt(D*D-d*d)))","p3":"压痕直径必须小于钢球直径"});
