# 一键部署到Cloudflare Pages

## 快速开始（5分钟）

### 1. 安装 wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开Cloudflare登录页面，授权后即可。

### 3. 运行部署脚本

```bash
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

### 4. 访问你的网站

部署成功后，访问：
- https://auto-intel.pages.dev

## 详细步骤

### 步骤1：准备工作

确保你已经：
- ✅ 安装了 Node.js
- ✅ 注册了 Cloudflare 账号（免费）
- ✅ 项目代码已提交到 Git

### 步骤2：安装工具

```bash
# 全局安装 wrangler
npm install -g wrangler

# 验证安装
wrangler --version
```

### 步骤3：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，你需要：
1. 登录 Cloudflare 账号
2. 授权 wrangler 访问你的账号
3. 看到成功提示

### 步骤4：部署项目

```bash
# 进入项目目录
cd /workspace/projects/auto-intel

# 运行部署脚本
bash scripts/deploy-cloudflare.sh
```

脚本会自动：
1. ✅ 检查登录状态
2. ✅ 构建项目（npm run build）
3. ✅ 创建 Cloudflare Pages 项目
4. ✅ 部署到全球 CDN
5. ✅ 显示访问地址

### 步骤5：访问网站

部署完成后：
- 首次访问：https://auto-intel.pages.dev
- 国内访问速度：快（香港节点）
- 全球访问：自动CDN加速

## 手动部署（可选）

如果你想手动控制部署过程：

```bash
# 1. 构建项目
npm run build

# 2. 创建 Pages 项目
wrangler pages project create auto-intel --production-branch=main

# 3. 部署静态文件
wrangler pages deploy .vercel/output/static \
  --project-name=auto-intel \
  --commit-hash=$(git rev-parse --short HEAD) \
  --commit-message="Deploy to Cloudflare Pages"
```

## 配置环境变量

### 方式1：通过控制台

1. 访问：https://dash.cloudflare.com
2. 选择 "Workers & Pages" → "auto-intel"
3. 点击 "Settings" → "Environment variables"
4. 添加以下变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q
BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV
```

### 方式2：通过命令行

```bash
# 设置 Supabase URL（公开变量）
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL --project-name=auto-intel

# 设置 API Key（需要输入值）
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --project-name=auto-intel
wrangler pages secret put BRAVE_API_KEY --project-name=auto-intel
```

## 绑定自定义域名（可选）

### 步骤1：准备域名

确保你有自己的域名，如果没有：
- Cloudflare提供免费子域名：`your-name.pages.dev`
- 可以购买域名（如：auto-intel.com）

### 步骤2：添加域名

1. 访问 Cloudflare 控制台
2. 选择你的 Pages 项目
3. 点击 "Custom domains"
4. 点击 "Set up a custom domain"
5. 输入你的域名

### 步骤3：配置DNS

Cloudflare会自动生成DNS记录，添加到你的域名DNS设置中：

```
类型: CNAME
名称: auto-intel
目标: auto-intel.pages.dev
```

### 步骤4：验证

等待DNS生效（通常5-10分钟），访问你的自定义域名。

## 持续部署（自动更新）

### Git集成部署

1. 在 Cloudflare 控制台，选择你的 Pages 项目
2. 点击 "Settings" → "Build & deployments"
3. 点击 "Connect to Git"
4. 选择你的 Git 仓库
5. 选择分支（main）
6. 配置构建设置：

```
构建命令: npm run build
输出目录: .vercel/output/static
```

### 自动部署

推送代码后，Cloudflare会自动：
1. 检测到新的 commit
2. 触发构建
3. 部署到生产环境
4. 更新访问地址

## 监控和日志

### 查看部署日志

```bash
# 查看最近部署
wrangler pages deployment list --project-name=auto-intel

# 查看部署详情
wrangler pages deployment tail --project-name=auto-intel
```

### 查看访问统计

访问：https://dash.cloudflare.com/analytics

### 查看错误日志

访问：https://dash.cloudflare.com/pages/view/auto-intel/logs

## 故障排查

### 问题：部署失败

```bash
# 检查构建输出
npm run build
ls -la .vercel/output/static

# 测试静态文件
cd .vercel/output/static
python3 -m http.server 8080
```

### 问题：API路由404

Next.js API路由在静态托管中需要特殊处理：
- 使用 Cloudflare Functions
- 或使用Serverless Functions

### 问题：环境变量未生效

```bash
# 列出所有环境变量
wrangler pages secret list --project-name=auto-intel

# 重新设置环境变量
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL --project-name=auto-intel
```

### 问题：访问速度慢

1. 检查是否启用了CDN（Cloudflare默认启用）
2. 检查地理位置（Cloudflare会自动选择最近的节点）
3. 使用测试工具：https://tools.pingdom.com

## 性能优化

### 启用缓存

在 `vercel.json` 中配置缓存头：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

### 压缩资源

Cloudflare会自动压缩：
- HTML, CSS, JavaScript
- 图片（WebP格式）

### 启用HTTP/3

在Cloudflare控制台启用HTTP/3（默认启用）

## 成本说明

### Cloudflare Pages

- ✅ 完全免费
- ✅ 无限带宽
- ✅ 全球CDN
- ✅ 自动HTTPS
- ✅ 自定义域名

### 限制（免费计划）

- 每月500次构建
- 每个项目25,000次请求
- 每个域名限制

## 下一步

1. ✅ 部署到Cloudflare Pages
2. ⏳ 绑定自定义域名（可选）
3. ⏳ 配置持续部署
4. ⏳ 设置监控告警
5. ⏳ 优化性能

## 获取帮助

- Cloudflare文档：https://developers.cloudflare.com/pages
- wrangler文档：https://developers.cloudflare.com/workers/wrangler
- Cloudflare社区：https://community.cloudflare.com

---

**现在就开始部署，5分钟让全世界都能访问你的网站！**
