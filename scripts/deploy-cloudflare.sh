#!/bin/bash

# 智能驾驶情报平台 - Cloudflare部署脚本

set -e

echo "🚀 开始部署到 Cloudflare Pages..."
echo ""

# 检查是否安装了 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  未安装 wrangler CLI"
    echo "请先安装: npm install -g wrangler"
    echo "然后登录: wrangler login"
    exit 1
fi

# 检查是否已登录
echo "🔍 检查登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录，请先执行: wrangler login"
    exit 1
fi

echo "✅ 已登录 Cloudflare"
echo ""

# 构建项目
echo "📦 构建项目..."
npm run build

echo "✅ 构建完成"
echo ""

# 部署到 Cloudflare Pages
echo "🌐 部署到 Cloudflare Pages..."
wrangler pages project create auto-intel --production-branch=main 2>/dev/null || true

wrangler pages deploy out \
  --project-name=auto-intel \
  --commit-hash=$(git rev-parse --short HEAD) \
  --commit-message="Deploy to Cloudflare Pages"

echo ""
echo "✅ 部署成功！"
echo ""
echo "📱 访问地址: https://auto-intel.pages.dev"
echo "📚 管理后台: https://dash.cloudflare.com/pages"
