# 智能驾驶情报洞察平台

一个智能驾驶和智能座舱产品舆情监控与分析平台。

## 功能特性

### 核心功能

- 📊 **产品管理**：管理智能驾驶和智能座舱产品信息
- 📰 **行业情报**：实时监控智能驾驶和智能座舱行业动态
- 🔍 **舆情监控**：基于 Brave Search 自动采集舆情数据
- 🎛️ **传感器技术**：跟踪激光雷达、毫米波雷达等传感器技术
- 📡 **OTA更新**：监控各车企最新OTA版本和功能
- 🤖 **情感分析**：AI 驱动的舆情情感分析
- 🔔 **消息推送**：集成飞书机器人，实时推送重要舆情
- 📱 **响应式设计**：支持桌面和移动端访问
- 🎨 **科幻风格**：酷炫的科技感界面设计

### 数据特点

- ✅ **真实数据**：所有新闻来自真实官网和权威媒体
- ✅ **时效性**：自动过滤，只显示最近3个月的数据
- ✅ **多来源**：华为、小米、理想、小鹏、蔚来、工信部等
- ✅ **可追溯**：每条数据包含真实来源URL，可点击查看原文

### 双核心领域

- 🚗 **智能驾驶**：自动驾驶、城市NOA、传感器、芯片等
- 📱 **智能座舱**：车机系统、语音交互、AR-HUD、生态等

## 技术栈

- **前端**：Next.js 14 + React + TypeScript
- **UI**：Tailwind CSS + Lucide Icons
- **数据库**：Supabase (PostgreSQL)
- **搜索**：Brave Search API
- **爬虫**：自定义爬虫框架
- **AI分析**：GLM / DeepSeek 模型
- **部署**：Vercel + Cloudflare Pages

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Brave Search 配置
BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV

# 飞书 Webhook（可选）
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

### 3. 配置 Supabase

详细步骤见 [Supabase 配置指南](docs/SUPABASE_SETUP.md)

简要步骤：
1. 访问 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 中运行 `src/data/init.ts` 中的 SQL 脚本
3. 获取 Project URL 和 anon key
4. 配置到 `.env.local`

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 部署地址

- **Cloudflare Pages**（推荐，国内快速访问）：https://auto-intel.pages.dev
- **Vercel**（全球访问）：https://auto-intel-0226.vercel.app

### 5. 部署到 Cloudflare Pages（推荐，国内可访问）

详细步骤见 [Cloudflare 部署指南](docs/CLOUDFLARE_DEPLOY.md)

简要步骤：
1. 安装 wrangler CLI：`npm install -g wrangler`
2. 登录 Cloudflare：`wrangler login`
3. 运行部署脚本：`bash scripts/deploy-cloudflare.sh`
4. 访问：https://auto-intel.pages.dev

### 6. 部署到 Vercel（全球访问）

详细步骤见 [Vercel 部署指南](docs/VERCEL_DEPLOYMENT.md)

简要步骤：
1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 点击 Deploy

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── page.tsx     # 主页面（产品列表、舆情展示、统计数据）
│   ├── layout.tsx   # 布局
│   ├── globals.css  # 全局样式
│   └── api/
│       └── crawl/    # 数据采集 API
├── components/      # React 组件
├── lib/             # 工具函数
│   ├── supabase.ts  # Supabase 客户端
│   ├── crawler.ts   # 爬虫逻辑（使用 Brave Search）
│   ├── brave-search.ts # Brave Search 集成
│   └── feishu.ts    # 飞书推送
├── types/           # TypeScript 类型定义
├── data/            # 数据和初始化脚本
│   └── init.ts      # 数据库初始化 SQL
└── docs/            # 文档
    ├── SUPABASE_SETUP.md      # Supabase配置指南
    ├── VERCEL_DEPLOYMENT.md   # Vercel部署指南
    ├── CLOUDFLARE_DEPLOY.md   # Cloudflare部署指南（推荐）
    ├── PUBLIC_ACCESS_GUIDE.md # 公网访问解决方案
    └── REAL_DATA_GUIDE.md    # 真实数据指南
```

## 部署说明

### 推荐部署方案

| 方案 | 国内访问 | 成本 | 推荐度 |
|------|---------|------|--------|
| Cloudflare Pages | 快 | 免费 | ⭐⭐⭐⭐⭐ |
| Vercel + Cloudflare CDN | 快 | 免费 | ⭐⭐⭐⭐ |
| Vercel | 慢/受限 | 免费 | ⭐⭐ |
| 阿里云/腾讯云 | 最快 | 低（~50元/月） | ⭐⭐⭐ |

## API 接口

### 数据采集

```bash
POST /api/crawl
```

触发 Brave Search 数据采集，自动情感分析并保存到数据库。

### 示例

```bash
curl -X POST http://localhost:3000/api/crawl
```

响应：

```json
{
  "success": true,
  "count": 15,
  "message": "成功采集 15 条新舆情"
}
```

## 数据来源

当前使用 Brave Search API 采集舆情：

- 📰 新闻网站
- 📱 社交媒体（微博、知乎、小红书等）
- 🚗 汽车论坛和评测网站

## 情感分析

使用关键词匹配进行情感分析：

- **正面**：优秀、出色、流畅、稳定、强大等
- **负面**：问题、差、糟糕、故障、卡顿等
- **中立**：其他内容

未来可集成 LLM 进行更精准的分析。

## 飞书推送配置

### 获取 Webhook URL

1. 在飞书中创建自定义机器人
2. 获取 Webhook URL
3. 配置到 `.env.local` 或 Vercel 环境变量

### 推送内容

- 📢 新舆情提醒
- 📊 每日舆情报告
- ⚠️ 负面舆情预警

## 开发计划

- [ ] 实现真实爬虫（微博、知乎、小红书）
- [ ] 集成更多情感分析模型（GLM、DeepSeek）
- [ ] 添加数据可视化图表（趋势、热力图）
- [ ] 支持用户自定义监控关键词
- [ ] 添加 RSS 订阅功能
- [ ] 实现舆情预警和告警
- [ ] 多语言支持

## 成本说明

### 免费资源

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| Cloudflare Pages | 完全免费 | 全球CDN，无限带宽 |
| Vercel | 100GB 带宽/月 | 无限部署 |
| Supabase | 500MB 数据库 | 1GB 存储 |
| Brave Search | 免费计划可用 | 2000次请求/月 |

对于个人和小团队项目，完全免费使用。

### 付费选项（可选）

- Cloudflare Pages Pro：$20/月（更多构建次数）
- Vercel Pro：$20/月（更多带宽和功能）
- Supabase Pro：$25/月（8GB数据库，50GB存储）

## 文档

- [Supabase 配置指南](docs/SUPABASE_SETUP.md)
- [Vercel 部署指南](docs/VERCEL_DEPLOYMENT.md)
- [Cloudflare 部署指南](docs/CLOUDFLARE_DEPLOY.md) ⭐ 推荐
- [公网访问解决方案](docs/PUBLIC_ACCESS_GUIDE.md)
- [真实数据指南](docs/REAL_DATA_GUIDE.md)

## 许可证

MIT

---

**作者**：小竹 🎋
**创建时间**：2026-02-25
