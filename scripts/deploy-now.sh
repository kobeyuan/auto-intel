#!/bin/bash
# 一键部署脚本

set -e

echo "========================================="
echo "   Auto Intelligence Platform 部署脚本"
echo "========================================="
echo ""

# 1. 检查构建产物
echo "📦 检查构建产物..."
if [ ! -d "out" ]; then
    echo "❌ 构建产物不存在，请先运行: npm run build"
    exit 1
fi
echo "✅ 构建产物已就绪"
echo ""

# 2. Git 状态
echo "📋 Git 状态..."
git status --short
echo ""

# 3. 提交代码
echo "🚀 提交代码到 GitHub..."
git add .
git commit -m "Security fix: Remove hardcoded keys and use environment variables

- Updated BRAVE_API_KEY
- Remove hardcoded Supabase Anon Key from source files
- Remove hardcoded keys from wrangler.toml
- Clean up build artifacts (.next, out)
- Add security documentation

Refs: docs/SECURITY_FIX.md" || echo "⚠️  没有新的变更需要提交"
echo ""

# 4. 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main || git push origin master || echo "⚠️  推送失败，请手动推送"
echo ""

echo "========================================="
echo "   部署触发完成！"
echo "========================================="
echo ""
echo "📊 部署平台监控："
echo ""
echo "🔹 Vercel:"
echo "   访问: https://vercel.com/dashboard"
echo "   项目: auto-intel-0226"
echo "   状态会自动更新"
echo ""
echo "🔹 Cloudflare Pages:"
echo "   访问: https://dash.cloudflare.com/"
echo "   项目: Workers & Pages → auto-intel"
echo "   状态会自动更新"
echo ""
echo "✅ 访问地址:"
echo "   Vercel: https://auto-intel-0226.vercel.app"
echo "   Cloudflare: https://auto-intel.pages.dev"
echo ""
