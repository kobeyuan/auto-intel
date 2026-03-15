'use client'

import { useState, useEffect } from 'react'
import { IndustryNews } from '@/types'
import { ChevronRight, ChevronDown, ExternalLink, ShieldAlert, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { getFreshnessBadge } from '@/utils/intelligence'

interface IntelligenceCardProps {
  item: IndustryNews
}

export function IntelligenceCard({ item }: IntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const freshness = getFreshnessBadge(item.published_at || item.created_at)
  const tags = Array.isArray(item.keywords) ? item.keywords : []

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-red-600 border-red-200 bg-red-50'
    if (score >= 8) return 'text-orange-600 border-orange-200 bg-orange-50'
    return 'text-blue-600 border-blue-200 bg-blue-50'
  }

  // 解析 NotebookLM 风格的 snippet
  const parseSnippet = (snippet: string) => {
    if (!snippet) return { summary: '', full: '' };

    // 提取执行摘要作为预览
    const summaryMatch = snippet.match(/【战略执行摘要】\s*([\s\S]*?)(?=\n\n|【|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : snippet;

    // 格式化主体内容，加粗关键标题
    const formatted = snippet.replace(/(【.*?】)/g, '**$1**');

    return { summary, full: formatted };
  }

  const { summary, full } = parseSnippet(item.content);

  // Hydration guard
  if (!mounted) return null;

  return (
    <div
      className={`group border-b border-slate-100 hover:bg-blue-50/50 transition-all cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-4 px-8 py-4 min-h-[60px]">
        <div className={`flex-shrink-0 w-12 h-6 flex items-center justify-center rounded-lg text-[10px] font-black border ${getScoreColor(item.quality_score || 0)} shadow-sm`}>
          {item.quality_score?.toFixed(1)}
        </div>

        <div className="flex-shrink-0 flex gap-2">
          {tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] font-bold text-slate-500 uppercase tracking-tight border border-slate-200 px-2 py-0.5 rounded-md bg-white shadow-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex-grow min-w-0">
          <p className={`text-base font-bold text-slate-900 transition-colors ${isExpanded ? '' : 'truncate'} group-hover:text-blue-700`}>
            {item.title}
          </p>
          {!isExpanded && (
            <p className="text-xs text-slate-500 truncate mt-0.5 opacity-70">
              {summary}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          <span className={`text-xs font-black ${freshness.color} hidden md:block uppercase tracking-tighter`}>
            {freshness.text.replace(/🔥 |⚡ |📌 |⏳ /, '')}
          </span>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 md:px-24 pb-8 pt-2 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md space-y-6">
            <div className="flex items-start justify-between gap-6">
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                {item.title}
              </h3>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-slate-100">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</span>
                <p className="text-xs font-bold text-slate-700">{item.source}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                <p className="text-xs font-bold text-slate-700">{item.category}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</span>
                <p className="text-xs font-bold text-slate-700">
                  {new Date(item.published_at || item.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Strategic Briefing (NotebookLM Style)</span>
              </div>
              <div className="text-sm leading-loose text-slate-700 whitespace-pre-wrap font-medium">
                {full.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="text-slate-900 block mt-4 mb-1">{part}</strong> : part
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
