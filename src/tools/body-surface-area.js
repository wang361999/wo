/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"body-surface-area","name":"身体表面积","cat":"health","icon":"🧍","desc":"按 Du Bois 公式算体表面积","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~体重~kg~65;h~身高~cm~172","p2":"体表面积:0.007184*Math.pow(h,0.725)*Math.pow(w,0.425);Mosteller 公式:Math.sqrt(h*w/3600)","p3":"单位平方米"});
