/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"annualized-return","name":"年化收益率","cat":"finance","icon":"📈","desc":"按起止金额与持有天数算年化与总收益","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"p~初始金额~元~10000;e~期末金额~元~11200;d~持有天数~天~180","p2":"总收益率:(e-p)/p*100;年化收益率:(Math.pow(e/p,365/d)-1)*100;日化:(Math.pow(e/p,1/d)-1)*100","p3":"按复利折算"});
