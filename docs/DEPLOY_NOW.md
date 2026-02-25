# GitHub + Vercel 部署指南

## 第 1 步：推送到 GitHub（5 分钟）

### 1.1 创建 GitHub 仓库

1. 访问：https://github.com/new
2. 填写：
   - **Repository name**: `auto-intel`
   - **Description**: `智能驾驶情报洞察平台`
   - **Visibility**: 选择 `Public` 或 `Private`
3. 点击 **Create repository**

### 1.2 初始化 Git 并推送

在项目目录执行以下命令：

```bash
cd /workspace/projects/auto-intel

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Auto Intelligence Platform"

# 添加远程仓库
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/auto-intel.git

# 推送代码
git branch -M main
git push -u origin main
```

**如果遇到错误：**

- **用户名/密码错误**：使用 GitHub Personal Access Token
  1. 访问 https://github.com/settings/tokens
  2. 生成新 token（勾选 repo 权限）
  3. 复制 token
  4. 推送时用 token 作为密码

- **远程仓库已存在**：
  ```bash
  git remote set-url origin https://github.com/YOUR_USERNAME/auto-intel.git
  git push -u origin main
  ```

---

## 第 2 步：部署到 Vercel（5 分钟）

### 2.1 导入项目

1. 访问：https://vercel.com/new
2. 使用 GitHub 账号登录
3. 在 "Import Git Repository" 部分：
   - 找到 `auto-intel` 仓库
   - 点击 **Import**

### 2.2 配置项目

1. **Project Name**: `auto-intel`（或自定义）
2. **Framework Preset**: Next.js（自动检测）
3. **Root Directory**: 留空
4. 点击 **Continue**

### 2.3 配置环境变量

Vercel 会自动检测 `.env.example`，但你需要手动添加：

在 "Environment Variables" 部分，添加以下 4 项：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eotyzutqjsowbexabzms.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_3NQh6OlqqoVSiHyVoGVXDw_dmlRSLCx` |
| `BRAVE_API_KEY` | `BSAJodIqkC38RnlMhH7d_b67JTIfTLV` |
| `FEISHU_WEBHOOK_URL` | （暂时留空，等飞书 Webhook） |

**注意：**
- `NEXT_PUBLIC_` 开头的变量会暴露给浏览器
- 这是正常的，因为 Supabase 的 anon key 本来就是公开的

### 2.4 部署

1. 点击 **Deploy**
2. 等待 1-2 分钟
3. 部署完成后，你会得到一个 URL：
   ```
   https://auto-intel.vercel.app
   ```
   或自定义域名

---

## 第 3 步：验证部署（2 分钟）

### 3.1 访问网站

打开你的 Vercel URL，检查：
- ✅ 页面正常加载
- ✅ 产品列表显示（10 个产品）
- ✅ 舆情列表显示（4 条舆情）
- ✅ 统计数据正确

### 3.2 测试数据采集

```bash
# 在终端执行
curl -X POST https://auto-intel.vercel.app/api/crawl
```

或者直接访问：
```
https://auto-intel.vercel.app/api/crawl
```

应该返回：
```json
{
  "success": true,
  "count": 0,
  "message": "成功采集 0 条新舆情"
}
```

（第一次可能是 0，因为示例数据已存在）

---

## 第 4 步：配置自定义域名（可选）

### 4.1 在 Vercel 添加域名

1. 进入项目 **Settings** → **Domains**
2. 点击 **Add**
3. 输入你的域名（如 `intel.yourdomain.com`）
4. 按照提示配置 DNS：

### 4.2 DNS 配置

在你的域名服务商处添加：

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | intel | `cname.vercel-dns.com` |

等待 DNS 生效（通常 5-30 分钟）

---

## 常见问题

### 1. Git 推送失败

**错误**：`Authentication failed`
**解决**：使用 Personal Access Token 而不是密码

### 2. Vercel 构建失败

**错误**：`Build failed`
**解决**：
- 检查日志中的具体错误
- 确认环境变量都已配置
- 尝试本地运行 `npm run build`

### 3. 部署后页面空白

**可能原因**：
- Supabase 连接失败
- 环境变量未正确配置

**解决**：
- 在 Vercel Dashboard 检查环境变量
- 查看 Function Logs 查看错误

### 4. 数据无法加载

**检查**：
1. Supabase 项目是否运行
2. API Key 是否正确
3. Table Editor 中是否有数据

---

## 成功标志

部署成功后，你应该能看到：

- [ ] Vercel 部署状态为 "Ready"
- [ ] 网站可以正常访问
- [ ] 产品列表显示 10 个产品
- [ ] 舆情列表显示 4 条舆情
- [ ] 统计数据正确

---

## 后续优化

部署成功后，你可以：

1. **配置飞书 Webhook**
   - 在飞书创建自定义机器人
   - 获取 Webhook URL
   - 在 Vercel 环境变量中添加 `FEISHU_WEBHOOK_URL`

2. **添加更多产品**
   - 在 Supabase Table Editor 中添加

3. **配置定时任务**
   - 在 Vercel Cron Jobs 中配置定时采集

4. **监控数据**
   - 定期查看网站
   - 查看 Vercel Analytics

---

需要帮助随时告诉我！🎋
