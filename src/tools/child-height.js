/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"child-height","name":"孩子身高预测","cat":"health","icon":"📐","desc":"按父母身高估算男孩女孩成年身高","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"f~父亲身高~cm~175;m~母亲身高~cm~162","p2":"男孩:(f+m+13)/2;女孩:(f+m-13)/2;浮动区间:(f+m+13)/2-5","p3":"遗传靶身高，误差约 5 厘米"});
