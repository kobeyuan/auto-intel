# 使用 API Token 登录 Cloudflare（推荐）

## 为什么使用 API Token？

- ✅ 更稳定，不会超时
- ✅ 无需浏览器授权
- ✅ 适合 CI/CD 和自动化
- ✅ 更安全，可以设置权限和过期时间

## 步骤1：创建 API Token

### 1. 访问 Token 创建页面

在浏览器打开：
https://dash.cloudflare.com/profile/api-tokens

### 2. 创建 Token

点击 **"Create Token"** 按钮

### 3. 选择模板

推荐使用 **"Edit Cloudflare Workers"** 模板：
1. 滚动到 "Workers & Pages" 部分
2. 点击 "Edit Cloudflare Workers" 模板的 "Use template"
3. 点击 "Continue to summary"

### 4. 设置权限和过期时间（可选）

你可以调整：
- **Permissions**：权限范围（默认即可）
- **Resources**：资源范围（默认 All 即可）
- **Client IP Address Filtering**：IP 过滤（可选）
- **TTL**：Token 过期时间（建议设置为 "Never expire"）

### 5. 创建并复制 Token

1. 点击 **"Create Token"**
2. 复制显示的 **Token**（只显示一次，立即复制！）
3. Token 格式类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**⚠️ 重要：Token 只显示一次，请立即复制保存！**

## 步骤2：使用 Token 登录

### 使用命令行登录

在终端执行：

```bash
wrangler login
```

wrangler 会显示选项，选择：
```
? How would you like to authenticate?
  Open a browser
❯ Use an API Token
```

选择 **"Use an API Token"**（使用 API Token）

### 粘贴 Token

1. wrangler 会提示：`Paste your API Token:`
2. 粘贴刚才复制的 Token
3. 按 Enter

### 验证登录

```bash
wrangler whoami
```

应该显示你的邮箱和账号信息，例如：
```
⛅️ email@example.com
```

## 步骤3：部署项目

```bash
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

## 常见问题

### Q: Token 失效了怎么办？

重新创建 Token：
1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 找到之前的 Token
3. 点击 "Revoke" 或删除
4. 按上述步骤创建新的 Token

### Q: Token 权限不足

确保 Token 权限包括：
- **Account > Workers Scripts > Edit**
- **Account > Account Settings > Read**

### Q: 找不到 "Edit Cloudflare Workers" 模板？

手动创建 Token：
1. 点击 "Create Token"
2. 点击 "Create Custom Token"
3. 设置权限：
   ```
   Account > Workers Scripts > Edit
   Account > Account Settings > Read
   ```
4. 点击 "Continue to summary"
5. 点击 "Create Token"

### Q: 如何查看已创建的 Token？

访问：https://dash.cloudflare.com/profile/api-tokens

可以看到所有已创建的 Token 及其：
- 名称
- 权限
- 过期时间
- 最后使用时间

## 安全建议

### 1. 不要泄露 Token

- ❌ 不要提交到 Git 仓库
- ❌ 不要在公开论坛分享
- ❌ 不要在聊天工具中发送

### 2. 设置过期时间

建议设置合理的过期时间：
- **开发环境**：1-3 个月
- **生产环境**：6-12 个月
- **自动化**：1 年或 Never expire

### 3. 定期更新 Token

- 定期撤销旧的 Token
- 创建新的 Token 替换
- 记录 Token 创建时间

### 4. 使用环境变量

不要在脚本中硬编码 Token，使用环境变量：

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
wrangler login
```

或创建 `.wrangler/config.toml`：

```toml
api_token = "your_token_here"
```

## 快速参考

### 创建 Token 一键流程

1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Edit Cloudflare Workers" 模板
4. 点击 "Continue to summary"
5. 点击 "Create Token"
6. 复制 Token（只显示一次！）
7. 执行 `wrangler login` 选择 "Use an API Token"
8. 粘贴 Token

### 验证登录

```bash
wrangler whoami
```

### 部署项目

```bash
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

---

**推荐使用 API Token 方式，更稳定更安全！** 🔐
