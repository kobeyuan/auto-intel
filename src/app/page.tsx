'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Zap, Cpu, Rocket, RefreshCw, ExternalLink, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function Home() {
  const [sentiments, setSentiments] = useState<any[]>([])
  const [industryNews, setIndustryNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [crawling, setCrawling] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [supabase, setSupabase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 初始化 Supabase 客户端
  useEffect(() => {
    console.log('初始化 Supabase 客户端...')
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase 环境变量未配置')
        setError('Supabase 配置缺失')
        return
      }
      
      const client = createClient(supabaseUrl, supabaseAnonKey)
      console.log('Supabase 客户端初始化成功')
      setSupabase(client)
      loadData(client)
    } catch (err) {
      console.error('Supabase 初始化失败:', err)
      setError('初始化失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }, [])

  // 加载数据
  const loadData = async (client?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const dbClient = client || supabase
      if (!dbClient) {
        console.error('Supabase 客户端未初始化')
        setError('数据库连接未就绪')
        return
      }

      console.log('加载数据...')
      const [sentimentsResult, newsResult] = await Promise.all([
        dbClient
          .from('sentiments')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(20),
        dbClient
          .from('industry_news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(20)
      ])

      if (sentimentsResult.error) {
        console.error('加载舆情数据错误:', sentimentsResult.error)
      }

      if (newsResult.error) {
        console.error('加载行业新闻错误:', newsResult.error)
      }

      setSentiments(sentimentsResult.data || [])
      setIndustryNews(newsResult.data || [])
      setLastUpdate(new Date().toLocaleString('zh-CN'))
      console.log(`数据加载完成: ${sentimentsResult.data?.length || 0} 条舆情, ${newsResult.data?.length || 0} 条新闻`)
      
    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  // 触发数据采集
  const triggerCrawl = async () => {
    try {
      setCrawling(true)
      setError(null)
      
      if (!supabase) {
        console.error('Supabase 客户端未初始化')
        setError('数据库连接未就绪')
        setCrawling(false)
        return
      }
      
      console.log('触发数据采集...')
      
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
        console.log('数据采集成功:', result.message)
        
        // 等待 2 秒让数据入库
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 重新加载数据
        await loadData()
        
        alert('数据采集成功！已更新最新情报。')
      } else {
        console.error('数据采集失败:', result.error)
        setError('采集失败: ' + (result.error || '未知错误'))
      }
    } catch (err) {
      console.error('数据采集异常:', err)
      setError('采集异常: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCrawling(false)
    }
  }

  // 计算统计数据
  const positiveSentiments = sentiments.filter(s => s.sentiment === 'positive')
  const negativeSentiments = sentiments.filter(s => s.sentiment === 'negative')

  // 显示错误信息
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="text-xl font-bold">应用程序错误</h2>
                <p className="text-gray-400">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 显示加载状态
  if (loading && sentiments.length === 0 && industryNews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">规划部智能化情报洞察平台</h1>
                <p className="text-sm text-gray-400">实时监控智能驾驶与智能座舱行业动态</p>
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
                disabled={crawling || !supabase}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {crawling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    采集中...
                  </>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">行业情报</p>
                <p className="text-3xl font-bold">{industryNews.length}</p>
              </div>
              <Rocket className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">舆情总数</p>
                <p className="text-3xl font-bold">{sentiments.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">正面舆情</p>
                <p className="text-3xl font-bold text-green-400">{positiveSentiments.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">负面舆情</p>
                <p className="text-3xl font-bold text-red-400">{negativeSentiments.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 行业情报 */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold">行业情报</h2>
              </div>
              <span className="text-sm text-gray-400">{industryNews.length} 条</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {industryNews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据，点击刷新按钮采集</p>
              ) : (
                industryNews.slice(0, 10).map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.sentiment === 'positive' ? 'bg-green-900/30 text-green-400' :
                        item.sentiment === 'negative' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {item.sentiment === 'positive' ? '正面' : item.sentiment === 'negative' ? '负面' : '中性'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{item.content?.substring(0, 100)}...</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.source} • {new Date(item.published_at).toLocaleDateString('zh-CN')}</span>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" className="text-blue-400 hover:text-blue-300">
                          查看原文
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 舆情分析 */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Cpu className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold">舆情分析</h2>
              </div>
              <span className="text-sm text-gray-400">{sentiments.length} 条</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {sentiments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据，点击刷新按钮采集</p>
              ) : (
                sentiments.slice(0, 10).map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <div className="flex items-center gap-2">
                        {item.sentiment === 'positive' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : item.sentiment === 'negative' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.sentiment === 'positive' ? 'bg-green-900/30 text-green-400' :
                          item.sentiment === 'negative' ? 'bg-red-900/30 text-red-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {item.sentiment === 'positive' ? '正面' : item.sentiment === 'negative' ? '负面' : '中性'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{item.content?.substring(0, 100)}...</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.source} • {new Date(item.published_at).toLocaleDateString('zh-CN')}</span>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" className="text-blue-400 hover:text-blue-300">
                          查看原文
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>数据来源: Brave Search API | 数据库: Supabase | 部署: Cloudflare Pages</p>
          <p className="mt-1">最后更新: {lastUpdate || '未加载'}</p>
          {!supabase && (
            <p className="mt-2 text-amber-400">
              ⚠️ 数据库连接初始化中... 如果长时间未连接成功，请刷新页面
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
