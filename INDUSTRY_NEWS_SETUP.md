# 行业情报爬虫功能部署指南

## 功能概述
- **行业新闻采集**：自动采集智能驾驶和智能座舱领域的行业动态
- **多来源支持**：36氪、虎嗅、汽车之家、盖世汽车等权威媒体
- **智能分析**：自动情感分析、重要性评级、关键词提取
- **实时展示**：在前端页面展示最新行业情报

## 部署步骤

### 1. 创建数据库表
在 **Supabase** 中运行 SQL 脚本：

1. 登录 [Supabase](https://app.supabase.com)
2. 进入项目: `eotyzutqjsowbexabzms`
3. 点击 **SQL Editor**
4. 复制 `industry-news-table.sql` 文件中的 SQL 脚本
5. 点击 **Run** 执行

### 2. 推送代码到 GitHub
```bash
cd auto-intel
git add .
git commit -m "feat: 添加行业情报爬虫功能"
git push origin main
```

### 3. 在 Vercel 重新部署
1. 进入 [Vercel 项目](https://vercel.com/你的用户名/auto-intel-0226)
2. 点击 **Deployments** 标签
3. 找到最新的部署记录，点击右侧 **⋮** 按钮
4. 选择 **Redeploy**
5. **取消勾选** "Use existing build cache"
6. 点击 **Redeploy**

### 4. 测试功能
部署完成后：

1. 访问 https://auto-intel-0226.vercel.app
2. 页面底部应该显示 **"行业情报洞察"** 面板
3. 点击 **"采集新闻"** 按钮测试爬虫功能
4. 等待几秒钟，应该能看到采集的行业新闻

## API 端点

### 1. 行业新闻采集
- **POST** `/api/crawl/industry`
- 触发行业新闻采集
- 参数: `{ "maxResults": 5 }`

### 2. 获取行业新闻
- **GET** `/api/industry-news`
- 查询参数:
  - `category`: 类别筛选
  - `sentiment`: 情感筛选
  - `importance`: 重要性筛选
  - `limit`: 返回数量
  - `offset`: 分页偏移

### 3. 手动添加新闻
- **POST** `/api/industry-news`
- 手动添加行业新闻到数据库

## 数据模型

### industry_news 表结构
```sql
id           UUID        主键
title        TEXT        标题
content      TEXT        内容
source       TEXT        来源
source_url   TEXT        原文链接（唯一）
category     TEXT        类别（technology/product/policy/funding/partnership/other）
keywords     TEXT[]      关键词数组
sentiment    TEXT        情感（positive/neutral/negative）
importance   TEXT        重要性（high/medium/low）
published_at TIMESTAMP   发布时间
created_at   TIMESTAMP   创建时间
```

## 类别说明

| 类别 | 说明 | 示例 |
|------|------|------|
| technology | 技术动态 | 自动驾驶算法、传感器技术 |
| product | 产品发布 | 新车发布、功能更新 |
| policy | 政策法规 | 国家标准、安全规范 |
| funding | 融资动态 | 融资消息、投资 |
| partnership | 合作 | 企业合作、战略联盟 |
| other | 其他 | 人事变动、行业活动 |

## 配置项

### 关键词配置
在 `src/lib/brave-search.ts` 中配置：
- `INDUSTRY_KEYWORDS`: 各类别搜索关键词
- `INDUSTRY_SOURCES`: 行业新闻来源网站

### 情感分析规则
- **正面关键词**: 突破、创新、合作、融资等
- **负面关键词**: 事故、问题、召回、亏损等

### 重要性评级
- **高重要性**: 政策法规、安全事故、重大突破
- **中重要性**: 产品发布、企业合作
- **低重要性**: 一般新闻、行业活动

## 定时采集（可选）

配置 Vercel Cron Jobs 每天自动采集：

1. 在 Vercel 项目设置中配置 Cron Job
2. 定时调用 `/api/crawl/industry` 端点
3. 建议频率：每天 2-3 次

## 故障排除

### 问题1：industry_news 表不存在
- 解决方案：在 Supabase 中运行 SQL 脚本

### 问题2：采集无结果
- 检查 Brave Search API Key 是否正确配置
- 检查网络连接
- 调整搜索关键词

### 问题3：页面不显示行业新闻
- 检查 API 端点是否正常工作
- 检查 Console 错误信息
- 确认数据库中有数据

## 后续扩展

### 1. 增加更多数据源
- 添加更多行业媒体
- 集成 RSS 订阅
- 爬取官方公告

### 2. 增强分析能力
- 集成 LLM 进行深度分析
- 添加趋势分析
- 生成摘要报告

### 3. 优化用户体验
- 添加图表可视化
- 支持自定义关键词
- 实时推送通知