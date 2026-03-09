# 安全指南

## ⚠️ 重要提醒

本项目涉及多个敏感 API 密钥，**务必确保不要将这些密钥提交到 Git 仓库**。

## 已配置的安全措施

### 1. Git 忽略配置 (`.gitignore`)

```
.env              # 主环境变量文件
.env*.local       # 本地环境变量文件
```

### 2. 预提交安全检查

运行以下命令安装预提交钩子：

```bash
npm run security:install
```

安装后，每次 `git commit` 会自动检查是否有敏感信息泄露。

### 3. 手动安全检查

```bash
npm run security:check
```

## 环境变量配置

### 开发环境

1. 复制模板文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的真实密钥

3. **永远不要** 将 `.env` 文件添加到 git：
   ```bash
   # 确认 .env 被忽略
git check-ignore -v .env
   ```

### 生产环境

在 Vercel/Netlify 等平台部署时，通过平台的环境变量设置界面配置，**不要**将 `.env` 文件上传到代码仓库。

## 敏感信息清单

以下信息必须保密：

| 变量名 | 用途 | 泄露风险 |
|--------|------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理员密钥 | 数据库被完全控制 |
| `GEMINI_API_KEY` | Gemini AI API | 额度被盗用 |
| `KIMI_API_KEY` | Kimi AI API | 额度被盗用 |
| `BRAVE_API_KEY` | Brave 搜索 API | 额度被盗用 |

## 如果意外泄露了密钥

1. **立即撤销密钥**：
   - Supabase: Project Settings → API → 重新生成密钥
   - Gemini/Kimi: 登录对应的 API 平台撤销密钥
   - Brave: 重新生成 API Key

2. **清理 Git 历史**（如果已提交）：
   ```bash
   # 使用 git-filter-repo 清理历史
   git filter-repo --force --replace-text <(echo '旧密钥===新占位符')

   # 或者重置仓库（如果影响不大）
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit (after security cleanup)"
   ```

3. **强制推送**（谨慎操作）：
   ```bash
   git push origin --force --all
   ```

## 代码安全最佳实践

### ❌ 不要这样做

```typescript
// 硬编码密钥
const apiKey = 'sk-actual-secret-key-here'

// 在错误信息中暴露环境变量
setError(`Config: ${process.env.API_KEY}`)

// 类型断言绕过检查
const key = process.env.KEY as string
```

### ✅ 正确做法

```typescript
// 使用环境变量
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error('API_KEY not configured')
}

// 安全的错误信息
setError('Configuration error')

// 运行时检查
const key = process.env.KEY
if (!key) {
  throw new Error('KEY is required')
}
```

## 相关脚本

```bash
# 检查安全
npm run security:check

# 安装 git 钩子
npm run security:install

# AI 模型切换
npm run ai:status     # 查看当前配置
npm run ai:kimi       # 切换到 Kimi
npm run ai:gemini     # 切换到 Gemini
```

## 报告安全问题

如果发现安全漏洞，请立即：

1. 不要公开披露
2. 更改所有相关密钥
3. 检查访问日志
