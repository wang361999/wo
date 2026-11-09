/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"calorie-burn","name":"运动消耗热量","cat":"health","icon":"🏃","desc":"按 MET 值、体重与时长算运动消耗","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~体重~kg~65;met~代谢当量~MET~7;min~时长~分钟~40","p2":"消耗大卡:met*3.5*w/200*min;等价米饭克数:met*3.5*w/200*min/1.16","p3":"米饭按 116 大卡每百克"});
