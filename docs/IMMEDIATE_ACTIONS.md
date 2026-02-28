# 🚨 立即行动指南

## 当前状态
✅ 所有硬编码密钥已从源代码中移除
✅ 构建产物已清理
✅ 配置文件已更新
⚠️ 需要更换已泄露的密钥

## 立即执行（按优先级）

### 1. 🔴 最高优先级：更换 Supabase Anon Key

**步骤：**
1. 打开 https://supabase.com/dashboard/project/eotyzutqjsowbexabzms/settings/api
2. 找到 "Project API Keys" 部分
3. 复制 `anon public` 密钥（如果有 "Regenerate" 按钮，点击它）
4. 更新本地 `/workspace/projects/auto-intel/.env.local`：
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<新密钥>
   ```

### 2. 🟡 高优先级：更换 Brave API Key（建议）

**步骤：**
1. 打开 https://api.search.brave.com/app/keys
2. 生成新的 API Key
3. 更新本地 `/workspace/projects/auto-intel/.env.local`：
   ```bash
   BRAVE_API_KEY=<新密钥>
   ```

### 3. 🟢 更新部署平台

#### Vercel
1. 访问 https://vercel.com/dashboard
2. 选择 `auto-intel-0226` 项目
3. Settings → Environment Variables
4. 更新以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://eotyzutqjsowbexabzms.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<新密钥>`
   - `BRAVE_API_KEY` = `<新密钥>`
5. Redeploy → Deploy to Production

#### Cloudflare Pages
1. 访问 https://dash.cloudflare.com/
2. 选择 Workers & Pages → auto-intel
3. Settings → Environment variables
4. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://eotyzutqjsowbexabzms.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<新密钥>`
   - `BRAVE_API_KEY` = `<新密钥>`
5. 重新部署

### 4. 📋 检查 Git 历史（如果已推送）

如果代码已经推送到 GitHub：

```bash
cd /workspace/projects/auto-intel
git log --all --oneline --grep="key\|secret\|token"
```

如果发现密钥已提交，选择以下方案之一：

**方案 A：使用 git filter-repo（推荐）**
```bash
pip install git-filter-repo
git filter-repo --invert-paths --path src/app/page.tsx --path scripts/insert-real-news.js --path wrangler.toml
```

**方案 B：创建新仓库（最简单）**
```bash
# 1. 备份当前分支
git branch backup-branch

# 2. 初始化新的 Git 仓库
rm -rf .git
git init
git add .
git commit -m "Initial commit: Security fixes applied"

# 3. 添加远程仓库
git remote add origin https://github.com/your-username/auto-intel.git
git push -u origin main
```

### 5. 🚀 本地测试

更新密钥后，测试应用是否正常工作：

```bash
cd /workspace/projects/auto-intel
npm install
npm run dev
```

访问 http://localhost:3000，检查：
- [ ] 数据能正常加载
- [ ] 没有控制台错误
- [ ] 刷新数据功能正常

### 6. 📊 重新部署

**部署到 Vercel：**
```bash
cd /workspace/projects/auto-intel
npm run build
npx vercel --prod
```

**部署到 Cloudflare Pages：**
```bash
cd /workspace/projects/auto-intel
npm run build
npx wrangler pages deploy out --project-name=auto-intel
```

## 验证清单

完成以上步骤后，确认：

- [ ] Supabase Anon Key 已更换
- [ ] Brave API Key 已更换
- [ ] Vercel 环境变量已更新
- [ ] Cloudflare Pages 环境变量已更新
- [ ] 本地应用正常运行
- [ ] Vercel 部署正常
- [ ] Cloudflare Pages 部署正常
- [ ] Git 历史已清理（如果需要）

## 常见问题

### Q: 为什么密钥泄露这么严重？
A: 因为 Supabase Anon Key 允许任何人读取/写入数据库（取决于 RLS 策略）。如果密钥泄露到公开的 Git 仓库，任何人都可以获取它并访问你的数据库。

### Q: .env.local 会提交到 Git 吗？
A: 不会。.gitignore 中已经配置了 `.env*.local`，这些文件不会被提交。

### Q: 为什么 wrangler.toml 不包含密钥了？
A: 硬编码在配置文件中的密钥会被提交到 Git，造成安全风险。正确的方式是在 Cloudflare Pages Dashboard 中配置环境变量。

### Q: 如果我没有更换密钥会怎样？
A: 
- **Supabase Anon Key**：攻击者可能读取/修改你的数据库数据
- **Brave API Key**：可能刷爆你的 API 额度（2000次/月），导致采集功能失效

## 需要帮助？

如果遇到问题，可以：
1. 查看详细文档：`docs/SECURITY_FIX.md`
2. 检查环境变量配置：`docs/ENV_CONFIG_CHECKLIST.md`

---

**最后更新：** 2026-02-28
**状态：** ✅ 密钥已移除，等待更换
