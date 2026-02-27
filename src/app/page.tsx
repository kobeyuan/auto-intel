'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Zap, Cpu, Rocket, RefreshCw, ExternalLink, Calendar } from 'lucide-react'

export default function Home() {
  const [sentiments, setSentiments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    loadData()
    // 每5分钟自动刷新
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 加载舆情数据
      const sentimentsResponse = await fetch('/api/sentiments')
      const sentimentsResult = await sentimentsResponse.json()
      setSentiments(sentimentsResult.sentiments || [])

      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />
      default:
        return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'sentiment-positive'
      case 'negative':
        return 'sentiment-negative'
      default:
        return 'sentiment-neutral'
    }
  }

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '正面'
      case 'negative':
        return '负面'
      default:
        return '中性'
    }
  }

  // 舆情数据
  const recentSentiments = [...sentiments]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 10)

  // 模拟 OTA 更新数据
  const otaUpdates = [
    {
      id: 1,
      brand: '特斯拉',
      version: '2026.8.2',
      title: 'FSD Beta v13.3 正式推送',
      features: ['城市NOA全面升级', '智能召唤功能增强', '自动泊车优化'],
      date: '2026-02-26',
      impact: 'high'
    },
    {
      id: 2,
      brand: '蔚来',
      version: 'Banyan 3.2.0',
      title: 'NOMI GPT 3.0 上线',
      features: ['多模态交互升级', '实时路况预测', '情感识别增强'],
      date: '2026-02-25',
      impact: 'medium'
    },
    {
      id: 3,
      brand: '理想',
      version: 'OTA 6.1',
      title: '城市NOA全国推送',
      features: ['全国城市道路支持', '通勤路线记忆', '智能避障升级'],
      date: '2026-02-24',
      impact: 'high'
    },
    {
      id: 4,
      brand: '小鹏',
      version: 'Xmart OS 5.2',
      title: 'XNGP全场景覆盖',
      features: ['高速+城市+泊车一体化', '代客泊车升级', '语音交互2.0'],
      date: '2026-02-23',
      impact: 'high'
    },
    {
      id: 5,
      brand: '华为',
      version: 'ADS 3.1',
      title: '智驾系统重大更新',
      features: ['无图高阶智驾', 'AVP代客泊车增强', '全向防碰撞系统'],
      date: '2026-02-22',
      impact: 'high'
    }
  ]

  // 模拟技术前沿动态
  const techTrends = [
    {
      id: 1,
      title: '端到端大模型技术突破',
      category: '算法',
      summary: '特斯拉、华为等头部厂商纷纷采用端到端神经网络架构，智能驾驶感知与决策一体化水平显著提升。',
      impact: 'revolutionary',
      tags: ['AI', '深度学习', '神经网络']
    },
    {
      id: 2,
      title: 'BEV+Transformer 成为主流',
      category: '感知',
      summary: '鸟瞰视角(BEV)与Transformer结合成为智能驾驶感知方案的主流选择，多传感器融合能力大幅增强。',
      impact: 'major',
      tags: ['BEV', 'Transformer', '融合感知']
    },
    {
      id: 3,
      title: '大模型上车，座舱智能化升级',
      category: '座舱',
      summary: 'GPT-4等大模型技术逐步落地智能座舱，语音助手、多模态交互体验全面升级。',
      impact: 'major',
      tags: ['LLM', 'NLP', '人机交互']
    },
    {
      id: 4,
      title: '算力竞赛持续升级',
      category: '硬件',
      summary: '英伟达Orin、Thor等芯片算力持续突破，单芯片算力超过2000 TOPS，为复杂场景提供强大算力支撑。',
      impact: 'significant',
      tags: ['芯片', 'Orin', 'Thor']
    },
    {
      id: 5,
      title: '数据闭环驱动快速迭代',
      category: '平台',
      summary: '基于海量真实道路数据的数据闭环体系成为核心竞争力，算法迭代周期缩短至周级别。',
      impact: 'significant',
      tags: ['数据闭环', '仿真', '迭代']
    },
    {
      id: 6,
      title: '车路协同加速落地',
      category: 'V2X',
      summary: '5G+V2X技术成熟度快速提升，车路协同在特定场景率先落地，降低单车智能成本。',
      impact: 'moderate',
      tags: ['V2X', '5G', '车路协同']
    }
  ]

  // 统计数据
  const positiveCount = sentiments.filter(s => s.sentiment === 'positive').length
  const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length
  const neutralCount = sentiments.filter(s => s.sentiment === 'neutral').length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 scifi-grid opacity-30"></div>
        <div className="loading-ring"></div>
        <p className="mt-6 text-blue-400 text-lg font-medium">系统初始化中...</p>
        <p className="mt-2 text-gray-500 text-sm">正在加载智能驾驶情报数据</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* 动态网格背景 */}
      <div className="fixed inset-0 scifi-grid opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-blue-500/20">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="w-10 h-10 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">智能驾驶情报洞察平台</h1>
                <p className="text-xs text-gray-500">Auto Intelligence Platform v2.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>更新于: {lastUpdate}</span>
                </div>
              )}
              <button
                onClick={loadData}
                className="neon-button flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 relative">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="scan-line"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">舆情总数</p>
                <p className="text-4xl font-bold text-white">{sentiments.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="stat-card glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="scan-line"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">正面舆情</p>
                <p className="text-4xl font-bold text-green-400">{positiveCount}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="stat-card glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="scan-line"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">负面舆情</p>
                <p className="text-4xl font-bold text-red-400">{negativeCount}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center border border-red-500/30">
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>

          <div className="stat-card glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="scan-line"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">OTA 更新</p>
                <p className="text-4xl font-bold text-purple-400">{otaUpdates.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/30">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 行业舆情监控 */}
          <div className="glow-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Activity className="w-5 h-5" />
                行业舆情监控
              </h2>
              <span className="tag">实时更新</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {recentSentiments.map((sentiment, index) => (
                <div key={sentiment.id} className="data-card relative">
                  <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="ml-10">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-white flex-1 pr-2 line-clamp-2">
                        {sentiment.title}
                      </h3>
                      <span className={`tag ${getSentimentClass(sentiment.sentiment)} flex-shrink-0`}>
                        {getSentimentIcon(sentiment.sentiment)}
                        <span className="ml-1">{getSentimentText(sentiment.sentiment)}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {sentiment.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-2">
                        <span className="tag">{sentiment.source}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sentiment.published_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentSentiments.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>暂无舆情数据</p>
                </div>
              )}
            </div>
          </div>

          {/* OTA 更新动态 */}
          <div className="glow-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Zap className="w-5 h-5" />
                OTA 更新动态
              </h2>
              <span className="tag">本周更新</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {otaUpdates.map((update) => (
                <div key={update.id} className="data-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{update.brand}</h3>
                        <span className="tag">{update.version}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{update.title}</p>
                    </div>
                    {update.impact === 'high' && (
                      <div className="glow-dot"></div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {update.features.map((feature, idx) => (
                      <span key={idx} className="text-xs bg-slate-800 text-gray-400 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {update.date}
                    </span>
                    <span className={update.impact === 'high' ? 'text-orange-400' : 'text-gray-500'}>
                      {update.impact === 'high' ? '重要更新' : '常规更新'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 行业技术前沿 */}
        <div className="glow-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              行业技术前沿
            </h2>
            <span className="tag">技术洞察</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techTrends.map((trend) => (
              <div key={trend.id} className="data-card group">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`tag ${
                    trend.impact === 'revolutionary' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' :
                    trend.impact === 'major' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                    trend.impact === 'significant' ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' :
                    'bg-gray-500/20 border-gray-500/40 text-gray-400'
                  }`}>
                    {trend.impact === 'revolutionary' ? '革命性' :
                     trend.impact === 'major' ? '重大' :
                     trend.impact === 'significant' ? '重要' : '一般'}
                  </span>
                  <span className="text-xs text-gray-500">{trend.category}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {trend.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                  {trend.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {trend.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-slate-800/50 text-gray-500 px-2 py-1 rounded border border-gray-700/50">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🎋 智能驾驶情报洞察平台 | 数据来源: Brave Search & Supabase</p>
        </div>
      </main>
    </div>
  )
}
