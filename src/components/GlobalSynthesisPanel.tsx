'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, ShieldCheck, Terminal } from 'lucide-react';

interface GlobalSynthesisPanelProps {
  summary: string;
  loading?: boolean;
}

export function GlobalSynthesisPanel({ summary, loading }: GlobalSynthesisPanelProps) {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (loading) {
      setDisplayText('');
      setIndex(0);
      return;
    }

    if (index < summary.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + summary[index]);
        setIndex((prev) => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [index, summary, loading]);

  return (
    <section className="relative mb-12 group">
      {/* 科技感背景网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-[2rem] pointer-events-none" />
      
      <div className="relative p-8 rounded-[2rem] bg-slate-900/30 border border-slate-800 backdrop-blur-sm overflow-hidden ring-1 ring-white/5 shadow-2xl">
        {/* 动态呼吸高光 */}
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-pulse" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center ring-2 ring-slate-900">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-slate-900">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="h-px w-8 bg-slate-800" />
              <h2 className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2">
                AI 全局态势推演 
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </h2>
            </div>

            <div className="relative min-h-[80px]">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded-full w-full animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded-full w-2/3 animate-pulse" />
                </div>
              ) : (
                <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed tracking-tight">
                  {displayText}
                  <span className="inline-block w-1.5 h-5 bg-cyan-500 ml-1 animate-pulse align-middle" />
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-48 flex lg:flex-col gap-3">
            <div className="flex-1 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                系统置信度
              </div>
              <div className="text-lg font-black text-white italic">98.4%</div>
            </div>
            <div className="flex-1 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-500" />
                推演节点
              </div>
              <div className="text-lg font-black text-white italic">1,240+</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Brain } from 'lucide-react';
