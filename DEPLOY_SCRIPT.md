# 一键部署脚本

## 快速部署到 Vercel（API 服务）

### 步骤 1：获取 Vercel Token

#### 方法 A：通过网页获取（最简单）

1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 名称填写：`auto-intel-token`
4. Scope 选择你的账号
5. 点击 "Create & Copy"
6. **立即复制显示的 Token**（格式：`vercel_xxx`）

#### 方法 B：通过 CLI

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login
# 按提示在浏览器完成认证

# 3. 查看 Token
vercel whoami
# Token 保存在 ~/.vercel/auth.json
```

---

### 步骤 2：创建 Vercel 项目

```bash
# 1. 进入项目目录
cd /path/to/auto-intel

# 2. 使用 Token 登录
export VERCEL_TOKEN="你的_token"

# 3. 链接项目
vercel --token=$VERCEL_TOKEN --confirm

# 4. 记录项目信息
# 项目创建后会显示 Project ID 和 URL
```

---

### 步骤 3：设置环境变量

```bash
# 在 Vercel Dashboard 设置，或使用 CLI

vercel --token=$VERCEL_TOKEN env add BRAVE_API_KEY
vercel --token=$VERCEL_TOKEN env add SUPABASE_SERVICE_ROLE_KEY
vercel --token=$VERCEL_TOKEN env add GEMINI_API_KEY
vercel --token=$VERCEL_TOKEN env add NEXT_PUBLIC_SUPABASE_URL
vercel --token=$VERCEL_TOKEN env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

### 步骤 4：部署

```bash
# 部署到生产环境
vercel --token=$VERCEL_TOKEN --prod

# 获取部署后的 URL
# 例如：https://auto-intel-api-xxxxx.vercel.app
```

---

### 步骤 5：配置 Cloudflare Pages 调用 Vercel API

在你的 Cloudflare Pages 项目设置中添加环境变量：

```
NEXT_PUBLIC_API_URL=https://auto-intel-api-xxxxx.vercel.app
```

修改前端代码 `src/lib/api.ts`：

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function triggerCollection() {
  const response = await fetch(`${API_BASE}/api/update_intel`);
  return response.json();
}
```

---

## 配置 GitHub Actions 自动部署（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

在 GitHub Secrets 中添加：
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 验证部署

### 测试 API

```bash
# 健康检查
curl https://your-api.vercel.app/api/health

# 触发采集
curl https://your-api.vercel.app/api/update_intel

# RSS 采集
curl https://your-api.vercel.app/api/rss_collect
```

### 查看日志

```bash
# 查看实时日志
vercel --token=$VERCEL_TOKEN logs --json
```

---

## 故障排除

### 问题 1：部署失败 "Build Failed"

**解决**：检查 Python 依赖
```bash
# 确保 requirements.txt 包含
supabase
requests
python-dotenv
feedparser
```

### 问题 2：API 返回 500

**解决**：检查环境变量
```bash
# 查看环境变量
vercel --token=$VERCEL_TOKEN env ls
```

### 问题 3：CORS 错误

**解决**：已在代码中添加 CORS 头，确保 Cloudflare 域名已添加到 CORS 白名单。

---

## 最终架构

```
用户访问
    │
    ▼
Cloudflare Pages (前端界面)
    │
    ├── 直接读取 Supabase 数据 ✅
    │
    └── 触发采集 ────────▶ Vercel API (Python)
                              │
                              ├── Brave Search API
                              ├── RSS 采集
                              └── 存入 Supabase
```

## 成本估算

| 服务 | 免费额度 | 预估费用 |
|------|---------|---------|
| Cloudflare Pages | 无限请求 | 免费 |
| Vercel Functions | 100GB 带宽/月 | 免费 |
| Supabase | 500MB 数据 | 免费 |
| Brave Search API | 2000 次/月 | 免费 |

**总计：免费使用**

---

需要帮助？请提供：
1. 你的 Vercel Token（或告诉我你是否已经获取）
2. Cloudflare Pages 的域名
3. 是否需要我帮你配置 GitHub Actions
