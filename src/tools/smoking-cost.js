/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"smoking-cost","name":"吸烟成本计算","cat":"math","icon":"🚭","desc":"按每天包数与单价估算一年和多年花费","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"n~每天~包~1;p~每包~元~25;y~年数~年~10","p2":"一年花费:n*p*365;累计花费:n*p*365*y;累计支数:n*20*365*y","p3":""});
