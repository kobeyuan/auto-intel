// 改进版搜索机制 - 确保数据详实、及时、来源可靠

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || ''
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedAt: string
  source: string
  domain: string
  language: string
}

// 可信赖的新闻来源（中文）
const TRUSTED_SOURCES = [
  '36kr.com',        // 36氪
  'autohome.com.cn', // 汽车之家
  'xueqiu.com',      // 雪球
  'caixin.com',      // 财新
  'yicai.com',       // 第一财经
  'jiemian.com',     // 界面新闻
  'thepaper.cn',     // 澎湃新闻
  'people.com.cn',   // 人民网
  'xinhuanet.com',   // 新华网
  'gov.cn',          // 政府网站
  'baidu.com',       // 百度
  'sina.com.cn',     // 新浪
  'sohu.com',        // 搜狐
  'qq.com',          // 腾讯
  '163.com',         // 网易
  'ifeng.com',       // 凤凰网
  'cs.com.cn',       // 中证网
  'cnstock.com',     // 上海证券报
  'stcn.com',        // 证券时报
  'p5w.net',         // 全景网
]

// 智能驾驶相关关键词
const AUTONOMOUS_DRIVING_KEYWORDS = [
  '自动驾驶',
  '智能驾驶',
  '辅助驾驶',
  'ADAS',
  'NOA',
  'NGP',
  'FSD',
  '城市NOA',
  '高速NOA',
  '激光雷达',
  '毫米波雷达',
  '摄像头',
  '芯片',
  '算法',
  '高精地图',
  'V2X',
  '车路协同',
  '智能座舱',
  '鸿蒙座舱',
  '智能汽车',
  '新能源汽车',
  '电动车',
  '特斯拉',
  '华为',
  '蔚来',
  '理想',
  '小鹏',
  '比亚迪',
  '小米汽车',
  '百度Apollo',
  '滴滴自动驾驶',
  '文远知行',
  '小马智行',
  'Momenta',
  '图森未来',
  '元戎启行',
  '智行者',
  '轻舟智航',
  '地平线',
  '黑芝麻',
  '寒武纪',
  '华为昇腾',
  '英伟达',
  '高通',
  'Mobileye',
  '安波福',
  '博世',
  '大陆集团',
  '法雷奥',
  '采埃孚',
]

// 智能座舱相关关键词
const SMART_COCKPIT_KEYWORDS = [
  '智能座舱',
  '车载系统',
  '车机系统',
  '中控屏',
  '仪表盘',
  'HUD',
  'AR-HUD',
  '语音助手',
  '语音交互',
  '手势控制',
  '人脸识别',
  '驾驶员监控',
  'DMS',
  'OMS',
  '车载娱乐',
  '车载应用',
  '车联网',
  'OTA',
  '远程升级',
  '鸿蒙座舱',
  '华为HarmonyOS',
  '小米澎湃OS',
  '蔚来NOMI',
  '理想理想同学',
  '小鹏小P',
  '比亚迪DiLink',
  '特斯拉车机',
  '苹果CarPlay',
  '安卓Auto',
  '百度CarLife',
  '腾讯TAI',
  '阿里斑马',
]

// 构建搜索查询
function buildSearchQuery(category: string, options: {
  timeRange?: 'day' | 'week' | 'month' | 'year'
  trustedOnly?: boolean
  language?: 'zh' | 'en'
} = {}): string {
  const { timeRange = 'week', trustedOnly = true, language = 'zh' } = options
  
  let keywords: string[] = []
  let domainFilters: string[] = []
  
  switch (category) {
    case 'technology':
      keywords = AUTONOMOUS_DRIVING_KEYWORDS.slice(0, 5)
      domainFilters = ['36kr.com', 'autohome.com.cn', 'xueqiu.com', 'caixin.com']
      break
    case 'product':
      keywords = SMART_COCKPIT_KEYWORDS.slice(0, 5)
      domainFilters = ['autohome.com.cn', 'xcar.com.cn', 'pcauto.com.cn', 'bitauto.com']
      break
    case 'policy':
      keywords = ['政策', '法规', '标准', '安全', '监管', '工信部', '国家标准']
      domainFilters = ['gov.cn', 'people.com.cn', 'xinhuanet.com', 'mofcom.gov.cn']
      break
    case 'company':
      keywords = ['融资', '投资', '合作', '并购', '上市', '财报', '业绩']
      domainFilters = ['36kr.com', 'xueqiu.com', 'caixin.com', 'yicai.com']
      break
    case 'sensor':
      keywords = ['激光雷达', '毫米波雷达', '摄像头', '超声波', '传感器', '芯片']
      domainFilters = ['36kr.com', 'autohome.com.cn', 'xueqiu.com', 'eechina.com']
      break
    case 'ota':
      keywords = ['OTA', '远程升级', '软件更新', '系统升级', '版本更新']
      domainFilters = ['autohome.com.cn', 'xcar.com.cn', 'pcauto.com.cn', 'bitauto.com']
      break
    default:
      keywords = ['智能汽车', '自动驾驶', '智能座舱']
      domainFilters = TRUSTED_SOURCES.slice(0, 10)
  }
  
  // 构建查询
  let query = keywords.join(' OR ')
  
  // 添加时间范围
  if (timeRange === 'day') {
    query += ' 今天'
  } else if (timeRange === 'week') {
    query += ' 本周'
  } else if (timeRange === 'month') {
    query += ' 本月'
  }
  
  // 添加来源限制
  if (trustedOnly && domainFilters.length > 0) {
    const siteFilters = domainFilters.map(domain => `site:${domain}`).join(' OR ')
    query += ` (${siteFilters})`
  }
  
  return query
}

