import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { 
  searchAllIndustryNews, 
  analyzeIndustrySentiment, 
  analyzeIndustryImportance 
} from '@/lib/brave-search'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const maxResultsPerCategory = body.maxResults || 3
    const debugMode = body.debug || false
    const testMode = body.testMode || body.testRaw || body.action === 'rawTest'

    console.log('开始采集行业新闻...')
    console.log('Brave API Key 配置:', process.env.BRAVE_API_KEY ? '已配置' : '未配置')
    console.log('测试模式:', testMode)

    // 如果是测试模式，直接测试 Brave API
    if (testMode || body.testSearch) {
      const testQuery = body.query || '自动驾驶'
      const testCount = body.count || 3
      const testCategory = body.category || 'technology'
      
      console.log(`测试模式: 搜索 "${testQuery}"，数量 ${testCount}`)
      
      // 直接测试 Brave API
      const testUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(testQuery)}&count=${testCount}`
      
      const response = await fetch(testUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Brave API 错误:', response.status, errorText)
        return NextResponse.json({
          success: false,
          error: `Brave API 错误: ${response.status}`,
          details: errorText.substring(0, 200)
        })
      }
      
      const data = await response.json()
      const results = data.web?.results || []
      
      console.log(`Brave API 返回 ${results.length} 条结果`)
      
      // 如果是搜索函数测试，也测试 searchIndustryNews 函数
      if (body.testSearch) {
        const { searchIndustryNews } = await import('@/lib/brave-search')
        const searchResults = await searchIndustryNews(testCategory as any, testCount)
        
        return NextResponse.json({
          success: true,
          message: '搜索函数测试完成',
          category: testCategory,
          searchQuery: testQuery,
          braveApiResults: {
            count: results.length,
            sample: results.slice(0, 3).map((r: any) => r.title)
          },
          searchFunctionResults: {
            count: searchResults.length,
            rawResults: searchResults
          }
        })
      }
      
      // 返回原始数据用于调试
      return NextResponse.json({
        success: true,
        message: 'Brave API 测试完成',
        query: testQuery,
        rawData: data,
        resultsCount: results.length,
        results: results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet?.substring(0, 100)
        })),
        sampleTitles: results.map((r: any) => r.title)
      })
    }

    // 正常模式：搜索所有类别的行业新闻
    const industryResults = await searchAllIndustryNews(maxResultsPerCategory)
    
    if (debugMode) {
      console.log('详细搜索结果:')
      for (const [category, results] of Object.entries(industryResults)) {
        console.log(`  ${category}: ${results.length} 条结果`)
        results.forEach((r, i) => {
          console.log(`    ${i+1}. ${r.title}`)
          console.log(`       URL: ${r.url}`)
        })
      }
    } else {
      console.log('搜索结果:', Object.keys(industryResults).map(k => `${k}: ${industryResults[k].length}`))
    }

    let totalAdded = 0
    let totalSkipped = 0
    const addedNews: any[] = []

    // 处理每个类别的结果
    for (const [category, results] of Object.entries(industryResults)) {
      console.log(`处理类别 ${category}: ${results.length} 条结果`)

      for (const result of results) {
        try {
          // 检查是否已存在（基于 URL）
          const { data: existing } = await supabase
            .from('industry_news')
            .select('id')
            .eq('source_url', result.url)
            .single()

          if (existing) {
            console.log(`跳过已存在的新闻: ${result.title}`)
            totalSkipped++
            continue
          }

          // 提取来源（从 URL 中提取域名）
          let source = '未知'
          try {
            const urlObj = new URL(result.url)
            source = urlObj.hostname.replace('www.', '').split('.')[0]
            source = source.charAt(0).toUpperCase() + source.slice(1)
          } catch (e) {
            source = '其他'
          }

          // 分析情感和重要性
          const sentiment = analyzeIndustrySentiment(result.title, result.snippet)
          const importance = analyzeIndustryImportance(result.title, source, category)

          // 提取关键词（从标题中提取）
          const keywords = extractKeywords(result.title)

          // 准备新闻数据
          const newsData = {
            title: result.title,
            content: result.snippet,
            source: source,
            source_url: result.url,
            category: mapCategory(category),
            keywords: keywords,
            sentiment: sentiment,
            importance: importance,
            published_at: result.publishedAt || new Date().toISOString()
          }

          // 插入数据库
          const { data, error } = await supabase
            .from('industry_news')
            .insert([newsData])
            .select()
            .single()

          if (error) {
            console.error(`插入失败: ${result.title}`, error)
            continue
          }

          console.log(`添加成功: ${result.title}`)
          totalAdded++
          addedNews.push(data)

          // 添加延迟避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error) {
          console.error(`处理新闻失败: ${result.title}`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '行业新闻采集完成',
      summary: {
        totalAdded,
        totalSkipped,
        totalProcessed: totalAdded + totalSkipped
      },
      addedNews: addedNews.slice(0, 5) // 只返回前5条
    })

  } catch (error: any) {
    console.error('行业新闻采集API错误:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '行业新闻采集失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// 从标题中提取关键词
function extractKeywords(title: string): string[] {
  const commonWords = ['的', '了', '在', '是', '和', '与', '及', '等', '之', '为']
  const keywords: string[] = []
  
  // 按中文标点和空格分割
  const words = title.split(/[\s,，.。!！?？;；:：、]/)
  
  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed.length > 1 && !commonWords.includes(trimmed)) {
      keywords.push(trimmed)
    }
  }
  
  return keywords.slice(0, 5) // 最多返回5个关键词
}

// 映射类别
function mapCategory(category: string): 'technology' | 'product' | 'policy' | 'funding' | 'partnership' | 'other' {
  const categoryMap: Record<string, any> = {
    'technology': 'technology',
    'product': 'product',
    'policy': 'policy',
    'company': 'other' // 公司动态暂时归为other
  }
  
  return categoryMap[category] || 'other'
}

// GET 方法：测试和诊断
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const searchParams = request.nextUrl.searchParams
    const testType = searchParams.get('test')
    
    // 测试环境变量
    if (testType === 'env') {
      return NextResponse.json({
        success: true,
        braveApiKey: process.env.BRAVE_API_KEY ? '已配置' : '未配置',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置',
        nodeEnv: process.env.NODE_ENV
      })
    }
    
    // 测试 Brave API
    if (testType === 'brave') {
      try {
        const testQuery = '自动驾驶'
        const testUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(testQuery)}&count=2`
        
        const response = await fetch(testUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
          }
        })
        
        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: `Brave API 错误: ${response.status}`,
            status: response.status
          })
        }
        
        const data = await response.json()
        return NextResponse.json({
          success: true,
          message: 'Brave API 连接正常',
          resultsCount: data.web?.results?.length || 0,
          sampleResults: data.web?.results?.slice(0, 2) || []
        })
        
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: 'Brave API 测试失败',
          details: error.message
        })
      }
    }
    
    // 默认：检查数据库表是否存在
    const { data, error } = await supabase
      .from('industry_news')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'industry_news 表可能不存在',
        details: error.message,
        instructions: '请在 Supabase 中运行 industry-news-table.sql 创建表'
      })
    }

    return NextResponse.json({
      success: true,
      message: '行业新闻API正常',
      tableExists: true,
      endpoints: {
        'POST /api/crawl/industry': '触发行业新闻采集',
        'GET /api/industry-news': '获取行业新闻列表',
        'POST /api/industry-news': '手动添加行业新闻'
      },
      testEndpoints: {
        'GET /api/crawl/industry?test=env': '测试环境变量',
        'GET /api/crawl/industry?test=brave': '测试 Brave API'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'API检查失败',
      details: error.message
    }, { status: 500 })
  }
}