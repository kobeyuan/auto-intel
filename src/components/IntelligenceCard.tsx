'use client'

import { useState, useEffect } from 'react'
import { IndustryNews } from '@/types'
import { ChevronRight, ExternalLink, TrendingUp, Clock, Globe } from 'lucide-react'
import { getFreshnessBadge, formatRelativeTime } from '@/utils/intelligence'

interface IntelligenceCardProps {
  item: IndustryNews
}

export function IntelligenceCard({ item }: IntelligenceCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const freshness = getFreshnessBadge(item.published_at || item.created_at)
  const tags = Array.isArray(item.keywords) ? item.keywords : []

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'bg-red-500 text-white'
    if (score >= 8) return 'bg-orange-500 text-white'
    return 'bg-blue-600 text-white'
  }

  // 解析 NotebookLM 风格的 snippet
  const parseSnippet = (snippet: string) => {
    if (!snippet) return { summary: '', strategy: '', countermeasures: '', trajectory: '' };

    const summaryMatch = snippet.match(/【战略执行摘要】\s*([\s\S]*?)(?=\n\n|【|$)/);
    const counterMatch = snippet.match(/【战略对策】\s*([\s\S]*?)(?=\n\n|【|$)/);
    const trajectoryMatch = snippet.match(/【行业轨迹】\s*([\s\S]*?)(?=\n\n|【|$)/);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : snippet.slice(0, 150),
      strategy: summaryMatch ? summaryMatch[1].trim() : '',
      countermeasures: counterMatch ? counterMatch[1].trim() : '',
      trajectory: trajectoryMatch ? trajectoryMatch[1].trim() : ''
    };
  }

  const { summary, countermeasures } = parseSnippet(item.content);

  if (!mounted) return null;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col h-full">
      {/* 图片区域 */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
            <Globe className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg ${getScoreColor(item.quality_score || 0)}`}>
            Score {item.quality_score?.toFixed(1)}
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg bg-white/90 text-slate-900 border border-slate-200 backdrop-blur-sm`}>
            {item.source}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-[10px] font-black uppercase tracking-tighter ${freshness.color}`}>
            {freshness.text}
          </span>
          <div className="h-1 w-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {formatRelativeTime(item.published_at || item.created_at)}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
          {item.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-3 mb-6 font-medium leading-relaxed">
          {summary}
        </p>

        {/* 战略对策 (如果有) */}
        {countermeasures && (
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Strategic Action</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold italic line-clamp-2 leading-relaxed">
              "{countermeasures.split('\n')[0]}"
            </p>
          </div>
        )}

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] font-black text-slate-400 uppercase tracking-tighter border border-slate-100 px-2 py-0.5 rounded bg-slate-50">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800 transition-colors"
          >
            Read Intelligence
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
