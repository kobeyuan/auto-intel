# 公网访问解决方案

## 当前问题

❌ **Vercel部署问题**：
- Vercel服务器在美国
- 中国大陆访问受限
- 加载速度慢，可能无法访问

## 推荐方案（按优先级）

### 方案1：Cloudflare Pages ⭐ 推荐（免费、快速）

**优势**：
- ✅ 完全免费
- ✅ 全球CDN，包括中国香港
- ✅ 自动HTTPS
- ✅ 国内访问速度快
- ✅ 部署简单

**部署步骤**：

```bash
# 1. 安装 wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 运行部署脚本
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

**访问地址**：
- https://auto-intel.pages.dev

**或手动部署**：
```bash
# 1. 构建项目
npm run build

# 2. 创建项目
wrangler pages project create auto-intel

# 3. 部署
wrangler pages deploy .vercel/output/static --project-name=auto-intel
```

### 方案2：Vercel + Cloudflare CDN

如果已有Vercel部署，添加Cloudflare CDN加速：

**步骤**：
1. 注册 Cloudflare：https://dash.cloudflare.com/sign-up
2. 添加域名（如果没有，使用免费子域名）
3. 在Cloudflare添加站点
4. 将域名DNS指向Vercel
5. 启用Cloudflare CDN

**Cloudflare设置**：
```
类型: CNAME
名称: auto-intel
目标: [你的Vercel域名]
代理状态: 已开启（橙色云朵）
```

### 方案3：国内部署（阿里云、腾讯云）

#### 阿里云 OSS + CDN

```bash
# 1. 安装阿里云CLI
npm install -g aliyun-cli

# 2. 配置
aliyun configure

# 3. 构建项目
npm run build

# 4. 上传到OSS
aliyun oss cp .vercel/output/static oss://auto-intel-bucket/ -r

# 5. 配置CDN（在阿里云控制台）
```

#### 腾讯云 COS + CDN

```bash
# 1. 安装腾讯云CLI
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 部署
npm run build
cloudbase hosting:deploy .vercel/output/static
```

### 方案4：Vercel Edge Network

修改 `vercel.json`，启用边缘网络：

```json
{
  "regions": ["hkg1", "sin1", "icn1"],
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  }
}
```

**支持的区域**：
- `hkg1` - 香港
- `sin1` - 新加坡
- `icn1` - 首尔

## 快速解决方案（推荐）

### 最简单方案：Cloudflare Pages

```bash
# 1. 安装工具
npm install -g wrangler

# 2. 登录
wrangler login

# 3. 部署
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

**5分钟完成，完全免费！**

## 性能对比

| 方案 | 中国访问速度 | 成本 | 复杂度 |
|------|------------|------|--------|
| Vercel | 慢/无法访问 | 免费 | 简单 |
| Vercel + Cloudflare | 快 | 免费 | 中等 |
| Cloudflare Pages | 快 | 免费 | 简单 ⭐ |
| 阿里云OSS+CDN | 最快 | 低（约50元/月） | 复杂 |
| 腾讯云COS+CDN | 最快 | 低（约50元/月） | 复杂 |

## 域名绑定（可选）

### Cloudflare Pages绑定域名

1. 在Cloudflare控制台，选择你的Pages项目
2. 点击 "Custom domains"
3. 添加域名（如：auto-intel.yourdomain.com）
4. 按提示添加DNS记录

### Vercel绑定域名

1. 在Vercel项目设置中，点击 "Domains"
2. 添加域名
3. 添加CNAME记录：
   ```
   类型: CNAME
   名称: auto-intel
   目标: cname.vercel-dns.com
   ```

## 环境变量配置

### Cloudflare Pages环境变量

在Cloudflare控制台 → Pages → Settings → Environment variables：

```
NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV
```

### 或通过命令行设置：

```bash
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --project-name=auto-intel
```

## 验证部署

### 检查国内访问

```bash
# 测试响应时间（从国内）
curl -o /dev/null -s -w "Response time: %{time_total}s\n" https://auto-intel.pages.dev

# 测试不同地区
curl -I https://auto-intel.pages.dev
```

### 性能监控

- Cloudflare Analytics：https://dash.cloudflare.com/analytics
- Lighthouse：Chrome DevTools → Lighthouse
- GTmetrix：https://gtmetrix.com

## 故障排查

### 问题：Cloudflare Pages部署失败

```bash
# 检查构建输出
ls -la .vercel/output/static

# 手动测试静态文件
cd .vercel/output/static
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 问题：API路由404

Next.js API路由在纯静态托管中不工作，需要：
1. 使用Cloudflare Functions（需要适配）
2. 或使用Serverless Functions（Vercel）

### 问题：Supabase连接失败

检查环境变量是否正确配置：
```bash
wrangler pages secret list --project-name=auto-intel
```

## 推荐配置

**最佳实践**：
1. ✅ 使用Cloudflare Pages（免费+快速）
2. ✅ 绑定自定义域名（可选）
3. ✅ 启用Cloudflare Analytics
4. ✅ 配置自动部署（Git集成）
5. ✅ 设置访问统计

## 一键部署脚本

我已经准备好了部署脚本：

```bash
cd /workspace/projects/auto-intel
bash scripts/deploy-cloudflare.sh
```

**需要准备**：
- Cloudflare账号（免费）
- wrangler CLI工具

## 获取帮助

- Cloudflare文档：https://developers.cloudflare.com/pages
- wrangler文档：https://developers.cloudflare.com/workers/wrangler
- Cloudflare社区：https://community.cloudflare.com

---

**推荐立即使用Cloudflare Pages，5分钟完成部署，国内访问速度大幅提升！**
