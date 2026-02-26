// Brave Search 集成 - 简化版

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || ''
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedAt?: string
}

// 搜索行业新闻（简化版）
export async function searchIndustryNews(
  category: string = 'technology',
  maxResults: number = 5
): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    let query = ''
    switch (category) {
      case 'technology':
        query = '自动驾驶 最新消息 site:36kr.com'
        break
      case 'product':
        query = '智能座舱 新车 发布 site:autohome.com.cn'
        break
      case 'policy':
        query = '智能网联汽车 政策 site:gov.cn'
        break
      case 'company':
        query = '特斯拉 华为 融资 合作 最新'
        break
      default:
        query = '智能汽车 新闻'
    }

    const url = `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${maxResults}`
    console.log(`搜索 [${category}]: ${query}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      console.error(`Brave API 错误: ${response.status}`)
      return []
    }

    const data: any = await response.json()
    const results = data.web?.results || []

    return results.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      publishedAt: new Date().toISOString()
    }))

  } catch (error) {
    console.error('搜索错误:', error)
    return []
  }
}

// 批量搜索所有类别
export async function searchAllIndustryNews(maxResults: number = 3): Promise<Record<string, SearchResult[]>> {
  const results: Record<string, SearchResult[]> = {}
  const categories = ['technology', 'product', 'policy', 'company']

  for (const category of categories) {
    console.log(`搜索类别: ${category}`)
    results[category] = await searchIndustryNews(category, maxResults)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return results
}

// 分析情感（简化版）
export function analyzeIndustrySentiment(title: string, content: string): 'positive' | 'neutral' | 'negative' {
  const positiveKeywords = ['突破', '创新', '合作', '融资', '发布', '增长']
  const negativeKeywords = ['事故', '问题', '故障', '召回', '亏损', '失败']

  const text = (title + ' ' + content).toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0

  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) positiveScore++
  })

  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) negativeScore++
  })

  if (positiveScore > negativeScore) return 'positive'
  if (negativeScore > positiveScore) return 'negative'
  return 'neutral'
}

// 分析重要性（简化版）
export function analyzeIndustryImportance(title: string, source: string, category: string): 'high' | 'medium' | 'low' {
  const highSources = ['工信部', '国家标准', '特斯拉', '华为']
  const highKeywords = ['标准', '法规', '政策', '安全', '事故']
  
  if (highSources.some(s => source.includes(s))) return 'high'
  if (highKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) return 'high'
  
  if (category === 'policy' || category === 'technology') return 'medium'
  return 'low'
}
