/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"sector-area","name":"扇形面积","cat":"math","icon":"🍕","desc":"按圆心角或弧长算扇形面积与弧长","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"r~半径~cm~6;n~圆心角度~度~90","p2":"面积:Math.PI*r*r*n/360;弧长:Math.PI*r*n/180;周长:2*r+Math.PI*r*n/180","p3":""});
