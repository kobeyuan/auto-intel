'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Rss, Globe, MessageCircle } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  company?: string;
  category: string;
  tier: number;
  credibility_score: number;
  urls: Record<string, string>;
  rss?: {
    enabled: boolean;
    url?: string;
  };
  focus_areas: string[];
  enabled: boolean;
  manual_review: boolean;
  notes?: string;
}

interface SourceCategory {
  name: string;
  description: string;
  sources: DataSource[];
}

export default function SourcesManagementPage() {
  const [sources, setSources] = useState<Record<string, SourceCategory>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('official_sites');

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/admin/sources');
      const data = await response.json();
      setSources(data.sources || {});
    } catch (error) {
      console.error('加载数据源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (category: string, sourceId: string, enabled: boolean) => {
    try {
      await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', category, sourceId, enabled })
      });
      fetchSources();
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const getTierBadge = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800'
    };
    const labels: Record<number, string> = { 1: '官方', 2: '专业媒体', 3: '社区' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[tier]}`}>
        Tier {tier} - {labels[tier]}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">数据源管理</h1>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {Object.entries(sources).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg ${activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-white'}`}
          >
            {category.name} ({category.sources.length})
          </button>
        ))}
      </div>

      {/* Sources Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">数据源</th>
              <th className="px-6 py-3 text-left">等级</th>
              <th className="px-6 py-3 text-left">RSS</th>
              <th className="px-6 py-3 text-left">状态</th>
              <th className="px-6 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {sources[activeTab]?.sources.map((source) => (
              <tr key={source.id} className="border-t">
                <td className="px-6 py-4">
                  <div className="font-medium">{source.name}</div>
                  {source.company && <div className="text-sm text-gray-500">{source.company}</div>}
                </td>
                <td className="px-6 py-4">
                  {getTierBadge(source.tier)}
                  <div className="text-xs text-gray-500">可信度: {source.credibility_score}/100</div>
                </td>
                <td className="px-6 py-4">
                  {source.rss?.enabled ? (
                    <span className="text-green-600">✓ 已启用</span>
                  ) : (
                    <span className="text-gray-400">未启用</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleSource(activeTab, source.id, !source.enabled)}
                    className={source.enabled ? 'text-green-600' : 'text-gray-400'}
                  >
                    {source.enabled ? '已启用' : '已禁用'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
