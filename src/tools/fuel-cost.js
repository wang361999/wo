/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"fuel-cost","name":"汽车油耗费用","cat":"math","icon":"⛽","desc":"按百公里油耗、里程和油价算花费","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"L~百公里油耗~L~8;km~里程~km~300;p~油价~元/L~7.8","p2":"总油耗:L*km/100;总费用:L*km/100*p;每公里:Math.round(L*p)/100","p3":"每公里结果单位为元"});
