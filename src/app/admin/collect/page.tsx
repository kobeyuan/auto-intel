'use client';

import { useState, useEffect } from 'react';
import { Play, RefreshCw, CheckCircle, AlertCircle, Globe, Rss } from 'lucide-react';
import { collectIntelligence, collectRSS, checkAPIHealth, VERCEL_API_BASE } from '@/lib/api-config';

export default function CollectPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 检查 API 状态
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await checkAPIHealth();
      setApiStatus(health.status === 'healthy' ? 'online' : 'offline');
    } catch (e) {
      setApiStatus('offline');
    }
  };

  const handleCollect = async (type: 'full' | 'rss') => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = type === 'full' ? await collectIntelligence() : await collectRSS();
      setResult(data);
    } catch (err: any) {
      setError(err.message || '采集失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">情报采集控制面板</h1>
        <p className="text-gray-600 mb-6">
          通过 Vercel API 触发情报采集任务
        </p>

        {/* API 状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">API 状态</h2>
              <p className="text-sm text-gray-500">{VERCEL_API_BASE}</p>
            </div>
            <div className="flex items-center gap-2">
              {apiStatus === 'checking' && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  检查中...
                </span>
              )}
              {apiStatus === 'online' && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  在线
                </span>
              )}
              {apiStatus === 'offline' && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  离线
                </span>
              )}
              <button
                onClick={checkHealth}
                className="ml-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* 采集按钮 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">完整采集</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              通过 Brave Search API 采集全网情报
              <br />
              预计耗时：2-5 分钟
            </p>
            <button
              onClick={() => handleCollect('full')}
              disabled={loading || apiStatus !== 'online'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  采集中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始采集
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Rss className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold">RSS 采集</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              从配置的 RSS 源采集最新情报
              <br />
              预计耗时：30 秒 - 1 分钟
            </p>
            <button
              onClick={() => handleCollect('rss')}
              disabled={loading || apiStatus !== 'online'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  采集中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始 RSS 采集
                </>
              )}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">采集失败</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* 结果展示 */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">采集结果</h3>
            <pre className="bg-gray-50 rounded p-4 overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* 配置说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">配置说明</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Vercel API 地址：{VERCEL_API_BASE}</li>
            <li>需在 Cloudflare Pages 环境变量中设置 NEXT_PUBLIC_VERCEL_API_URL</li>
            <li>首次使用请在 Vercel Dashboard 中配置环境变量</li>
            <li>建议设置定时任务自动采集（可使用 GitHub Actions 或 cron-job.org）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
