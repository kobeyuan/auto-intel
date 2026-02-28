#!/bin/bash
echo "🧪 验证构建配置..."

# 1. 检查环境变量
echo "1. 检查环境变量配置..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local 存在"
    grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && echo "✅ NEXT_PUBLIC_SUPABASE_URL 已配置" || echo "❌ NEXT_PUBLIC_SUPABASE_URL 未配置"
    grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local && echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY 已配置" || echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置"
    grep -q "BRAVE_API_KEY" .env.local && echo "✅ BRAVE_API_KEY 已配置" || echo "❌ BRAVE_API_KEY 未配置"
else
    echo "❌ .env.local 不存在"
fi

# 2. 检查 TypeScript 编译
echo -e "\n2. 检查 TypeScript 编译..."
npx tsc --noEmit 2>&1 | grep -q "error" && echo "❌ TypeScript 编译有错误" || echo "✅ TypeScript 编译通过"

# 3. 检查 Next.js 配置
echo -e "\n3. 检查 Next.js 配置..."
if [ -f "next.config.mjs" ]; then
    echo "✅ next.config.mjs 存在"
    grep -q "output: 'export'" next.config.mjs && echo "✅ 配置了静态导出" || echo "❌ 未配置静态导出"
else
    echo "❌ next.config.mjs 不存在"
fi

# 4. 检查关键文件
echo -e "\n4. 检查关键文件..."
[ -f "src/app/page.tsx" ] && echo "✅ src/app/page.tsx 存在" || echo "❌ src/app/page.tsx 不存在"
[ -f "src/lib/improved-search.ts" ] && echo "✅ src/lib/improved-search.ts 存在" || echo "❌ src/lib/improved-search.ts 不存在"
[ -f "src/lib/improved-crawler.ts" ] && echo "✅ src/lib/improved-crawler.ts 存在" || echo "❌ src/lib/improved-crawler.ts 不存在"

# 5. 检查 package.json 脚本
echo -e "\n5. 检查 package.json 脚本..."
grep -q '"build"' package.json && echo "✅ build 脚本存在" || echo "❌ build 脚本不存在"
grep -q '"dev"' package.json && echo "✅ dev 脚本存在" || echo "❌ dev 脚本不存在"

echo -e "\n🎯 验证完成"
