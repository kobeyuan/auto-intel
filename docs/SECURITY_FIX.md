# 安全修复报告

## 🚨 发现的安全问题

### 密钥泄露风险
以下文件中硬编码了敏感密钥，已被提交到 Git 仓库：

**Supabase Anon Key 泄露：**
1. ✅ `src/app/page.tsx` - 主页面直接硬编码（已修复）
2. ✅ `scripts/insert-real-news.js` - 数据插入脚本（已修复）
3. ✅ `wrangler.toml` - Cloudflare Pages 配置（已修复）
4. ✅ `check-rls.js` - 测试脚本（已删除）
5. ✅ `test-supabase-access.js` - 测试脚本（已删除）
6. ✅ `test-db.js` - 测试脚本（已删除）
7. ✅ `.next/server/app/api/*/route.js` - 构建产物（已清理）
8. ✅ `out/_next/static/chunks/app/*.js` - Cloudflare Pages 构建产物（已清理）
9. ✅ `.next/static/chunks/app/*.js` - Vercel 构建产物（已清理）

**Brave API Key 泄露：**
1. ✅ `wrangler.toml` - Cloudflare Pages 配置（已修复）

## 🔧 已采取的修复措施

### 1. 修复源代码
- ✅ `src/app/page.tsx`：改为使用 `process.env.NEXT_PUBLIC_SUPABASE_URL` 和 `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `scripts/insert-real-news.js`：改为使用环境变量

### 2. 清理测试脚本
- ✅ 删除 `check-rls.js`
- ✅ 删除 `test-supabase-access.js`
- ✅ 删除 `test-db.js`

### 3. 更新配置文件
- ✅ `wrangler.toml`：移除所有硬编码密钥，添加配置说明

### 4. 清理构建产物
- ✅ 删除 `.next/` 目录（包含硬编码密钥的构建产物）
- ✅ 删除 `out/` 目录（Cloudflare Pages 构建产物）

## ⚠️ 立即需要执行的操作

### 1. 更换 Supabase Anon Key（高优先级）
由于密钥已泄露，建议立即更换：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard/project/eotyzutqjsowbexabzms/settings/api)
2. 点击 "Generate New API Key" 生成新的 anon key
3. 更新本地 `.env.local` 文件
4. 更新以下部署平台的环境变量：
   - Vercel：Project Settings → Environment Variables
   - Cloudflare Pages：Project Settings → Environment variables

### 2. 更换 Brave API Key（中优先级）
如果担心额度被刷，建议更换：

1. 访问 [Brave Search API Keys](https://api.search.brave.com/app/keys)
2. 生成新的 API Key
3. 更新本地 `.env.local` 文件
4. 更新部署平台的环境变量

### 3. 重新部署
更新密钥后，需要重新部署：

```bash
# Vercel
cd /workspace/projects/auto-intel
npm run build
vercel --prod

# Cloudflare Pages
npm run build
npx wrangler pages deploy out --project-name=auto-intel
```

### 4. 检查 Git 历史
如果这些文件已经被推送到 GitHub：

1. 检查提交历史：
   ```bash
   git log --all --full-history --oneline -- "*key*" "*secret*" "*anon*"
   ```

2. 如果密钥在公开仓库中，考虑：
   - 使用 `git filter-repo` 或 `BFG Repo-Cleaner` 从历史记录中删除
   - 推送清理后的历史
   - 或者直接创建新的仓库（最简单）

## 🛡️ 未来预防措施

### 1. 环境变量最佳实践

**本地开发：**
```bash
# .env.local（不要提交到 Git）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BRAVE_API_KEY=your-brave-api-key
```

**Vercel 部署：**
- 在 Project Settings → Environment Variables 中配置
- 所有密钥都应使用环境变量，不要硬编码

**Cloudflare Pages 部署：**
- 在 Project Settings → Environment variables 中配置
- 或者使用 `wrangler secrets` 命令：
  ```bash
  npx wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL --project-name=auto-intel
  ```

### 2. Git 安全

**.gitignore 配置：**
```gitignore
# 环境变量
.env
.env.local
.env.production

# 构建产物
.next/
out/
dist/
build/

# 测试文件（可能包含硬编码密钥）
test-*.js
check-*.js
```

### 3. 代码审查清单

在提交代码前，检查：

- [ ] 是否有任何文件中硬编码了 `supabase.co` 域名
- [ ] 是否有任何文件中硬编码了 API Key（JWT token 格式）
- [ ] 是否有任何文件中硬编码了密钥字符串（`BRAVE_API_KEY` 等）
- [ ] `.gitignore` 是否正确配置
- [ ] 是否有测试文件泄露了密钥

### 4. 使用 Pre-commit Hook

安装 `husky` 和 `lint-staged`，在提交前自动检查：

```bash
npm install --save-dev husky lint-staged
npx husky install
echo "npx lint-staged" > .husky/pre-commit
```

`package.json` 配置：
```json
{
  "lint-staged": {
    "*.{js,ts,tsx,jsx}": [
      "node scripts/check-no-secrets.js"
    ]
  }
}
```

## 📋 环境变量配置清单

### 本地开发 (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<新密钥>
BRAVE_API_KEY=<新密钥>
FEISHU_WEBHOOK_URL=<可选>
```

### Vercel
在 Dashboard 中配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BRAVE_API_KEY`

### Cloudflare Pages
在 Dashboard 中配置（使用 wrangler secrets 命令更安全）：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BRAVE_API_KEY`

## 🚀 下一步行动

1. ✅ 立即更换 Supabase Anon Key
2. ✅ 立即更换 Brave API Key（建议）
3. ✅ 更新所有部署平台的环境变量
4. ✅ 重新部署应用
5. ✅ 检查并清理 Git 历史（如果已推送）
6. ✅ 配置 `.gitignore` 防止未来泄露
7. ✅ 建立代码审查流程

---

**报告生成时间：** 2026-02-28
**严重程度：** 🔴 高危
**影响范围：** 整个项目的安全
