'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  Cpu,
  ShieldAlert,
  Zap,
  Activity,
  RefreshCw,
  Brain,
  Car,
  Radar,
  Search,
  FileDown,
  ChevronDown
} from 'lucide-react'
import { IntelligenceCard } from '@/components/IntelligenceCard'
import { ExecutiveBriefing } from '@/components/ExecutiveBriefing'
import { TagFilterBar } from '@/components/TagFilterBar'
import { GlobalSynthesisPanel } from '@/components/GlobalSynthesisPanel'
import { TrendRadarChart } from '@/components/TrendRadarChart'
import { IndustryNews } from '@/types'
import { supabase } from '@/lib/supabase'
import { generateDailySynthesis, generateMarkdownReport } from '@/utils/intelligence'

export default function Home() {
  const [intelligence, setIntelligence] = useState<IndustryNews[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [dailySummary, setDailySummary] = useState('')

  // 过滤状态
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('industry_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const formatted: IndustryNews[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.snippet,
        source: item.source,
        source_url: item.link,
        category: item.category,
        sentiment: item.sentiment || 'neutral',
        importance: item.importance || (item.quality_score >= 8.5 ? 'high' : 'medium'),
        quality_score: item.quality_score,
        verified: item.verified,
        metadata: item.metadata,
        created_at: item.created_at,
        published_at: item.created_at
      }))

      setIntelligence(formatted)

      // 生成每日综述
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

  // 1. 提取去重标签
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    intelligence.forEach(item => {
      if (item.metadata?.tags && Array.isArray(item.metadata.tags)) {
        item.metadata.tags.forEach(t => tagsSet.add(t))
      }
      if (item.keywords && Array.isArray(item.keywords)) {
        item.keywords.forEach(t => tagsSet.add(t))
      }
    })
    return Array.from(tagsSet).filter(t => t.length > 1 && t !== '2026_TREND')
  }, [intelligence])

  // 2. 筛选 Top 3 高价值情报 (用于 ExecutiveBriefing)
  const topFocusItems = useMemo(() => {
    return [...intelligence]
      .filter(item => item.importance === 'high' || (item.quality_score && item.quality_score >= 8.5))
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 3)
  }, [intelligence])

  // 3. 筛选情报流 (用于 Timeline)
  const filteredTimeline = useMemo(() => {
    return intelligence.filter(item => {
      const matchesTag = !selectedTag ||
        (item.metadata?.tags?.includes(selectedTag)) ||
        (item.keywords?.includes(selectedTag)) ||
        (item.title.includes(selectedTag))

      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTag && matchesSearch
    })
  }, [intelligence, selectedTag, searchQuery])

  // 导出报告
  const handleExport = () => {
    const reportMd = generateMarkdownReport(filteredTimeline);
    const blob = new Blob([reportMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BYD_Intelligence_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-cyan-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="text-[10px] font-black tracking-[0.4em] text-cyan-500 uppercase">Strategic AI Node</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white">
                Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Command Center</span>
              </h1>
              <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">
                Real-time Strategic Feed • 2026 Breakthroughs • AI-Curated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="搜索战略情报..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all w-64"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all group"
            >
              <FileDown className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
              导出战略周报
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
          </div>
        </header>

        {/* 1. 上部：AI 全局研判面板 (Daily Synthesis) */}
        <GlobalSynthesisPanel summary={dailySummary} loading={loading} />

        {/* 2. 中部：今日战略聚焦 (Top Focus) & 态势感知雷达 (Radar Vis) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <ExecutiveBriefing items={topFocusItems} />
            )}
          </div>
          <div className="lg:col-span-4">
            <TrendRadarChart data={intelligence} />
          </div>
        </div>

        {/* 3. 下部：动态标签过滤栏 */}
        <TagFilterBar
          tags={allTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />

        {/* 4. 下部：情报时间线 (Timeline) */}
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Activity className="w-5 h-5 text-cyan-500" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">情报时间线</h2>
              <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 uppercase tracking-widest">
                {filteredTimeline.length} 条目
              </span>
            </div>

            <div className="flex items-center gap-6">
               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span>战略预警</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <span>常规监测</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 rounded-3xl bg-slate-900/20 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="py-32 text-center rounded-[3rem] border border-dashed border-slate-800 bg-slate-900/10">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Radar className="w-10 h-10 text-slate-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-400 tracking-tight">扫描范围未发现匹配情报</h3>
              <p className="text-slate-600 text-xs mt-2 uppercase tracking-widest font-black">请尝试调整筛选条件或搜索关键词</p>
              <button
                onClick={() => { setSelectedTag(null); setSearchQuery(''); }}
                className="mt-8 text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-cyan-400 border border-cyan-500/20 px-6 py-2.5 rounded-full hover:bg-cyan-500/5 transition-all"
              >
                重置系统检索
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTimeline.map((item) => (
                <IntelligenceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-slate-900/50">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 grayscale opacity-30">
              <Brain className="w-6 h-6 text-cyan-500" />
              <div className="h-4 w-px bg-slate-700" />
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-400">Autonomous Intelligence Hub</span>
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
              Data Sync: {lastUpdate} • BYD Strategic Planning Unit
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
