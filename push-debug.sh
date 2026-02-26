#!/bin/bash

echo "🎋 推送调试代码..."
echo ""

git add src/app/page.tsx
git commit -m "Debug: Add console logs for troubleshooting"
git push

echo ""
echo "✅ 推送完成！"
echo ""
echo "🚀 下一步："
echo "1. 在 Vercel 点击 Redeploy"
echo "2. 部署完成后，打开网站"
echo "3. 按 F12 打开浏览器控制台"
echo "4. 查看 Console 标签页的日志"
echo ""
echo "📋 把控制台的错误日志发给我！"
echo ""
