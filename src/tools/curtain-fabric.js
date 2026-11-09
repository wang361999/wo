/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"curtain-fabric","name":"窗帘用量计算","cat":"math","icon":"🪟","desc":"窗宽与褶皱倍数算布料米数与幅数","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"w~窗宽~m~2.4;h~帘高~m~2.6;k~褶皱倍数~倍~2;bw~布幅~m~2.8","p2":"所需幅数:Math.ceil(w*k/bw);用料米数:Math.ceil(w*k/bw)*(h+0.3)","p3":"帘高已含上下各 15cm 缝份"});
