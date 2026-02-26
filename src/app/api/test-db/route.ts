import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('开始测试数据库连接...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('SUPABASE_URL:', supabaseUrl?.substring(0, 20) + '...')
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey?.substring(0, 20) + '...')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('环境变量未配置')
    return NextResponse.json(
      { error: '环境变量未配置' },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('查询产品表...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')

    if (productsError) {
      console.error('产品查询错误:', productsError)
      return NextResponse.json(
        { error: '产品查询失败', details: productsError },
        { status: 500 }
      )
    }

    console.log('产品数量:', products?.length)

    return NextResponse.json({
      success: true,
      count: products?.length || 0,
      products: products?.slice(0, 5)
    })
  } catch (error: any) {
    console.error('数据库连接失败:', error)
    return NextResponse.json(
      { error: '数据库连接失败', details: error.message },
      { status: 500 }
    )
  }
}
