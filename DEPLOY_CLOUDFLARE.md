# Cloudflare Pages 部署指南

## 架构设计

由于 Cloudflare Pages 对 Python 支持有限，采用混合架构：

```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问层                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   前端界面    │ │   数据API    │ │  采集服务    │
│(Cloudflare  │ │(Supabase     │ │(Vercel/自有  │
│  Pages)      │ │  Edge Func)  │ │ 服务器)      │
└──────────────┘ └──────────────┘ └──────────────┘
                        │               │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │   Supabase    │
                        │   (PostgreSQL)│
                        └───────────────┘
```

## 方案一：前端 Cloudflare + API Vercel（推荐）

### 步骤 1：部署前端到 Cloudflare Pages

已经在 Cloudflare Pages 部署，确保以下设置：

**构建设置：**
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
```

**环境变量（在 Cloudflare Dashboard 设置）：**
```
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步骤 2：部署 API 到 Vercel

由于 Python 采集脚本需要长时间运行，单独部署到 Vercel：

```bash
# 1. 在项目根目录创建 vercel.json
{
  "version": 2,
  "regions": ["hkg1", "sin1"],
  "functions": {
    "api/**/*.py": {
      "maxDuration": 300
    }
  }
}

# 2. 部署 Python API
vercel --prod

# 3. 记录 API 地址
# https://your-api.vercel.app/api/update_intel
```

### 步骤 3：前端调用 API

修改前端配置，指向 Vercel API：

```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.vercel.app';

export async function collectIntelligence() {
  const response = await fetch(`${API_BASE}/api/update_intel`);
  return response.json();
}
```

在 Cloudflare 环境变量中添加：
```
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

---

## 方案二：纯 Cloudflare 方案（需要改造）

### 将 Python API 改为 TypeScript

Cloudflare Pages Functions 支持 TypeScript，需要将采集逻辑重写：

```typescript
// functions/api/collect.ts
export async function onRequestGet(context) {
  // 使用 TypeScript 重写 RSS 采集逻辑
  // 注意：Cloudflare Workers 有执行时间限制（免费版 50ms）
}
```

**限制：**
- 免费版 Workers 执行时间 50ms
- 付费版 30s 或 5分钟
- 不适合长时间采集任务

**结论：不推荐**，采集任务通常需要数秒到数分钟。

---

## 方案三：使用外部服务触发采集

### 定时触发器

由于 Cloudflare 和 Vercel 都有定时任务限制，可以使用外部 Cron 服务：

#### 1. GitHub Actions（推荐）

创建 `.github/workflows/collect.yml`：

```yaml
name: Daily Intelligence Collection

on:
  schedule:
    # 每6小时执行一次
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Collection API
        run: |
          curl -X GET "https://your-api.vercel.app/api/update_intel" \
            -H "Authorization: Bearer ${{ secrets.API_SECRET }}"
```

#### 2. 使用 Cron-job.org（免费）

1. 访问 https://cron-job.org
2. 注册账号
3. 创建定时任务：
   - URL: `https://your-api.vercel.app/api/update_intel`
   - 频率: 每6小时
   - 方法: GET

#### 3. 使用 UptimeRobot（免费）

1. 访问 https://uptimerobot.com
2. 添加监控：
   - 类型: HTTP(s)
   - URL: `https://your-api.vercel.app/api/update_intel`
   - 间隔: 每6小时

---

## 方案四：数据库直连（无需 API）

如果不需要复杂的采集逻辑，可以直接从前端操作数据库：

```typescript
// 使用 Supabase Client 直接操作
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 直接查询数据
export async function getIntelligence() {
  const { data, error } = await supabase
    .from('industry_intelligence')
    .select('*')
    .order('collected_at', { ascending: false })
    .limit(50);

  return data;
}
```

**缺点：** 无法执行自动化采集，需要手动添加数据。

---

## 推荐配置总结

### 你的场景：Cloudflare Pages 已部署

**立即执行：**

1. **在 Vercel 部署 API 部分**
   ```bash
   # 创建 vercel.json
   {
     "version": 2,
     "regions": ["hkg1"]
   }

   # 部署
   vercel --prod
   ```

2. **配置 Cloudflare 环境变量**
   ```
   NEXT_PUBLIC_API_URL=https://your-api.vercel.app
   ```

3. **设置定时采集**
   - 使用 GitHub Actions
   - 或使用 cron-job.org

### 最终架构

```
Cloudflare Pages (前端)
    ├── 用户界面 ✅
    ├── 数据源管理 ✅
    ├── 质量评估 ✅
    └── 调用 Vercel API

Vercel Functions (API)
    ├── /api/update_intel (Python采集)
    ├── /api/rss_collector (RSS采集)
    └── 连接 Supabase

Supabase (数据库)
    └── PostgreSQL 数据存储

定时触发
    └── GitHub Actions / cron-job.org
```

---

## 验证部署

### 测试前端
访问你的 Cloudflare Pages 地址：
```
https://your-project.pages.dev
```

### 测试 API
访问 Vercel API：
```
https://your-api.vercel.app/api/update_intel
```

### 测试数据库
在 Supabase Dashboard 查看数据是否写入：
```
https://supabase.com/dashboard/project/eotyzutqjsowbexabzms
```

---

## 下一步

请告诉我：

1. **你的 Vercel API 地址是什么？**（如果已部署）
2. **是否需要我帮你配置 GitHub Actions 定时任务？**
3. **Cloudflare Pages 的域名是什么？**（用于配置 CORS）

我可以帮你完成最终的配置整合。
