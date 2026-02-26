'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Globe } from 'lucide-react'
import type { IndustryNews } from '@/types'

interface IndustryNewsPanelProps {
  limit?: number
  showControls?: boolean
}

export default function IndustryNewsPanel({ limit = 10, showControls = true }: IndustryNewsPanelProps) {
  const [news, setNews] = useState<IndustryNews[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [error, setError] = useState<string>('')

  const loadIndustryNews = async () => {
    try {
      setLoading(true)
      setError('')
      
      let url = '/api/industry-news?limit=' + limit
      if (filter !== 'all') {
        url += '&category=' + filter
      }

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '加载失败')
      }

      setNews(result.data || [])
    } catch (err: any) {
      console.error('加载行业新闻失败:', err)
      setError(err.message || '加载行业新闻失败')
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const triggerCrawl = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/crawl/industry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxResults: 5 })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '采集失败')
      }

      alert(`采集完成！新增 ${result.summary.totalAdded} 条新闻`)
      loadIndustryNews() // 重新加载
    } catch (err: any) {
      console.error('触发采集失败:', err)
      alert('采集失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIndustryNews()
  }, [filter, limit])

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const categoryLabels: Record<string, string> = {
    'technology': '技术动态',
    'product': '产品发布',
    'policy': '政策法规',
    'funding': '融资动态',
    'partnership': '合作',
    'other': '其他'
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center text-red-500">
          <p>行业新闻加载失败</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <p className="text-sm text-gray-500 mt-1">
            industry_news 表可能不存在，请在 Supabase 中运行 SQL 脚本
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">行业情报洞察</h2>
          <p className="text-sm text-slate-500">智能驾驶 & 智能座舱行业动态</p>
        </div>
        
        {showControls && (
          <div className="flex gap-2">
            <button
              onClick={triggerCrawl}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '采集中...' : '采集新闻'}
            </button>
          </div>
        )}
      </div>

      {/* 筛选器 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            全部
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 新闻列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">加载行业新闻中...</div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">暂无行业新闻数据</div>
          <p className="text-sm text-gray-400 mt-2">
            点击"采集新闻"按钮开始采集行业动态
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {news.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-slate-900 dark:text-white flex-1">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.title}
                  </a>
                </h3>
                <div className="flex items-center gap-2 ml-2">
                  {getSentimentIcon(item.sentiment)}
                  {getImportanceIcon(item.importance)}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {item.content}
              </p>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {item.source}
                  </span>
                  
                  <span className={`px-2 py-1 rounded-full ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment === 'positive' ? '正面' : 
                     item.sentiment === 'negative' ? '负面' : '中性'}
                  </span>
                  
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {categoryLabels[item.category] || item.category}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-2 sm:mt-0">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.published_at.toString())}
                </div>
              </div>

              {/* 关键词 */}
              {item.keywords && item.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.keywords.slice(0, 4).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {news.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-sm text-slate-500">
            <span>共 {news.length} 条行业新闻</span>
            <button
              onClick={loadIndustryNews}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              刷新
            </button>
          </div>
        </div>
      )}
    </div>
  )
}