/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-flex","name":"定活两便利息","cat":"finance","icon":"🔄","desc":"按实际存期靠档计息，估算到手利息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~本金~元~30000;r~一年期利率~%~1.5;d~存期~天~200","p2":"按六折估算:p*r/100*0.6*d/365;本息:p+p*r/100*0.6*d/365","p3":"定活两便通常按同档整存整取六折计息"});
