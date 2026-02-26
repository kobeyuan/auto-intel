// 检查 Supabase RLS 策略
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eotyzutqjsowbexabzms.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q'

// 使用 service_role key 来查询 RLS 策略（需要更高权限）
// 但这里我们只能测试 anon key 的访问权限

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkRLS() {
  console.log('测试匿名用户访问权限...\n')

  try {
    // 使用 anon key 查询
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productsError) {
      console.error('匿名用户无法访问 products 表:')
      console.error('错误:', productsError.message)
      console.error('错误代码:', productsError.code)
      console.error('错误详情:', productsError)
      console.log('\n可能原因：')
      console.log('1. RLS (Row Level Security) 已启用但没有允许匿名访问的策略')
      console.log('2. 需要在 Supabase 中添加 RLS 策略')
      console.log('\n修复方法：')
      console.log('在 Supabase SQL Editor 中运行：')
      console.log(`
-- 允许匿名用户访问
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to products"
ON products FOR SELECT
TO anon
USING (true);

ALTER TABLE sentiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to sentiments"
ON sentiments FOR SELECT
TO anon
USING (true);
      `)
    } else {
      console.log('✅ 匿名用户可以访问 products 表')
      console.log('产品数据:', products)
    }

  } catch (error) {
    console.error('检查失败:', error.message)
  }
}

checkRLS()
