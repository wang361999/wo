// 第二批工具注册表：功能对等的自有实现，只登记「做什么」，实现引擎在 src/static/x-*.js。
// 每行 10 个字段，用 | 分隔；# 开头是分组注释。
//   id|名称|分类|图标|功能摘要|引擎|参数1|参数2|参数3|档位
// calc  参数1=字段(id~标签~单位~默认值;...)，参数2=输出(标签:表达式;...)，参数3=口径说明
// unit  参数1=单位表(id~名称~折算系数;...)，参数2=口径说明
// text / codec / rand / color / custom / table  参数1=引擎里的算子名，参数2=补充说明
// 说明文字一律自己写，不复制任何外站描述；标 lite 的工具内置的是精简数据集。

const LINES = String.raw`
# ---- 数学与几何：公式类 ----
circle-area|圆形面积|math|⭕|按半径算圆面积，顺带给出周长与直径|calc|r~半径~cm~3|面积:Math.PI*r*r;周长:2*Math.PI*r;直径:2*r|单位随输入，结果保留 6 位有效数字
circle-diameter|圆形直径推算|math|🔵|已知直径反推半径、周长与圆面积|calc|d~直径~cm~10|半径:d/2;周长:Math.PI*d;面积:Math.PI*(d/2)*(d/2)|
circle-circumference|圆形周长|math|🟠|按半径或直径算圆的周长|calc|r~半径~cm~5|周长:2*Math.PI*r;面积:Math.PI*r*r;直径:2*r|
sphere-area|圆球表面积|math|⚪|按半径算球的表面积与体积|calc|r~半径~cm~5|表面积:4*Math.PI*r*r;体积:4*Math.PI*r*r*r/3|
sphere-volume|圆球体积|math|🔮|按半径算球体积，附带表面积|calc|r~半径~cm~5|体积:4*Math.PI*r*r*r/3;表面积:4*Math.PI*r*r|
hemisphere-volume|半球体积|math|🌗|按半径算半球体积，给出对应整球体积|calc|r~半径~cm~5|半球体积:2*Math.PI*r*r*r/3;整球体积:4*Math.PI*r*r*r/3|
hemisphere-curve|半球曲面面积|math|🌘|按半径算半球的曲面面积，不含底面|calc|r~半径~cm~5|曲面面积:2*Math.PI*r*r;底面积:Math.PI*r*r|
hemisphere-total|半球总表面积|math|🌖|曲面加底面，算半球的总表面积|calc|r~半径~cm~5|总表面积:3*Math.PI*r*r;曲面面积:2*Math.PI*r*r|
cuboid-volume|长方体体积|math|📦|长宽高算体积，并给表面积与对角线|calc|a~长~cm~4;b~宽~cm~3;h~高~cm~2|体积:a*b*h;表面积:2*(a*b+a*h+b*h);对角线:Math.sqrt(a*a+b*b+h*h)|
cylinder-side|圆柱侧面积|math|🥫|半径与高算圆柱侧面积，不含上下底|calc|r~半径~cm~3;h~高~cm~8|侧面积:2*Math.PI*r*h;底面积:Math.PI*r*r|
cylinder-area|圆柱表面积|math|🛢️|侧面积加两个底面，算圆柱总表面积|calc|r~半径~cm~3;h~高~cm~8|总表面积:2*Math.PI*r*(r+h);侧面积:2*Math.PI*r*h;体积:Math.PI*r*r*h|
cylinder-volume|圆柱体积|math|🧃|半径与高算圆柱容积，可换算成升|calc|r~半径~cm~3;h~高~cm~8|体积:Math.PI*r*r*h;容积:Math.PI*r*r*h/1000|体积单位 cm³，容积单位 L
cone-volume|圆锥体积|math|🍦|底半径与高算圆锥体积|calc|r~底半径~cm~3;h~高~cm~8|体积:Math.PI*r*r*h/3;同底圆柱:Math.PI*r*r*h|
cone-area|圆锥表面积|math|🔺|底半径与母线长算圆锥总表面积|calc|r~底半径~cm~3;l~母线长~cm~6|总表面积:Math.PI*r*(r+l);侧面积:Math.PI*r*l;底面积:Math.PI*r*r|
cone-side|圆锥侧面积|math|📐|底半径与母线长算圆锥侧面展开面积|calc|r~底半径~cm~3;l~母线长~cm~6|侧面积:Math.PI*r*l;展开扇形角:360*r/l|展开扇形角单位为度
ring-area|圆环面积|math|💍|外半径与内半径算圆环面积|calc|R~外半径~cm~6;r~内半径~cm~4|圆环面积:Math.PI*(R*R-r*r);外圆面积:Math.PI*R*R;内圆面积:Math.PI*r*r|
sector-area|扇形面积|math|🍕|按圆心角或弧长算扇形面积与弧长|calc|r~半径~cm~6;n~圆心角度~度~90|面积:Math.PI*r*r*n/360;弧长:Math.PI*r*n/180;周长:2*r+Math.PI*r*n/180|
trapezoid-area|梯形面积|math|🔻|上下底与高算梯形面积|calc|a~上底~cm~4;b~下底~cm~8;h~高~cm~5|面积:(a+b)*h/2|
parallelogram-area|平行四边形面积|math|▱|底与高算平行四边形面积|calc|a~底~cm~6;h~高~cm~4|面积:a*h;周长:2*(a+5)|周长按另一边缺省 5 估算，仅供对照
equilateral-area|等边三角形面积|math|🔺|边长算等边三角形面积与高|calc|a~边长~cm~6|面积:Math.sqrt(3)*a*a/4;高:Math.sqrt(3)*a/2;周长:3*a|
ellipse-area|椭圆面积|math|🥚|长短半轴算椭圆面积与近似周长|calc|a~长半轴~cm~6;b~短半轴~cm~4|面积:Math.PI*a*b;近似周长:Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)))|
hexagon-area|正六边形面积|math|⬡|边长算正六边形面积与周长|calc|a~边长~cm~5|面积:3*Math.sqrt(3)*a*a/2;周长:6*a;内切圆半径:Math.sqrt(3)*a/2|
wedge-volume|楔形体积|math|🧱|按楔形上下棱长、宽与高估算体积|calc|a~下棱长~cm~8;c~上棱长~cm~4;b~宽~cm~5;h~高~cm~3|体积:(2*a+c)*b*h/6|按标准楔体公式，复杂异形需另算
square-calc|平方计算|math|²|一个数算平方、倒数与平方根|calc|x~数值~~4|平方:x*x;立方:x*x*x;平方根:Math.sqrt(Math.abs(x))|
sqrt-calc|平方根计算|math|√|算平方根，负数时明确标注无实数解|calc|x~数值~~16|平方根:Math.sqrt(x);平方:x*x|负数返回 NaN 表示无实数平方根
cube-calc|立方计算|math|³|一个数算立方与立方根|calc|x~数值~~3|立方:x*x*x;立方根:Math.cbrt(x);平方:x*x|
cbrt-calc|立方根计算|math|∛|算立方根，支持负数|calc|x~数值~~27|立方根:Math.cbrt(x);校验:Math.cbrt(x)*Math.cbrt(x)*Math.cbrt(x)|
fourth-root|四次方根计算|math|⁴√|算四次方根，负数无实数解|calc|x~数值~~16|四次方根:Math.sqrt(Math.sqrt(x));校验:Math.pow(Math.sqrt(Math.sqrt(x)),4)|
npow-calc|N 次方计算|math|🔢|底数与指数任意组合，给出反向开方|calc|x~底数~~2;n~指数~~10|N 次方:Math.pow(x,n);反向 N 次根:Math.pow(Math.pow(x,n),1/n)|
abs-calc|绝对值计算|math|↔|算绝对值，顺带给出相反数与符号|calc|x~数值~~-7|绝对值:Math.abs(x);相反数:-x;符号:Math.sign(x)|
ln-calc|自然对数计算|math|📈|算自然对数、常用对数与以 2 为底对数|calc|x~正数~~10|自然对数:Math.log(x);常用对数:Math.log10(x);二进制对数:Math.log2(x)|x 必须大于 0
sound-speed|声速计算|math|🔊|按空气温度估算声速与回声测距|calc|t~气温~℃~20|声速:331.3+0.606*t;一公里传播秒数:1000/(331.3+0.606*t)|近似公式，未计入湿度与气压
water-hardness|水硬度计算|math|💧|按钙镁离子浓度换算德国度与分级|calc|ca~钙离子~mg/L~60;mg~镁离子~mg/L~12|以碳酸钙计:ca*2.497+mg*4.118;德国度:(ca*2.497+mg*4.118)/17.848|德国度低于 8 为软水
wood-density|木材密度计算|math|🪵|质量与体积算木材密度，给出气干密度分级|calc|m~质量~g~600;v~体积~cm³~1000|密度:m/v;每立方米千克:m/v*1000|
steel-plate-weight|不锈钢板重量|math|⬜|长宽厚算不锈钢板理论重量|calc|L~长~mm~1000;W~宽~mm~1000;T~厚~mm~2|重量:L*W*T*7.93/1000000|按 304 密度 7.93 g/cm³，单位 kg
steel-pipe-weight|不锈钢圆管重量|math|⭕|外径壁厚与长度算圆管理论重量|calc|D~外径~mm~50;T~壁厚~mm~2;L~长度~m~6|重量:0.02491*T*(D-T)*L|按 304 密度，单位 kg
steel-square-weight|不锈钢方管重量|math|▢|边长壁厚与长度算方管理论重量|calc|A~边长~mm~40;T~壁厚~mm~2;L~长度~m~6|重量:(4*A*T-4*T*T)*L*7.93/1000|按 304 密度，单位 kg
brinell-hardness|布氏硬度计算|math|🔨|按试验力、钢球直径与压痕直径算 HBW|calc|P~试验力~kgf~3000;D~钢球直径~mm~10;d~压痕直径~mm~4|布氏硬度:2*P/(Math.PI*D*(D-Math.sqrt(D*D-d*d)))|压痕直径必须小于钢球直径
paper-gram-thickness|纸张克重厚度换算|math|📄|按克重与紧度估算纸张厚度|calc|g~克重~g/m²~80;d~紧度~g/cm³~0.8;n~张数~张~500|单张厚度微米:g/d;整叠厚度毫米:g/d*n/1000|紧度是估算值，铜版纸与胶版纸差异较大
curtain-fabric|窗帘用量计算|math|🪟|窗宽与褶皱倍数算布料米数与幅数|calc|w~窗宽~m~2.4;h~帘高~m~2.6;k~褶皱倍数~倍~2;bw~布幅~m~2.8|所需幅数:Math.ceil(w*k/bw);用料米数:Math.ceil(w*k/bw)*(h+0.3)|帘高已含上下各 15cm 缝份
smoking-cost|吸烟成本计算|math|🚭|按每天包数与单价估算一年和多年花费|calc|n~每天~包~1;p~每包~元~25;y~年数~年~10|一年花费:n*p*365;累计花费:n*p*365*y;累计支数:n*20*365*y|
fuel-cost|汽车油耗费用|math|⛽|按百公里油耗、里程和油价算花费|calc|L~百公里油耗~L~8;km~里程~km~300;p~油价~元/L~7.8|总油耗:L*km/100;总费用:L*km/100*p;每公里:Math.round(L*p)/100|每公里结果单位为元
tv-distance|电视观看距离|math|📺|按屏幕对角尺寸与分辨率给推荐观看距离|calc|inch~对角尺寸~英寸~55|4K 建议米:inch*0.0254*1.5;1080P 建议米:inch*0.0254*3;屏幕宽米:inch*0.0254*0.8716|按 16:9 与常见视场角估算
charge-cost|新能源充电费用|math|🔌|按电池容量、剩余电量与电价算一次充电花费|calc|kwh~电池容量~kWh~60;from~当前电量~%~20;to~目标电量~%~90;p~电价~元/kWh~1.2|充入电量:kwh*(to-from)/100;费用:kwh*(to-from)/100*p;估算续航:kwh*(to-from)/100*6|续航按 6km/kWh 粗估
planet-weight|行星体重换算|math|🪐|按各星球表面重力换算体重|calc|w~地球体重~kg~60|水星:w*0.378;金星:w*0.907;火星:w*0.377;木星:w*2.36;土星:w*0.916;月球:w*0.166|冥王星等矮行星未列入
# ---- 数学与几何：单位换算 ----
data-size-unit|数据大小换算|math|💾|字节到 PB 全单位互转，区分十进制与二进制|unit|B~字节~1;KB~千字节~1000;MB~兆字节~1000000;GB~吉字节~1000000000;TB~太字节~1000000000000;KiB~Kibibyte~1024;MiB~Mebibyte~1048576;GiB~Gibibyte~1073741824|十进制用 1000 进位，二进制用 1024 进位
power-unit|功率换算|math|⚡|瓦、千瓦、马力、英热单位每小时互转|unit|W~瓦~1;kW~千瓦~1000;PS~公制马力~735.499;HP~英制马力~745.7;BTU/h~英热每小时~0.293071|以瓦为基准
pressure-unit|压力换算|math|🌡️|帕、巴、标准大气压、psi、毫米汞柱互转|unit|Pa~帕~1;kPa~千帕~1000;bar~巴~100000;atm~标准大气压~101325;psi~磅力每平方英寸~6894.76;mmHg~毫米汞柱~133.322|以帕为基准
speed-unit|速度换算|math|🏃|米每秒、公里每小时、英里每小时、节互转|unit|m/s~米每秒~1;km/h~公里每小时~0.277778;mph~英里每小时~0.44704;kn~节~0.514444;马赫~海平面马赫~340.3|马赫按 15℃ 海平面近似
heat-unit|热量换算|math|🔥|焦耳、卡路里、大卡、千瓦时、英热单位互转|unit|J~焦耳~1;kJ~千焦~1000;cal~卡路里~4.184;kcal~大卡~4184;Wh~瓦时~3600;kWh~千瓦时~3600000;BTU~英热单位~1055.06|以焦耳为基准
volume-unit|体积容量换算|math|🧴|升、毫升、立方米、加仑、品脱互转|unit|mL~毫升~0.001;L~升~1;m3~立方米~1000;cm3~立方厘米~0.001;galUS~美制加仑~3.78541;galUK~英制加仑~4.54609;ptUS~美制品脱~0.473176|以升为基准
weight-unit|重量换算|math|⚖️|克、千克、吨、斤、两、磅、盎司互转|unit|g~克~0.001;kg~千克~1;t~吨~1000;jin~市斤~0.5;liang~市两~0.05;lb~磅~0.453592;oz~盎司~0.0283495|以千克为基准
angle-unit|角度弧度换算|math|📐|度、弧度、梯度、角分角秒互转|unit|deg~度~1;rad~弧度~57.2958;grad~梯度~0.9;arcmin~角分~0.0166667;arcsec~角秒~0.000277778|以度为基准
# ---- 数学与几何：数列与算法 ----
gcd-calc|最大公约数|math|➗|一行多个整数算最大公约数并展示辗转过程|text|gcd||
lcm-calc|最小公倍数|math|✖️|一行多个整数算最小公倍数|text|lcm||
prime-factor|质因数分解|math|🔍|把整数分解成质因数乘积，标出是否质数|text|factor||
prime-range|质数生成|math|🔢|列出指定区间内全部质数并计数|text|primes||
game24-solver|24 点求解|math|🃏|给四个数穷举加减乘除，列出所有解|text|game24|穷举全部括号与运算顺序
ipv6-calc|IPv6 地址展开|dev|🔢|IPv6 压缩与完整写法互转，算网络前缀|text|ipv6||
ip-num-convert|IP 与整数互转|dev|🔟|IPv4 地址与 32 位无符号整数互相换算|text|ipnum||
bcc-check|BCC 异或校验|dev|🧮|逐字节异或算 BCC 校验值，支持十六进制输入|codec|bcc||
lrc-check|LRC 纵向冗余校验|dev|📊|算 LRC 校验字节，常用于工业协议帧|codec|lrc||
# ---- 财务与储蓄 ----
rate-convert|年月日利率互转|finance|📅|年利率月利率日利率三向互算|calc|v~已知利率~%~4.5|折月利率:v/12;折日利率:v/365;复利等效年化:(Math.pow(1+v/1200,12)-1)*100|单利按 365 天，复利另列
gold-return|黄金买卖收益|finance|🥇|按买入卖出克数与价格算盈亏|calc|g~克数~克~50;buy~买入价~元/克~480;sell~卖出价~元/克~520;fee~手续费率~%~0.5|毛收益:(sell-buy)*g;手续费:(buy+sell)*g*fee/100;净收益:(sell-buy)*g-(buy+sell)*g*fee/100|
annualized-return|年化收益率|finance|📈|按起止金额与持有天数算年化与总收益|calc|p~初始金额~元~10000;e~期末金额~元~11200;d~持有天数~天~180|总收益率:(e-p)/p*100;年化收益率:(Math.pow(e/p,365/d)-1)*100;日化:(Math.pow(e/p,1/d)-1)*100|按复利折算
deposit-demand|活期存款利息|finance|🏦|本金与存期算活期利息和本息合计|calc|p~本金~元~50000;r~年利率~%~0.2;d~存期~天~180|利息:p*r/100*d/365;本息:p+p*r/100*d/365|
deposit-notice|通知存款利息|finance|📢|按一天或七天通知存款利率算利息|calc|p~本金~元~100000;r~年利率~%~0.45;d~存期~天~30|利息:p*r/100*d/365;本息:p+p*r/100*d/365|不足通知期限按活期计息
deposit-fixed|整存整取利息|finance|💰|本金、存期与挂牌利率算到期本息|calc|p~本金~元~50000;r~年利率~%~1.5;y~存期~年~3|利息:p*r/100*y;本息:p+p*r/100*y;年均利息:p*r/100|
deposit-flex|定活两便利息|finance|🔄|按实际存期靠档计息，估算到手利息|calc|p~本金~元~30000;r~一年期利率~%~1.5;d~存期~天~200|按六折估算:p*r/100*0.6*d/365;本息:p+p*r/100*0.6*d/365|定活两便通常按同档整存整取六折计息
deposit-zero-in|零存整取利息|finance|🪙|每月固定存入，按累计月数算到期本息|calc|m~每月存入~元~1000;n~月数~月~12;r~年利率~%~1.1|累计本金:m*n;利息:m*r/100/12*n*(n+1)/2;本息:m*n+m*r/100/12*n*(n+1)/2|按月积数法估算
deposit-zero-out|整存零取利息|finance|🏧|一次存入后分期支取，估算到期利息|calc|p~一次存入~元~60000;n~月数~月~12;r~年利率~%~1.1|每期支取:p/n;利息:p*r/100/12*(n+1)/2;本息合计:p+p*r/100/12*(n+1)/2|按平均余额法估算
deposit-interest-only|存本取息利息|finance|💵|本金不动、按月取息，算每期与累计利息|calc|p~本金~元~100000;r~年利率~%~1.3;n~月数~月~12|每期利息:p*r/100/12;累计利息:p*r/100/12*n;到期本金:p|
deposit-education|教育储蓄利息|finance|🎓|按整存整取口径算教育储蓄到期本息|calc|m~每月存入~元~500;n~月数~月~36;r~年利率~%~1.75|累计本金:m*n;利息:m*r/100/12*n*(n+1)/2;本息:m*n+m*r/100/12*n*(n+1)/2|按零存整取方式计息
bond-yield|国债到期收益|finance|📜|面值、票面利率与买入价算持有到期收益|calc|face~面值~元~100;coupon~票面利率~%~2.5;price~买入价~元~98;y~剩余年数~年~3|每年利息:face*coupon/100;到期总收益:face*coupon/100*y+(face-price);简单年化:(face*coupon/100+(face-price)/y)/price*100|
bond-zero|零息国债收益|finance|📉|贴现价与面值算零息债券到期收益率|calc|face~面值~元~100;price~买入价~元~95;y~剩余年数~年~2|到期收益:face-price;总收益率:(face-price)/price*100;年化收益率:(Math.pow(face/price,1/y)-1)*100|
bond-coupon|附息国债收益|finance|📈|按付息次数算每期利息与当期收益率|calc|face~面值~元~100;coupon~票面利率~%~2.8;price~买入价~元~101;n~每年付息次数~次~2|每期利息:face*coupon/100/n;年利息:face*coupon/100;当期收益率:face*coupon/100/price*100|
salary-convert|单双休日薪换算|life|💼|月薪按不同作息折算日薪与小时薪|calc|m~月薪~元~10000;h~每天工时~小时~8|双休日薪:m/21.75;大小周日薪:m/23;单休日薪:m/26;小时薪:m/21.75/h|计薪天数按常见口径估算
retirement-age|法定退休年龄|life|👴|按出生年月与性别查渐进式延迟退休对照|text|retire|按现行渐进式延迟退休口径，结果仅供规划参考|lite
retirement-countdown|退休日期倒数|life|📆|按预计退休日期算还要工作多少天|text|retiredays||
baby-hundred-days|宝宝百日计算|life|👶|按出生日期算百日、满月与周岁日期|text|babydays||
date-upper|日期大写转换|chinese|🀄|把数字日期转成中文大写日期写法|text|dateupper||
date-english|日期英文转换|chinese|🔤|把数字日期转成美式和英式写法|text|dateen||
shichen-convert|十二时辰转换|chinese|🕰️|把现代时间换算成十二时辰与刻|text|shichen||
hour1224|12 与 24 小时制|life|🕐|12 小时制与 24 小时制时间互相转换|text|hour1224||
ganzhi-bazi|生辰八字换算|chinese|🎋|按公历生日算四柱干支，注明节气分界|text|bazi|按年份干支与简化节气表推算，不替代专业排盘|lite
bazi-to-date|八字反查日期|chinese|🔎|由年柱干支反查对应公历年份范围|text|bazidate|按六十甲子周期反查|lite
dao-calendar|道历换算|chinese|☯️|按公历年份换算道教纪年|text|daoli|道历以黄帝纪元为基准，各派口径略有差异|lite
buddha-calendar|佛历换算|chinese|🙏|按公历年份换算佛历纪年|text|foli|以佛灭纪元常用口径换算|lite
leap-query|闰年闰月查询|chinese|🗓️|查任意年份是否闰年，并列出农历闰月|text|leapq|内置 1900 至 2100 年农历数据|lite
solar-terms|二十四节气|chinese|🌾|按年份列出二十四节气的近似公历日期|text|solarterms|按平气法近似推算，与天文时刻可能差一天|lite
sexagenary-table|六十甲子速查|chinese|🈶|六十组天干地支与生肖纳音对照表|table|sexagenary||lite
zodiac-constellation|生肖星座查询|life|♈|按出生日期查生肖、星座与干支年|text|zodiac||
shelf-life|保质期计算|life|🥛|按生产日期与保质期算到期日和剩余天数|text|shelflife||
gaokao-countdown|高考倒计时|life|📝|按选定年份算距离高考还有多少天|text|gaokao|默认按每年 6 月 7 日估算
# ---- 健康养生 ----
bmr-calc|基础代谢率|health|🔥|按 Mifflin 公式算每日基础代谢与总消耗|calc|w~体重~kg~65;h~身高~cm~172;a~年龄~岁~30;act~活动系数~倍~1.375|基础代谢:10*w+6.25*h-5*a+5;每日总消耗:(10*w+6.25*h-5*a+5)*act|公式按男性常数 5，女性需减 166
bfr-calc|体脂率估算|health|⚖️|按 BMI 法与腰围法两种口径估算体脂率|calc|w~体重~kg~65;h~身高~cm~172;a~年龄~岁~30;waist~腰围~cm~78|BMI: w/((h/100)*(h/100));BMI 法体脂:1.2*(w/((h/100)*(h/100)))+0.23*a-16.2|女性 BMI 法需加 10.8，此处为通用估算
body-surface-area|身体表面积|health|🧍|按 Du Bois 公式算体表面积|calc|w~体重~kg~65;h~身高~cm~172|体表面积:0.007184*Math.pow(h,0.725)*Math.pow(w,0.425);Mosteller 公式:Math.sqrt(h*w/3600)|单位平方米
calorie-burn|运动消耗热量|health|🏃|按 MET 值、体重与时长算运动消耗|calc|w~体重~kg~65;met~代谢当量~MET~7;min~时长~分钟~40|消耗大卡:met*3.5*w/200*min;等价米饭克数:met*3.5*w/200*min/1.16|米饭按 116 大卡每百克
water-intake|每日喝水量|health|💧|按体重与活动量算每日建议饮水量|calc|w~体重~kg~65;extra~运动额外补水量~mL~300|建议饮水:w*35+extra;折合杯数:(w*35+extra)/250|每杯按 250mL
target-heart-rate|燃脂心率|health|❤️|按年龄算最大心率与有氧燃脂区间|calc|a~年龄~岁~30|最大心率:220-a;燃脂下限:(220-a)*0.6;燃脂上限:(220-a)*0.75;有氧上限:(220-a)*0.85|单位为次每分钟
three-size-check|三围参考自测|health|📏|按身高给常见三围参考区间|calc|h~身高~cm~165|胸围参考:h*0.53;腰围参考:h*0.37;臀围参考:h*0.54|只是统计参考值，不是身材标准
fetal-weight|胎儿体重估算|health|🤰|按宫高腹围估算胎儿体重|calc|f~宫高~cm~32;ab~腹围~cm~92|估算体重克:f*ab*0.9+500;折算斤:(f*ab*0.9+500)/500|粗略估算，以超声为准
child-height|孩子身高预测|health|📐|按父母身高估算男孩女孩成年身高|calc|f~父亲身高~cm~175;m~母亲身高~cm~162|男孩:(f+m+13)/2;女孩:(f+m-13)/2;浮动区间:(f+m+13)/2-5|遗传靶身高，误差约 5 厘米
child-sleep|儿童睡眠时间|health|😴|按年龄给推荐睡眠时长与就寝时间|calc|a~年龄~岁~5;wake~起床时间~时~7|推荐时长:14-a*0.5;建议就寝:wake-(14-a*0.5)|按学龄前递减公式粗估
sleep-cycle|睡眠周期计算|health|🌙|按入睡或起床时间推算完整睡眠周期|text|sleepcycle|每周期按 90 分钟估算
breath-count|呼吸次数估算|health|💨|按年龄与静息呼吸频率估算累计呼吸次数|calc|a~年龄~岁~30;r~每分钟呼吸~次~16|每年次数:r*60*24*365;累计次数:r*60*24*365*a|只是数量级估算
blood-pressure|血压分级|health|🩸|按收缩压舒张压对照分级并给提示|text|bloodpressure|参考一般成人诊室血压分级
blood-alcohol|血液酒精含量|health|🍺|按 Widmark 公式估算血液酒精浓度|calc|ml~饮酒量~mL~500;abv~酒精度~%~4;w~体重~kg~65;r~分布系数~~0.68;h~经过小时~小时~2|摄入酒精克:ml*abv/100*0.789;估算浓度:ml*abv/100*0.789/(w*r)*100-15*h/100|仅为估算，不能作为驾车判断依据
vitamin-table|维生素与食物|health|🥗|常见维生素、功能与主要食物来源速查|table|vitamins||lite
child-growth-table|儿童身高体重参考|health|🧒|各年龄段男女身高体重参考区间|table|childgrowth||lite
safety-period|安全期与排卵期|health|📅|按周期长度与末次月经推算易孕期区间|text|safety|日历法仅供了解，不能作为避孕依据
lung-age|肺龄自测|health|🫁|按年龄身高与呼吸问卷粗估肺功能年龄|text|lungage|问卷式估算，不替代肺功能检查
blood-type-child|子女血型预测|health|🅰️|按父母 ABO 血型列出子女可能血型|text|bloodtype|ABO 遗传规律，Rh 与亚型不在范围内
# ---- 站长与网页 ----
browser-info|浏览器信息|web|🖥️|读取当前浏览器 UA、语言、屏幕与能力支持|custom|browserinfo|
utm-builder|UTM 网址生成|web|🔗|填来源媒介活动等参数生成带 UTM 的链接|custom|utm|
robots-generator|robots.txt 生成|web|🤖|按勾选规则生成 robots.txt 内容|custom|robotsgen|
meta-generator|Meta 标签生成|web|🏷️|填标题描述与 OG 信息生成 head 标签|custom|metagen|
meta-check|网页 META 检测|web|🔍|粘贴 HTML 源码，列出已有和缺失的元信息|text|metacheck|
html-links|网页链接提取|web|🕸️|从 HTML 源码里批量提取链接与图片地址|text|htmllinks|
html-preview|HTML 调试预览|web|👁️|写 HTML CSS 在隔离 iframe 里即时预览|custom|htmlpreview|
js-runner|JS 代码调试|web|▶️|粘贴 JS 运行并捕获控制台输出|custom|jsrunner|
svg-to-css|SVG 转 CSS|web|🖼️|把 SVG 源码转成 background-image 可用写法|text|svg2css|
badge-generator|Shield Badge 生成|web|🛡️|填标签与状态生成 SVG 徽章|custom|badge|
css-glass|CSS 毛玻璃生成|web|🪟|调模糊透明度与圆角生成毛玻璃代码|custom|cssglass|
css-loading|CSS Loading 动画|web|⏳|选样式调速度生成纯 CSS 加载动画|custom|cssloading|
css-bubble|CSS 三角气泡框|web|💬|调三角位置与尺寸生成对话气泡代码|custom|cssbubble|
css-stripes|CSS 条纹背景|web|📊|调角度间距与配色生成条纹背景代码|custom|cssstripes|
css-neumorphism|新拟态 CSS 生成|web|🔘|调底色距离与模糊生成新拟态样式|custom|cssneu|
css-text-shadow|CSS 文字阴影|web|🔤|叠加多层文字阴影并实时预览|custom|csstextshadow|
css-button|CSS 按钮生成|web|🔘|调圆角渐变与悬停态生成按钮代码|custom|cssbutton|
desktop-shortcut|网站快捷方式|web|🔖|生成 Windows 与 Linux 桌面快捷方式文件|custom|shortcut|
cookie-parse|Cookie 字符串解析|web|🍪|把 Cookie 串拆成键值表并转成导入格式|text|cookieparse|
page-refresh|网页定时刷新|web|🔄|按间隔在 iframe 里重新载入指定网址|custom|pagerefresh|部分站点禁止被嵌入，会显示空白
htaccess-nginx|htaccess 转 Nginx|web|🔀|把常见 Apache 重写规则转成 Nginx 写法|text|htaccess|
url-batch|网址批量生成|web|🧾|按前缀、变量范围与后缀批量生成网址|text|urlbatch|
websocket-test|WebSocket 测试|web|🔌|连接 WebSocket 地址收发消息看日志|custom|wstest|只能连接允许浏览器跨域的公开服务
hello-world|Hello World 速查|web|👋|常见编程语言的最小可运行示例|table|helloworld||lite
php-functions|PHP 函数速查|web|🐘|常用 PHP 函数按用途分类速查|table|phpfunc||lite
lang-codes|国家语言代码|web|🌍|ISO 639 语言代码与中文名对照|table|langcodes||lite
mime-types|MIME 类型速查|web|📎|常见扩展名与 Content-Type 对照表|table|mimetypes||lite
magic-bytes|文件头 Magic Bytes|web|🧿|常见文件格式的十六进制文件头标识|table|magicbytes||lite
shortcut-vscode|VSCode 快捷键|nav|⌨️|代码编辑器常用快捷键分组速查|table|shortcuts_vscode||lite
shortcut-ps|Photoshop 快捷键|nav|🎨|图像处理常用快捷键分组速查|table|shortcuts_ps||lite
shortcut-excel|Excel 快捷键|nav|📗|表格处理常用快捷键分组速查|table|shortcuts_excel||lite
shortcut-ppt|PPT 快捷键|nav|📙|演示文稿常用快捷键分组速查|table|shortcuts_ppt||lite
shortcut-word|Word 快捷键|nav|📘|文档编辑常用快捷键分组速查|table|shortcuts_word||lite
shortcut-wps|WPS 快捷键|nav|📄|WPS 文字表格演示快捷键速查|table|shortcuts_wps||lite
excel-functions|Excel 函数速查|nav|Σ|常用 Excel 函数按用途分类|table|excelfunc||lite
linux-commands|Linux 命令速查|nav|🐧|常用 Linux 命令按场景分类|table|linuxcmd||lite
# ---- 参考表 ----
periodic-table|元素周期表|nav|⚛️|118 种化学元素的符号原子序与相对原子质量|table|elements||lite
area-codes|长途区号速查|nav|☎️|国内主要城市与地区的长途电话区号|table|areacodes||lite
hotline-list|常用服务电话|nav|📞|政务、急救、运营商与银行客服号码|table|hotlines||lite
province-list|省份简称与省会|nav|🗺️|省级行政区简称、省会与车牌首字母|table|provinces||lite
plate-lookup|车牌归属地速查|life|🚗|按车牌首字与字母查所属省份城市|table|plates||lite
paper-sizes|纸张标准尺寸|nav|📐|A B C 系列与常见开本尺寸对照|table|papersizes||lite
dynasty-table|中国历史朝代|nav|🏯|朝代起止年份、都城与代表人物|table|dynasties||lite
emperor-table|历代皇帝速查|nav|👑|主要朝代帝王与在位时间|table|emperors||lite
capital-list|各国首都速查|nav|🌐|国家、首都与所属大洲对照|table|capitals||lite
country-dial|国际区号与时差|nav|🕰️|主要国家地区电话区号与 UTC 偏移|table|countrydial||lite
festival-list|世界节日速查|nav|🎊|公历节日、农历节日与纪念日|table|festivals||lite
hardness-table|硬度对照表|nav|💎|莫氏硬度与常见材料对照|table|hardness||lite
school-list|双一流高校名单|life|🎓|按省份查 985 与 211 高校名单|table|schools||lite
special-symbols|特殊符号大全|chinese|✳️|常用可打印特殊符号分类速查|table|symbols||lite
chinese-colors|中国传统色彩|image|🏮|传统色名与对应十六进制色值|table|chinesecolors||lite
japan-colors|日本传统色彩|image|🌸|日本传统色名与对应十六进制色值|table|japancolors||lite
web-safe-colors|Web 安全色|image|🎛️|216 种 Web 安全色按色相排列|table|websafe||lite
rgb-table|RGB 颜色对照|image|🌈|常见颜色的 RGB 与十六进制对照|table|rgbtable||lite
cmyk-table|CMYK 颜色对照|image|🖨️|常见印刷色的 CMYK 与 RGB 对照|table|cmyktable||lite
gradient-gallery|渐变色方案|image|🌅|常用双色与多色渐变配色及 CSS 代码|table|gradients||lite
size-suit|男士西装尺码|life|👔|身高胸围腰围与西装号型对照|table|size_suit||lite
size-bra|文胸尺码对照|life|👙|上下胸围差与罩杯国际尺码对照|table|size_bra||lite
size-underwear|内裤尺码对照|life|🩲|腰围臀围与男女内裤尺码对照|table|size_underwear||lite
size-pants|裤子尺码对照|life|👖|腰围与裤长对应的尺码及国际码|table|size_pants||lite
size-ring|戒指尺寸对照|life|💍|指围周长与大陆港版美版戒圈号|table|size_ring||lite
# ---- 文本处理 ----
text-reverse|文本反转|dev|🔄|按字符或按行反转一段文本|text|reverse|
text-repeat|文本重复|dev|🔁|把文本按次数重复并自定义连接符|text|repeat|
line-numbers|文本添加行号|dev|🔢|给每行加序号，可设起始值与格式|text|linenum|
remove-blank-lines|去除空行|dev|🧹|删掉纯空白行与行尾空格|text|removeblank|
text-sort|文本排序|dev|🔤|按行排序，可选去重与升降序|text|sortlines|
text-pad|文本填充|dev|📏|按目标长度在左或右补齐字符|text|pad|
text-insert|文本批量插入|dev|➕|按字符间隔或每行首尾批量插入内容|text|insert|
extract-phones|手机号提取|dev|📱|从一段文字里批量提取手机号|text|phones|
extract-emails|邮箱提取|dev|✉️|从一段文字里批量提取邮箱地址|text|emails|
extract-urls|网址提取|dev|🌐|从一段文字里批量提取网址链接|text|urls|
newline-toggle|换行符互转|dev|↵|字面反斜杠 n 与真实换行互相转换|text|newline|
enter-to-p|回车转 P 标签|dev|📝|把每段文字包成 HTML 段落标签|text|enterp|
name-sort|姓名排序|chinese|📇|按姓氏拼音或笔画给名单排序|text|namesort|笔画按内置常用字表近似，生僻字回退拼音|lite
article-format|文章一键排版|chinese|📰|中文段落缩进、空行与标点规范化|text|articleformat|
vertical-text|古文竖排排版|chinese|📜|把文字排成从右到左的竖版样式|text|vertical|
mars-text|火星文转换|chinese|👽|把简体字替换成常见火星文写法|text|mars||lite
sensitive-check|敏感词检测|dev|🚫|按内置精简词表标出疑似违禁表述|text|sensitive|词表为精简版，只作自查提示|lite
rich-editor|富文本编辑器|dev|📝|所见即所得编辑并导出 HTML|custom|richeditor|
kaomoji-list|颜文字速查|chinese|😊|常用颜文字按情绪分类速查|table|kaomoji||lite
pinyin-to-hanzi|拼音转汉字|chinese|🔠|按拼音音节查常用同音汉字|text|pinyin2hanzi|内置常用音节与汉字，非全字表|lite
stroke-to-hanzi|笔画数查汉字|chinese|🖌️|按笔画数查常用汉字|text|stroke2hanzi|内置常用字笔画表|lite
goupi-article|废话文章生成|puzzle|📄|随机拼装一段看似正经的空洞长文|rand|goupi|娱乐用途
rainbow-fart|彩虹屁生成|puzzle|🌈|随机生成一句花式夸人的话|rand|caihong|娱乐用途
# ---- 编码与格式 ----
text-binary|文本与二进制|dev|0️⃣|文本与 0 1 二进制互相转换|codec|binary|
string-ascii|字符串 ASCII 互换|dev|🔡|文本与十进制 ASCII 码互相转换|codec|asciicode|
unicode-ascii|Unicode 与 ASCII 转义|dev|🔠|中文与 \u 转义序列互相转换|codec|u2a|
escape-codec|Escape 编解码|dev|🔐|escape 与 unescape 百分号编码转换|codec|escape|
punycode-codec|Punycode 编解码|dev|🌏|中文域名与 xn-- 形式互相转换|codec|punycode|
fullwidth-codec|半角全角转换|dev|◐|半角字符与全角字符互相转换|codec|fullwidth|
utf8-bytes|UTF8 字节互转|dev|🧬|字符串与 UTF8 十六进制字节互相转换|codec|utf8bytes|
gzip-codec|Gzip 编解码|dev|🗜️|用浏览器压缩流把文本转成 Gzip 再还原|codec|gzip|输出为 Base64 便于复制
rc4-cipher|RC4 加解密|dev|🗝️|按密钥对文本做 RC4 流加密与解密|codec|rc4|RC4 已不推荐用于新系统
text-hide|文字隐藏|dev|👻|用零宽字符把密文藏进另一段文字|codec|hide|
email-protect|邮箱地址加密|dev|📮|把邮箱转成字符实体降低被采集概率|codec|emailprotect|
js-pack|JS 简易打包|dev|📦|把脚本转成字符码形式的可执行写法|codec|jspack|只是编码打包，不等于抗逆向混淆
crc32-hash|CRC32 校验|dev|🧾|算文本或十六进制数据的 CRC32 校验值|codec|crc32|
hmac-hash|HMAC 签名|dev|🔏|按密钥与 SHA 算法算 HMAC 值|codec|hmac|
base24-cipher|24 字加密|dev|🔑|用 24 个汉字作替换表给文本编码|codec|base24|古典替换法，只适合玩
file-md5|文件 MD5 计算|dev|📁|选本地文件算 MD5 与 SHA 校验值|custom|filemd5|
qr-decode|二维码解析|image|🔳|上传二维码图片读出里面的内容|custom|qrdecode|依赖浏览器内置条码识别能力
html-to-js|HTML 转 JS|dev|📜|把 HTML 片段转成 JS 字符串拼接写法|text|html2js|
html-format|HTML 压缩格式化|dev|🧰|HTML 源码压缩与缩进格式化|text|htmlformat|
js-format|JS 压缩格式化|dev|🧰|JS 源码去掉多余空白或重新缩进|text|jsformat|
css-format|CSS 压缩格式化|dev|🧰|CSS 源码压缩与缩进格式化|text|cssformat|
sql-format|SQL 压缩格式化|dev|🧰|SQL 语句压缩与关键字换行排版|text|sqlformat|
css-px-rem|CSS PX 转 REM|dev|📐|按根字号批量把 px 换成 rem|text|px2rem|
html-to-php|HTML 转 PHP|dev|🐘|把 HTML 逐行转成 PHP echo 输出|text|html2lang|目标语言 PHP
html-to-asp|HTML 转 ASP|dev|🖥️|把 HTML 逐行转成 ASP 输出语句|text|html2lang|目标语言 ASP
html-to-jsp|HTML 转 JSP|dev|☕|把 HTML 逐行转成 JSP 输出语句|text|html2lang|目标语言 JSP
html-to-perl|HTML 转 Perl|dev|🐪|把 HTML 逐行转成 Perl 输出语句|text|html2lang|目标语言 Perl
html-to-ubb|HTML 转 UBB|dev|💬|把常见 HTML 标签转成论坛 UBB 代码|text|html2ubb|
num-to-en|数字转英文|chinese|🔢|把阿拉伯数字写成英文读法|text|num2en|
html-escape-all|HTML 转义与还原|dev|🔤|文本与 HTML 实体批量互转|codec|htmlentity|
# ---- 颜色 ----
color-mix|双色混合|image|🎨|把两种颜色按权重混合出中间色|color|mix|
color-mid|颜色中间色|image|↔️|算两种颜色在 RGB 空间的中点色|color|mid|
color-delta|颜色差异计算|image|📊|按 CIE76 色差公式算两色匹配度|color|delta|
color-inverse|相反色计算|image|🔃|按色相环算补色与反相色|color|inverse|
hex-hsv|HEX 与 HSV 互转|image|🔄|十六进制色值与 HSV 分量互相换算|color|hexhsv|
hex-rgb|HEX 与 RGB 互转|image|🔴|十六进制色值与 RGB 分量互相换算|color|hexrgb|
rgb-cmyk|RGB 与 CMYK 互转|image|🖨️|屏幕色与印刷色分量互相换算|color|rgbcmyk|
hsv-cmyk|HSV 与 CMYK 互转|image|🌈|HSV 色相模型与印刷色互相换算|color|hsvcmyk|
cmyk-hex|CMYK 与 HEX 互转|image|🎯|印刷四分色与十六进制色值互相换算|color|cmykhex|
rgb-hsv|RGB 与 HSV 互转|image|🌀|RGB 与色相饱和度明度互相换算|color|rgbhsv|
image-picker|图片颜色拾取|image|💉|上传图片后点任意位置取色|custom|imagepicker|
screen-eyedropper|屏幕颜色拾取|web|🖱️|调用系统取色器取屏幕上任意颜色|custom|eyedropper|需要浏览器支持 EyeDropper API
image-gray|彩图转黑白|image|⬛|用 canvas 把彩色图片转成灰度图|custom|imagegray|
image-filter|图片滤镜|image|🎞️|调亮度对比度饱和度与复古色调|custom|imagefilter|
svg-to-png|SVG 转 PNG|image|🖼️|粘贴或上传 SVG 导出 PNG 图片|custom|svg2png|
image-to-svg|图片转 SVG|image|🧩|把图片嵌进 SVG 容器导出矢量外壳|custom|img2svg|导出的是内嵌位图的 SVG
code-to-image|代码生成图片|image|💻|把代码片段排成带底色的分享图片|custom|code2img|
identicon|随机头像生成|image|👤|按输入文本生成对称几何头像|custom|identicon|
two-block-logo|双色块 Logo|image|🟦|用两色文字块生成简洁的站名标识|custom|twoblock|
coconut-style|椰树风格图|image|🥥|生成椰树配色的文字海报图|custom|coconut|
# ---- 生成与随机 ----
mac-generator|随机 MAC 地址|dev|🔗|批量生成单播 MAC 地址，可设前缀|rand|mac|
random-number|随机数生成|math|🎲|按范围与个数生成随机数，可去重|rand|number|
chinese-names|姓名生成|chinese|🧧|按姓氏与性别生成中文姓名|rand|names|姓名用字为精简字库|lite
ancient-names|古风名字生成|chinese|🏮|按意象字库生成古风人名与字号|rand|ancientnames||lite
file-tree|文件目录树|dev|🌳|把路径清单转成树状目录结构|text|filetree|
lottery-ssq|双色球机选|life|🔴|按红蓝球规则随机生成注数号码|rand|ssq|随机选号，不预测开奖
lottery-dlt|大乐透机选|life|🔵|按前区后区规则随机生成注数号码|rand|dlt|随机选号，不预测开奖
lottery-qlc|七乐彩机选|life|🟡|按 30 选 7 规则随机生成号码|rand|qlc|随机选号，不预测开奖
lottery-22x5|22 选 5 机选|life|🟢|按 22 选 5 规则随机生成号码|rand|22x5|随机选号，不预测开奖
coin-flip|抛硬币|puzzle|🪙|连续抛硬币并统计正反面次数|rand|coin|
dice-roll|投骰子|puzzle|🎲|选骰子数量与面数，掷出点数和|rand|dice|
what-to-eat|今天吃什么|puzzle|🍜|从候选清单里随机决定一顿饭|rand|eat|可自己编辑候选清单
what-to-do|今天干什么|puzzle|🎯|从任务卡里随机抽一件事做|rand|do|
# ---- 生活小工具 ----
stopwatch|在线秒表|life|⏱️|支持计次与分圈记录的网页秒表|custom|stopwatch|
alarm-clock|在线闹钟|life|⏰|设定时间点，到点用声音提醒|custom|alarm|页面需保持打开
scoreboard|比赛记分板|life|🏆|两队加减分、换边与计时显示|custom|scoreboard|
sedentary-reminder|久坐提醒|life|🪑|按间隔提醒起身活动，可后台计时|custom|sedentary|
beijing-time|北京时间校对|life|🕰️|显示本机时间与标准时间偏差提示|custom|beijingtime|用页面响应头时间估算偏差
fake-system-update|假装系统升级|puzzle|💻|全屏伪装系统更新进度画面|custom|fakeupdate|摸鱼娱乐用途
wake-lock|屏幕常亮|life|💡|申请唤醒锁阻止屏幕自动休眠|custom|wakelock|需要浏览器支持 Wake Lock
e-signature|电子签名|life|✍️|手写签名生成透明底 PNG|custom|signature|
tel-supersub|上下标号码|chinese|☎️|把电话号码转成上标或下标 Unicode 写法|text|supersub|
camera-recorder|摄像头录像|media|📹|调用摄像头预览并录制 WebM 视频|custom|camrecord|需要允许摄像头权限
# ---- 互动小游戏 ----
game-2048|2048|puzzle|🎮|方向键合并方块，目标凑出 2048|custom|game2048|
game-gomoku|五子棋|puzzle|⚫|与简易 AI 对弈，先连五子者胜|custom|gomoku|AI 用局部评分启发式
game-minesweeper|扫雷|puzzle|💣|三档难度的经典扫雷，支持标旗|custom|minesweeper|
game-maze|迷宫|puzzle|🧭|随机生成迷宫，用方向键走到终点|custom|maze|
game-dino|恐龙快跑|puzzle|🦖|跳过障碍的小恐龙跑酷游戏|custom|dino|
game-fireworks|烟花|puzzle|🎆|点击画面放一朵粒子烟花|custom|fireworks|
game-woodfish|电子木鱼|puzzle|🪵|敲击积功德，带计数与音效|custom|woodfish|
game-bubbles|捏泡泡|puzzle|🫧|点击戳破泡泡的解压小游戏|custom|bubbles|
game-fan|云风扇|puzzle|🌀|可调档位的网页电风扇动画|custom|fan|
cps-test|手速测试|puzzle|🖱️|限时点击测每秒点击次数|custom|cps|
fart-sound|放屁音效|puzzle|💨|点击播放合成的搞怪音效|custom|fart|娱乐用途
pay-sound|到账音效生成|puzzle|🔔|按金额合成一段到账提示音|custom|paysound|用浏览器合成音，非官方音频
# ---- PDF 扩展 ----
pdf-meta-read|PDF 元数据读取|pdf|🔍|本地读取 PDF 的标题作者与创建信息|custom|pdfmeta|
pdf-meta-write|PDF 元数据设置|pdf|🏷️|给本地 PDF 写入标题作者等元信息|custom|pdfmetawrite|
pdf-extract-images|PDF 提取图片|pdf|🖼️|把 PDF 内嵌图片逐张导出|custom|pdfimages|仅支持未压缩内嵌位图
pdf-nup|PDF 多页合一页|pdf|📑|把多页 PDF 缩放拼到同一页|custom|pdfnup|
`;

/* 新增的三类：数学与几何、健康养生、站长与网页。其余工具并入已有分类。 */
export const EXTRA_CATS = [
  { id: 'math', name: '数学与几何', icon: '📐' },
  { id: 'health', name: '健康养生', icon: '🩺' },
  { id: 'web', name: '站长与网页', icon: '🌐' },
];

export const EXTRA = LINES.split('\n')
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('#'))
  .map((line) => {
    const [id, name, cat, icon, desc, kind, p1 = '', p2 = '', p3 = '', mode = 'local'] = line.split('|');
    if (!id || !name || !cat || !kind) throw new Error('工具注册表有残缺行：' + line);
    return {
      id, name, cat, icon: icon || '🔧', desc, dev: 'both', tags: [], status: 'ready', tier: 1,
      mode: mode.trim() || 'local', kind, p1, p2, p3,
    };
  });

if (new Set(EXTRA.map((t) => t.id)).size !== EXTRA.length) throw new Error('新增工具 id 有重复');
if (new Set(EXTRA.map((t) => t.name)).size !== EXTRA.length) throw new Error('新增工具名称有重复');
