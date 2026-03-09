// OTA版本追踪系统 - 优化时效性、准确性
import { getSupabase } from './supabase'
import { askAI, AIModel } from './ai-client'

// OTA情报接口
export interface OTAIntelligence {
  id: string
  brand: string
  model: string
  version: string
  versionNumber: string
  updateType: 'major' | 'minor' | 'hotfix'
  releaseDate: string
  updateSize?: string
  updateContent: string
  keyFeatures: string[]
  userFeedback: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  competitiveAnalysis?: string
  technicalHighlights?: string[]
  marketImpact?: string
  source: string
  source_url: string
  created_at: string
}

// 主流车企OTA关键词
export const OTA_KEYWORDS = {
  // 造车新势力
  nio: ['蔚来OTA', '蔚来Banyan更新', '蔚来系统升级', 'NIO OS'],
  xiaopeng: ['小鹏OTA', '小鹏Xmart OS', '小鹏天玑系统', '小鹏升级'],
  li: ['理想OTA', '理想OTA 5.0', '理想OTA 6.0', '理想车机升级'],
  zeekr: ['极氪OTA', '极氪ZEEKR OS', '极氪OS 6.0', '极氪升级'],
  neta: ['哪吒OTA', '哪吒NETA OS'],
  leap: ['零跑OTA', '零跑Leapmotor OS'],

  // 传统车企新能源
  byd: ['比亚迪OTA', '比亚迪DiLink', '比亚迪升级'],
  avatr: ['阿维塔OTA', '阿维塔HarmonyOS'],
  huawei: ['问界OTA', '问界鸿蒙座舱', '智界OTA', '享界OTA'],
  geely: ['极氪OTA', '银河OTA', '领克OTA', 'Flyme Auto'],
  changan: ['深蓝OTA', '启源OTA'],
  gac: ['埃安OTA', '昊铂OTA'],

  // 特斯拉
  tesla: ['特斯拉OTA', 'Tesla OTA', 'FSD更新']
}

// 解析OTA版本号
export function parseVersion(version: string): {
  major: number
  minor: number
  patch: number
  isBeta: boolean
} {
  const clean = version.replace(/^v/i, '').replace(/[-_].*$/, '')
  const parts = clean.split('.').map(Number)
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    isBeta: /beta|alpha|rc|preview/i.test(version)
  }
}

// 判断版本更新类型
export function classifyUpdateType(
  oldVersion: string,
  newVersion: string
): 'major' | 'minor' | 'hotfix' {
  const old = parseVersion(oldVersion)
  const new_ = parseVersion(newVersion)

  if (new_.major > old.major) return 'major'
  if (new_.minor > old.minor) return 'minor'
  return 'hotfix'
}

// AI深度分析OTA更新
export async function analyzeOTAUpdate(
  title: string,
  content: string,
  brand: string,
  provider?: AIModel
): Promise<Partial<OTAIntelligence> | null> {
  const prompt = `作为智能汽车OTA分析师，请分析以下OTA更新：

【品牌】${brand}
【标题】${title}
【更新内容】${content}

请提取并返回以下信息（JSON格式）：
{
  "version": "版本号",
  "versionNumber": "版本数字（如 5.2.0）",
  "updateType": "major/minor/hotfix",
  "keyFeatures": ["核心功能1", "核心功能2", "核心功能3"],
  "userFeedback": "positive/neutral/negative",
  "importance": "high/medium/low",
  "competitiveAnalysis": "与竞品对比分析（50字）",
  "technicalHighlights": ["技术亮点1", "技术亮点2"],
  "marketImpact": "市场影响评估（50字）"
}

分析要求：
1. 识别更新类型：大版本（架构升级）、中版本（功能新增）、小版本（bug修复）
2. 提取核心功能点，最多3个
3. 判断用户反馈倾向
4. 评估对市场竞争的影响
5. 对比华为、小鹏、理想等竞品`;

  try {
    const response = await askAI(prompt, {
      provider,
      temperature: 0.3,
      systemPrompt: '你是智能汽车OTA分析专家，擅长版本分析和竞品对比。只返回JSON格式。'
    })

    if (!response) return null

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('OTA分析失败:', error)
    return null
  }
}

