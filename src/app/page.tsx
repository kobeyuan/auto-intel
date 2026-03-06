'use client'

import { useState, useEffect } from 'react'
import { Brain, RefreshCw, Calendar, AlertCircle, ExternalLink, Car, MonitorSmartphone, Radar, CloudDownload, MessageSquareText, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function Home() {
  const [cockpitNews, setCockpitNews] = useState<any[]>([])
  const [drivingNews, setDrivingNews] = useState<any[]>([])
  const [sensorNews, setSensorNews] = useState<any[]>([])
  const [otaNews, setOtaNews] = useState<any[]>([])
  const [sentiments, setSentiments] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [supabase, setSupabase] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        //setError('Supabase 配置缺失')
        // 修改这一行，看看公网上到底拿到了什么（哪怕是空字符串也要看清）
setError(`配置缺失详情: URL=[${process.env.NEXT_PUBLIC_SUPABASE_URL || '空'}], KEY=[${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已拿到' : '空'}]`)
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

      // 同时获取 5 个板块的数据
      const queries = ['smart-cockpit', 'autonomous-driving', 'sensors', 'ota', 'sentiment'].map(category => 
        dbClient.from('industry_intelligence').select('*').eq('category', category).order('created_at', { ascending: false }).limit(6)
      )

      const results = await Promise.all(queries)
      
      // 检查是否有报错
      results.forEach(res => { if (res.error) throw res.error })

      setCockpitNews(results[0].data || [])
      setDrivingNews(results[1].data || [])
      setSensorNews(results[2].data || [])
      setOtaNews(results[3].data || [])
      setSentiments(results[4].data || [])
      
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (err) {
      console.error(err)
      setError('加载失败: 请检查数据库连接')
    } finally {
      setLoading(false)
    }
  }

  // 简单的关键词情感模拟器（前端暂时用这个区分正负面）
  const getSentimentMock = (text: string) => {
    if (text.includes('好') || text.includes('升级') || text.includes('领先') || text.includes('突破')) return 'positive'
    if (text.includes('差') || text.includes('吐槽') || text.includes('问题') || text.includes('落后')) return 'negative'
    return 'neutral'
  }

  if (error) return <div className="text-white p-6">{error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider">Auto-Intel 洞察引擎</h1>
              <p className="text-xs text-cyan-400">规划部专属 • 智能化全域监控</p>
            </div>
          </div>
          <button onClick={() => loadData()} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-2 text-sm transition-all">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            同步数据
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 顶部四大指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: '智驾情报', count: drivingNews.length, icon: Car, color: 'text-cyan-400' },
            { title: '座舱动态', count: cockpitNews.length, icon: MonitorSmartphone, color: 'text-purple-400' },
            { title: '传感器前沿', count: sensorNews.length, icon: Radar, color: 'text-emerald-400' },
            { title: 'OTA 追踪', count: otaNews.length, icon: CloudDownload, color: 'text-amber-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50 hover:bg-gray-800/80 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.count} <span className="text-sm font-normal text-gray-500">篇</span></p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-cyan-400 animate-pulse">全域数据扫描中...</div>
        ) : (
          <div className="space-y-8">
            {/* 上半部分：四大硬件/软件板块 (2x2 网格) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 模块复用组件提取，保持代码整洁 */}
              {[
                { title: '智能驾驶 (AD/ADAS)', data: drivingNews, icon: Car, color: 'text-cyan-400', border: 'hover:border-cyan-500/50' },
                { title: '智能座舱 (Smart Cockpit)', data: cockpitNews, icon: MonitorSmartphone, color: 'text-purple-400', border: 'hover:border-purple-500/50' },
                { title: '传感器与硬件 (Sensors)', data: sensorNews, icon: Radar, color: 'text-emerald-400', border: 'hover:border-emerald-500/50' },
                { title: 'OTA 升级追踪 (FOTA/SOTA)', data: otaNews, icon: CloudDownload, color: 'text-amber-400', border: 'hover:border-amber-500/50' }
              ].map((section, idx) => (
                <div key={idx} className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-5 border-b border-gray-700/50 pb-3">
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                    <h2 className={`text-lg font-bold text-gray-100`}>{section.title}</h2>
                  </div>
                  <div className="space-y-3 h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    {section.data.map((item) => (
                      <div key={item.id} className={`p-4 rounded-xl bg-gray-900/60 border border-transparent ${section.border} transition-all group`}>
                        <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.snippet}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400">{item.source}</span>
                          <a href={item.link} target="_blank" rel="noreferrer" className={`text-xs ${section.color} opacity-80 hover:opacity-100 flex items-center gap-1`}>
                            原文 <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 下半部分：舆情洞察专区 (全宽) */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/80">
              <div className="flex items-center justify-between mb-6 border-b border-gray-700/50 pb-3">
                <div className="flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-gray-100">全网舆情监控雷达</h2>
                </div>
                <div className="text-xs text-gray-400 flex gap-4">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> 正面倾向</span>
                  <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-400"/> 负面倾向</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sentiments.map((item) => {
                  const vibe = getSentimentMock(item.snippet || item.title);
                  return (
                    <div key={item.id} className="p-4 rounded-xl bg-gray-900/60 border border-gray-700/50 hover:border-rose-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400">{item.source}</span>
                          {vibe === 'positive' && <span className="bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-1 rounded flex items-center gap-1"><TrendingUp className="w-3 h-3"/> 偏好</span>}
                          {vibe === 'negative' && <span className="bg-rose-900/30 text-rose-400 text-[10px] px-2 py-1 rounded flex items-center gap-1"><TrendingDown className="w-3 h-3"/> 偏空</span>}
                          {vibe === 'neutral' && <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-1 rounded flex items-center gap-1"><Minus className="w-3 h-3"/> 中性</span>}
                        </div>
                        <h3 className="font-medium text-sm text-gray-200 mb-2">{item.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-3">{item.snippet}</p>
                      </div>
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-rose-400 opacity-80 hover:opacity-100 flex items-center gap-1 mt-4">
                        追踪溯源 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
