// 测试改进版搜索机制

require('dotenv').config({ path: '.env.local' })

// 注意：由于这是 CommonJS 环境，我们需要使用动态导入
async function main() {
  console.log('🧪 测试改进版搜索机制\n')
  
  // 动态导入 ES 模块
  const { searchIndustryNewsImproved } = await import('../src/lib/improved-search.js')
  
  // 测试配置
  const testCases = [
    { category: 'technology', description: '技术新闻' },
    { category: 'product', description: '产品新闻' },
    { category: 'policy', description: '政策新闻' },
    { category: 'company', description: '公司新闻' },
    { category: 'sensor', description: '传感器新闻' },
    { category: 'ota', description: 'OTA更新新闻' }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试 ${testCase.description} (${testCase.category})`)
    console.log('='.repeat(50))
    
    try {
      const results = await searchIndustryNewsImproved(testCase.category, 3, {
        timeRange: 'week',
        trustedOnly: true
      })
      
      console.log(`✅ 收到 ${results.length} 条结果`)
      
      if (results.length > 0) {
        for (const result of results.slice(0, 2)) { // 只显示前2条
          console.log(`\n📰 ${result.title}`)
          console.log(`   🔗 ${result.url}`)
          console.log(`   📅 ${new Date(result.publishedAt).toLocaleDateString('zh-CN')}`)
          console.log(`   📍 ${result.source}`)
          console.log(`   📝 ${result.snippet.substring(0, 100)}...`)
        }
      } else {
        console.log('⚠️  没有收到结果')
      }
      
    } catch (error) {
      console.error(`❌ 测试失败:`, error.message)
    }
    
    // 添加延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n🎯 所有测试完成')
}

// 运行测试
main().catch(console.error)
