'use client';

import React from 'react';
import { Sparkles, Target, Zap, TrendingUp, ExternalLink, ChevronRight } from 'lucide-react';
import { IndustryNews } from '@/types';
import { parseAIAnalysis, isValidUrl } from '@/utils/intelligence';

interface ExecutiveBriefingProps {
  items: IndustryNews[];
}

export function ExecutiveBriefing({ items }: ExecutiveBriefingProps) {
  if (items.length === 0) return null;

  return (
    <section className="relative mb-16 overflow-hidden">
      {/* 装饰性背景高光 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[120%] bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100 tracking-tight">
              今日战略聚焦 <span className="text-xs font-bold text-amber-500/80 ml-2 uppercase tracking-widest">Top Focus</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">经 AI 深度研判，从全球情报库中优选的 3 条高价值战略动向</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.slice(0, 3).map((item, idx) => {
            const analysis = parseAIAnalysis(item.content);
            return (
              <div 
                key={item.id}
                className="group relative flex flex-col p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
              >
                {/* 排名装饰 */}
                <div className="absolute top-4 right-6 text-4xl font-black text-amber-500/5 italic select-none">
                  0{idx + 1}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-tighter">
                    核心情报
                  </span>
                  {item.quality_score && (
                    <span className="text-[10px] font-bold text-amber-200/60 flex items-center gap-1">
                      战略价值: {item.quality_score}
                    </span>
                  )}
                </div>

                <h3 className="text-[16px] font-bold text-slate-100 mb-6 leading-tight group-hover:text-amber-300 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {analysis && (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400/80 uppercase">
                        <Sparkles className="w-3 h-3" />
                        战略研判
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {analysis.impact}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-slate-800/50 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{item.source}</span>
                  </div>
                  {isValidUrl(item.source_url) && (
                    <a 
                      href={item.source_url} 
                      target="_blank"
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-400/60 hover:text-amber-300 transition-colors uppercase tracking-widest"
                    >
                      详情 <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
