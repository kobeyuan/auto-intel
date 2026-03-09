// 行业情报洞察V2 - 优化时效性、准确性、洞察深度

import { getSupabase } from './supabase'
import { askAI, AIModel } from './ai-client'

// 情报来源可信度评级
export const SOURCE_CREDIBILITY = {
  official: ['华为官网', '小鹏官网', '蔚来官网', '理想官网', '官方公告', '工信部'],
  tier1: ['36氪', '财新', '第一财经', '界面', '澎湃', '人民网', '新华网'],
  tier2: ['汽车之家', '易车', '懂车帝', '爱卡汽车', '太平洋汽车'],
  tier3: ['雪球', '知乎', '虎嗅', '雷锋网']
}

// 情报类型定义
export interface IntelligenceItemV2 {
  id: string
  title: string
  content: string
  summary: string
  source: string
  sourceCredibility: 'official' | 'tier1' | 'tier2' | 'tier3'
  sourceUrl: string
  publishTime: string
  category: 'sensor' | 'autonomous-driving' | 'cockpit' | 'policy' | 'market'
  subCategory?: string

  // AI分析字段
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number // 0-1
  importance: 'critical' | 'high' | 'medium' | 'low'
  importanceScore: number // 0-1

  // 洞察字段
  keyInsights: string[]
  industryImpact: string
  techInnovation?: string
  marketTrend?: string
  competitiveDynamics?: string

  // 关联信息
  relatedCompanies: string[]
  relatedTechnologies: string[]
  relatedProducts: string[]

  // 时间敏感性
  timeSensitivity: 'breaking' | 'trending' | 'normal' | 'archived'
  validUntil?: string

  // 元数据
  aiAnalyzed: boolean
  aiProvider?: string
  confidence: number
  createdAt: string
}

// 情报验证 - 交叉验证准确性
export async function verifyIntelligence(
  title: string,
  content: string,
  source: string
): Promise<{
  credibility: number
  verified: boolean
  issues: string[]
}> {
  const issues: string[] = []
  let credibility = 0.5

  // 1. 来源评级
  if (SOURCE_CREDIBILITY.official.some(s => source.includes(s))) {
    credibility += 0.3
  } else if (SOURCE_CREDIBILITY.tier1.some(s => source.includes(s))) {
    credibility += 0.2
  } else if (SOURCE_CREDIBILITY.tier2.some(s => source.includes(s))) {
    credibility += 0.1
  }

  // 2. 内容完整性检查
  if (content.length < 100) {
    issues.push('内容过短，可能不完整')
    credibility -= 0.1
  }

  // 3. 时效性检查
  if (title.includes('今日') || title.includes('刚刚') || title.includes('最新')) {
    credibility += 0.1
  }

  // 4.  sensationalism 检查
  const sensationalWords = ['震惊', '重磅', '炸裂', '颠覆', '彻底改变']
  if (sensationalWords.some(w => title.includes(w))) {
    issues.push('标题含有夸张词汇，需谨慎对待')
    credibility -= 0.1
  }

  return {
    credibility: Math.max(0, Math.min(1, credibility)),
    verified: credibility > 0.6,
    issues
  }
}

// 深度情报分析V2
export async function analyzeIntelligenceV2(
  title: string,
  content: string,
  category: string,
  provider?: AIModel
): Promise<Partial<IntelligenceItemV2> | null> {
  const prompt = `作为智能驾驶产业研究专家，请对以下情报进行深度分析：

【标题】${title}
【内容】${content}
【类别】${category}

请返回JSON格式分析结果：
{
  "summary": "核心摘要（25字内）",
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0.8,
  "importance": "critical/high/medium/low",
  "importanceScore": 0.85,
  "keyInsights": ["洞察1（聚焦技术/市场/竞争）", "洞察2", "洞察3"],
  "industryImpact": "产业影响（40字内，具体数据优先）",
  "techInnovation": "技术创新点（如有）",
  "marketTrend": "市场趋势判断（如有）",
  "competitiveDynamics": "竞争格局变化（如有）",
  "relatedCompanies": ["华为", "小鹏", "蔚来"],
  "relatedTechnologies": ["激光雷达", "端到端"],
  "relatedProducts": ["问界M9", "小鹏X9"],
  "timeSensitivity": "breaking/trending/normal/archived"
}

分析标准：
1. **critical重要性**：颠覆性技术、重大政策、行业洗牌事件
2. **high重要性**：头部企业战略调整、重要产品发布、核心技术突破
3. **时效性判断**：breaking=突发重大，trending=近期热点，normal=常规资讯
4. **洞察深度**：不只表面信息，要有产业链视角和竞争分析
5. **数据支撑**：如有具体数据（市场份额、性能指标等）优先提取`

  try {
    const response = await askAI(prompt, {
      provider,
      temperature: 0.2,
      maxTokens: 800
    })

    if (!response) return null

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        ...analysis,
        aiAnalyzed: true,
        aiProvider: provider || 'default',
        confidence: analysis.importanceScore || 0.5
      }
    }
    return null
  } catch (error) {
    console.error('情报分析V2失败:', error)
    return null
  }
}

