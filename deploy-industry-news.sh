#!/bin/bash

echo "=== 行业情报爬虫部署脚本 ==="
echo ""

# 1. 提交代码
echo "1. 提交代码到 Git..."
git add .
git commit -m "feat: 添加行业情报爬虫功能"
git push origin main

echo ""
echo "✅ 代码已提交到 GitHub"
echo ""

# 2. 提示在 Supabase 中运行 SQL
echo "2. 需要在 Supabase 中创建 industry_news 表:"
echo "   a. 登录 https://app.supabase.com"
echo "   b. 进入项目: eotyzutqjsowbexabzms"
echo "   c. 点击 SQL Editor"
echo "   d. 运行 industry-news-table.sql 文件中的 SQL 脚本"
echo ""

# 3. 提示在 Vercel 重新部署
echo "3. 在 Vercel 重新部署:"
echo "   a. 进入 https://vercel.com/你的用户名/auto-intel-0226"
echo "   b. 点击 Deployments 标签"
echo "   c. 点击 Redeploy 按钮"
echo "   d. 取消勾选 'Use existing build cache'"
echo "   e. 点击 Redeploy"
echo ""

# 4. 测试 API
echo "4. 部署完成后测试:"
echo "   a. 访问 https://auto-intel-0226.vercel.app"
echo "   b. 页面底部应该显示 '行业情报洞察' 面板"
echo "   c. 点击 '采集新闻' 按钮测试爬虫功能"
echo ""

echo "=== 部署完成！ ==="