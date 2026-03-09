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
  source_url: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  key_insights?: string[]
  related_tech?: string[]
  impact?: string
  created_at: string
}

export default function Home() {
  const [cockpitNews, setCockpitNews] = useState<IntelligenceItem[]>([])
  const [drivingNews, setDrivingNews] = useState<IntelligenceItem[]>([])
  const [sensorNews, setSensorNews] = useState<IntelligenceItem[]>([])
  const [otaNews, setOtaNews] = useState<IntelligenceItem[]>([])
  const [sentiments, setSentiments] = useState<IntelligenceItem[]>([])
  const [trendReport, setTrendReport] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [supabase, setSupabase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

      // 加载趋势报告（这里简化处理，实际应该从API获取）
      setTrendReport(`本周智能驾驶领域呈现以下趋势：

1. **激光雷达技术突破**：华为发布896线激光雷达，分辨率大幅提升，预计将在问界M9等车型搭载。

2. **城市NOA加速落地**：小鹏XNGP、华为ADS、理想AD Max等城市智驾方案持续迭代，竞争加剧。

3. **座舱大模型普及**：鸿蒙座舱、NOMI GPT、理想同学等语音助手向端侧大模型演进。

4. **芯片算力竞赛**：英伟达Thor、地平线J6、华为昇腾等下一代芯片即将量产。

建议关注：华为激光雷达量产进展、L3法规落地时间、端到端算法实际表现。`)

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

    return (
      <div className={`p-4 rounded-xl bg-gray-900/60 border ${importance.border} hover:border-opacity-80 transition-all group`}>
        {/* 头部：来源和重要性 */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400">{item.source}</span>
            <span className={`text-[10px] px-2 py-1 rounded ${importance.bg} ${importance.color}`}>
              重要度{importance.label}
            </span>
          </div>
          {getSentimentIcon(item.sentiment)}
        </div>

        {/* 标题 */}
        <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {item.title}
        </h3>

        {/* AI 摘要 */}
        {item.summary && (
          <div className="mb-2 p-2 bg-blue-900/20 rounded border border-blue-500/20">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-blue-400">AI 摘要</span>
            </div>
            <p className="text-xs text-gray-300">{item.summary}</p>
          </div>
        )}

        {/* 关键洞察 */}
        {item.key_insights && item.key_insights.length > 0 && (
          <div className="mb-2 space-y-1">
            {item.key_insights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <Target className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-400">{insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* 相关技术标签 */}
        {item.related_tech && item.related_tech.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.related_tech.slice(0, 3).map((tech, idx) => (
              <span key={idx} className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* 影响评估 */}
        {item.impact && (
          <div className="mb-2 text-xs text-gray-500 line-clamp-2">
            <span className="text-purple-400">影响：</span>{item.impact}
          </div>
        )}

        {/* 原文链接 */}
        <a href={item.source_url} target="_blank" rel="noreferrer"
           className={`text-xs ${colorClass} opacity-80 hover:opacity-100 flex items-center gap-1 mt-2`}>
          查看原文 <ExternalLink className="w-3 h-3" />
        </a>
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
            {/* 趋势报告区域 */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-gray-100">本周趋势洞察</h2>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">AI 生成</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-line text-gray-300 text-sm leading-relaxed">
                  {trendReport}
                </div>
              </div>
            </div>

            {/* 传感器专题 - 突出显示 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-rose-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Radar className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-gray-100">传感器前沿</h2>
                  <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded">高关注</span>
                </div>
                <span className="text-xs text-gray-500">{sensorNews.length} 条情报</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensorNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-rose-400" />
                ))}
              </div>
            </div>

            {/* 智能驾驶板块 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-cyan-500/30">
              <div className="flex items-center gap-3 mb-5">
                <Car className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-gray-100">智能驾驶 AD/ADAS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivingNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-cyan-400" />
                ))}
              </div>
            </div>

            {/* 智能座舱板块 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-5">
                <MonitorSmartphone className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-gray-100">智能座舱 Smart Cockpit</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cockpitNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-purple-400" />
                ))}
              </div>
            </div>

            {/* OTA 追踪 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-amber-500/30">
              <div className="flex items-center gap-3 mb-5">
                <CloudDownload className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-gray-100">OTA 升级追踪</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otaNews.map((item) => (
                  <IntelligenceCard key={item.id} item={item} colorClass="text-amber-400" />
                ))}
              </div>
            </div>

            {/* 舆情监控 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-100">全网舆情雷达</h2>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3"/> 正面</span>
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
