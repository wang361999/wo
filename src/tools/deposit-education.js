/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-education","name":"教育储蓄利息","cat":"finance","icon":"🎓","desc":"按整存整取口径算教育储蓄到期本息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"m~每月存入~元~500;n~月数~月~36;r~年利率~%~1.75","p2":"累计本金:m*n;利息:m*r/100/12*n*(n+1)/2;本息:m*n+m*r/100/12*n*(n+1)/2","p3":"按零存整取方式计息"});
