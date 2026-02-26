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

// ==================== 行业新闻搜索功能 ====================

// 行业新闻关键词配置
export const INDUSTRY_KEYWORDS = {
  // 技术类
  technology: [
    '自动驾驶技术',
    '智能驾驶算法',
    '激光雷达',
    '毫米波雷达',
    '摄像头感知',
    '高精地图',
    '车路协同',
    'V2X',
    'ADAS',
    'L2+自动驾驶',
    'L4自动驾驶',
    '端到端神经网络'
  ],
  // 产品类
  product: [
    '智能座舱',
    '车载OS',
    '座舱芯片',
    '人机交互',
    '多屏联动',
    '智能语音',
    'AR-HUD',
    '电子后视镜'
  ],
  // 政策类
  policy: [
    '智能网联汽车标准',
    '数据安全',
    '自动驾驶法规',
    '道路测试',
    '工信部政策',
    '国家标准'
  ],
  // 企业动态
  company: [
    '特斯拉',
    '华为智能汽车',
    '百度Apollo',
    '小鹏汽车',
    '蔚来汽车',
    '理想汽车',
    '小米汽车',
    '比亚迪',
    '宁德时代'
  ]
}

// 行业新闻来源配置
export const INDUSTRY_SOURCES = [
  '36氪', '虎嗅', '钛媒体', '品玩', '爱范儿',
  '汽车之家', '懂车帝', '易车网', '车云网',
  '盖世汽车', '第一电动网', '电动汽车观察家'
]

// 搜索行业新闻（优化版）
export async function searchIndustryNews(
  category: keyof typeof INDUSTRY_KEYWORDS = 'technology',
  maxResults: number = 10,
  freshness: string = 'pm' // past month 改为过去一个月，增加结果
): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    // 从该类别中选择关键词（不再随机，使用固定关键词提高命中率）
    const keywords = INDUSTRY_KEYWORDS[category]
    // 使用更通用的关键词
    const keyword = category === 'technology' ? '自动驾驶' :
                   category === 'product' ? '智能座舱' :
                   category === 'policy' ? '智能网联汽车政策' :
                   '智能汽车'
    
    // 放宽来源限制，不限制特定网站
    const query = `${keyword} 新闻 最新`
    
    const url = `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=${maxResults}&fresh=${freshness}`

    console.log(`搜索行业新闻 [${category}]: ${query}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      console.error(`Brave API 错误: ${response.status}`, await response.text())
      return []
    }

    const data: BraveSearchResult = await response.json()

    const results = data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      publishedAt: new Date().toISOString()
    })) || []

    console.log(`找到 ${results.length} 条行业新闻 [${category}]`)
    
    // 过滤掉明显不相关的结果
    const filteredResults = results.filter(result => {
      const title = result.title.toLowerCase()
      const snippet = result.snippet.toLowerCase()
      
      // 检查是否包含相关关键词
      const relevantKeywords = ['自动驾驶', '智能驾驶', '智能座舱', '车联网', '汽车', '特斯拉', '华为', '比亚迪', '小鹏', '蔚来']
      return relevantKeywords.some(keyword => 
        title.includes(keyword) || snippet.includes(keyword)
      )
    })
    
    console.log(`过滤后剩余 ${filteredResults.length} 条相关新闻`)
    return filteredResults

  } catch (error) {
    console.error('行业新闻搜索错误:', error)
    return []
  }
}

// 批量搜索所有类别的行业新闻
export async function searchAllIndustryNews(maxResultsPerCategory: number = 5): Promise<Record<string, SearchResult[]>> {
  const results: Record<string, SearchResult[]> = {}
  const categories: (keyof typeof INDUSTRY_KEYWORDS)[] = ['technology', 'product', 'policy', 'company']

  for (const category of categories) {
    console.log(`搜索行业新闻类别: ${category}`)
    results[category] = await searchIndustryNews(category, maxResultsPerCategory)
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return results
}

// 分析行业新闻情感（简单关键词匹配）
export function analyzeIndustrySentiment(title: string, content: string): 'positive' | 'neutral' | 'negative' {
  const positiveKeywords = [
    '突破', '创新', '领先', '成功', '合作', '融资', '发布', '升级',
    '提升', '增长', '利好', '优势', '先进', '优秀', '卓越'
  ]
  const negativeKeywords = [
    '事故', '问题', '故障', '召回', '下跌', '亏损', '失败', '争议',
    '风险', '挑战', '困难', '落后', '缺陷', '投诉', '调查'
  ]

  const text = (title + ' ' + content).toLowerCase()

  let positiveScore = 0
  let negativeScore = 0

  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) positiveScore++
  })

  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) negativeScore++
  })

  if (positiveScore > negativeScore) return 'positive'
  if (negativeScore > positiveScore) return 'negative'
  return 'neutral'
}

// 分析行业新闻重要性
export function analyzeIndustryImportance(
  title: string,
  source: string,
  category: string
): 'high' | 'medium' | 'low' {
  // 高重要性来源
  const highImportanceSources = ['工信部', '国家标准', '特斯拉', '华为']
  // 高重要性关键词
  const highImportanceKeywords = ['标准', '法规', '政策', '安全', '事故', '突破']
  // 高重要性类别
  const highImportanceCategories = ['policy', 'technology']

  const text = title.toLowerCase()

  // 检查来源
  if (highImportanceSources.some(sourceName => source.includes(sourceName))) {
    return 'high'
  }

  // 检查关键词
  if (highImportanceKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
    return 'high'
  }

  // 检查类别
  if (highImportanceCategories.includes(category)) {
    return 'medium'
  }

  return 'low'
}
