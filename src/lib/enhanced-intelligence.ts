// 增强版情报收集与分析系统
// 集成 AI 深度分析、趋势判断、智能总结

import { getSupabase } from './supabase'
import { searchIndustryNewsImproved, SearchResult } from './improved-search'
import { askAI, analyzeNewsWithAI, AIModel } from './ai-client'

// 扩展关键词库 - 添加更细致的传感器和技术关键词
export const ENHANCED_KEYWORDS = {
  // 激光雷达细分
  lidar: [
    '激光雷达', 'LiDAR', '固态激光雷达', '机械激光雷达', 'MEMS激光雷达',
    '华为激光雷达', '华为896线', '华为192线', '华为D3', '华为问界',
    '禾赛科技', '禾赛AT', '禾赛FT', '禾赛ET', '速腾聚创', '速腾M1', '速腾E1',
    '大疆 Livox', '览沃', '览沃Horiz', '览沃Tele',
    'Innovusion', '图达通', 'Falcon', '猎鹰',
    '一径科技', '北醒光子', '镭神智能', '万集科技',
    '补盲激光雷达', '4D激光雷达', 'FMCW激光雷达',
    '1550nm激光雷达', '905nm激光雷达', 'VCSEL', 'SPAD', 'SiPM'
  ],
  // 毫米波雷达细分
  radar: [
    '毫米波雷达', '4D毫米波雷达', '成像雷达', '4D成像雷达',
    '博世雷达', '大陆ARS', '采埃孚雷达', '安波福雷达',
    '华为4D雷达', '森思泰克', '楚航科技', '华域汽车',
    '77GHz雷达', '79GHz雷达', '前向雷达', '角雷达', '舱内雷达',
    'Arbe', 'Mobileye雷达', '德州仪器TI', '恩智浦NXP'
  ],
  // 摄像头与视觉
  camera: [
    '车载摄像头', '前视摄像头', '环视摄像头', '周视摄像头',
    '800万像素摄像头', '1200万像素', '高清摄像头',
    'Mobileye EyeQ', 'EyeQ5', 'EyeQ6', 'EyeQ7',
    '地平线征程', '征程3', '征程5', '征程6', 'J3', 'J5', 'J6',
    '黑芝麻华山', '华山A1000', '华山A2000',
    '英伟达Orin', 'Orin X', 'Orin N', 'DRIVE Thor',
    '高通骁龙Ride', 'Snapdragon Ride',
    '华为昇腾', '昇腾310', '昇腾610', '昇腾910',
    '海思芯片', '安霸CV', 'CV2', 'CV3'
  ],
  // 智驾方案
  adSolution: [
    '城市NOA', '高速NOA', '记忆泊车', 'AVP', 'HNP', 'ANP',
    '华为ADS', 'ADS 2.0', 'ADS 3.0', '华为智驾', '乾崑智驾',
    '小鹏XNGP', '小鹏XBrain', '理想AD Max', '理想AD Pro',
    '蔚来NOP', '蔚来NAD', 'Banyan', 'NT2.0',
    '特斯拉FSD', 'FSD v12', '端到端',
    '百度Apollo', '萝卜快跑', '极越PPA',
    '小米智驾', '澎湃智驾',
    '比亚迪天神之眼', '腾势Pilot', '仰望智驾',
    '长城NOH', '毫末智行', '智行宝宝',
    '轻舟智航', 'Momenta', '商汤绝影', '大疆车载', '卓驭'
  ],
  // 座舱交互
  cockpit: [
    '鸿蒙座舱', 'HarmonyOS车机', '鸿蒙智行',
    '小米澎湃OS', '澎湃座舱',
    '蔚来NOMI', 'NOMI GPT',
    '理想同学', 'Mind GPT', '星环GPT',
    '小鹏小P', 'XGPT',
    '极越SIMO', '文心一言座舱',
    '通义千问座舱', '讯飞星火座舱',
    'AR-HUD', 'XR-HUD', '华为光场屏',
    '车载大模型', '座舱大模型', '端侧大模型'
  ],
  // 政策与标准
  policy: [
    'L3自动驾驶', 'L4自动驾驶', 'L2++', '组合驾驶辅助',
    '自动驾驶法规', '智能网联汽车准入',
    '工信部公告', '新能源汽车免购置税',
    'C-NCAP', '中保研', 'C-IASI', '主动安全测试',
    'ISO 26262', '功能安全', '预期功能安全', 'SOTIF'
  ]
}

// 情报分析结果接口
export interface IntelligenceAnalysis {
  summary: string           // AI 生成的摘要
  keyInsights: string[]     // 关键洞察点
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  trends: string[]          // 趋势判断
  relatedTech: string[]     // 相关技术
  impact: string            // 影响评估
}

// 使用 AI 深度分析情报
export async function analyzeIntelligenceWithAI(
  title: string,
  content: string,
  category: string,
  provider?: AIModel
): Promise<IntelligenceAnalysis | null> {
  const prompt = `作为智能驾驶行业分析师，请对以下情报进行深度分析：

【标题】${title}
【内容】${content}
【类别】${category}

请提供以下分析（返回 JSON 格式）：
{
  "summary": "一句话核心摘要（30字以内）",
  "keyInsights": ["关键洞察1", "关键洞察2", "关键洞察3"],
  "sentiment": "positive|neutral|negative",
  "importance": "high|medium|low",
  "trends": ["趋势判断1", "趋势判断2"],
  "relatedTech": ["相关技术1", "相关技术2"],
  "impact": "影响评估（50字以内）"
}

分析要求：
1. 聚焦技术创新、市场竞争、产业影响
2. 识别华为、小鹏、蔚来、理想等厂商动态
3. 关注激光雷达、芯片、算法等核心技术
4. 判断对智能驾驶行业的影响程度`

  try {
    const response = await askAI(prompt, {
      provider,
      temperature: 0.3,
      systemPrompt: '你是智能驾驶行业资深分析师，擅长技术分析和产业洞察。只返回JSON格式，不要其他解释。'
    })

    if (!response) return null

    // 提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return analysis as IntelligenceAnalysis
    }
    return null
  } catch (error) {
    console.error('AI 分析失败:', error)
    return null
  }
}

