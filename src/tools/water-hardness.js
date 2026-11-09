/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"water-hardness","name":"水硬度计算","cat":"math","icon":"💧","desc":"按钙镁离子浓度换算德国度与分级","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"ca~钙离子~mg/L~60;mg~镁离子~mg/L~12","p2":"以碳酸钙计:ca*2.497+mg*4.118;德国度:(ca*2.497+mg*4.118)/17.848","p3":"德国度低于 8 为软水"});
