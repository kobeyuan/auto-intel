'use client'

import { useState, useEffect } from 'react'
import { Brain, RefreshCw, ExternalLink, Car, MonitorSmartphone, Radar, CloudDownload, MessageSquareText, TrendingUp, TrendingDown, Minus, Sparkles, Target, Zap, Activity } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// 情报数据接口
interface IntelligenceItem {
  id: string
  title: string
  snippet: string
  summary?: string
  source: string
  link: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  key_insights?: string[]
  related_tech?: string[]
  impact?: string
  created_at: string
  publish_time?: string
  // AI 分析字段
  frontier_score?: number
  frontier_level?: string
  frontier_badge?: string
  ai_what_is_it?: string
  ai_impact?: string
  ai_focus_points?: string[]
  ai_analyzed?: boolean
  credibility_tier?: string
  quality_score?: number
  verified?: boolean
}

// AI 战略精要接口
interface StrategicSummary {
  id: string
  title: string
  content: string
  overview: string
  intelligence_count: number
  created_at: string
}

// 格式化相对时间（确保鲜度显示）
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return '刚刚'
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 获取鲜度样式（越新越突出）
function getFreshnessStyle(dateString: string): { text: string; color: string; badge: string } {
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffHours < 6) return { text: '🔥 最新', color: 'text-red-400', badge: 'bg-red-500/20 text-red-400' }
  if (diffHours < 24) return { text: '⚡ 今日', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' }
  if (diffHours < 72) return { text: '📌 近期', color: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' }
  return { text: '', color: 'text-gray-500', badge: 'bg-gray-800 text-gray-500' }
}

// 验证URL是否有效
function isValidUrl(url: string): boolean {
  if (!url || url === '') return false
  if (url.startsWith('https://example.com')) return false
  if (url.startsWith('http://example.com')) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 解析AI分析内容（从snippet中提取三段式结构）
function parseAIAnalysis(snippet: string): { what: string; impact: string; focus: string[] } | null {
  if (!snippet.includes('【AI分析】')) return null

  const parts = snippet.split(/\\n|\\r\\n/)
  let what = ''
  let impact = ''
  const focus: string[] = []

  let currentSection = ''

  for (const line of parts) {
    if (line.includes('这是什么？')) {
      currentSection = 'what'
      what = line.replace(/.*这是什么？/, '').trim()
    } else if (line.includes('有什么影响？')) {
      currentSection = 'impact'
      impact = line.replace(/.*有什么影响？/, '').trim()
    } else if (line.includes('关注要点：')) {
      currentSection = 'focus'
    } else if (currentSection === 'focus' && line.trim().match(/^\d+\./)) {
      focus.push(line.replace(/^\d+\./, '').trim())
    } else if (currentSection === 'what' && line.trim()) {
      what += ' ' + line.trim()
    } else if (currentSection === 'impact' && line.trim()) {
      impact += ' ' + line.trim()
    }
  }

  return what ? { what, impact, focus } : null
}

export default function Home() {
  const [cockpitNews, setCockpitNews] = useState<IntelligenceItem[]>([])
  const [drivingNews, setDrivingNews] = useState<IntelligenceItem[]>([])
  const [sensorNews, setSensorNews] = useState<IntelligenceItem[]>([])
  const [otaNews, setOtaNews] = useState<IntelligenceItem[]>([])
  const [sentiments, setSentiments] = useState<IntelligenceItem[]>([])
  const [strategicSummary, setStrategicSummary] = useState<StrategicSummary | null>(null)

  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [supabase, setSupabase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase 配置缺失，请检查环境变量')
        return
      }
      const client = createClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client)
      loadData(client)
    } catch (err) {
      setError('初始化失败')
    }
  }, [])

  const loadData = async (client?: any) => {
    try {
      setLoading(true)
      const dbClient = client || supabase
      if (!dbClient) return

      // 获取各类别数据，包含AI分析字段
      const queries = [
        { category: 'smart-cockpit', setter: setCockpitNews },
        { category: 'autonomous-driving', setter: setDrivingNews },
        { category: 'sensors', setter: setSensorNews },
        { category: 'ota', setter: setOtaNews },
        { category: 'sentiment', setter: setSentiments }
      ].map(({ category, setter }) =>
        dbClient
          .from('industry_intelligence')
          .select('*')
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(8)
          .then((res: any) => {
            setter(res.data || [])
            return res
          })
      )

      await Promise.all(queries)

      // 从最新的自动驾驶情报生成简易战略精要
      const latestIntel = drivingNews.slice(0, 3);
      if (latestIntel.length > 0) {
        const keyTopics = latestIntel.map(i => i.title?.replace(/\[.*?\]/g, '').trim()).filter(Boolean);
        const mockSummary = `今日智能驾驶领域重点关注：${keyTopics.join('；')}。建议持续跟踪端到端技术进展、法规政策变化及头部厂商竞争动态。`;
        setStrategicSummary({
          id: 'mock-1',
          title: '今日 AI 战略精要',
          content: mockSummary,
          overview: mockSummary.slice(0, 50),
          intelligence_count: latestIntel.length,
          created_at: new Date().toISOString()
        });
      }

      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (err) {
      console.error(err)
      setError('加载失败: 请检查数据库连接')
    } finally {
      setLoading(false)
    }
  }

  // 获取重要性颜色和图标
  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'high': return { color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', label: '高' }
      case 'medium': return { color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', label: '中' }
      default: return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600', label: '低' }
    }
  }

  // 获取情感图标
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'negative': return <TrendingDown className="w-4 h-4 text-rose-400" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  // 情报卡片组件
  const IntelligenceCard = ({ item, colorClass }: { item: IntelligenceItem; colorClass: string }) => {
    const importance = getImportanceStyle(item.importance)
    const freshness = getFreshnessStyle(item.publish_time || item.created_at)
    const timeText = formatRelativeTime(item.publish_time || item.created_at)
    const hasValidUrl = isValidUrl(item.link)
    const isExpanded = expandedCard === item.id

    // 获取可信度等级标签
    const getCredibilityLabel = (tier?: string) => {
      switch (tier) {
        case 'tier1': return { text: '官方权威', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        case 'tier2': return { text: '专业媒体', color: 'text-blue-400', bg: 'bg-blue-500/10' }
        default: return { text: '一般来源', color: 'text-gray-400', bg: 'bg-gray-500/10' }
      }
    }
    const cred = getCredibilityLabel(item.credibility_tier)

    return (
      <div className={`p-4 rounded-xl bg-gray-900/60 border ${importance.border} hover:border-opacity-80 transition-all group`}>
        {/* 头部：来源、重要性和鲜度 */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${cred.bg} ${cred.color}`}>{item.source}</span>
            <span className={`text-[10px] px-2 py-1 rounded ${importance.bg} ${importance.color}`}>
              重要度{importance.label}
            </span>
            {item.quality_score && item.quality_score > 80 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1">
                <Target className="w-3 h-3" />
                高可信
              </span>
            )}
            {freshness.text && (
              <span className={`text-[10px] px-2 py-1 rounded ${freshness.badge}`}>
                {freshness.text}
              </span>
            )}
            {/* AI 分析标识 */}
            {item.ai_analyzed && (
              <span className="text-[10px] px-2 py-1 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI 已分析
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item.verified && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center" title="官方已认证">
                <span className="text-[10px] text-white">✓</span>
              </div>
            )}
            {getSentimentIcon(item.sentiment)}
          </div>
        </div>

        {/* 时间戳（鲜度） */}
        <div className="flex items-center gap-1 mb-2">
          <span className={`text-[10px] ${freshness.color}`}>{timeText}</span>
        </div>

        {/* 标题 */}
        <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {item.title}
        </h3>

        {/* AI 情报综述 - 三个核心问题 */}
        {(() => {
          const aiAnalysis = parseAIAnalysis(item.snippet)
          if (!aiAnalysis) return null

          return (
            <div className="mb-3 space-y-2">
              {/* AI 已分析标识 */}
              <div className="flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-purple-400">AI 情报分析</span>
              </div>

              {/* 问题1：这是什么？ */}
              <div className="p-2 bg-blue-900/20 rounded border border-blue-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-semibold text-blue-400">❶ 这是什么？</span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{aiAnalysis.what}</p>
              </div>

              {/* 展开后显示更多 */}
              {isExpanded && (
                <>
                  {/* 问题2：对我们有什么影响？ */}
                  <div className="p-2 bg-amber-900/20 rounded border border-amber-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-amber-400">❷ 有什么影响？</span>
                    </div>
                    <p className="text-xs text-gray-300">{aiAnalysis.impact}</p>
                  </div>

                  {/* 问题3：建议关注点 */}
                  {aiAnalysis.focus.length > 0 && (
                    <div className="p-2 bg-emerald-900/20 rounded border border-emerald-500/20">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-emerald-400">❸ 关注要点</span>
                      </div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {aiAnalysis.focus.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* 展开/收起按钮 */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                {isExpanded ? '收起详情' : '查看 AI 完整分析'}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )
        })()}

        {/* 前沿程度标识 - 基于标题标签 */}
        {(item.title?.startsWith('🔥') || item.title?.startsWith('⚡') || item.title?.includes('[今日热点]')) && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              高战略价值
            </span>
          </div>
        )}

        {/* 原文链接 - 仅在有有效URL时显示 */}
        {hasValidUrl ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${colorClass} opacity-80 hover:opacity-100 flex items-center gap-1 mt-2 hover:underline`}
            title={item.link}
          >
            查看原文 <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-600 flex items-center gap-1 mt-2 cursor-not-allowed" title="暂无原文链接">
            原文链接暂不可用
          </span>
        )}
      </div>
    )
  }

  if (error) return <div className="text-white p-6">{error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider">Auto-Intel Pro</h1>
              <p className="text-xs text-cyan-400">AI 驱动 • 实时洞察 • 趋势预判</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">更新于 {lastUpdate}</span>
            <button onClick={() => loadData()} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-2 text-sm transition-all">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="py-20 text-center text-cyan-400 animate-pulse">
            <Activity className="w-8 h-8 mx-auto mb-4 animate-spin" />
            AI 分析引擎启动中...
          </div>
        ) : (
          <div className="space-y-8">
            {/* 今日 AI 战略精要 - 置顶看板 */}
            {strategicSummary && (
              <div className="bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-red-900/30 rounded-2xl p-6 border border-amber-500/40 shadow-lg shadow-amber-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-amber-100">今日 AI 战略精要</h2>
                      <p className="text-xs text-amber-400/80">基于过去24小时高价值情报生成</p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
                    {new Date(strategicSummary.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-amber-500/20">
                  <p className="text-amber-50 text-sm leading-relaxed whitespace-pre-line">
                    {strategicSummary.content}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-amber-500/60">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AI 实时研判
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    战略优先级: 高
                  </span>
                </div>
              </div>
            )}

            {/* 智能驾驶板块 - 优先级最高 */}
            <div className="bg-gradient-to-br from-gray-800/40 to-cyan-900/10 rounded-2xl p-6 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-gray-100">智能驾驶 AD/ADAS</h2>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">核心</span>
                </div>
                <span className="text-xs text-gray-500">{drivingNews.length} 条情报</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivingNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-cyan-400" />
                ))}
              </div>
            </div>

            {/* 智能座舱板块 */}
            <div className="bg-gradient-to-br from-gray-800/40 to-purple-900/10 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-gray-100">智能座舱 Smart Cockpit</h2>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">核心</span>
                </div>
                <span className="text-xs text-gray-500">{cockpitNews.length} 条情报</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cockpitNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-purple-400" />
                ))}
              </div>
            </div>

            {/* 传感器专题 - 放后面 */}
            <div className="bg-gradient-to-br from-gray-800/40 to-rose-900/10 rounded-2xl p-6 border border-rose-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Radar className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-gray-100">传感器前沿</h2>
                  <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded">上游</span>
                </div>
                <span className="text-xs text-gray-500">{sensorNews.length} 条情报</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensorNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-rose-400" />
                ))}
              </div>
            </div>

            {/* OTA 追踪 */}
            <div className="bg-gradient-to-br from-gray-800/40 to-amber-900/10 rounded-2xl p-6 border border-amber-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CloudDownload className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-gray-100">OTA 升级追踪</h2>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">动态</span>
                </div>
                <span className="text-xs text-gray-500">{otaNews.length} 条情报</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otaNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-amber-400" />
                ))}
              </div>
            </div>

            {/* 舆情监控 */}
            <div className="bg-gradient-to-br from-gray-800/40 to-emerald-900/10 rounded-2xl p-6 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-100">全网舆情雷达</h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">参考</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3"/> 正面</span>
                  <span className="flex items-center gap-1 text-gray-400"><Minus className="w-3 h-3"/> 中性</span>
                  <span className="flex items-center gap-1 text-rose-400"><TrendingDown className="w-3 h-3"/> 负面</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sentiments.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-emerald-400" />
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
