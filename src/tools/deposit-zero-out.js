/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-zero-out","name":"整存零取利息","cat":"finance","icon":"🏧","desc":"一次存入后分期支取，估算到期利息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~一次存入~元~60000;n~月数~月~12;r~年利率~%~1.1","p2":"每期支取:p/n;利息:p*r/100/12*(n+1)/2;本息合计:p+p*r/100/12*(n+1)/2","p3":"按平均余额法估算"});
