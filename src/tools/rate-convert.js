/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"rate-convert","name":"年月日利率互转","cat":"finance","icon":"📅","desc":"年利率月利率日利率三向互算","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"v~已知利率~%~4.5","p2":"折月利率:v/12;折日利率:v/365;复利等效年化:(Math.pow(1+v/1200,12)-1)*100","p3":"单利按 365 天，复利另列"});
