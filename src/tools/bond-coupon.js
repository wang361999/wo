/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"bond-coupon","name":"附息国债收益","cat":"finance","icon":"📈","desc":"按付息次数算每期利息与当期收益率","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"face~面值~元~100;coupon~票面利率~%~2.8;price~买入价~元~101;n~每年付息次数~次~2","p2":"每期利息:face*coupon/100/n;年利息:face*coupon/100;当期收益率:face*coupon/100/price*100","p3":""});
