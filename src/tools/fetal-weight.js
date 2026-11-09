/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"fetal-weight","name":"胎儿体重估算","cat":"health","icon":"🤰","desc":"按宫高腹围估算胎儿体重","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"f~宫高~cm~32;ab~腹围~cm~92","p2":"估算体重克:f*ab*0.9+500;折算斤:(f*ab*0.9+500)/500","p3":"粗略估算，以超声为准"});
