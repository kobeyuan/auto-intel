'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

export default function TestPage() {
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const testConnection = async () => {
    try {
      addLog('开始测试数据库连接...')

      // 测试 products 表
      addLog('查询 products 表...')
      const { data: products, error: productsError } = await getSupabase()
        .from('products')
        .select('*')

      if (productsError) {
        addLog(`❌ Products 错误: ${productsError.message}`)
      } else {
        addLog(`✅ Products 查询成功，共 ${products?.length || 0} 条记录`)
        addLog(`产品列表: ${JSON.stringify(products, null, 2)}`)
      }

      // 测试 sentiments 表
      addLog('查询 sentiments 表...')
      const { data: sentiments, error: sentimentsError } = await getSupabase()
        .from('sentiments')
        .select('*')

      if (sentimentsError) {
        addLog(`❌ Sentiments 错误: ${sentimentsError.message}`)
      } else {
        addLog(`✅ Sentiments 查询成功，共 ${sentiments?.length || 0} 条记录`)
        if (sentiments && sentiments.length > 0) {
          addLog(`第一条舆情: ${JSON.stringify(sentiments[0], null, 2)}`)
        }
      }

      // 测试表结构
      addLog('检查数据库环境变量...')
      addLog(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
      addLog(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...`)

    } catch (error) {
      addLog(`❌ 测试失败: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">数据库连接测试</h1>

        <button
          onClick={testConnection}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-6"
        >
          开始测试
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">测试日志</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {log.length === 0 && <p className="text-gray-500">点击"开始测试"按钮</p>}
            {log.map((item, index) => (
              <div key={index} className="font-mono text-sm p-2 bg-gray-50 rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
