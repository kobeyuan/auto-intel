#!/bin/bash

echo "🎋 推送字段名修复..."
echo ""

git add src/app/page.tsx
git commit -m "Fix: Correct field names (createdAt -> created_at, publishedAt -> published_at)"
git push

echo ""
echo "✅ 推送完成！"
echo ""
echo "🚀 下一步："
echo "1. 在 Vercel 点击 Redeploy"
echo "2. 部署完成后，刷新网站"
echo "3. 检查产品总数是否显示 10"
echo ""
