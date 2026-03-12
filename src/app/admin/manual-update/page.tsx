'use client';

import { useState } from 'react';
import { RefreshCw, Play, Globe, Rss, CheckCircle, AlertCircle } from 'lucide-react';

export default function ManualUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerUpdate = async (type: 'full' | 'rss') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = type === 'full'
        ? `${baseUrl}/api/update_intel`
        : `${baseUrl}/api/rss_collect`;

      const response = await fetch(endpoint, { method: 'GET' });
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || '更新失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">手动更新情报</h1>
        <p className="text-gray-600 mb-8">
          点击按钮手动触发情报采集任务
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 完整采集 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-blue-600" />
              <h2 className="text-xl font-semibold">完整采集</h2>
            </div>
            <p className="text-gray-600 mb-6">
              通过 Brave Search API 全网采集最新情报
            </p>
            <button
              onClick={() => triggerUpdate('full')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {loading ? '采集中...' : '开始完整采集'}
            </button>
          </div>

          {/* RSS 采集 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Rss className="w-8 h-8 text-green-600" />
              <h2 className="text-xl font-semibold">RSS 采集</h2>
            </div>
            <p className="text-gray-600 mb-6">
              从配置的 RSS 源采集最新情报
            </p>
            <button
              onClick={() => triggerUpdate('rss')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {loading ? '采集中...' : '开始 RSS 采集'}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">更新失败</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* 结果展示 */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 text-green-700 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">更新成功</span>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
