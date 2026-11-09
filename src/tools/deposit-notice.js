/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-notice","name":"通知存款利息","cat":"finance","icon":"📢","desc":"按一天或七天通知存款利率算利息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~本金~元~100000;r~年利率~%~0.45;d~存期~天~30","p2":"利息:p*r/100*d/365;本息:p+p*r/100*d/365","p3":"不足通知期限按活期计息"});