// 生成OTA竞争态势报告
export async function generateOTACompetitiveReport(
  days: number = 30,
  provider?: AIModel
): Promise<string | null> {
  const supabase = getSupabase()

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: otaUpdates } = await supabase
      .from('ota_updates')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (!otaUpdates || otaUpdates.length === 0) {
      return '暂无近期OTA更新数据'
    }

    // 按品牌分组统计
    const brandStats = otaUpdates.reduce((acc, item) => {
      acc[item.brand] = (acc[item.brand] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const updateText = otaUpdates.slice(0, 15).map((u, i) =>
      `${i + 1}. ${u.brand} ${u.model}: ${u.version} - ${u.keyFeatures?.[0] || '功能更新'}`
    ).join('\n')

    const prompt = `基于以下${days}天内各品牌的OTA更新数据，生成竞争态势分析报告：

各品牌更新次数：
${Object.entries(brandStats).map(([b, c]) => `${b}: ${c}次`).join('\n')}

OTA更新详情：
${updateText}

请生成OTA竞争态势报告，包括：
1. 各品牌OTA频率对比
2. 技术路线差异（自研vs合作）
3. 大版本功能创新对比
4. 用户体验优化方向
5. 未来OTA趋势预测

报告要求：
- 数据驱动，有具体案例
- 对比华为、小鹏、理想、蔚来、极氪等主流品牌
- 总字数600字以内`;

    const report = await askAI(prompt, {
      provider,
      temperature: 0.7,
      maxTokens: 1000
    })

    return report
  } catch (error) {
    console.error('生成OTA报告失败:', error)
    return null
  }
}

// 获取最新OTA情报
export async function getLatestOTAUpdates(
  brand?: string,
  limit: number = 10
): Promise<OTAIntelligence[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('ota_updates')
    .select('*')
    .order('releaseDate', { ascending: false })
    .limit(limit)

  if (brand) {
    query = query.eq('brand', brand)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取OTA更新失败:', error)
    return []
  }

  return data || []
}

// OTA版本对比分析
export async function compareOTAVersions(
  brand1: string,
  brand2: string,
  provider?: AIModel
): Promise<string | null> {
  const supabase = getSupabase()

  try {
    const [{ data: updates1 }, { data: updates2 }] = await Promise.all([
      supabase.from('ota_updates').select('*').eq('brand', brand1).order('releaseDate', { ascending: false }).limit(5),
      supabase.from('ota_updates').select('*').eq('brand', brand2).order('releaseDate', { ascending: false }).limit(5)
    ])

    const prompt = `对比分析${brand1}和${brand2}的OTA策略差异：

${brand1}最近更新：
${updates1?.map((u, i) => `${i + 1}. ${u.version}: ${u.keyFeatures?.join(', ')}`).join('\n')}

${brand2}最近更新：
${updates2?.map((u, i) => `${i + 1}. ${u.version}: ${u.keyFeatures?.join(', ')}`).join('\n')}

请分析：
1. 更新频率差异
2. 功能侧重点差异
3. 技术路线差异
4. 用户体验策略差异
5. 优劣势对比`;

    return await askAI(prompt, { provider, temperature: 0.5 })
  } catch (error) {
    console.error('版本对比失败:', error)
    return null
  }
}

// 采集并分析OTA情报
export async function crawlOTAIntelligence(options: {
  brands?: string[]
  maxResults?: number
  useAI?: boolean
  provider?: AIModel
  debug?: boolean
} = {}) {
  const {
    brands = Object.keys(OTA_KEYWORDS),
    maxResults = 5,
    useAI = true,
    provider,
    debug = false
  } = options

  const results = {
    total: 0,
    added: 0,
    analyzed: 0,
    errors: [] as string[]
  }

  // 这里应该调用搜索API获取OTA情报
  // 简化示例，实际实现需要根据搜索源调整

  if (debug) {
    console.log('🚗 OTA情报采集完成')
    console.log(`  品牌数: ${brands.length}`)
    console.log(`  AI分析: ${useAI ? '启用' : '禁用'}`)
  }

  return results
}
