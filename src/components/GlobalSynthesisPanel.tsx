'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Terminal, Brain } from 'lucide-react';

interface GlobalSynthesisPanelProps {
  summary: string;
  loading?: boolean;
}

export function GlobalSynthesisPanel({ summary, loading }: GlobalSynthesisPanelProps) {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading || !summary) {
      setDisplayText('');
      setIndex(0);
      return;
    }

    if (index < summary.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + summary[index]);
        setIndex((prev) => prev + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [index, summary, loading, mounted]);

  // Hydration guard
  if (!mounted) return null;

  return (
    <section className="relative mb-20 group">
      <div className="relative p-12 rounded-[2rem] bg-white border border-slate-200 shadow-xl overflow-hidden glow-card">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(59,130,246,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan pointer-events-none opacity-50" />

        <div className="relative flex flex-col xl:flex-row gap-16 items-stretch">
          <div className="flex-1 space-y-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shadow-sm">
                <Brain className="w-9 h-9 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-600 uppercase tracking-[0.5em] mb-2">
                  Global Strategic Inference | 全球战略研判
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1.5 h-4 bg-blue-600/30 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Neural Processing Active</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {loading ? (
                <div className="space-y-6">
                  <div className="h-10 bg-slate-100 rounded-lg w-full animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded-lg w-5/6 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-3xl md:text-4xl font-black text-slate-900 leading-[1.4] tracking-tight antialiased">
                    {displayText}
                    <span className="inline-block w-3 h-10 bg-blue-600 ml-3 animate-pulse align-bottom shadow-sm" />
                  </p>
                  <div className="flex gap-4">
                    <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 rounded uppercase tracking-widest">
                      Strategic Priority: Alpha
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 rounded uppercase tracking-widest">
                      Impact: Paradigm Shift
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 w-full xl:w-80 flex flex-col gap-6">
            <div className="flex-1 p-8 bg-slate-50 border-l-4 border-emerald-500 rounded-r-2xl flex flex-col justify-center shadow-sm">
              <div className="text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em] flex items-center justify-between">
                <span>System Confidence</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">98.4</span>
                <span className="text-xl font-black text-emerald-600">%</span>
              </div>
              <div className="mt-4 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98.4%] shadow-sm" />
              </div>
            </div>

            <div className="flex-1 p-8 bg-slate-50 border-l-4 border-blue-500 rounded-r-2xl flex flex-col justify-center shadow-sm">
              <div className="text-xs font-black text-slate-500 uppercase mb-4 tracking-[0.2em] flex items-center justify-between">
                <span>Intelligence Nodes</span>
                <Terminal className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">1,240</span>
                <span className="text-xl font-black text-blue-600">+</span>
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aggregated from 48 Global Sources
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
