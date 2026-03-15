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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-6">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-sm" />
              <p className="text-xs font-black text-blue-600 uppercase tracking-[0.5em]">
                Synchronizing Strategic Matrix...
              </p>
            </div>
          ) : Object.entries(groupedData).length === 0 || Object.values(groupedData).every(items => items.length === 0) ? (
            <div className="col-span-full bg-white/40 border-2 border-dashed border-slate-200 rounded-[3rem] p-32 text-center shadow-inner">
              <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-8">
                <Radar className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">No Active Intelligence</h3>
              <p className="text-sm text-slate-500 mt-4 font-medium">当前雷达范围内未发现符合战略评分的情报节点。</p>
            </div>
          ) : (
            Object.entries(groupedData).map(([groupId, items]) => {
              if (items.length === 0) return null;
              const subInfo = SUB_SECTIONS.find(s => s.id === groupId) || mainTabs.find(t => t.id === groupId);
              const isExpanded = expandedSections[groupId] !== false;
              const topItems = items.slice(0, 8);

              return (
                <section key={groupId} className="flex flex-col bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden transition-all hover:border-blue-200 group/section h-full glow-card">
                  <div
                    className="flex items-center justify-between px-10 py-8 cursor-pointer hover:bg-slate-50/50 transition-all border-b border-slate-100"
                    onClick={() => toggleSection(groupId)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover/section:border-blue-200 transition-colors shadow-sm">
                        {subInfo?.icon ? <subInfo.icon className="w-6 h-6 text-blue-600" /> : <Activity className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-widest uppercase">{subInfo?.label || '其他情报'}</h2>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{items.length} Nodes Detected</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                            Peak Score: {(items[0]?.quality_score || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-md">
                        <TrendingUp className="w-3 h-3 text-blue-600" />
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">AI 研判中</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="flex flex-col flex-1">
                      <div className="px-10 py-8 bg-slate-50/30 border-b border-slate-100">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Strategic Deep Dive</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-blue-500/20 to-transparent" />
                          </div>

                          <p className="text-[14px] font-medium text-slate-700 leading-[1.8] tracking-tight antialiased">
                            {groupId === 'gtc-insight' && (
                              <>
                                英伟达通过 Rubin 架构实现了从“单体芯片”向“系统级集群”的范式转移。其 NVLink 交换机技术将 72 颗 GPU 融合成一个巨大的虚拟算力池，这不仅是算力的提升，更是对大模型训练效率的代际垄断。
                                <span className="text-blue-600 font-black mx-2">// So What:</span>
                                对比亚迪而言，这意味着单纯堆叠算力卡已失去边际效应。我们必须在“璇玑架构”中实现更深度的软硬解耦，并针对端侧推理进行非对称优化。建议立即评估 DRIVE Thor 在璇玑架构中的底层适配深度。
                              </>
                            )}
                            {groupId === 'openclaw' && (
                              <>
                                OpenClaw 具身智能 (Embodied AI) 正在重新定义机器人的物理交互上限。其将大模型的语义理解能力直接映射到末端执行器的扭矩控制上，实现了从“脑”到“手”的无缝贯通。
                                <span className="text-blue-600 font-black mx-2">// So What:</span>
                                比亚迪应将具身智能视为“移动终端”的终极形态。重点关注其在工业生产线自动化（工业机器人）以及未来车载助理物理交互（具身座舱）中的应用。建议研发部门立即开启 OpenClaw 与 Isaac 平台的联合测试，探索其在复杂非标场景下的泛化控制能力。
                              </>
                            )}
                            {groupId === 'sensors' && (
                              <>
                                传感器领域正经历“图像级”革命。4D 成像雷达与固态激光雷达的规模化 SOP 标志着全天候感知能力的基准线被大幅拉高。
                                <span className="text-blue-600 font-black mx-2">// So What:</span>
                                比亚迪应采取“分级感知架构”：高端车型通过 4D 成像雷达补足长距离感知短板，中低端车型通过璇玑架构的算法冗余实现对昂贵传感器的减配降本。重点建立自研的感知融合大模型，实现对物理世界的“语义级”深度理解。
                              </>
                            )}
                            {(!['gtc-insight', 'openclaw', 'autonomous-driving', 'smart-cockpit', 'ota', 'sensors'].includes(groupId)) && (
                              <>
                                当前板块聚焦于行业底层的代际变革。AI 研判显示，竞争正从单一参数比拼转向底层全栈自研能力的系统性对抗。
                                <span className="text-blue-600 font-black mx-2">// So What:</span>
                                在这一轮范式转移中，比亚迪必须利用垂直整合的优势，将核心技术与智能化架构深度耦合，形成竞品无法轻易复制的系统级壁垒。
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {topItems.map(item => (
                          <IntelligenceCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )
            })
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
