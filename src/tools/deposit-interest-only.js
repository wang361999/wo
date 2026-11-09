/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-interest-only","name":"存本取息利息","cat":"finance","icon":"💵","desc":"本金不动、按月取息，算每期与累计利息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~本金~元~100000;r~年利率~%~1.3;n~月数~月~12","p2":"每期利息:p*r/100/12;累计利息:p*r/100/12*n;到期本金:p","p3":""});
