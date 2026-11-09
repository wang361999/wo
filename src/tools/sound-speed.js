/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"sound-speed","name":"声速计算","cat":"math","icon":"🔊","desc":"按空气温度估算声速与回声测距","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"t~气温~℃~20","p2":"声速:331.3+0.606*t;一公里传播秒数:1000/(331.3+0.606*t)","p3":"近似公式，未计入湿度与气压"});
