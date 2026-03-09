'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Brain, RefreshCw, ExternalLink, Car, MonitorSmartphone, Radar,
  CloudDownload, MessageSquareText, TrendingUp, TrendingDown, Minus,
  Sparkles, Target, Zap, Activity, Clock, Shield, AlertTriangle,
  BarChart3, Layers, Filter, ChevronDown, ChevronUp
} from 'lucide-react'

// 类型定义
interface IntelligenceItem {
  id: string
  title: string
  content: string
  summary: string
  source: string
  sourceCredibility: 'official' | 'tier1' | 'tier2' | 'tier3'
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  importance: 'critical' | 'high' | 'medium' | 'low'
  importanceScore: number
  keyInsights: string[]
  industryImpact: string
  relatedCompanies: string[]
  relatedTechnologies: string[]
  timeSensitivity: 'breaking' | 'trending' | 'normal' | 'archived'
  createdAt: string
}

interface OTAItem {
  id: string
  brand: string
  model: string
  version: string
  updateType: 'major' | 'minor' | 'hotfix'
  releaseDate: string
  keyFeatures: string[]
  importance: 'high' | 'medium' | 'low'
  competitiveAnalysis?: string
}

// 主组件
export default function IntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sensor' | 'ota' | 'cockpit'>('overview')
  const [intelligence, setIntelligence] = useState<IntelligenceItem[]>([])
  const [otaUpdates, setOtaUpdates] = useState<OTAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [filterImportance, setFilterImportance] = useState<string>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase配置缺失')
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // 加载情报数据
      const { data: intelData } = await supabase
        .from('industry_intelligence')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (intelData) {
        setIntelligence(intelData as IntelligenceItem[])
      }

      // 加载OTA数据
      const { data: otaData } = await supabase
        .from('ota_updates')
        .select('*')
        .order('releaseDate', { ascending: false })
        .limit(15)

      if (otaData) {
        setOtaUpdates(otaData as OTAItem[])
      }

      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取重要性样式
  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'critical':
        return { color: 'text-red-400', bg: 'bg-red-900/40', border: 'border-red-500/50', label: 'Critical' }
      case 'high':
        return { color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/40', label: 'High' }
      case 'medium':
        return { color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', label: 'Medium' }
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600', label: 'Low' }
    }
  }

  // 获取可信度图标
  const getCredibilityIcon = (level: string) => {
    switch (level) {
      case 'official':
        return <Shield className="w-3 h-3 text-emerald-400" />
      case 'tier1':
        return <Shield className="w-3 h-3 text-blue-400" />
      default:
        return <Shield className="w-3 h-3 text-gray-400" />
    }
  }

  // 情报卡片组件
  const IntelligenceCard = ({ item }: { item: IntelligenceItem }) => {
    const importance = getImportanceStyle(item.importance)
    const isExpanded = expandedItem === item.id

    return (
      <div className={`p-4 rounded-xl bg-gray-900/60 border ${importance.border} hover:border-opacity-80 transition-all`}>
        {/* 头部信息 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded ${importance.bg} ${importance.color} font-medium`}>
              {importance.label}
            </span>
            {item.timeSensitivity === 'breaking' && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">
                Breaking
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              {getCredibilityIcon(item.sourceCredibility)}
              <span>{item.source}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {item.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-rose-400" />}
            {item.sentiment === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
            <span className="text-[10px] text-gray-500">
              {new Date(item.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* AI摘要 */}
        <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-900/30 to-purple-900/20 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-400 font-medium">AI洞察</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{item.summary}</p>
        </div>

        {/* 关键洞察 */}
        {item.keyInsights && item.keyInsights.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {item.keyInsights.slice(0, isExpanded ? undefined : 2).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <Target className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-400">{insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* 展开内容 */}
        {isExpanded && (
          <div className="mb-3 space-y-2">
            {item.industryImpact && (
              <div className="text-xs text-gray-400">
                <span className="text-purple-400 font-medium">产业影响：</span>
                {item.industryImpact}
              </div>
            )}
            {item.relatedCompanies && item.relatedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-gray-500">涉及企业：</span>
                {item.relatedCompanies.map((company, idx) => (
                  <span key={idx} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                    {company}
                  </span>
                ))}
              </div>
            )}
            {item.relatedTechnologies && item.relatedTechnologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.relatedTechnologies.map((tech, idx) => (
                  <span key={idx} className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
            className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
          >
            {isExpanded ? (
              <><ChevronUp className="w-3 h-3" /> 收起</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> 展开</>
            )}
          </button>
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            原文 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    )
  }

  // OTA卡片组件
  const OTACard = ({ item }: { item: OTAItem }) => {
    const updateTypeColors = {
      major: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      minor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      hotfix: 'bg-gray-500/20 text-gray-400 border-gray-500/40'
    }

    return (
      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700 hover:border-amber-500/30 transition-all">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-200">{item.brand}</span>
            <span className="text-xs text-gray-500">{item.model}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded border ${updateTypeColors[item.updateType]}`}>
            {item.updateType === 'major' ? '大版本' : item.updateType === 'minor' ? '功能更新' : '修复'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <CloudDownload className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-bold text-amber-400">{item.version}</span>
          <span className="text-[10px] text-gray-500">
            {new Date(item.releaseDate).toLocaleDateString('zh-CN')}
          </span>
        </div>

        {item.keyFeatures && item.keyFeatures.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {item.keyFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {item.competitiveAnalysis && (
          <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
            <span className="text-amber-400">竞争分析：</span>
            {item.competitiveAnalysis}
          </div>
        )}
      </div>
    )
  }

  // 概览统计组件
  const OverviewStats = () => {
    const criticalCount = intelligence.filter(i => i.importance === 'critical').length
    const highCount = intelligence.filter(i => i.importance === 'high').length
    const breakingCount = intelligence.filter(i => i.timeSensitivity === 'breaking').length

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Critical情报', count: criticalCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/30' },
          { title: 'High Priority', count: highCount, icon: Target, color: 'text-orange-400', bg: 'bg-orange-900/30' },
          { title: 'Breaking News', count: breakingCount, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-900/30' },
          { title: 'OTA更新', count: otaUpdates.length, icon: CloudDownload, color: 'text-amber-400', bg: 'bg-amber-900/30' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-xl p-4 border border-gray-700/50`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.count}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">Auto-Intel Pro</h1>
                <p className="text-xs text-cyan-400">AI驱动情报洞察 · 实时竞品监控</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">更新于 {lastUpdate}</span>
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>

          {/* Tab导航 */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: '情报概览', icon: BarChart3 },
              { id: 'sensor', label: '传感器前沿', icon: Radar },
              { id: 'cockpit', label: '智能座舱', icon: MonitorSmartphone },
              { id: 'ota', label: 'OTA追踪', icon: CloudDownload }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="py-20 text-center">
            <Activity className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
            <p className="text-gray-400">AI分析引擎加载中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 概览页 */}
            {activeTab === 'overview' && (
              <>
                <OverviewStats />

                {/* 热点追踪 */}
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 rounded-2xl p-5 border border-red-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-bold">热点追踪</h2>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">Live</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {intelligence
                      .filter(i => i.timeSensitivity === 'breaking' || i.importance === 'critical')
                      .slice(0, 3)
                      .map(item => (
                        <IntelligenceCard key={item.id} item={item} />
                      ))}
                  </div>
                </div>

                {/* 最新情报 */}
                <div className="bg-gray-800/30 rounded-2xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-cyan-400" />
                      <h2 className="text-lg font-bold">最新情报</h2>
                    </div>
                    <select
                      value={filterImportance}
                      onChange={(e) => setFilterImportance(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">全部重要性</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {intelligence
                      .filter(i => filterImportance === 'all' || i.importance === filterImportance)
                      .slice(0, 9)
                      .map(item => (
                        <IntelligenceCard key={item.id} item={item} />
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* 传感器页 */}
            {activeTab === 'sensor' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-rose-900/30 to-purple-900/20 rounded-2xl p-5 border border-rose-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Radar className="w-5 h-5 text-rose-400" />
                    <h2 className="text-lg font-bold">传感器情报中心</h2>
                    <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">高关注</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    聚焦激光雷达、毫米波雷达、摄像头等核心传感器技术动态
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {intelligence
                      .filter(i => i.category === 'sensor' || i.relatedTechnologies?.some(t =>
                        t.includes('激光雷达') || t.includes('毫米波') || t.includes('摄像头')
                      ))
                      .map(item => (
                        <IntelligenceCard key={item.id} item={item} />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* OTA页 */}
            {activeTab === 'ota' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 rounded-2xl p-5 border border-amber-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <CloudDownload className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold">OTA版本追踪</h2>
                  </div>

                  {/* 品牌筛选 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['全部', '华为', '小鹏', '理想', '蔚来', '极氪'].map(brand => (
                      <button
                        key={brand}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otaUpdates.map(item => (
                      <OTACard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 座舱页 */}
            {activeTab === 'cockpit' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 rounded-2xl p-5 border border-purple-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <MonitorSmartphone className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold">智能座舱动态</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {intelligence
                      .filter(i => i.category === 'cockpit' || i.relatedTechnologies?.some(t =>
                        t.includes('座舱') || t.includes('鸿蒙') || t.includes('NOMI')
                      ))
                      .map(item => (
                        <IntelligenceCard key={item.id} item={item} />
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
