/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"water-intake","name":"每日喝水量","cat":"health","icon":"💧","desc":"按体重与活动量算每日建议饮水量","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~体重~kg~65;extra~运动额外补水量~mL~300","p2":"建议饮水:w*35+extra;折合杯数:(w*35+extra)/250","p3":"每杯按 250mL"});
