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
  { id: 'gtc-insight', label: 'GTC 2026 | 英伟达大会', icon: Cpu, keywords: ['GTC', 'NVIDIA', '英伟达', 'Blackwell', 'Rubin'] },
  { id: 'openclaw', label: 'OpenClaw | 具身智能', icon: Brain, keywords: ['OpenClaw', '智爪', '具身智能', 'Robotics', 'Isaac'] },
  { id: 'autonomous-driving', label: 'Autonomous Driving | 智能驾驶', icon: Car, keywords: ['智驾', 'FSD', '自动驾驶', 'ADS', '端到端', 'World Model'] },
  { id: 'smart-cockpit', label: 'Smart Cockpit | 智能座舱', icon: Zap, keywords: ['座舱', '鸿蒙', '大模型', '语音', '屏幕', '8295'] },
  { id: 'sensors', label: 'Sensor | 传感器', icon: Radio, keywords: ['激光雷达', '4D雷达', '雷达', '感知', 'LiDAR'] },
  { id: 'ota', label: 'OTA Updates | 软件升级', icon: RefreshCw, keywords: ['OTA', '升级', '更新', '软件'] },
]

export default function Home() {
  const [intelligence, setIntelligence] = useState<IndustryNews[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [dailySummary, setDailySummary] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'competitor' | 'tech' | 'policy' | 'voc'>('all')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

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
        image_url: item.image_url,
        metadata: item.metadata || { tags: item.keywords || [] },
        created_at: item.created_at,
        published_at: item.published_at || item.created_at,
        keywords: item.keywords || []
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
    if (mounted) {
      fetchData()
    }
  }, [mounted])

  const mainTabs = [
    { id: 'all', label: 'Dashboard | 全量情报', icon: LayoutDashboard, color: 'text-slate-500' },
    { id: 'competitor', label: 'Competitors | 竞品 X 光机', icon: Target, color: 'text-red-600', category: 'gtc-insight' },
    { id: 'tech', label: 'Tech Radar | 技术罗盘', icon: Compass, color: 'text-blue-600', category: 'autonomous-driving' },
    { id: 'policy', label: 'Regulatory | 政策红线', icon: Scale, color: 'text-amber-600', category: 'sensors' },
    { id: 'voc', label: 'VOC | 用户声音', icon: MessageSquare, color: 'text-purple-600', category: 'ota' },
  ]

  const groupedData = useMemo(() => {
    const groups: Record<string, IndustryNews[]> = {}

    if (activeTab === 'all') {
      SUB_SECTIONS.forEach(sub => {
        groups[sub.id] = intelligence.filter(item => {
          // 匹配逻辑：优先匹配 category，其次匹配关键词
          if (item.category === sub.id) return true;

          const titleLower = item.title?.toLowerCase() || '';
          const snippetLower = item.content?.toLowerCase() || '';
          const keywords = item.keywords || [];

          return sub.keywords.some(sk =>
            titleLower.includes(sk.toLowerCase()) ||
            snippetLower.includes(sk.toLowerCase()) ||
            keywords.some(k => k.toLowerCase().includes(sk.toLowerCase()))
          );
        }).slice(0, 8)
      })
      const classifiedIds = new Set(Object.values(groups).flat().map(i => i.id))
      groups['others'] = intelligence.filter(item => !classifiedIds.has(item.id)).slice(0, 8)
    } else {
      const activeCategory = mainTabs.find(t => t.id === activeTab)?.category
      groups[activeTab] = intelligence.filter(item => item.category === activeCategory).slice(0, 8)
    }

    return groups
  }, [intelligence, activeTab])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))
  }

  // Hydration guard
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:60px_60px] opacity-30 scifi-grid" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_800px_at_50%_-100px,#f1f5f9,transparent)]" />
      </div>

      <div className="relative w-full max-w-[1800px] mx-auto px-8 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
              <Radar className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                BYD <span className="text-blue-600">Strategic Terminal</span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-700 rounded uppercase tracking-tighter">
                  Confidential
                </span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                  Intell-System v3.0 // 璇玑架构适配版
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                Neural Uplink Stable
              </span>
            </div>
            <button onClick={fetchData} disabled={loading} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95 shadow-sm">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>

        <GlobalSynthesisPanel summary={dailySummary} loading={loading} />

        <nav className="flex flex-wrap gap-2 mb-12 p-1.5 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl w-fit shadow-sm">
          {mainTabs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                activeTab === s.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <s.icon className={`w-4 h-4 ${activeTab === s.id ? 'text-white' : 'text-slate-400'}`} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-6">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-sm" />
              <p className="text-xs font-black text-blue-600 uppercase tracking-[0.5em]">
                Synchronizing Strategic Matrix...
              </p>
            </div>
          ) : intelligence.length === 0 ? (
            <div className="col-span-full bg-white/40 border-2 border-dashed border-slate-200 rounded-[3rem] p-32 text-center shadow-inner">
              <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-8">
                <Radar className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">No Active Intelligence</h3>
              <p className="text-sm text-slate-500 mt-4 font-medium">当前雷达范围内未发现符合战略评分的情报节点。</p>
            </div>
          ) : (
            intelligence
              .filter(item => {
                if (activeTab === 'all') return true;
                const activeCategory = mainTabs.find(t => t.id === activeTab)?.category;
                return item.category === activeCategory;
              })
              .map(item => (
                <IntelligenceCard key={item.id} item={item} />
              ))
          )}
        </div>

        <footer className="mt-24 pb-12 text-center border-t border-slate-200 pt-12">
          <div className="flex items-center justify-center gap-3 mb-4 opacity-30">
            <div className="h-px w-12 bg-slate-400" />
            <Brain className="w-4 h-4 text-slate-900" />
            <div className="h-px w-12 bg-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Data Sync: {lastUpdate} • Autonomous Strategic Node
          </p>
        </footer>
      </div>
    </main>
  )
}
