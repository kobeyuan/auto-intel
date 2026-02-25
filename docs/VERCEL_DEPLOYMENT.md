# Vercel 部署指南

## 部署到 Vercel

### 方法一：通过 GitHub 部署（推荐）

#### 1. 推送代码到 GitHub

```bash
cd /workspace/projects/auto-intel
git init
git add .
git commit -m "Initial commit: Auto Intelligence Platform"
git branch -M main
git remote add origin https://github.com/your-username/auto-intel.git
git push -u origin main
```

#### 2. 在 Vercel 导入项目

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 选择你的 `auto-intel` 仓库
5. 点击 "Import"

#### 3. 配置环境变量

在 Vercel 项目配置页面，添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase anon key |
| `BRAVE_API_KEY` | `BSAJodIqkC38RnlMhH7d_b67JTIfTLV` |
| `FEISHU_WEBHOOK_URL` | 你的飞书 Webhook URL（可选） |

#### 4. 部署

1. 点击 "Deploy"
2. 等待部署完成（约 1-2 分钟）
3. 部署完成后，你会得到一个类似 `https://auto-intel.vercel.app` 的 URL

#### 5. 配置自定义域名（可选）

1. 在 Vercel 项目中，进入 **Settings** → **Domains**
2. 添加你的域名（如 `intel.yourdomain.com`）
3. 按照提示配置 DNS 记录

---

### 方法二：通过 Vercel CLI 部署

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录

```bash
vercel login
```

#### 3. 部署

```bash
cd /workspace/projects/auto-intel
vercel
```

按照提示操作：
- 选择 Vercel 账户
- 输入项目名称：`auto-intel`
- 配置环境变量
- 确认部署

---

## 定时任务（可选）

### 方法一：Vercel Cron Jobs

1. 在项目根目录创建 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/crawl",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

这会每 6 小时自动触发一次数据采集。

2. 重新部署项目。

### 方法二：GitHub Actions

创建 `.github/workflows/crawl.yml`：

```yaml
name: Daily Crawl

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Call Crawl API
        run: |
          curl -X POST https://your-app.vercel.app/api/crawl
```

---

## 配置飞书 Webhook

### 获取 Webhook URL

1. 在飞书中创建自定义机器人
2. 在机器人设置中获取 Webhook URL
3. 配置到 Vercel 的 `FEISHU_WEBHOOK_URL` 环境变量

### Webhook 格式

飞书 Webhook URL 格式：
```
https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 部署后验证

### 1. 访问网站

打开你的 Vercel URL（如 `https://auto-intel.vercel.app`），确认：
- 页面正常显示
- 产品列表有数据
- 舆情列表有数据

### 2. 测试数据采集

```bash
curl -X POST https://your-app.vercel.app/api/crawl
```

检查网站是否显示了新的舆情数据。

### 3. 查看日志

在 Vercel Dashboard 中：
- 进入项目 → **Deployments**
- 点击最新的部署
- 查看 **Function Logs**

---

## 故障排查

### 部署失败

1. 检查 `npm run build` 是否成功
2. 查看 Vercel 构建日志
3. 确认所有环境变量都已配置

### 网站无法访问

1. 检查部署状态是否为 "Ready"
2. 查看日志是否有错误
3. 确认 Supabase 连接正常

### 数据无法加载

1. 检查环境变量是否正确
2. 在 Supabase 控制台查看数据是否存在
3. 查看浏览器控制台是否有错误

---

## 成本说明

### Vercel

- **免费计划**：
  - 每月 100GB 带宽
  - 无限次部署
  - Serverless Functions 每月 100GB 小时

### Supabase

- **免费计划**：
  - 500MB 数据库
  - 1GB 文件存储
  - 2GB 带宽/月

对于个人和小团队项目，免费计划足够使用。

---

## 下一步

部署完成后，你可以：

1. 定期访问网站查看最新舆情
2. 配置飞书推送，实时接收舆情提醒
3. 根据需要添加更多产品
4. 优化情感分析算法
