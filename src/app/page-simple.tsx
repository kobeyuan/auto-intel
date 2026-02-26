'use client'

import { useState, useEffect } from 'react'

export default function HomeSimple() {
  const [products, setProducts] = useState<any[]>([])
  const [sentiments, setSentiments] = useState<any[]>([])
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
      setProducts(productsResult.products || [])

      // 加载舆情数据
      const sentimentsResponse = await fetch('/api/sentiments')
      const sentimentsResult = await sentimentsResponse.json()
      console.log('舆情数据:', sentimentsResult)
      setSentiments(sentimentsResult.sentiments || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">智能驾驶情报洞察 - 测试页面</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">数据统计</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500">产品总数</p>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500">舆情总数</p>
            <p className="text-3xl font-bold">{sentiments.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500">正面舆情</p>
            <p className="text-3xl font-bold text-green-600">
              {sentiments.filter(s => s.sentiment === 'positive').length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">产品列表</h2>
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">产品名称</th>
                <th className="px-4 py-2 text-left">品牌</th>
                <th className="px-4 py-2 text-left">分类</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 5).map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-2">{product.name}</td>
                  <td className="px-4 py-2">{product.brand}</td>
                  <td className="px-4 py-2">{product.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">最新舆情</h2>
        <div className="space-y-3">
          {sentiments.slice(0, 5).map((sentiment) => (
            <div key={sentiment.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{sentiment.title}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  sentiment.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                  sentiment.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sentiment.sentiment}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{sentiment.content}</p>
              <div className="text-sm text-gray-500 mt-2">
                {sentiment.source} · {new Date(sentiment.published_at).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}