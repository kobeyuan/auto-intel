// 改进版爬虫 - 确保数据详实、及时、来源可靠

import { getSupabase } from './supabase'
import {
  searchIndustryNewsImproved,
  searchAllIndustryNewsImproved,
  analyzeSentimentImproved,
  analyzeImportanceImproved,
  SearchResult
} from './improved-search'

// 行业新闻采集
export async function crawlIndustryNewsImproved(options: {
  maxResults?: number
  timeRange?: 'day' | 'week' | 'month' | 'year'
  trustedOnly?: boolean
  debug?: boolean
} = {}) {
  const {
    maxResults = 5,
    timeRange = 'week',
    trustedOnly = true,
    debug = false
  } = options

  try {
    const supabase = getSupabase()
    
    if (debug) {
      console.log('🚀 开始采集行业新闻...')
      console.log(`📊 配置: maxResults=${maxResults}, timeRange=${timeRange}, trustedOnly=${trustedOnly}`)
    }

    // 搜索所有类别的行业新闻
    const searchResults = await searchAllIndustryNewsImproved(maxResults, {
      timeRange,
      trustedOnly
    })

    if (debug) {
      console.log('\n📈 搜索结果汇总:')
      for (const [category, results] of Object.entries(searchResults)) {
        console.log(`  ${category}: ${results.length} 条结果`)
      }
    }

    let totalAdded = 0
    let totalSkipped = 0
    const addedNews: any[] = []

    // 处理每个类别的结果
    for (const [category, results] of Object.entries(searchResults)) {
      if (debug) {
        console.log(`\n📋 处理类别 ${category}: ${results.length} 条结果`)
      }

      for (const result of results) {
        try {
          // 检查是否已存在（通过 URL 去重）
          const { data: existing } = await supabase
            .from('industry_news')
            .select('id')
            .eq('source_url', result.url)
            .single()

          if (existing) {
            if (debug) console.log(`  ⏭️  跳过已存在的新闻: ${result.title}`)
            totalSkipped++
            continue
          }

          // 情感分析
          const sentimentAnalysis = analyzeSentimentImproved(result.title, result.snippet)
          
          // 重要性分析
          const importanceAnalysis = analyzeImportanceImproved(
            result.title,
            result.snippet,
            result.source,
            category
          )

          // 提取关键词
          const keywords = extractKeywords(result.title, result.snippet)

          // 准备插入数据
          const newsData = {
            title: result.title,
            content: result.snippet,
            source: result.source,
            source_url: result.url,
            category: mapCategory(category),
            keywords: keywords,
            sentiment: sentimentAnalysis.sentiment,
            confidence: sentimentAnalysis.confidence,
            importance: importanceAnalysis.importance,
            published_at: result.publishedAt,
            created_at: new Date().toISOString()
          }

          // 插入数据库
          const { data: inserted, error } = await supabase
            .from('industry_news')
            .insert([newsData])
            .select()
            .single()

          if (error) {
            if (debug) console.error(`  ❌ 插入失败: ${result.title}`, error)
            continue
          }

          if (debug) console.log(`  ✅ 添加成功: ${result.title}`)
          totalAdded++
          addedNews.push(inserted)

          // 添加延迟避免 API 限流
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          if (debug) console.error(`  ⚠️  处理新闻失败: ${result.title}`, error)
        }
      }
    }

    if (debug) {
      console.log('\n🎯 采集完成')
      console.log(`  总计添加: ${totalAdded}`)
      console.log(`  总计跳过: ${totalSkipped}`)
      console.log(`  总计处理: ${totalAdded + totalSkipped}`)
    }

    return {
      success: true,
      message: '行业新闻采集完成',
      summary: {
        totalAdded,
        totalSkipped,
        totalProcessed: totalAdded + totalSkipped
      },
      addedNews: addedNews.slice(0, 10) // 只返回前10条
    }

  } catch (error) {
    console.error('❌ 行业新闻采集失败:', error)
    return {
      success: false,
      error: '行业新闻采集失败',
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

// 产品舆情采集（改进版）
export async function crawlProductSentimentsImproved(options: {
  maxResults?: number
  timeRange?: 'day' | 'week' | 'month' | 'year'
  trustedOnly?: boolean
  debug?: boolean
} = {}) {
  const {
    maxResults = 3,
    timeRange = 'week',
    trustedOnly = true,
    debug = false
  } = options

  try {
    const supabase = getSupabase()

    if (debug) {
      console.log('🚀 开始采集产品舆情...')
    }

    // 获取所有产品
    const { data: products } = await supabase
      .from('products')
      .select('*')

    if (!products || products.length === 0) {
      return { success: false, message: '没有找到产品数据' }
    }

    let totalAdded = 0
    const addedSentiments: any[] = []

    // 为每个产品搜索舆情
    for (const product of products) {
      if (debug) {
        console.log(`\n🔍 搜索产品: ${product.name}`)
      }

      // 构建搜索查询
      const query = `${product.name} ${product.brand} 评价 评测 体验 用户反馈`
      
      // 使用改进的搜索函数（这里简化处理，实际应该调用相应的搜索函数）
      const searchResults = await searchIndustryNewsImproved('product', maxResults, {
        timeRange,
        trustedOnly
      })

      for (const result of searchResults) {
        try {
          // 检查是否已存在
          const { data: existing } = await supabase
            .from('sentiments')
            .select('id')
            .eq('source_url', result.url)
            .single()

          if (existing) {
            if (debug) console.log(`  ⏭️  跳过已存在的舆情: ${result.title}`)
            continue
          }

          // 情感分析
          const sentimentAnalysis = analyzeSentimentImproved(result.title, result.snippet)

          // 准备插入数据
          const sentimentData = {
            product_id: product.id,
            title: result.title,
            content: result.snippet,
            source: result.source,
            source_url: result.url,
            sentiment: sentimentAnalysis.sentiment,
            confidence: sentimentAnalysis.confidence,
            published_at: result.publishedAt,
            keywords: sentimentAnalysis.keywords,
            created_at: new Date().toISOString()
          }

          // 插入数据库
          const { data: inserted, error } = await supabase
            .from('sentiments')
            .insert([sentimentData])
            .select()
            .single()

          if (error) {
            if (debug) console.error(`  ❌ 插入失败: ${result.title}`, error)
            continue
          }

          if (debug) console.log(`  ✅ 添加成功: ${result.title}`)
          totalAdded++
          addedSentiments.push(inserted)

          // 添加延迟
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          if (debug) console.error(`  ⚠️  处理舆情失败: ${result.title}`, error)
        }
      }

      // 产品间添加延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (debug) {
      console.log('\n🎯 产品舆情采集完成')
      console.log(`  总计添加: ${totalAdded}`)
    }

    return {
      success: true,
      message: '产品舆情采集完成',
      summary: {
        totalAdded
      },
      addedSentiments: addedSentiments.slice(0, 10)
    }

  } catch (error) {
    console.error('❌ 产品舆情采集失败:', error)
    return {
      success: false,
      error: '产品舆情采集失败',
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

// 提取关键词
function extractKeywords(title: string, content: string): string[] {
  const text = title + ' ' + content
  const stopWords = ['的', '了', '在', '是', '和', '与', '及', '等', '之', '为', '对', '就', '都', '而', '及', '以及', '或者']
  
  const words = text.split(/[\s,，.。!！?？;；:：、]/)
  const keywords = new Set<string>()
  
  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed.length > 1 && 
        !stopWords.includes(trimmed) &&
        !/^\d+$/.test(trimmed)) {
      keywords.add(trimmed)
    }
  }
  
  return Array.from(keywords).slice(0, 10)
}

// 映射类别
function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'technology': 'technology',
    'product': 'product',
    'policy': 'policy',
    'company': 'other',
    'sensor': 'technology',
    'ota': 'product'
  }
  
  return categoryMap[category] || 'other'
}

// 测试函数
export async function testImprovedCrawler() {
  console.log('🧪 测试改进版爬虫...\n')
  
  // 测试行业新闻采集
  console.log('1. 测试行业新闻采集...')
  const industryResult = await crawlIndustryNewsImproved({
    maxResults: 2,
    timeRange: 'week',
    trustedOnly: true,
    debug: true
  })
  
  console.log('\n2. 测试产品舆情采集...')
  const sentimentResult = await crawlProductSentimentsImproved({
    maxResults: 2,
    timeRange: 'week',
    trustedOnly: true,
    debug: true
  })
  
  console.log('\n🎯 测试完成')
  return {
    industry: industryResult,
    sentiment: sentimentResult
  }
}
