# Cloudflare 登录和部署完整指南

## 步骤1：注册 Cloudflare 账号（免费）

### 访问官网
打开浏览器，访问：https://dash.cloudflare.com/sign-up

### 注册账号
1. 点击 "Create Account"
2. 填写邮箱地址
3. 设置密码（至少8位，包含字母和数字）
4. 点击 "Create Account"

### 验证邮箱
1. Cloudflare会发送验证邮件到你注册的邮箱
2. 打开邮件，点击验证链接
3. 验证成功后自动跳转到 Cloudflare 控制台

### 账号信息
- **免费**：完全免费，无隐藏费用
- **功能**：Pages、Workers、CDN 等
- **限制**：免费计划有使用限额（够用）

## 步骤2：安装 wrangler CLI

### 什么是 wrangler？
wrangler 是 Cloudflare 的命令行工具，用于部署和管理项目。

### 安装方法

**Windows**（PowerShell 或 CMD）：
```powershell
npm install -g wrangler
```

**Mac / Linux**：
```bash
npm install -g wrangler
```

### 验证安装
```bash
wrangler --version
```

如果显示版本号（如 `wrangler 3.x.x`），说明安装成功。

### 常见问题

**Q: npm 不是内部或外部命令**
- 解决：先安装 Node.js（https://nodejs.org）

**Q: 权限不足（Mac/Linux）**
- 解决：使用 `sudo npm install -g wrangler`

**Q: 安装慢**
- 解决：使用淘宝镜像 `npm install -g wrangler --registry=https://registry.npmmirror.com`

## 步骤3：登录 Cloudflare

### 方法1：自动登录（推荐）

在终端执行：
```bash
wrangler login
```

这会：
1. 打开默认浏览器
2. 跳转到 Cloudflare 登录页面
3. 输入你的邮箱和密码登录
4. 授权 wrangler 访问你的账号
5. 授权成功后，终端显示 "Authenticated with Cloudflare!"

### 方法2：手动登录（备用）

如果自动登录失败，使用 API Token：

```bash
# 1. 访问 https://dash.cloudflare.com/profile/api-tokens
# 2. 点击 "Create Token"
# 3. 选择 "Edit Cloudflare Workers" 模板
# 4. 点击 "Continue to summary"
# 5. 点击 "Create Token"（复制 Token）

# 6. 使用 Token 登录
wrangler login
# 在浏览器中选择 "Use an API Token"
# 粘贴 Token 并确认
```

### 验证登录

```bash
wrangler whoami
```

如果显示你的邮箱和账号信息，说明登录成功。

## 步骤4：部署项目

### 进入项目目录
```bash
cd /workspace/projects/auto-intel
```

### 构建项目
```bash
npm run build
```

### 运行部署脚本
```bash
bash scripts/deploy-cloudflare.sh
```

### 手动部署（备选方案）

如果脚本失败，手动部署：

```bash
# 1. 创建 Pages 项目
wrangler pages project create auto-intel --production-branch=main

# 2. 部署
wrangler pages deploy .vercel/output/static \
  --project-name=auto-intel \
  --commit-hash=$(git rev-parse --short HEAD) \
  --commit-message="Deploy to Cloudflare Pages"
```

## 步骤5：访问你的网站

部署成功后，终端会显示访问地址：

```
✅ Success! Uploaded [x] files
🌐 https://auto-intel.pages.dev
```

直接在浏览器打开这个地址即可。

## 常见问题

### Q1: wrangler login 打不开浏览器

**原因**：终端环境可能不支持打开浏览器

**解决**：
```bash
# 手动登录
wrangler login
# 在浏览器中手动打开显示的 URL
```

### Q2: 登录成功但部署失败

**原因**：可能没有构建项目

**解决**：
```bash
npm run build
ls -la .vercel/output/static
# 确认 static 目录存在且有文件
```

### Q3: 部署很慢

**原因**：网络问题或文件多

**解决**：
- 等待完成（首次可能需要几分钟）
- 或使用更快的网络
- 确保文件总数不超过 10000 个

### Q4: 部署成功但访问 404

**原因**：目录结构不正确

**解决**：
```bash
# 检查输出目录
ls -la .vercel/output/static
# 确认有 index.html 等文件
```

### Q5: 环境变量未生效

**原因**：Cloudflare Pages 需要单独配置环境变量

**解决**：
1. 访问 https://dash.cloudflare.com
2. 选择 "Workers & Pages" → "auto-intel"
3. 点击 "Settings" → "Environment variables"
4. 添加以下变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV
   ```

## 快速参考

### 一键登录和部署

```bash
# 1. 安装 wrangler（如果没安装）
npm install -g wrangler

# 2. 登录
wrangler login

# 3. 进入项目目录
cd /workspace/projects/auto-intel

# 4. 运行部署脚本
bash scripts/deploy-cloudflare.sh

# 5. 访问网站
# https://auto-intel.pages.dev
```

### 检查部署状态

```bash
# 列出最近的部署
wrangler pages deployment list --project-name=auto-intel

# 查看实时日志
wrangler pages deployment tail --project-name=auto-intel
```

### 删除项目（如果需要）

```bash
wrangler pages project delete auto-intel
```

## 下一步

部署成功后：

1. ✅ 访问网站：https://auto-intel.pages.dev
2. ✅ 测试功能：查看数据、刷新按钮等
3. ⏳ 绑定自定义域名（可选）
4. ⏳ 配置持续部署（可选）
5. ⏳ 查看访问统计（可选）

## 获取帮助

- Cloudflare文档：https://developers.cloudflare.com/pages
- wrangler文档：https://developers.cloudflare.com/workers/wrangler
- Cloudflare社区：https://community.cloudflare.com
- 联系支持：https://support.cloudflare.com

---

**现在就开始吧！5分钟完成部署！** 🚀
