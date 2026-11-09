/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"bond-zero","name":"零息国债收益","cat":"finance","icon":"📉","desc":"贴现价与面值算零息债券到期收益率","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"face~面值~元~100;price~买入价~元~95;y~剩余年数~年~2","p2":"到期收益:face-price;总收益率:(face-price)/price*100;年化收益率:(Math.pow(face/price,1/y)-1)*100","p3":""});
