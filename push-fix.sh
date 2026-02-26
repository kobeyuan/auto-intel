#!/bin/bash

echo "🎋 推送修复..."
echo ""

git add vercel.json
git commit -m "Fix: Remove secrets reference from vercel.json"
git push

echo ""
echo "✅ 推送完成！"
echo ""
echo "🚀 下一步："
echo "1. 在 Vercel 重新导入项目，或"
echo "2. 直接在 Vercel Settings → Environment Variables 添加环境变量"
echo ""
echo "📋 环境变量："
echo "NEXT_PUBLIC_SUPABASE_URL=https://eotyzutqjsowbexabzms.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q"
echo "BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV"
echo ""
