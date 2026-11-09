/* 由 gen/generate.mjs 生成，勿手改。 */
import { makeTool } from '/x-core.js';
export default makeTool({"id":"child-sleep","name":"儿童睡眠时间","cat":"health","icon":"😴","desc":"按年龄给推荐睡眠时长与就寝时间","dev":"both","tags":[],"status":"ready","tier":1,"mode":"local","kind":"calc","p1":"a~年龄~岁~5;wake~起床时间~时~7","p2":"推荐时长:14-a*0.5;建议就寝:wake-(14-a*0.5)","p3":"按学龄前递减公式粗估"});