// 生成行业周报
export async function generateWeeklyReport(
  weekStart?: string,
  provider?: AIModel
): Promise<{
  overview: string
  highlights: string[]
  byCategory: Record<string, string>
  predictions: string[]
} | null> {
  const supabase = getSupabase()

  try {
    const startDate = weekStart
      ? new Date(weekStart)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data: news } = await supabase
      .from('industry_intelligence')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('importance_score', { ascending: false })
      .limit(30)

    if (!news || news.length === 0) {
      return null
    }

    // 分类汇总
    const byCategory = news.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof news>)

    const newsBrief = news.slice(0, 10).map((n, i) =>
      `${i + 1}. [${n.importance?.toUpperCase()}] ${n.title} (${n.source})`
    ).join('\n')

    const prompt = `基于本周${news.length}条行业情报，生成周报：

情报列表：
${newsBrief}

请生成周报（JSON格式）：
{
  "overview": "本周综述（100字内，概括主要趋势）",
  "highlights": ["重要事件1（带数据）", "重要事件2", "重要事件3"],
  "byCategory": {
    "sensor": "传感器领域动态",
    "autonomous-driving": "智驾领域动态",
    "cockpit": "座舱领域动态",
    "policy": "政策法规动态"
  },
  "predictions": ["下周趋势预测1", "预测2", "预测3"]
}

要求：
1. 有数据支撑（市场份额、性能指标等）
2. 突出华为、小鹏、蔚来、理想等头部企业动态
3. 预测有理有据`

    const response = await askAI(prompt, {
      provider,
      temperature: 0.5,
      maxTokens: 1200
    })

    if (!response) return null

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null

  } catch (error) {
    console.error('生成周报失败:', error)
    return null
  }
}

// 热点追踪 - 识别突发重要情报
export async function trackHotTopics(
  hours: number = 24,
  provider?: AIModel
): Promise<{
  breaking: string[]
  trending: string[]
  analysis: string
}> {
  const supabase = getSupabase()

  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)

  const { data: recentNews } = await supabase
    .from('industry_intelligence')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false })

  if (!recentNews || recentNews.length === 0) {
    return { breaking: [], trending: [], analysis: '暂无新情报' }
  }

  // 统计热词
  const allTitles = recentNews.map(n => n.title).join(' ')

  const prompt = `分析以下情报标题，识别热点：

${recentNews.slice(0, 15).map(n => `- ${n.title}`).join('\n')}

请返回JSON：
{
  "breaking": ["突发重要事件1", "事件2"],
  "trending": ["热点趋势1", "趋势2", "趋势3"],
  "analysis": "热点分析（100字）"
}`

  try {
    const response = await askAI(prompt, { provider })
    if (!response) {
      return {
        breaking: [],
        trending: recentNews.slice(0, 5).map(n => n.title),
        analysis: '近期关注：' + recentNews[0]?.title
      }
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      breaking: [],
      trending: [],
      analysis: '分析失败'
    }
  } catch {
    return {
      breaking: [],
      trending: [],
      analysis: '分析失败'
    }
  }
}

// 竞品动态监控
export async function monitorCompetitors(
  companies: string[],
  days: number = 7,
  provider?: AIModel
): Promise<Record<string, {
  updates: string[]
  analysis: string
}>> {
  const supabase = getSupabase()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results: Record<string, { updates: string[]; analysis: string }> = {}

  for (const company of companies) {
    const { data } = await supabase
      .from('industry_intelligence')
      .select('*')
      .textSearch('title', company)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    if (data && data.length > 0) {
      const updates = data.map(d => d.title)

      const prompt = `分析${company}最近动态：
${updates.join('\n')}

简要分析其战略意图（50字内）`

      const analysis = await askAI(prompt, { provider }) || '暂无分析'

      results[company] = { updates, analysis }
    } else {
      results[company] = { updates: [], analysis: '近期无重大动态' }
    }
  }

  return results
}

// 导出所有功能
export const IntelligenceV2 = {
  verifyIntelligence,
  analyzeIntelligenceV2,
  generateWeeklyReport,
  trackHotTopics,
  monitorCompetitors,
  SOURCE_CREDIBILITY
}
