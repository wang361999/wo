import { formTool, esc } from '/kit.js';
// [端口, 协议, 服务, 用途, 公网暴露风险]
const DATA = [
  [20, 'TCP', 'FTP-DATA', 'FTP 数据传输', '中'], [21, 'TCP', 'FTP', '文件传输控制', '高'],
  [22, 'TCP', 'SSH', '安全远程登录', '高'], [23, 'TCP', 'Telnet', '明文远程登录（应禁用）', '极高'],
  [25, 'TCP', 'SMTP', '邮件发送', '中'], [53, 'TCP/UDP', 'DNS', '域名解析', '高'],
  [67, 'UDP', 'DHCP', '服务端分配地址', '低'], [68, 'UDP', 'DHCP', '客户端接收地址', '低'],
  [69, 'UDP', 'TFTP', '简单文件传输', '高'], [80, 'TCP', 'HTTP', '网页', '低'],
  [110, 'TCP', 'POP3', '邮件收取', '中'], [123, 'UDP', 'NTP', '时间同步', '中'],
  [135, 'TCP', 'MS-RPC', 'Windows RPC', '极高'], [137, 'UDP', 'NetBIOS', '名称服务', '高'],
  [138, 'UDP', 'NetBIOS', '数据报服务', '高'], [139, 'TCP', 'NetBIOS', '会话服务', '极高'],
  [143, 'TCP', 'IMAP', '邮件收取', '中'], [161, 'UDP', 'SNMP', '网络管理', '高'],
  [162, 'UDP', 'SNMP-Trap', '告警接收', '中'], [179, 'TCP', 'BGP', '路由协议', '高'],
  [389, 'TCP/UDP', 'LDAP', '目录服务', '高'], [443, 'TCP', 'HTTPS', '加密网页', '低'],
  [445, 'TCP', 'SMB', 'Windows 文件共享', '极高'], [465, 'TCP', 'SMTPS', '加密邮件发送', '低'],
  [514, 'UDP', 'Syslog', '日志接收', '中'], [515, 'TCP', 'LPD', '打印服务', '中'],
  [520, 'UDP', 'RIP', '路由协议', '中'], [587, 'TCP', 'SMTP', '邮件提交', '低'],
  [631, 'TCP', 'IPP', '网络打印', '中'], [636, 'TCP', 'LDAPS', '加密目录服务', '低'],
  [873, 'TCP', 'Rsync', '文件同步', '高'], [993, 'TCP', 'IMAPS', '加密邮件收取', '低'],
  [995, 'TCP', 'POP3S', '加密邮件收取', '低'], [1080, 'TCP', 'SOCKS', '代理', '高'],
  [1194, 'UDP', 'OpenVPN', 'VPN', '中'], [1433, 'TCP', 'MSSQL', 'SQL Server', '极高'],
  [1434, 'UDP', 'MSSQL', 'SQL Server 浏览', '高'], [1521, 'TCP', 'Oracle', 'Oracle 数据库', '极高'],
  [1723, 'TCP', 'PPTP', 'VPN', '高'], [1883, 'TCP', 'MQTT', '物联网消息', '高'],
  [2049, 'TCP/UDP', 'NFS', '网络文件系统', '极高'], [2082, 'TCP', 'cPanel', '主机面板', '中'],
  [2181, 'TCP', 'ZooKeeper', '分布式协调', '高'], [2375, 'TCP', 'Docker', 'Docker 远程 API（未加密）', '极高'],
  [2376, 'TCP', 'Docker', 'Docker TLS API', '中'], [3000, 'TCP', 'Dev', 'Node/开发服务常用', '中'],
  [3128, 'TCP', 'Squid', 'HTTP 代理', '中'], [3306, 'TCP', 'MySQL', 'MySQL 数据库', '极高'],
  [3389, 'TCP', 'RDP', 'Windows 远程桌面', '极高'], [3690, 'TCP', 'SVN', '版本控制', '中'],
  [4369, 'TCP', 'EPMD', 'Erlang 节点发现', '高'], [4444, 'TCP', 'Metasploit', '常见后门默认端口', '极高'],
  [5000, 'TCP', 'Dev', 'Flask / 开发服务', '中'], [5432, 'TCP', 'PostgreSQL', 'PostgreSQL 数据库', '极高'],
  [5601, 'TCP', 'Kibana', '日志可视化', '高'], [5672, 'TCP', 'RabbitMQ', '消息队列', '高'],
  [5900, 'TCP', 'VNC', '远程桌面', '极高'], [5984, 'TCP', 'CouchDB', '数据库', '高'],
  [6379, 'TCP', 'Redis', '缓存数据库', '极高'], [6443, 'TCP', 'Kubernetes', 'K8s API Server', '极高'],
  [7001, 'TCP', 'WebLogic', '应用服务器', '高'], [7474, 'TCP', 'Neo4j', '图数据库', '高'],
  [8000, 'TCP', 'Dev', '开发服务常用', '中'], [8080, 'TCP', 'HTTP-Alt', 'Web / 代理常用', '低'],
  [8443, 'TCP', 'HTTPS-Alt', '加密 Web 备用', '低'], [8888, 'TCP', 'Dev', 'Jupyter / 面板常用', '中'],
  [9000, 'TCP', 'Dev', 'PHP-FPM / 面板常用', '中'], [9090, 'TCP', 'Prometheus', '监控', '中'],
  [9200, 'TCP', 'Elasticsearch', '搜索服务', '极高'], [9300, 'TCP', 'Elasticsearch', '集群通信', '高'],
  [9418, 'TCP', 'Git', 'Git 协议', '中'], [11211, 'TCP/UDP', 'Memcached', '缓存', '极高'],
  [15672, 'TCP', 'RabbitMQ', '管理界面', '高'], [16379, 'TCP', 'Redis', 'Redis 备用端口', '高'],
  [27017, 'TCP', 'MongoDB', 'MongoDB 数据库', '极高'], [50000, 'TCP', 'SAP', 'SAP 服务', '高'],
];
const RISK = { 极高: '#b3392c', 高: '#b4552d', 中: '#96732f', 低: '#3d7a4e' };
export default formTool({
  fields: [
    { id: 'q', label: '搜索端口 / 服务 / 用途', type: 'text', placeholder: '例如 3306、Redis、数据库' },
    { id: 'risk', label: '风险', type: 'chips', options: [
      { value: 'all', label: '全部' }, { value: 'danger', label: '仅高风险' },
    ], default: 'all' },
  ],
  titleIn: '查找', titleOut: '端口速查表', primary: '复制筛选结果',
  sample: { q: '数据库', risk: 'all' },
  hintOut: '「极高」表示不建议对公网开放：数据库、远程桌面、Docker API、共享文件系统等历史上被反复利用。端口只是默认值，实际以你的配置为准。',
  compute(v) {
    const k = String(v.q || '').trim().toLowerCase();
    const rows = DATA.filter((d) => {
      if (v.risk === 'danger' && !['极高', '高'].includes(d[4])) return false;
      return !k || d.join(' ').toLowerCase().includes(k);
    });
    if (!rows.length) return { text: '没有匹配的端口，换个词试试。', copy: '' };
    const html = `<table class="t-table"><thead><tr><th>端口</th><th>协议</th><th>服务</th><th>用途</th><th>风险</th></tr></thead><tbody>` +
      rows.map((d) => `<tr data-copy="${d[0]}"><td class="num">${d[0]}</td><td>${esc(d[1])}</td><td><b>${esc(d[2])}</b></td>
        <td>${esc(d[3])}</td><td style="color:${RISK[d[4]]};font-weight:600">${d[4]}</td></tr>`).join('') + '</tbody></table>';
    const text = rows.map((d) => `${d[0]}\t${d[1]}\t${d[2]}\t${d[3]}\t${d[4]}`).join('\n');
    return { html, copy: text, stats: [{ label: '条目', value: rows.length }, { label: '极高风险', value: rows.filter((d) => d[4] === '极高').length }] };
  },
});
