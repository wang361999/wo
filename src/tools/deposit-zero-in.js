/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"deposit-zero-in","name":"零存整取利息","cat":"finance","icon":"🪙","desc":"每月固定存入，按累计月数算到期本息","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"m~每月存入~元~1000;n~月数~月~12;r~年利率~%~1.1","p2":"累计本金:m*n;利息:m*r/100/12*n*(n+1)/2;本息:m*n+m*r/100/12*n*(n+1)/2","p3":"按月积数法估算"});
