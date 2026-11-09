/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-fixed","name":"整存整取利息","cat":"finance","icon":"💰","desc":"本金、存期与挂牌利率算到期本息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~本金~元~50000;r~年利率~%~1.5;y~存期~年~3","p2":"利息:p*r/100*y;本息:p+p*r/100*y;年均利息:p*r/100","p3":""});
