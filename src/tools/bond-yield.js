/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"bond-yield","name":"国债到期收益","cat":"finance","icon":"📜","desc":"面值、票面利率与买入价算持有到期收益","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"face~面值~元~100;coupon~票面利率~%~2.5;price~买入价~元~98;y~剩余年数~年~3","p2":"每年利息:face*coupon/100;到期总收益:face*coupon/100*y+(face-price);简单年化:(face*coupon/100+(face-price)/y)/price*100","p3":""});
