#!/bin/bash

# GitHub + Vercel 部署脚本
# 使用前请先创建 GitHub 仓库

echo "🎋 开始部署智能驾驶情报洞察平台..."
echo ""

# 步骤 1：初始化 Git
echo "📝 步骤 1：初始化 Git..."
git init

# 步骤 2：添加文件
echo "📦 步骤 2：添加文件..."
git add .

# 步骤 3：提交
echo "✅ 步骤 3：提交..."
git commit -m "Initial commit: Auto Intelligence Platform"

# 步骤 4：提示添加远程仓库
echo ""
echo "⚠️  请先在 GitHub 创建仓库："
echo "   访问：https://github.com/new"
echo "   仓库名：auto-intel"
echo ""
read -p "✅ 仓库创建完成后，输入你的 GitHub 用户名: " USERNAME

# 步骤 5：添加远程仓库
echo ""
echo "🔗 步骤 5：连接远程仓库..."
git remote add origin "https://github.com/${USERNAME}/auto-intel.git"

# 步骤 6：推送
echo "📤 步骤 6：推送到 GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ 推送成功！"
echo ""
echo "🚀 下一步：访问 Vercel 部署"
echo "   访问：https://vercel.com/new"
echo "   导入 auto-intel 仓库"
echo ""
echo "📋 Vercel 环境变量："
echo "   NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_3NQh6OlqqoVSiHyVoGVXDw_dmlRSLCx"
echo "   BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV"
echo ""
