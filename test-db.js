// 测试数据库连接和数据
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eotyzutqjsowbexabzms.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdHl6dXRxanNvd2JleGFiem1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI4MzMsImV4cCI6MjA4NzU4ODgzM30.G2fRupJf4J9tD77-il1eudBck21V_hK3lnLzVjXp--Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('测试数据库连接...\n')

  try {
    // 测试产品表
    console.log('1. 查询产品表...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')

    if (productsError) {
      console.error('产品查询错误:', productsError.message)
      console.error('错误详情:', productsError)
    } else {
      console.log('✅ 产品查询成功')
      console.log(`   产品数量: ${products.length}`)
      if (products.length > 0) {
        console.log('   前3个产品:')
        products.slice(0, 3).forEach(p => {
          console.log(`   - ${p.name} (${p.brand})`)
        })
      }
    }

    console.log('\n2. 查询舆情表...')
    const { data: sentiments, error: sentimentsError } = await supabase
      .from('sentiments')
      .select('*')

    if (sentimentsError) {
      console.error('舆情查询错误:', sentimentsError.message)
      console.error('错误详情:', sentimentsError)
    } else {
      console.log('✅ 舆情查询成功')
      console.log(`   舆情数量: ${sentiments.length}`)
      if (sentiments.length > 0) {
        console.log('   前3条舆情:')
        sentiments.slice(0, 3).forEach(s => {
          console.log(`   - ${s.title} (${s.sentiment})`)
        })
      }
    }

    console.log('\n3. 测试表是否存在...')
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true })

    if (tablesError) {
      console.error('表不存在或无访问权限:', tablesError.message)
    } else {
      console.log('✅ products 表可访问')
    }

  } catch (error) {
    console.error('数据库连接失败:', error.message)
  }
}

testDatabase()
