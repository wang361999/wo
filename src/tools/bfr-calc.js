/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"bfr-calc","name":"体脂率估算","cat":"health","icon":"⚖️","desc":"按 BMI 法与腰围法两种口径估算体脂率","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~体重~kg~65;h~身高~cm~172;a~年龄~岁~30;waist~腰围~cm~78","p2":"BMI: w/((h/100)*(h/100));BMI 法体脂:1.2*(w/((h/100)*(h/100)))+0.23*a-16.2","p3":"女性 BMI 法需加 10.8，此处为通用估算"});
