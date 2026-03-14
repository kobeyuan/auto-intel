'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  Target,
  Compass,
  Scale,
  MessageSquare,
  RefreshCw,
  Brain,
  Activity,
  Radar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Cpu,
  Car,
  Zap,
  Radio
} from 'lucide-react'
import { IntelligenceCard } from '@/components/IntelligenceCard'
import { GlobalSynthesisPanel } from '@/components/GlobalSynthesisPanel'
import { IndustryNews } from '@/types'
import { supabase } from '@/lib/supabase'
import { generateDailySynthesis } from '@/utils/intelligence'

// 定义子板块配置
const SUB_SECTIONS = [
  { id: 'gtc', label: 'GTC 2026', icon: Cpu, keywords: ['GTC', 'NVIDIA', '英伟达', 'Blackwell'] },
  { id: 'adas', label: '智能驾驶', icon: Car, keywords: ['智驾', 'FSD', '自动驾驶', 'ADS', '端到端'] },
  { id: 'cockpit', label: '智能座舱', icon: Zap, keywords: ['座舱', '鸿蒙', '大模型', '语音', '屏幕'] },
  { id: 'sensor', label: '传感器', icon: Radio, keywords: ['激光雷达', '雷达', '摄像头', '感知'] },
  { id: 'ota', label: 'OTA 升级', icon: RefreshCw, keywords: ['OTA', '升级', '更新', '软件'] },
]

export default function Home() {
  const [intelligence, setIntelligence] = useState<IndustryNews[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [dailySummary, setDailySummary] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'competitor' | 'tech' | 'policy' | 'voc'>('all')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('industry_intelligence')
        .select('*')
        .order('quality_score', { ascending: false })
        .limit(300)

      if (error) throw error

      const formatted: IndustryNews[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.snippet,
        source: item.source,
        source_url: item.link,
        category: item.category,
        sentiment: item.sentiment || 'neutral',
        importance: (item.quality_score >= 8.5) ? 'high' : 'medium',
        quality_score: item.quality_score,
        verified: item.verified,
        metadata: item.metadata || { tags: item.keywords || [] },
        created_at: item.created_at,
        published_at: item.published_at || item.created_at,
        keywords: item.keywords
      }))

      setIntelligence(formatted)
      const summary = await generateDailySynthesis(formatted)
      setDailySummary(summary)
      setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
    } catch (err) {
      console.error('获取情报失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const mainTabs = [
    { id: 'all', label: '全量情报', icon: LayoutDashboard, color: 'text-slate-400' },
    { id: 'competitor', label: '竞品 X 光机', icon: Target, color: 'text-red-500', category: 'gtc-insight' },
    { id: 'tech', label: '技术罗盘', icon: Compass, color: 'text-cyan-500', category: 'autonomous-driving' },
    { id: 'policy', label: '政策红线', icon: Scale, color: 'text-amber-500', category: 'sensors' },
    { id: 'voc', label: '用户声音', icon: MessageSquare, color: 'text-purple-500', category: 'ota' },
  ]

  const groupedData = useMemo(() => {
    const groups: Record<string, IndustryNews[]> = {}

    if (activeTab === 'all') {
      SUB_SECTIONS.forEach(sub => {
        groups[sub.id] = intelligence.filter(item => {
          const titleMatch = item.title?.toLowerCase().includes(sub.id.toLowerCase());
          const keywordMatch = item.keywords?.some(k => sub.keywords.some(sk => k.toLowerCase().includes(sk.toLowerCase())));
          return titleMatch || keywordMatch;
        }).slice(0, 8) // 强制信息节流
      })
      const classifiedIds = new Set(Object.values(groups).flat().map(i => i.id))
      groups['others'] = intelligence.filter(item => !classifiedIds.has(item.id)).slice(0, 8)
    } else {
      const activeCategory = mainTabs.find(t => t.id === activeTab)?.category
      groups[activeTab] = intelligence.filter(item => item.category === activeCategory).slice(0, 8) // 强制信息节流
    }

    return groups
  }, [intelligence, activeTab])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }))
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-500/30 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-400/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Intelligence <span className="text-blue-600">Command Center</span>
              </h1>
              <p className="text-slate-400 text-[10px] mt-0.5 font-bold uppercase tracking-[0.2em]">
                Strategic Planning Unit • v2.2
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Online
              </span>
            </div>
            <button onClick={fetchData} disabled={loading} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-95">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </header>

        <GlobalSynthesisPanel summary={dailySummary} loading={loading} />

        <nav className="flex flex-wrap gap-2 mb-12 p-1.5 bg-slate-100/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl w-fit">
          {mainTabs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                activeTab === s.id
                ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 border border-blue-100'
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <s.icon className={`w-4 h-4 ${activeTab === s.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Initializing Strategic Nodes...
              </p>
            </div>
          ) : Object.entries(groupedData).length === 0 || Object.values(groupedData).every(items => items.length === 0) ? (
            <div className="bg-white/40 backdrop-blur-md border border-slate-200 rounded-[2rem] p-20 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-2xl mb-6">
                <Radar className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Intelligence</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">当前雷达范围内未发现符合战略评分的情报节点。</p>
            </div>
          ) : (
            Object.entries(groupedData).map(([groupId, items]) => {
              if (items.length === 0) return null;
              const subInfo = SUB_SECTIONS.find(s => s.id === groupId) || mainTabs.find(t => t.id === groupId);
              const isExpanded = expandedSections[groupId] !== false;
              const topItems = items.slice(0, 5);
              const otherItems = items.slice(5);

              return (
                <section key={groupId} className="bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div
                    className="flex items-center justify-between px-8 py-6 cursor-pointer hover:bg-slate-50/50 transition-all"
                    onClick={() => toggleSection(groupId)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        {subInfo?.icon ? <subInfo.icon className="w-5 h-5 text-blue-600" /> : <Activity className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">{subInfo?.label || '其他情报'}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} Nodes</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest">
                            Peak Score: {(items[0]?.quality_score || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">AI 趋势研判</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-2 pb-6">
                      <div className="mx-6 mb-6 p-5 bg-blue-50/40 border border-blue-100/50 rounded-2xl">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Brain className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                              <span className="text-blue-600 font-black uppercase mr-2">Strategic Insight:</span>
                              该板块核心热度集中在 {items[0]?.title.slice(0, 25)}...
                              {groupId === 'gtc' ? ' 英伟达正通过 Blackwell 架构建立绝对的算力护城河，建议关注其对端侧推理的成本摊薄效应。' : ' 行业正处于从功能堆叠向体验闭环转型的关键期，SOP 节点普遍提前。'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {topItems.map(item => (
                          <IntelligenceCard key={item.id} item={item} />
                        ))}

                        {otherItems.length > 0 && (
                          <div className="bg-slate-50/30">
                             <div className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                               次要监测情报 ({otherItems.length})
                             </div>
                             {otherItems.map(item => (
                               <IntelligenceCard key={item.id} item={item} />
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )
            })
          )}
        </div>

        <footer className="mt-24 pb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 opacity-20">
            <div className="h-px w-12 bg-slate-400" />
            <Brain className="w-4 h-4 text-slate-900" />
            <div className="h-px w-12 bg-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Data Sync: {lastUpdate} • Autonomous Strategic Node
          </p>
        </footer>
      </div>
    </main>
  )
}
