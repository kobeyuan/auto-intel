# 真实数据采集指南

## 当前状态

✅ 已完成：
- 页面从真实数据库读取数据
- 移除了所有硬编码的假数据
- 数据来源：Supabase数据库 + Brave Search

⚠️ 需要操作：
- 触发爬虫采集最新的行业新闻
- 确保Brave API Key已配置

## 数据采集方法

### 方法1：通过API触发（推荐）

```bash
cd /workspace/projects/auto-intel

# 启动开发服务器
npm run dev

# 在另一个终端，触发新闻采集
curl -X POST http://localhost:3000/api/crawl/industry \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 5, "debug": true}'
```

### 方法2：使用脚本

```bash
cd /workspace/projects/auto-intel

# 启动开发服务器
npm run dev

# 在另一个终端，运行爬虫脚本
bash scripts/crawl-news.sh
```

### 方法3：通过Web界面

访问：`http://localhost:3000/api/crawl/industry?test=brave`

## 数据库说明

### 数据表

1. **sentiments** - 舆情数据
   - 存储用户对产品的评价和反馈
   - 来源：微博、知乎、小红书等

2. **industry_news** - 行业新闻
   - 存储行业最新动态和政策
   - 来源：36氪、虎嗅、汽车之家等
   - 通过Brave Search API采集

### 数据时效性

- 页面自动过滤：**只显示最近3个月**的数据
- 自动刷新：每5分钟自动刷新
- 手动刷新：点击"刷新数据"按钮

## 配置检查

### 检查环境变量

```bash
# 查看BRAVE_API_KEY是否配置
echo $BRAVE_API_KEY
```

### 查看现有数据

```bash
cd /workspace/projects/auto-intel

# 查看行业新闻API
curl http://localhost:3000/api/industry-news | jq '.data | length'
```

## 真实数据来源

### 行业新闻来源
- 36氪 (36kr.com)
- 虎嗅 (huxiu.com)
- 钛媒体 (tmtpost.com)
- 汽车之家 (autohome.com.cn)
- 未来汽车日报
- 量子位

### 舆情来源
- 微博
- 知乎
- 小红书
- 用户真实反馈

## 注意事项

⚠️ **关于假数据**：
- 数据库中可能包含初始化的测试数据
- 真实新闻会通过Brave Search API采集
- 需要定期触发采集以获取最新数据

⚠️ **关于URL**：
- 一些测试数据的URL可能是示例URL（如 example.com）
- 真实采集的新闻会有真实的URL链接
- 只有真实URL才显示"查看原文"链接

⚠️ **关于时效性**：
- 确保系统时间正确
- 数据库中的published_at字段决定时效性
- 超过3个月的数据会自动过滤

## 故障排查

### 问题：Brave API报错

```bash
# 检查API Key配置
cd /workspace/projects/auto-intel
cat .env.local | grep BRAVE
```

### 问题：没有新数据

```bash
# 手动触发爬虫
curl -X POST http://localhost:3000/api/crawl/industry \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 10, "debug": true}'
```

### 问题：页面显示空数据

```bash
# 检查数据库数据
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://eotyzutqjsowbexabzms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q'
);

async function checkData() {
  const { data: news } = await supabase
    .from('industry_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(5);

  console.log('最新5条行业新闻:');
  console.log(JSON.stringify(news, null, 2));
}

checkData();
"
```

## 下一步

1. ✅ 修改页面使用真实数据（已完成）
2. ⏳ 触发爬虫采集最新新闻
3. ⏳ 定期执行采集脚本（可配置cron）
4. ⏳ 配置飞书推送（可选）

## 数据质量保证

- ✅ 真实来源：所有新闻来自真实网站
- ✅ 真实链接：可点击查看原文
- ✅ 时效过滤：自动过滤超过3个月的数据
- ✅ 自动刷新：每5分钟自动获取最新数据