// 提取域名
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

// 提取来源名称
function extractSource(domain: string): string {
  const sourceMap: Record<string, string> = {
    '36kr.com': '36氪',
    'autohome.com.cn': '汽车之家',
    'xueqiu.com': '雪球',
    'caixin.com': '财新',
    'yicai.com': '第一财经',
    'jiemian.com': '界面新闻',
    'thepaper.cn': '澎湃新闻',
    'people.com.cn': '人民网',
    'xinhuanet.com': '新华网',
    'gov.cn': '政府网站',
    'baidu.com': '百度',
    'sina.com.cn': '新浪',
    'sohu.com': '搜狐',
    'qq.com': '腾讯',
    '163.com': '网易',
    'ifeng.com': '凤凰网',
    'cs.com.cn': '中证网',
    'cnstock.com': '上海证券报',
    'stcn.com': '证券时报',
    'p5w.net': '全景网',
    'xcar.com.cn': '爱卡汽车',
    'pcauto.com.cn': '太平洋汽车',
    'bitauto.com': '易车',
    'eechina.com': '电子工程世界',
  }
  
  return sourceMap[domain] || domain
}

// 改进的搜索函数
export async function searchIndustryNewsImproved(
  category: string = 'technology',
  maxResults: number = 10,
  options: {
    timeRange?: 'day' | 'week' | 'month' | 'year'
    trustedOnly?: boolean
    language?: 'zh' | 'en'
  } = {}
): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.error('BRAVE_API_KEY not configured')
    return []
  }

  try {
    // 构建查询
    const query = buildSearchQuery(category, options)
    console.log(`🔍 搜索 [${category}]: ${query}`)
    
    // 构建 API 请求 URL
    const params = new URLSearchParams({
      q: query,
      count: maxResults.toString(),
      search_lang: options.language || 'zh',
      country: 'CN',
      freshness: options.timeRange === 'day' ? 'pd' : 
                 options.timeRange === 'week' ? 'pw' : 
                 options.timeRange === 'month' ? 'pm' : 'py'
    })
    
    const url = `${BRAVE_API_URL}?${params.toString()}`
    
    // 发送请求
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error(`❌ Brave API 错误: ${response.status}`, await response.text())
      return []
    }

    const data: any = await response.json()
    const results = data.web?.results || []
    
    console.log(`✅ 收到 ${results.length} 条结果`)
    
    // 处理结果
    const processedResults: SearchResult[] = []
    
    for (const result of results) {
      try {
        const domain = extractDomain(result.url)
        const source = extractSource(domain)
        
        // 检查是否来自可信来源
        if (options.trustedOnly && !TRUSTED_SOURCES.includes(domain)) {
          console.log(`⚠️  跳过非可信来源: ${domain}`)
          continue
        }
        
        // 提取发布时间（如果可用）
        let publishedAt = new Date().toISOString()
        if (result.meta_url?.published) {
          publishedAt = result.meta_url.published
        } else if (result.meta_url?.last_modified) {
          publishedAt = result.meta_url.last_modified
        }
        
        // 检查是否过时（超过30天）
        const publishDate = new Date(publishedAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff > 30) {
          console.log(`📅 跳过过时新闻 (${daysDiff}天前): ${result.title}`)
          continue
        }
        
        processedResults.push({
          title: result.title || '无标题',
          url: result.url,
          snippet: result.snippet || result.description || '',
          publishedAt,
          source,
          domain,
          language: 'zh'
        })
        
      } catch (error) {
        console.error('处理结果时出错:', error)
      }
    }
    
    console.log(`🎯 处理后保留 ${processedResults.length} 条有效结果`)
    return processedResults
    
  } catch (error) {
    console.error('搜索错误:', error)
    return []
  }
}

