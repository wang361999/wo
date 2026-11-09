/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"gold-return","name":"黄金买卖收益","cat":"finance","icon":"🥇","desc":"按买入卖出克数与价格算盈亏","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"g~克数~克~50;buy~买入价~元/克~480;sell~卖出价~元/克~520;fee~手续费率~%~0.5","p2":"毛收益:(sell-buy)*g;手续费:(buy+sell)*g*fee/100;净收益:(sell-buy)*g-(buy+sell)*g*fee/100","p3":""});
