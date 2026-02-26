'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Product, Sentiment, DashboardStats } from '@/types'
import { Car, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'autonomous-driving' | 'smart-cockpit'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('开始加载数据...')

      // 加载产品
      const productsResponse = await fetch('/api/products')
      const productsResult = await productsResponse.json()
      console.log('产品数据:', productsResult)

      if (!productsResponse.ok) {
        console.error('产品查询错误:', productsResult)
      } else {
        setProducts(productsResult.products || [])
      }

      // 加载舆情数据
      const sentimentsResponse = await fetch('/api/sentiments')
      const sentimentsResult = await sentimentsResponse.json()
      console.log('舆情数据:', sentimentsResult)

      if (!sentimentsResponse.ok) {
        console.error('舆情查询错误:', sentimentsResult)
      } else if (sentimentsResult.sentiments) {
        const sentiments = sentimentsResult.sentiments
        const positiveCount = sentiments.filter((s: any) => s.sentiment === 'positive').length
        const neutralCount = sentiments.filter((s: any) => s.sentiment === 'neutral').length
        const negativeCount = sentiments.filter((s: any) => s.sentiment === 'negative').length

        setStats({
          totalProducts: productsResult.products?.length || 0,
          totalSentiments: sentiments.length,
          positiveCount,
          neutralCount,
          negativeCount,
          recentSentiments: sentiments
            .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
            .slice(0, 10)
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">智能驾驶情报洞察</h1>
              <p className="text-sm text-slate-500">智能驾驶 & 智能座舱舆情监控平台</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            刷新数据
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">产品总数</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalProducts}</p>
                </div>
                <Car className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">舆情总数</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalSentiments}</p>
                </div>
                <Brain className="w-12 h-12 text-purple-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">正面舆情</p>
                  <p className="text-3xl font-bold text-green-600">{stats.positiveCount}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">负面舆情</p>
                  <p className="text-3xl font-bold text-red-600">{stats.negativeCount}</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setSelectedCategory('autonomous-driving')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'autonomous-driving'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              智能驾驶
            </button>
            <button
              onClick={() => setSelectedCategory('smart-cockpit')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'smart-cockpit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              智能座舱
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">产品列表</h2>
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-slate-500">{product.brand}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.category === 'autonomous-driving'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {product.category === 'autonomous-driving' ? '智能驾驶' : '智能座舱'}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-center text-slate-500 py-8">暂无产品数据</p>
              )}
            </div>
          </div>

          {/* Recent Sentiments */}
          {stats && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">最新舆情</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {stats.recentSentiments.map((sentiment) => (
                  <div
                    key={sentiment.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-slate-900 dark:text-white flex-1">
                        {sentiment.title}
                      </h3>
                      {getSentimentIcon(sentiment.sentiment)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                      {sentiment.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600">
                        {sentiment.source}
                      </span>
                      <span className="text-slate-400">
                        {new Date(sentiment.published_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.recentSentiments.length === 0 && (
                  <p className="text-center text-slate-500 py-8">暂无舆情数据</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
