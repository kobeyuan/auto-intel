// 测试改进版搜索机制

require('dotenv').config({ path: '.env.local' })

const { searchIndustryNewsImproved, testSearch } = require('../src/lib/improved-search')

async function main() {
  console.log('🧪 测试改进版搜索机制\n')
  
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
      
      for (const result of results) {
        console.log(`\n📰 ${result.title}`)
        console.log(`   🔗 ${result.url}`)
        console.log(`   📅 ${new Date(result.publishedAt).toLocaleDateString('zh-CN')}`)
        console.log(`   📍 ${result.source}`)
        console.log(`   📝 ${result.snippet.substring(0, 100)}...`)
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