// 生成趋势总结报告
export async function generateTrendReport(
  category: string,
  days: number = 7,
  provider?: AIModel
): Promise<string | null> {
  const supabase = getSupabase()

  try {
    // 获取近期数据
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: news } = await supabase
      .from('industry_intelligence')
      .select('*')
      .eq('category', category)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (!news || news.length === 0) {
      return '暂无足够数据生成趋势报告'
    }

    // 构建分析文本
    const newsText = news.map((n, i) =>
      `${i + 1}. ${n.title}${n.summary ? ` - ${n.summary}` : ''}`
    ).join('\n')

    const prompt = `基于以下${category}领域最近${days}天的情报，生成趋势分析报告：

${newsText}

请生成一份趋势报告，包括：
1. 整体趋势判断（技术演进/市场竞争/政策变化）
2. 主要厂商动态（华为、小鹏、蔚来、理想等）
3. 关键技术进展（激光雷达、芯片、算法等）
4. 下周关注点预测

报告要求：
- 条理清晰，分点论述
- 有数据支撑，具体案例
- 预测有理有据
- 总字数500字以内`

    const report = await askAI(prompt, {
      provider,
      temperature: 0.7,
      systemPrompt: '你是智能驾驶行业研究专家，擅长趋势分析和产业研究。'
    })

    return report
  } catch (error) {
    console.error('生成趋势报告失败:', error)
    return null
  }
}

// 批量采集并深度分析
export async function crawlAndAnalyzeIntelligence(options: {
  category?: string
  maxResults?: number
  timeRange?: 'day' | 'week' | 'month'
  useAI?: boolean
  provider?: AIModel
  debug?: boolean
} = {}) {
  const {
    category = 'all',
    maxResults = 10,
    timeRange = 'day',
    useAI = true,
    provider,
    debug = false
  } = options

  const supabase = getSupabase()
  const results = {
    total: 0,
    added: 0,
    analyzed: 0,
    errors: [] as string[]
  }

  try {
    if (debug) console.log('🚀 开始增强版情报采集...')

    // 1. 搜索情报
    const categories = category === 'all'
      ? ['technology', 'sensor', 'product', 'policy']
      : [category]

    for (const cat of categories) {
      if (debug) console.log(`\n📊 采集类别: ${cat}`)

      const searchResults = await searchIndustryNewsImproved(cat, maxResults, {
        timeRange,
        trustedOnly: true
      })

      results.total += searchResults.length

      // 2. 处理每条情报
      for (const item of searchResults) {
        try {
          // 检查是否已存在
          const { data: existing } = await supabase
            .from('industry_intelligence')
            .select('id')
            .eq('source_url', item.url)
            .single()

          if (existing) {
            if (debug) console.log(`  ⏭️  已存在: ${item.title}`)
            continue
          }

          // 3. AI 深度分析
          let analysis: IntelligenceAnalysis | null = null
          if (useAI) {
            analysis = await analyzeIntelligenceWithAI(
              item.title,
              item.snippet,
              cat,
              provider
            )
            results.analyzed++
          }

          // 4. 准备数据
          const intelligenceData = {
            title: item.title,
            snippet: item.snippet,
            source: item.source,
            source_url: item.url,
            category: cat,
            published_at: item.publishedAt,
            // AI 分析结果
            summary: analysis?.summary || null,
            key_insights: analysis?.keyInsights || [],
            sentiment: analysis?.sentiment || 'neutral',
            importance: analysis?.importance || 'medium',
            trends: analysis?.trends || [],
            related_tech: analysis?.relatedTech || [],
            impact: analysis?.impact || null,
            // 元数据
            created_at: new Date().toISOString(),
            ai_analyzed: useAI,
            ai_provider: provider || null
          }

          // 5. 保存到数据库
          const { error } = await supabase
            .from('industry_intelligence')
            .insert([intelligenceData])

          if (error) {
            results.errors.push(`插入失败: ${item.title}`)
            continue
          }

          results.added++
          if (debug) console.log(`  ✅ 已添加: ${item.title}`)

          // 避免限流
          await new Promise(r => setTimeout(r, 500))

        } catch (err) {
          results.errors.push(`处理失败: ${item.title}`)
        }
      }
    }

    if (debug) {
      console.log('\n🎯 采集完成')
      console.log(`  总计: ${results.total}`)
      console.log(`  新增: ${results.added}`)
      console.log(`  AI分析: ${results.analyzed}`)
      if (results.errors.length > 0) {
        console.log(`  错误: ${results.errors.length}`)
      }
    }

    return results

  } catch (error) {
    console.error('情报采集失败:', error)
    return results
  }
}

// 导出关键词用于搜索扩展
export function getEnhancedKeywords(): string[] {
  return Object.values(ENHANCED_KEYWORDS).flat()
}
