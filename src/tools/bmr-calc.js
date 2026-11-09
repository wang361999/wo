/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"bmr-calc","name":"基础代谢率","cat":"health","icon":"🔥","desc":"按 Mifflin 公式算每日基础代谢与总消耗","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~体重~kg~65;h~身高~cm~172;a~年龄~岁~30;act~活动系数~倍~1.375","p2":"基础代谢:10*w+6.25*h-5*a+5;每日总消耗:(10*w+6.25*h-5*a+5)*act","p3":"公式按男性常数 5，女性需减 166"});
