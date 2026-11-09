/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"paper-gram-thickness","name":"纸张克重厚度换算","cat":"math","icon":"📄","desc":"按克重与紧度估算纸张厚度","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"g~克重~g/m²~80;d~紧度~g/cm³~0.8;n~张数~张~500","p2":"单张厚度微米:g/d;整叠厚度毫米:g/d*n/1000","p3":"紧度是估算值，铜版纸与胶版纸差异较大"});
