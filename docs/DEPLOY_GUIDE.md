# 部署指南

## 🚀 快速部署

### 方式 1：自动部署（推荐）

代码推送到 GitHub 后，会自动触发 Vercel 和 Cloudflare Pages 的部署。

```bash
cd /workspace/projects/auto-intel

# 运行部署脚本
bash scripts/deploy-now.sh
```

### 方式 2：手动触发部署

#### Vercel

1. 访问 https://vercel.com/dashboard
2. 选择 `auto-intel-0226` 项目
3. 点击 "Redeploy" 按钮
4. 选择 "Deploy to Production"

#### Cloudflare Pages

1. 访问 https://dash.cloudflare.com/
2. 进入 "Workers & Pages"
3. 选择 `auto-intel` 项目
4. 点击 "Create deployment" 或 "Retry deployment"

---

## 🔧 环境变量配置

确保以下环境变量已在对应平台配置：

### Vercel

访问 https://vercel.com/dashboard → `auto-intel-0226` → Settings → Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 Supabase Anon Key>
BRAVE_API_KEY=BSA4PkPHupuZzGnxFZsw0Yle_iC6jwi
```

### Cloudflare Pages

访问 https://dash.cloudflare.com/ → Workers & Pages → `auto-intel` → Settings → Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 Supabase Anon Key>
BRAVE_API_KEY=BSA4PkPHupuZzGnxFZsw0Yle_iC6jwi
```

---

## 📊 部署状态

### 构建日志

```
✅ 构建成功
✅ 所有页面已生成
✅ API 路由已配置
```

### 构建产物

- `.next/` - Next.js 构建产物
- `out/` - 静态导出产物

### 访问地址

| 平台 | 地址 | 说明 |
|------|------|------|
| Vercel | https://auto-intel-0226.vercel.app | 全球加速，国内访问受限 |
| Cloudflare Pages | https://auto-intel.pages.dev | 国内快速访问 |

---

## 🧪 验证部署

部署完成后，访问任意地址，检查：

- [ ] 页面能正常加载
- [ ] 数据能正常显示（行业情报、传感器、OTA、舆情）
- [ ] 点击"刷新数据"按钮无错误
- [ ] 控制台无报错信息

### 功能测试

1. **数据加载测试**
   - 打开页面，检查数据是否显示
   - 检查统计数据是否正确

2. **刷新数据测试**
   - 点击"刷新数据"按钮
   - 检查是否有新数据被采集

3. **API 端点测试**
   - 访问 `/api/products` - 应返回产品列表
   - 访问 `/api/sentiments` - 应返回舆情列表
   - 访问 `/api/industry-news` - 应返回行业新闻

---

## 🐛 常见问题

### Q: 部署失败怎么办？

**A:** 检查以下几点：

1. 环境变量是否正确配置
2. 构建日志中的错误信息
3. Supabase 数据库是否可访问
4. Brave API Key 是否有效

### Q: 数据不显示？

**A:** 可能原因：

1. 环境变量未配置或配置错误
2. Supabase RLS 策略限制了访问
3. 网络连接问题（Supabase 在海外）

### Q: 刷新数据没反应？

**A:** 检查：

1. BRAVE_API_KEY 是否配置
2. API 端点是否正常工作
3. 浏览器控制台是否有错误

---

## 📝 部署历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-28 | v2.0.1 | 安全修复：移除硬编码密钥 |
| 2026-02-27 | v2.0.0 | 重构：改用静态导出 |
| 2026-02-26 | v1.0.0 | 初始版本 |

---

## 🔄 更新密钥后重新部署

如果你更新了密钥（Supabase Anon Key 或 Brave API Key），需要重新部署：

### Vercel

```bash
cd /workspace/projects/auto-intel
npm run build
vercel --prod
```

### Cloudflare Pages

```bash
cd /workspace/projects/auto-intel
npm run build
npx wrangler pages deploy out --project-name=auto-intel
```

---

**文档更新时间：** 2026-02-28
