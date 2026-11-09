/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"breath-count","name":"呼吸次数估算","cat":"health","icon":"💨","desc":"按年龄与静息呼吸频率估算累计呼吸次数","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"a~年龄~岁~30;r~每分钟呼吸~次~16","p2":"每年次数:r*60*24*365;累计次数:r*60*24*365*a","p3":"只是数量级估算"});
