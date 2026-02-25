// Brave Search 集成 - 用于舆情采集

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || ''
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedAt?: string
}

export interface BraveSearchResult {
  web?: {
    results?: Array<{
      title: string
      url: string
      snippet: string
    }>
  }
}

// 搜索特定产品的舆情
export async function searchProductSentiments(productName: string, maxResults: number = 5): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    const query = `${productName} 评价 体验 测评`
    const url = `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${maxResults}&fresh=pw`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`)
    }

    const data: BraveSearchResult = await response.json()

    return data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      publishedAt: new Date().toISOString()
    })) || []

  } catch (error) {
    console.error('Brave search error:', error)
    return []
  }
}

// 搜索品牌相关舆情
export async function searchBrandSentiments(brand: string, maxResults: number = 5): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    const query = `${brand} 智能驾驶 评测 体验`
    const url = `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${maxResults}&fresh=pw`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`)
    }

    const data: BraveSearchResult = await response.json()

    return data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      publishedAt: new Date().toISOString()
    })) || []

  } catch (error) {
    console.error('Brave search error:', error)
    return []
  }
}

// 搜索最新舆情（过去一周）
export async function searchRecentSentiments(keyword: string, days: number = 7, maxResults: number = 10): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    const query = `${keyword} 新闻 评测 体验`
    const freshness = `pw` // past week
    const url = `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${maxResults}&fresh=${freshness}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`)
    }

    const data: BraveSearchResult = await response.json()

    return data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      publishedAt: new Date().toISOString()
    })) || []

  } catch (error) {
    console.error('Brave search error:', error)
    return []
  }
}

// 批量搜索多个产品
export async function batchSearchProducts(productNames: string[]): Promise<Record<string, SearchResult[]>> {
  const results: Record<string, SearchResult[]> = {}

  for (const name of productNames) {
    console.log(`Searching for: ${name}`)
    results[name] = await searchProductSentiments(name, 3)
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}
