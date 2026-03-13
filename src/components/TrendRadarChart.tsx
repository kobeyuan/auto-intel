'use client';

import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { Activity, Target } from 'lucide-react';

interface TrendRadarChartProps {
  data: any[];
}

export function TrendRadarChart({ data }: TrendRadarChartProps) {
  const chartData = useMemo(() => {
    // 核心标签映射
    const categoryMap: Record<string, string> = {
      'autonomous-driving': '智能驾驶',
      'smart-cockpit': '智能座舱',
      'sensors': '感知硬件',
      'gtc-insight': '芯片算力',
      'ota': '系统动态',
      'sentiment': '舆情热度'
    };

    const stats: Record<string, { count: number; score: number }> = {};
    
    // 初始化
    Object.values(categoryMap).forEach(cat => {
      stats[cat] = { count: 0, score: 0 };
    });

    // 统计
    data.forEach(item => {
      const catName = categoryMap[item.category] || '其他';
      if (stats[catName]) {
        stats[catName].count += 1;
        stats[catName].score += (item.quality_score || 5);
      }
    });

    return Object.entries(stats).map(([subject, stat]) => ({
      subject,
      A: stat.count * 10, // 热度
      B: (stat.score / (stat.count || 1)) * 10, // 重要性
      fullMark: 100,
    }));
  }, [data]);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <Target className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">态势感知雷达</h2>
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>热度</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>重要度</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="情报热度"
              dataKey="A"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.2}
            />
            <Radar
              name="平均重要度"
              dataKey="B"
              stroke="#f43f5e"
              fill="#f43f5e"
              fillOpacity={0.1}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-black mt-4">
        基于近 7 天全网 1,200+ 节点数据的实时计算结果
      </p>
    </div>
  );
}
