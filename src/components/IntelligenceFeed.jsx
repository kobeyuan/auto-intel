"use client"; // 如果你用的是 Next.js App Router，必须加上这行声明它是客户端组件
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // 注意路径要根据你的实际位置调整

export default function IntelligenceFeed({ category = 'smart-cockpit' }) {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIntelligence() {
      // 从数据库中按分类获取最新的 5 条情报
      const { data, error } = await supabase
        .from('industry_intelligence')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error("获取数据失败:", error);
      } else {
        setNewsList(data);
      }
      setLoading(false);
    }

    fetchIntelligence();
  }, [category]);

  if (loading) return <div className="text-cyan-400 animate-pulse">核心情报加载中...</div>;

  return (
    <div className="space-y-4">
      {newsList.map((news) => (
        <div key={news.id} className="p-4 border border-gray-700 bg-gray-900/50 rounded-lg hover:border-cyan-500 transition-colors">
          <h3 className="text-lg font-bold text-white mb-2">{news.title}</h3>
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{news.snippet}</p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-cyan-600 bg-cyan-900/30 px-2 py-1 rounded">来源: {news.source}</span>
            <a href={news.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
              深度阅读 ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
