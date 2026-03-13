'use client';

import React, { useState } from 'react';
import { ExternalLink, Sparkles, TrendingUp, TrendingDown, Target, ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react';
import { parseAIAnalysis, getFreshnessBadge, formatRelativeTime, isValidUrl } from '@/utils/intelligence';
import { IndustryNews } from '@/types';

interface IntelligenceCardProps {
  item: IndustryNews;
}

export function IntelligenceCard({ item }: IntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 提取 AI 分析内容
  const analysis = parseAIAnalysis(item.content);
  const badge = getFreshnessBadge(item.created_at.toString());
  const hasValidLink = isValidUrl(item.source_url);

  // 确定重要性样式
  const isHighImportance = item.importance === 'high' || (item.quality_score && item.quality_score >= 8.5);

  return (
    <div className={`group relative p-5 rounded-2xl bg-slate-900/60 border transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 ${
      isHighImportance 
        ? 'border-red-500/30 bg-gradient-to-br from-slate-900/80 to-red-950/10' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* 顶部标签栏 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.badge} ${badge.color}`}>
            {badge.text}
          </span>
          <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {item.source}
          </span>
          {item.quality_score && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
              <Target className="w-3 h-3" /> 评分: {item.quality_score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(item.created_at.toString())}
          </div>
          {item.sentiment === 'positive' ? (
            <TrendingUp className="w-4 h-4 text-emerald-400 opacity-80" />
          ) : item.sentiment === 'negative' ? (
            <TrendingDown className="w-4 h-4 text-rose-400 opacity-80" />
          ) : null}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-[15px] font-bold text-slate-100 mb-4 leading-relaxed group-hover:text-cyan-400 transition-colors">
        {item.title}
      </h3>

      {/* AI 深度分析板块 */}
      {analysis ? (
        <div className="space-y-3">
          {/* 核心本质 */}
          <div className="p-3.5 bg-blue-500/5 border-l-2 border-blue-500/40 rounded-r-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">核心本质</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.what}</p>
          </div>
          
          {/* 展开内容：战略影响 */}
          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-3">
              <div className="p-3.5 bg-amber-500/5 border-l-2 border-amber-500/40 rounded-r-xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3 h-3 text-amber-400" />
                  <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">战略影响</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.impact}</p>
              </div>

              {analysis.focus.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.focus.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 交互按钮 */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-[11px] font-medium text-slate-500 hover:text-cyan-400 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg transition-all"
          >
            {isExpanded ? (
              <>收起深度研判 <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>查看 AI 战略研判 <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 italic opacity-80">
          {item.content.replace(/【AI分析】.*/s, '').trim()}
        </p>
      )}

      {/* 底部来源 */}
      {hasValidLink && (
        <div className="mt-5 pt-4 border-t border-slate-800/50 flex justify-end">
          <a 
            href={item.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 hover:text-white transition-colors group/link"
          >
            访问原始情报源 
            <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      )}
    </div>
  );
}
