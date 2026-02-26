'use client'

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testData() {
      try {
        console.log('开始测试数据加载...')

        // 直接测试 Supabase
        const { createClient } = await import('@supabase/supabase-js')

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        console.log('环境变量:')
        console.log('SUPABASE_URL:', supabaseUrl?.substring(0, 20) + '...')
        console.log('SUPABASE_ANON_KEY:', supabaseAnonKey?.substring(0, 20) + '...')

        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')

        console.log('产品数据:', products)
        console.log('产品错误:', productsError)

        if (productsError) {
          setError('产品查询失败: ' + productsError.message)
        } else {
          setData({
            products: products,
            count: products?.length || 0
          })
        }
      } catch (e: any) {
        console.error('测试失败:', e)
        setError(e.message)
      }
    }

    testData()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">数据库测试页面</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          <h2 className="font-bold">错误:</h2>
          <pre>{error}</pre>
        </div>
      )}

      {data && (
        <div className="bg-green-100 text-green-800 p-4 rounded">
          <h2 className="font-bold">成功!</h2>
          <p>产品数量: {data.count}</p>
          <h3 className="font-bold mt-2">产品列表:</h3>
          <ul className="list-disc list-inside">
            {data.products.map((p: any) => (
              <li key={p.id}>{p.name} - {p.brand}</li>
            ))}
          </ul>
        </div>
      )}

      {!data && !error && (
        <p className="text-gray-600">正在加载数据...</p>
      )}

      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">环境变量:</h2>
        <pre>
          {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
        </pre>
      </div>
    </div>
  )
}
