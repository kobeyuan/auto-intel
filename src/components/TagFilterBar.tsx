'use client';

import React, { useRef } from 'react';
import { Tag, ChevronLeft, ChevronRight, LayoutDashboard, Brain } from 'lucide-react';

interface TagFilterBarProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterBar({ tags, selectedTag, onSelectTag }: TagFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative mb-12 flex items-center gap-4">
      {/* 标题 & 图标 */}
      <div className="flex items-center gap-2 pr-6 border-r border-slate-800 shrink-0">
        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <Brain className="w-4 h-4 text-cyan-500" />
        </div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
          情报筛选器
        </span>
      </div>

      {/* 左右滚动控件 (在移动端通常可以隐藏或根据情况显示) */}
      <div className="relative flex-1 group">
        {/* 左箭头 */}
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-400 hover:border-cyan-500/30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 标签容器 */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {/* 全部情报 */}
          <button
            onClick={() => onSelectTag(null)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border ${
              selectedTag === null
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            全部
          </button>

          {/* 动态标签 */}
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                selectedTag === tag
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              {tag}
            </button>
          ))}
        </div>

        {/* 右箭头 */}
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-400 hover:border-cyan-500/30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
