# 环境变量配置检查清单

## 本地开发 (.env.local)

```bash
# Supabase 配置（必需）
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Brave Search 配置（必需，用于采集功能）
BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV

# 飞书 Webhook（可选）
FEISHU_WEBHOOK_URL=
```

## Vercel 部署

在 Vercel 项目设置 → Environment Variables 中添加：

1. `NEXT_PUBLIC_SUPABASE_URL` → https://eotyzutqjsowbexabzms.supabase.co
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
3. `BRAVE_API_KEY` → BSAJodIqkC38RnlMhH7d_b67JTIfTLV

**注意**：Vercel 的环境变量更新后需要重新部署。

## Cloudflare Pages 部署

Cloudflare Pages 的环境变量在 `wrangler.toml` 中配置：

```toml
[env.production]
NEXT_PUBLIC_SUPABASE_URL = "https://eotyzutqjsowbexabzms.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
BRAVE_API_KEY = "BSAJodIqkC38RnlMhH7d_b67JTIfTLV"
```

**更新后需要重新部署**。

## 故障排查

### 采集功能无反应

**症状**：点击"刷新数据"按钮，没有新数据被采集

**排查步骤**：

1. 检查浏览器控制台是否有错误
2. 检查 Cloudflare Pages 的函数日志（Functions → log）
3. 常见错误：
   - `BRAVE_API_KEY not configured` → 缺少 Brave API Key
   - `Supabase client error` → 缺少 Supabase Anon Key
   - `Unauthorized` → API Key 无效

### 数据库读取失败

**症状**：页面显示"加载数据失败"或空白

**排查步骤**：

1. 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置
2. 检查 Supabase 项目是否正常运行
3. 检查网络连接（中国大陆访问 Supabase 可能较慢）

### Brave API 限流

**症状**：采集偶尔成功，偶尔失败

**原因**：Brave 免费计划有请求频率限制

**解决方案**：
- 在采集代码中添加延迟（已有 1-2 秒延迟）
- 升级 Brave API 付费计划
- 使用代理或缓存机制

## 环境变量来源

### Supabase
- 获取地址：https://supabase.com/dashboard/project/eotyzutqjsowbexabzms/settings/api
- Anon Key：`project_anon_key`
- Service Role Key（仅后端）：`service_role`（不要泄露到前端）

### Brave Search
- 获取地址：https://api.search.brave.com/app/keys
- 免费额度：2000 次/月

### 飞书 Webhook（可选）
- 创建群机器人获取 Webhook URL
- 配置后可实时推送重要舆情

## 安全提示

⚠️ **不要将真实的 API Key 提交到 Git 仓库**

```bash
# 确保 .env.local 在 .gitignore 中
echo ".env.local" >> .gitignore

# 提交代码前检查
git diff --cached | grep "ANON_KEY\|API_KEY"
```

✅ 可以提交：`.env.example`（只包含占位符）
❌ 不要提交：`.env.local`（包含真实密钥）
