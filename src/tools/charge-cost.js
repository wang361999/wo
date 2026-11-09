/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"charge-cost","name":"新能源充电费用","cat":"math","icon":"🔌","desc":"按电池容量、剩余电量与电价算一次充电花费","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"kwh~电池容量~kWh~60;from~当前电量~%~20;to~目标电量~%~90;p~电价~元/kWh~1.2","p2":"充入电量:kwh*(to-from)/100;费用:kwh*(to-from)/100*p;估算续航:kwh*(to-from)/100*6","p3":"续航按 6km/kWh 粗估"});
