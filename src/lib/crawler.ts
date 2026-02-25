import { getSupabase } from './supabase'
import { searchProductSentiments, searchBrandSentiments, batchSearchProducts } from './brave-search'

// 基于 Brave Search 的舆情采集
export async function crawlSentiments() {
  try {
    const supabase = getSupabase()

    // 获取所有产品
    const { data: products } = await supabase
      .from('products')
      .select('*')

    if (!products || products.length === 0) {
      return { success: false, message: '没有找到产品数据' }
    }

    let newSentimentsCount = 0

    // 批量搜索产品舆情
    const productNames = products.map((p: any) => p.name)
    const searchResults = await batchSearchProducts(productNames)

    // 处理搜索结果
    for (const [productName, results] of Object.entries(searchResults)) {
      const product = products.find((p: any) => p.name === productName)

      if (!product) continue

      for (const result of results) {
        // 检查是否已存在（通过 URL 去重）
        const { data: existing } = await supabase
          .from('sentiments')
          .select('id')
          .eq('source_url', result.url)
          .single()

        if (existing) continue

        // 情感分析
        const analysis = await analyzeSentiment(result.snippet)

        // 插入舆情
        const { error } = await supabase
          .from('sentiments')
          .insert({
            product_id: product.id,
            title: result.title,
            content: result.snippet,
            source: 'Brave Search',
            source_url: result.url,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            published_at: result.publishedAt || new Date().toISOString(),
            keywords: analysis.keywords
          })

        if (!error) {
          newSentimentsCount++
        }
      }
    }

    return {
      success: true,
      count: newSentimentsCount,
      message: `成功采集 ${newSentimentsCount} 条新舆情`
    }

  } catch (error) {
    console.error('Crawl error:', error)
    return { success: false, error: '数据采集失败' }
  }
}

// 情感分析（使用 LLM）
export async function analyzeSentiment(text: string) {
  // 简单的关键词分析
  const lowerText = text.toLowerCase()

  const positiveWords = ['优秀', '出色', '流畅', '稳定', '强大', '体验', '好用', '满意', '推荐', '赞', '棒']
  const negativeWords = ['问题', '差', '糟糕', '故障', '卡顿', '慢', '失望', '不满', '吐槽', '吐槽', '差评']
  const techWords = ['自动驾驶', '智能座舱', '鸿蒙', 'FSD', 'NOA', '语音', '导航', '生态', '交互', '体验']

  let positiveScore = 0
  let negativeScore = 0
  const keywords: string[] = []

  positiveWords.forEach(word => {
    if (text.includes(word)) {
      positiveScore++
      keywords.push(word)
    }
  })

  negativeWords.forEach(word => {
    if (text.includes(word)) {
      negativeScore++
      keywords.push(word)
    }
  })

  techWords.forEach(word => {
    if (text.includes(word)) {
      keywords.push(word)
    }
  })

  // 简单的情感判断
  let sentiment: 'positive' | 'neutral' | 'negative'
  let confidence: number

  if (positiveScore > negativeScore) {
    sentiment = 'positive'
    confidence = 0.7 + (positiveScore * 0.05)
  } else if (negativeScore > positiveScore) {
    sentiment = 'negative'
    confidence = 0.7 + (negativeScore * 0.05)
  } else {
    sentiment = 'neutral'
    confidence = 0.65
  }

  // 限制置信度范围
  confidence = Math.min(confidence, 0.95)

  // 去重关键词
  const uniqueKeywords = [...new Set(keywords)]

  return {
    sentiment,
    confidence,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords.slice(0, 5) : ['分析']
  }
}

// 爬取指定产品
export async function crawlProductSentiment(productId: string) {
  try {
    const supabase = getSupabase()

    // 获取产品信息
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) {
      return { success: false, message: '产品不存在' }
    }

    // 搜索舆情
    const results = await searchProductSentiments(product.name, 10)

    let newSentimentsCount = 0

    for (const result of results) {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('sentiments')
        .select('id')
        .eq('source_url', result.url)
        .single()

      if (existing) continue

      // 情感分析
      const analysis = await analyzeSentiment(result.snippet)

      // 插入舆情
      const { error } = await supabase
        .from('sentiments')
        .insert({
          product_id: product.id,
          title: result.title,
          content: result.snippet,
          source: 'Brave Search',
          source_url: result.url,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          published_at: result.publishedAt || new Date().toISOString(),
          keywords: analysis.keywords
        })

      if (!error) {
        newSentimentsCount++
      }
    }

    return {
      success: true,
      count: newSentimentsCount,
      message: `为 ${product.name} 采集了 ${newSentimentsCount} 条新舆情`
    }

  } catch (error) {
    console.error('Crawl product error:', error)
    return { success: false, error: '数据采集失败' }
  }
}
