const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eotyzutqjsowbexabzms.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAccess() {
  console.log('测试 Supabase 匿名访问...\n')

  // 测试 products 表
  console.log('1. 查询 products 表:')
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(5)

  if (productsError) {
    console.log('❌ 失败:', productsError.message)
    console.log('   错误代码:', productsError.code)
  } else {
    console.log('✅ 成功，返回', products.length, '条记录')
    if (products.length > 0) {
      console.log('   示例:', products[0].name)
    }
  }

  // 测试 sentiments 表
  console.log('\n2. 查询 sentiments 表:')
  const { data: sentiments, error: sentimentsError } = await supabase
    .from('sentiments')
    .select('*')
    .limit(5)

  if (sentimentsError) {
    console.log('❌ 失败:', sentimentsError.message)
    console.log('   错误代码:', sentimentsError.code)
  } else {
    console.log('✅ 成功，返回', sentiments.length, '条记录')
    if (sentiments.length > 0) {
      console.log('   示例:', sentiments[0].title)
    }
  }
}

testAccess()
