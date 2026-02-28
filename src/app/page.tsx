'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Zap, Cpu, Rocket, RefreshCw, ExternalLink, Calendar, AlertCircle, Radar, Monitor } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// 客户端 Supabase 实例
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function Home() {
  const [sentiments, setSentiments] = useState<any[]>([])
  const [industryNews, setIndustryNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    loadData()
    // 定时刷新已取消 - 用户手动点击"刷新数据"按钮刷新
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 直接从 Supabase 获取数据（不使用 API 路由）
      const [sentimentsResult, newsResult] = await Promise.all([
        supabase
          .from('sentiments')
          .select('*')
          .order('published_at', { ascending: false }),
        supabase
          .from('industry_news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(50)
      ])

      if (sentimentsResult.error) {
        console.error('Error loading sentiments:', sentimentsResult.error)
      }

      if (newsResult.error) {
        console.error('Error loading news:', newsResult.error)
      }

      setSentiments(sentimentsResult.data || [])
      setIndustryNews(newsResult.data || [])
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  

    const triggerCrawl = async () => {
    try {
      setCrawling(true)
      console.log('🚀 触发数据采集...')
      
      // 调用爬虫 API
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'all',
          debug: false
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ 数据采集成功:', result.message)
        
        // 等待 2 秒让数据入库
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 重新加载数据
        await loadData()
        
        // 显示成功消息
        alert('数据采集成功！已更新最新情报。')
      } else {
        console.error('❌ 数据采集失败:', result.error)
        alert('数据采集失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      console.error('❌ 数据采集异常:', error)
      alert('数据采集异常，请检查控制台')
    } finally {
      setCrawling(false)
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technology':
        return <Cpu className="w-4 h-4" />
      case 'product':
        return <Monitor className="w-4 h-4" />
      case 'policy':
        return <AlertCircle className="w-4 h-4" />
      case 'funding':
        return <TrendingUp className="w-4 h-4" />
      case 'partnership':
        return <Activity className="w-4 h-4" />
      default:
        return <Rocket className="w-4 h-4" />
    }
  }

  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      'technology': '技术',
      'product': '产品',
      'policy': '政策',
      'funding': '融资',
      'partnership': '合作',
      'other': '其他'
    }
    return map[category] || '其他'
  }

  const getCategoryClass = (category: string) => {
    const map: Record<string, string> = {
      'technology': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      'product': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      'policy': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      'funding': 'bg-green-500/10 border-green-500/30 text-green-400',
      'partnership': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      'other': 'bg-gray-500/10 border-gray-500/30 text-gray-400'
    }
    return map[category] || map['other']
  }

  const getImportanceClass = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/20 border-red-500/40 text-red-400'
      case 'medium':
        return 'bg-orange-500/20 border-orange-500/40 text-orange-400'
      default:
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400'
    }
  }

  const getImportanceText = (importance: string) => {
    switch (importance) {
      case 'high':
        return '重要'
      case 'medium':
        return '中等'
      default:
        return '一般'
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

  // 行业情报：使用数据库真实数据
  const industryInsights = industryNews
    .filter(item => {
      const publishDate = new Date(item.published_at)
      return publishDate >= threeMonthsAgo
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 14)

  // 传感器技术：从行业新闻中提取 technology 相关的
  const sensorTechs = industryNews
    .filter(item => {
      const publishDate = new Date(item.published_at)
      const isRecent = publishDate >= threeMonthsAgo
      const title = item.title?.toLowerCase() || ''
      const content = (item.content || item.keywords?.join(' ') || '').toLowerCase()
      const isSensor = title.includes('雷达') || title.includes('传感器') ||
                      title.includes('激光') || title.includes('毫米波') ||
                      title.includes('摄像头') || title.includes('芯片') ||
                      content.includes('雷达') || content.includes('传感器')
      return isRecent && isSensor
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 10)

  // OTA更新：从行业新闻中提取
  const otaUpdates = industryNews
    .filter(item => {
      const publishDate = new Date(item.published_at)
      const isRecent = publishDate >= threeMonthsAgo
      const title = item.title?.toLowerCase() || ''
      const content = (item.content || '').toLowerCase()
      const isOTA = title.includes('ota') || title.includes('更新') ||
                     title.includes('升级') || title.includes('推送') ||
                     content.includes('ota') || content.includes('更新')
      return isRecent && isOTA
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 7)
    .map(item => ({
      id: item.id,
      brand: extractBrandFromTitle(item.title),
      version: extractVersionFromTitle(item.title),
      title: item.title,
      category: getCategoryName(item.category),
      features: item.keywords?.slice(0, 4) || [],
      date: new Date(item.published_at).toLocaleDateString('zh-CN'),
      impact: item.importance || 'medium',
      source: item.source,
      link: item.source_url
    }))

  // 辅助函数
  function extractBrandFromTitle(title: string): string {
    const brands = ['特斯拉', '华为', '蔚来', '理想', '小鹏', '比亚迪', '小米']
    for (const brand of brands) {
      if (title.includes(brand)) return brand
    }
    return '未标注'
  }

  function extractVersionFromTitle(title: string): string {
    const match = title.match(/(\d+\.\d+\.?\d*)/g)
    return match ? match[0] : '未标注'
  }

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
                <h1 className="text-2xl font-bold gradient-text">规划部智能化情报洞察平台</h1>
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
                onClick={triggerCrawl}
                className="neon-button flex items-center gap-2"
              >
                {crawling ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  采集中...
                </div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  刷新数据
                </>
              )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 relative">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <p className="text-sm text-gray-400 mb-1">传感器</p>
                <p className="text-4xl font-bold text-white">{sensorTechs.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                <Radar className="w-8 h-8 text-cyan-400" />
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
                <p className="text-sm text-gray-400 mb-1">OTA 更新</p>
                <p className="text-4xl font-bold text-purple-400">{otaUpdates.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/30">
                <Zap className="w-8 h-8 text-purple-400" />
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
        </div>

        {/* 核心功能：行业情报洞察（从数据库读取真实数据） */}
        <div className="glow-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Rocket className="w-6 h-6" />
              行业情报洞察
            </h2>
            <div className="flex items-center gap-2">
              <span className="tag bg-orange-500/20 border-orange-500/40 text-orange-400">核心功能</span>
              <span className="text-xs text-gray-500">真实数据来源: {industryInsights.length > 0 ? industryInsights[0].source : '数据库'}</span>
            </div>
          </div>

          {industryInsights.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500">暂无行业情报数据</p>
              <p className="text-xs text-gray-600 mt-2">等待数据采集</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {industryInsights.map((insight, index) => (
                <div key={insight.id} className="data-card group relative">
                  <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-1 rounded-full px-3 py-1 ${getImportanceClass(insight.importance)}`}>
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">{getImportanceText(insight.importance)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-3 pr-24">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-gradient-to-br from-orange-500/30 to-amber-500/30 text-orange-400`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-orange-400 transition-colors">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className={`tag flex items-center gap-1 ${getCategoryClass(insight.category)}`}>
                          {getCategoryIcon(insight.category)}
                          {getCategoryName(insight.category)}
                        </span>
                        <span>{insight.source}</span>
                        <span>·</span>
                        <span>{new Date(insight.published_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                    {insight.content || '暂无内容摘要'}
                  </p>

                  {insight.keywords && insight.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {insight.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                        <span key={idx} className="text-xs bg-slate-800/50 text-gray-400 px-2 py-1 rounded border border-gray-700/50">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {insight.source_url && insight.source_url && !insight.source_url.includes('example') && (
                    <a
                      href={insight.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      查看原文
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 传感器技术板块（从真实数据中提取） */}
        <div className="glow-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Radar className="w-6 h-6" />
              传感器技术动态
            </h2>
            <div className="flex items-center gap-2">
              <span className="tag bg-cyan-500/20 border-cyan-500/40 text-cyan-400">核心感知</span>
              <span className="text-xs text-gray-500">从行业新闻提取</span>
            </div>
          </div>

          {sensorTechs.length === 0 ? (
            <div className="text-center py-12">
              <Radar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500">暂无传感器技术数据</p>
              <p className="text-xs text-gray-600 mt-2">等待相关新闻采集</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sensorTechs.map((sensor, index) => (
                <div key={sensor.id} className="data-card group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                        {sensor.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className={`tag flex items-center gap-1 ${getCategoryClass(sensor.category)}`}>
                          {getCategoryIcon(sensor.category)}
                          {getCategoryName(sensor.category)}
                        </span>
                        <span>{sensor.source}</span>
                        <span>·</span>
                        <span>{new Date(sensor.published_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                    {sensor.content || '暂无内容摘要'}
                  </p>

                  {sensor.keywords && sensor.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {sensor.keywords.slice(0, 4).map((keyword: string, idx: number) => (
                        <span key={idx} className="text-xs bg-slate-800/50 text-cyan-300/70 px-2 py-1 rounded border border-cyan-500/20">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{sensor.source}</span>
                    {sensor.source_url && sensor.source_url && !sensor.source_url.includes('example') && (
                      <a
                        href={sensor.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        查看原文
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <div className="flex items-center gap-2">
                <span className="tag">本周更新</span>
                <span className="text-xs text-gray-500">从行业新闻提取</span>
              </div>
            </div>

            {otaUpdates.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-gray-500">暂无OTA更新数据</p>
                <p className="text-xs text-gray-600 mt-2">等待相关新闻采集</p>
              </div>
            ) : (
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
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {update.features.map((feature: string, idx: number) => (
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
                      <div className="flex items-center gap-2">
                        <span className={update.impact === 'high' ? 'text-orange-400' : 'text-gray-500'}>
                          {getImportanceText(update.impact)}
                        </span>
                        <span>·</span>
                        <span className="text-gray-600">{update.source}</span>
                      </div>
                    </div>
                    {update.link && update.link && !update.link.includes('example') && (
                      <div className="mt-2">
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          查看详情
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 行业舆情监控（真实数据） */}
          <div className="glow-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Activity className="w-5 h-5" />
                近期舆情
                <span className="text-xs text-gray-500 font-normal ml-2">(最近3个月)</span>
              </h2>
              <span className="tag">实时更新</span>
            </div>

            {recentSentiments.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-gray-500">暂无近期舆情数据</p>
                <p className="text-xs text-gray-600 mt-2">仅显示最近3个月的信息</p>
              </div>
            ) : (
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
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sentiment.published_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      {sentiment.source_url && sentiment.source_url && !sentiment.source_url.includes('example') && (
                        <div className="mt-2">
                          <a
                            href={sentiment.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            查看原文
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🎋 智能驾驶情报洞察平台 | 真实数据来源: Supabase数据库 | 仅显示最近3个月信息</p>
        </div>
      </main>
    </div>
  )
}
