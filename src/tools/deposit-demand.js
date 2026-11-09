/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-demand","name":"活期存款利息","cat":"finance","icon":"🏦","desc":"本金与存期算活期利息和本息合计","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~本金~元~50000;r~年利率~%~0.2;d~存期~天~180","p2":"利息:p*r/100*d/365;本息:p+p*r/100*d/365","p3":""});