// 批量搜索所有类别
export async function searchAllIndustryNewsImproved(
  maxResults: number = 5,
  options: {
    timeRange?: 'day' | 'week' | 'month' | 'year'
    trustedOnly?: boolean
  } = {}
): Promise<Record<string, SearchResult[]>> {
  const results: Record<string, SearchResult[]> = {}
  const categories = ['technology', 'product', 'policy', 'company', 'sensor', 'ota']
  
  for (const category of categories) {
    console.log(`\n📊 搜索类别: ${category}`)
    results[category] = await searchIndustryNewsImproved(category, maxResults, options)
    
    // 添加延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  
  return results
}

// 改进的情感分析
export function analyzeSentimentImproved(title: string, content: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  keywords: string[]
} {
  const positiveKeywords = [
    '突破', '创新', '合作', '融资', '发布', '增长', '成功', '领先', '优秀',
    '出色', '升级', '优化', '提升', '进步', '获奖', '认可', '好评', '推荐',
    '热销', '畅销', '供不应求', '供不应求', '订单火爆', '销量增长', '营收增长',
    '利润增长', '市场份额', '行业第一', '全球领先', '技术领先', '创新成果',
    '重大突破', '里程碑', '历史新高', '创纪录', '超预期', '超出预期'
  ]
  
  const negativeKeywords = [
    '事故', '问题', '故障', '召回', '亏损', '失败', '下滑', '下降', '下跌',
    '裁员', '倒闭', '破产', '诉讼', '纠纷', '争议', '质疑', '批评', '投诉',
    '维权', '缺陷', '安全隐患', '安全风险', '质量问题', '技术问题', '延迟',
    '推迟', '取消', '暂停', '停止', '终止', '退出', '放弃', '裁员', '减薪',
    '亏损', '赤字', '债务', '负债', '违约', '违规', '违法', '处罚', '罚款',
    '调查', '审查', '监管', '警告', '风险', '危机', '困境', '挑战', '困难'
  ]
  
  const text = (title + ' ' + content).toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  const foundKeywords: string[] = []
  
  // 检查正面关键词
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      positiveScore++
      foundKeywords.push(keyword)
    }
  })
  
  // 检查负面关键词
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      negativeScore++
      foundKeywords.push(keyword)
    }
  })
  
  // 计算置信度
  const totalScore = positiveScore + negativeScore
  let confidence = 0.5 // 默认置信度
  
  if (totalScore > 0) {
    confidence = 0.5 + (Math.max(positiveScore, negativeScore) * 0.1)
    confidence = Math.min(confidence, 0.95)
  }
  
  // 判断情感
  if (positiveScore > negativeScore) {
    return {
      sentiment: 'positive',
      confidence,
      keywords: [...new Set(foundKeywords)].slice(0, 5)
    }
  } else if (negativeScore > positiveScore) {
    return {
      sentiment: 'negative',
      confidence,
      keywords: [...new Set(foundKeywords)].slice(0, 5)
    }
  } else {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      keywords: []
    }
  }
}

// 改进的重要性分析
export function analyzeImportanceImproved(
  title: string,
  content: string,
  source: string,
  category: string
): {
  importance: 'high' | 'medium' | 'low'
  reasons: string[]
} {
  const reasons: string[] = []
  let score = 0
  
  // 来源重要性
  const highImportanceSources = ['工信部', '国家标准', '政府', '官方', '人民网', '新华网', '央视']
  const mediumImportanceSources = ['36氪', '财新', '第一财经', '澎湃', '界面']
  
  if (highImportanceSources.some(s => source.includes(s))) {
    score += 3
    reasons.push('来源权威')
  } else if (mediumImportanceSources.some(s => source.includes(s))) {
    score += 2
    reasons.push('来源可靠')
  }
  
  // 关键词重要性
  const highImportanceKeywords = [
    '事故', '安全', '召回', '死亡', '重伤', '火灾', '爆炸',
    '政策', '法规', '标准', '禁令', '处罚', '罚款', '调查',
    '破产', '倒闭', '裁员', '亏损', '债务', '违约',
    '突破', '创新', '首发', '全球首款', '行业第一'
  ]
  
  const text = (title + ' ' + content).toLowerCase()
  highImportanceKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 2
      reasons.push(`包含重要关键词: ${keyword}`)
    }
  })
  
  // 类别重要性
  if (category === 'policy' || category === 'technology') {
    score += 1
    reasons.push('重要类别')
  }
  
  // 判断重要性级别
  if (score >= 4) {
    return { importance: 'high', reasons }
  } else if (score >= 2) {
    return { importance: 'medium', reasons }
  } else {
    return { importance: 'low', reasons: ['常规新闻'] }
  }
}
