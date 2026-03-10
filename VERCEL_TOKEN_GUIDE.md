# Vercel Token 获取指南

## 方式一：通过 Vercel Dashboard 获取（推荐）

### 步骤 1：登录 Vercel
1. 访问 https://vercel.com/dashboard
2. 使用 GitHub 账号登录

### 步骤 2：进入设置页面
1. 点击右上角头像
2. 选择 "Settings"（设置）

### 步骤 3：生成 Token
1. 在左侧菜单选择 "Tokens"
2. 点击 "Create Token"
3. 填写信息：
   - **Token Name**: `auto-intel-deploy`
   - **Scope**: 选择你的团队或个人账号
   - **Expiration**: 建议选 "No Expiration"（永不过期）
4. 点击 "Create Token"
5. **立即复制 Token**（只显示一次）

### 步骤 4：设置 Token
```bash
# 在本地终端设置环境变量
export VERCEL_TOKEN="你的_token_这里"

# 验证是否设置成功
echo $VERCEL_TOKEN
```

---

## 方式二：使用 Vercel CLI 登录获取

### 步骤 1：安装 CLI
```bash
npm install -g vercel
```

### 步骤 2：登录
```bash
vercel login
# 会打开浏览器，按提示完成认证
```

### 步骤 3：获取本地 Token
登录成功后，Token 会保存在本地：
```bash
# Mac/Linux
cat ~/.vercel/auth.json

# Windows
type %USERPROFILE%\.vercel\auth.json
```

找到 `"token": "vcu_..."` 字段。

---

## 在 GitHub Actions 中使用

### 设置 Secrets

1. 打开 GitHub 仓库页面
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加以下 Secrets：

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | 你的 Vercel Token |
| `VERCEL_ORG_ID` | 你的 Vercel Org ID |
| `VERCEL_PROJECT_ID` | 你的 Vercel Project ID |

### 获取 Org ID 和 Project ID

在 Vercel Project 页面：
1. 进入项目设置
2. 选择 "General"
3. 找到 "Project ID" 和 "Team/Organization ID"

或者在本地项目根目录运行：
```bash
vercel link
# 然后查看 .vercel/project.json
cat .vercel/project.json
```

---

## 方式三：直接通过 GitHub 集成（最简单）

如果你已经在 Vercel 上关联了 GitHub 项目，**不需要 Token**！

### 自动部署配置

1. 在 Vercel Dashboard 选择你的项目
2. 点击 "Settings" → "Git"
3. 确认已连接 GitHub 仓库
4. 部署设置：
   - **Production Branch**: `main`
   - **Preview Deployment**: 开启（所有 PR 自动预览）

### 效果
- 每次 push 到 `main` 分支 → 自动部署到生产环境
- 每次创建 PR → 自动生成预览链接
- **无需手动配置 Token**

---

## Cloudflare Pages 部署（你当前的方案）

如果你使用 Cloudflare Pages，需要注意：

### Cloudflare 与 Vercel 的区别

| 功能 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| 函数运行时长 | 10s (免费) / 60s (Pro) | 50ms (免费) / 30s (付费) |
| Python 支持 | ✅ 原生支持 | ⚠️ 需 Workers |
| 中国访问 | ⚠️ 部分地区慢 | ✅ 更快 |
| Serverless Functions | ✅ | ✅ |

### Cloudflare 部署步骤

#### 1. 在 Cloudflare Dashboard 配置

1. 访问 https://dash.cloudflare.com
2. 选择 "Pages"
3. 点击 "Create a project"
4. 连接 GitHub 仓库
5. 构建设置：
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
```

#### 2. 环境变量设置

在 Cloudflare Pages 设置中添加：
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
BRAVE_API_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
GEMINI_API_KEY=xxx
```

#### 3. Python API 处理

Cloudflare Pages 对 Python 支持有限，需要将 Python API 改为：

**方案 A**: 使用 Cloudflare Workers (JavaScript/TypeScript)
**方案 B**: 使用外部服务（如 Vercel Functions 专门处理 API）
**方案 C**: 使用 Docker 部署到服务器

---

## 推荐方案

### 方案一：GitHub + Vercel 自动集成（最简单）

优点：
- 无需管理 Token
- 自动部署
- Python API 完美支持

缺点：
- 国内访问可能较慢

### 方案二：GitHub + Cloudflare Pages（你当前）

优点：
- 国内访问快
- CDN 全球加速

缺点：
- Python API 需要额外处理
- 函数运行时长限制

### 方案三：混合部署（推荐）

```
前端 (Next.js) → Cloudflare Pages
API (Python)   → Vercel Functions 或 自有服务器
```

这样可以兼顾：
- 前端快速国内访问
- API 完整功能支持

---

## 立即执行建议

请确认你的情况：

### 情况 A：已经在 Vercel 关联项目
✅ **无需 Token**，GitHub 自动部署已生效
- 每次 push 到 main 会自动部署
- 检查 Vercel Dashboard 看部署状态

### 情况 B：使用 Cloudflare Pages
需要处理 Python API：
1. **方案 1**: 将 Python 采集脚本改为 Node.js
2. **方案 2**: Python API 单独部署到 Vercel/服务器
3. **方案 3**: 使用 Cloudflare Workers 重写 API

### 情况 C：需要 GitHub Actions 自动部署
按照上面的方式获取 Token，然后设置 Secrets。

---

请告诉我：
1. 你目前项目的状态（Vercel 还是 Cloudflare）？
2. Python API 是否需要运行（情报采集）？
3. 是否需要国内访问优化？

我可以帮你制定最佳部署方案。
