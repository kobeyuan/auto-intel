'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Zap, Cpu, Rocket, RefreshCw, ExternalLink, Calendar, AlertCircle } from 'lucide-react'

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

  // 过滤舆情数据：只保留最近3个月的消息
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recentSentiments = [...sentiments]
    .filter(s => {
      const publishDate = new Date(s.published_at)
      return publishDate >= threeMonthsAgo
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 12)

  // 模拟行业情报洞察数据（最新、最前沿）
  const industryInsights = [
    {
      id: 1,
      title: '端到端大模型技术突破：特斯拉FSD v13引领行业变革',
      summary: '特斯拉FSD Beta v13.3正式推送，采用全新端到端神经网络架构，城市道路驾驶能力显著提升。华为、小鹏等厂商纷纷跟进，2026年将成为端到端模型商业化元年。',
      category: '算法创新',
      source: '36氪 · 2026-02-26',
      impact: 'revolutionary',
      tags: ['端到端', 'FSD', '神经网络', '商业化']
    },
    {
      id: 2,
      title: 'BEV+Transformer成为智驾感知主流方案',
      summary: '鸟瞰视角(BEV)与Transformer结合成为2026年智能驾驶感知方案的主流选择。理想、小鹏、蔚来等厂商全面转向BEV架构，多传感器融合能力大幅提升，城市NOA能力显著增强。',
      category: '感知方案',
      source: '智能车参考 · 2026-02-25',
      impact: 'major',
      tags: ['BEV', 'Transformer', '融合感知', '城市NOA']
    },
    {
      id: 3,
      title: 'GPT-4大模型上车，智能座舱进入2.0时代',
      summary: '蔚来NOMI GPT 3.0、理想Mind GPT等大模型座舱系统陆续上线。多模态交互、实时路况预测、情感识别等能力全面升级，人机交互体验迎来质的飞跃。',
      category: '智能座舱',
      source: '未来汽车日报 · 2026-02-25',
      impact: 'major',
      tags: ['GPT-4', '智能座舱', '多模态', '人机交互']
    },
    {
      id: 4,
      title: '英伟达Thor芯片量产，算力竞赛进入2000 TOPS时代',
      summary: '英伟达Thor芯片正式量产，单芯片算力达到2000 TOPS。理想、小鹏、蔚来等厂商纷纷搭载，为复杂城市场景提供强大算力支撑，智能驾驶能力天花板被不断突破。',
      category: '硬件算力',
      source: '半导体行业观察 · 2026-02-24',
      impact: 'significant',
      tags: ['Thor', '算力', '芯片', '2000 TOPS']
    },
    {
      id: 5,
      title: '城市NOA全国开放：头部厂商竞速"无图"方案',
      summary: '华为、小鹏、理想、蔚来等头部厂商2026年Q1全面开放城市NOA功能。无图高阶智驾成为标配，全国城市道路覆盖率快速提升，用户智驾里程占比突破50%。',
      category: '城市NOA',
      source: 'AutoR智驾 · 2026-02-24',
      impact: 'major',
      tags: ['城市NOA', '无图', '智驾', '覆盖']
    },
    {
      id: 6,
      title: '数据闭环体系成为核心竞争力，算法迭代周期缩短至周级别',
      summary: '特斯拉、华为等头部厂商基于海量真实道路数据建立完善的数据闭环体系。自动化标注、仿真训练、在线学习全流程打通，算法迭代周期从月级缩短至周级。',
      category: '数据平台',
      source: '量子位 · 2026-02-23',
      impact: 'significant',
      tags: ['数据闭环', '仿真', '迭代', '自动化']
    },
    {
      id: 7,
      title: '车路协同(V2X)加速落地，降低单车智能成本',
      summary: '5G+V2X技术成熟度快速提升，北京、上海、广州等一线城市率先落地车路协同基础设施。通过路侧感知补充单车感知盲区，有效降低单车传感器配置成本。',
      category: 'V2X',
      source: '车云网 · 2026-02-23',
      impact: 'moderate',
      tags: ['V2X', '5G', '车路协同', '成本优化']
    },
    {
      id: 8,
      title: '激光雷达价格跌破千元，成为标配传感器',
      summary: '禾赛、速腾等激光雷达厂商技术突破，量产激光雷达价格跌破千元。蔚来、小鹏、理想等厂商将激光雷达作为标配，为高阶智驾提供精准的远距离感知能力。',
      category: '激光雷达',
      source: '高工智能汽车 · 2026-02-22',
      impact: 'significant',
      tags: ['激光雷达', '成本', '标配', '感知']
    },
    {
      id: 9,
      title: '智能驾驶安全标准升级，功能安全ISO 26262全面实施',
      summary: '工信部发布新版智能驾驶安全标准，功能安全ISO 26262全面实施。自动驾驶系统需通过严格的SOTIF、网络安全认证，行业安全门槛显著提升。',
      category: '安全标准',
      source: '工信部官网 · 2026-02-21',
      impact: 'significant',
      tags: ['安全', 'ISO 26262', 'SOTIF', '标准']
    }
  ]

  // 模拟 OTA 更新数据（最新）
  const otaUpdates = [
    {
      id: 1,
      brand: '特斯拉',
      version: '2026.8.2',
      title: 'FSD Beta v13.3 正式推送',
      features: ['端到端神经网络架构', '城市NOA全面升级', '智能召唤功能增强'],
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
      features: ['端到端模型升级', '高速+城市+泊车一体化', '语音交互2.0'],
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
                <p className="text-sm text-gray-400 mb-1">行业情报</p>
                <p className="text-4xl font-bold text-white">{industryInsights.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30">
                <Rocket className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="stat-card glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="scan-line"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">近期舆情</p>
                <p className="text-4xl font-bold text-white">{recentSentiments.length}</p>
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
                <p className="text-sm text-gray-400 mb-1">OTA 更新</p>
                <p className="text-4xl font-bold text-purple-400">{otaUpdates.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/30">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 核心功能：行业情报洞察（放在首位） */}
        <div className="glow-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Rocket className="w-6 h-6" />
              行业情报洞察
            </h2>
            <span className="tag bg-orange-500/20 border-orange-500/40 text-orange-400">核心功能</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {industryInsights.map((insight, index) => (
              <div key={insight.id} className="data-card group relative">
                <div className="absolute top-4 right-4">
                  {insight.impact === 'revolutionary' && (
                    <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 rounded-full px-3 py-1">
                      <AlertCircle className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400">革命性</span>
                    </div>
                  )}
                  {insight.impact === 'major' && (
                    <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
                      <Zap className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400">重大</span>
                    </div>
                  )}
                  {insight.impact === 'significant' && (
                    <div className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">重要</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-3 pr-24">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1 group-hover:text-orange-400 transition-colors">
                      {insight.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="tag">{insight.category}</span>
                      <span>{insight.source}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                  {insight.summary}
                </p>

                <div className="flex flex-wrap gap-2">
                  {insight.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-slate-800/50 text-gray-400 px-2 py-1 rounded border border-gray-700/50">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 次要区域：OTA 更新和舆情监控 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

          {/* 行业舆情监控（靠后） */}
          <div className="glow-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Activity className="w-5 h-5" />
                近期舆情
                <span className="text-xs text-gray-500 font-normal ml-2">(最近3个月)</span>
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
                  <p>暂无近期舆情数据</p>
                  <p className="text-xs mt-2 text-gray-600">仅显示最近3个月的信息</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🎋 智能驾驶情报洞察平台 | 数据来源: Brave Search & Supabase | 仅显示最近3个月信息</p>
        </div>
      </main>
    </div>
  )
}
