/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"blood-alcohol","name":"血液酒精含量","cat":"health","icon":"🍺","desc":"按 Widmark 公式估算血液酒精浓度","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"ml~饮酒量~mL~500;abv~酒精度~%~4;w~体重~kg~65;r~分布系数~~0.68;h~经过小时~小时~2","p2":"摄入酒精克:ml*abv/100*0.789;估算浓度:ml*abv/100*0.789/(w*r)*100-15*h/100","p3":"仅为估算，不能作为驾车判断依据"});
