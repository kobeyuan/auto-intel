import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { IndustryNewsQuery } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const searchParams = request.nextUrl.searchParams
    
    // 构建查询参数
    const query: IndustryNewsQuery = {
      category: searchParams.get('category') || undefined,
      sentiment: searchParams.get('sentiment') || undefined,
      importance: searchParams.get('importance') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }

    // 构建 Supabase 查询
    let supabaseQuery = supabase
      .from('industry_news')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })

    // 应用筛选条件
    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category)
    }
    if (query.sentiment) {
      supabaseQuery = supabaseQuery.eq('sentiment', query.sentiment)
    }
    if (query.importance) {
      supabaseQuery = supabaseQuery.eq('importance', query.importance)
    }
    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('published_at', query.start_date)
    }
    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('published_at', query.end_date)
    }

    // 应用分页
    supabaseQuery = supabaseQuery
      .range(query.offset!, query.offset! + query.limit! - 1)

    // 执行查询
    const { data, error, count } = await supabaseQuery

    if (error) {
      console.error('查询行业新闻失败:', error)
      return NextResponse.json(
        { error: '查询行业新闻失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit: query.limit,
        offset: query.offset
      }
    })

  } catch (error: any) {
    console.error('行业新闻API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()

    // 验证必要字段
    if (!body.title || !body.source || !body.source_url) {
      return NextResponse.json(
        { error: '缺少必要字段: title, source, source_url' },
        { status: 400 }
      )
    }

    // 检查是否已存在（基于 source_url）
    const { data: existing } = await supabase
      .from('industry_news')
      .select('id')
      .eq('source_url', body.source_url)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '该新闻已存在', id: existing.id },
        { status: 409 }
      )
    }

    // 准备数据
    const newsData = {
      title: body.title,
      content: body.content || '',
      source: body.source,
      source_url: body.source_url,
      category: body.category || 'other',
      keywords: body.keywords || [],
      sentiment: body.sentiment || 'neutral',
      importance: body.importance || 'medium',
      published_at: body.published_at || new Date().toISOString()
    }

    // 插入数据
    const { data, error } = await supabase
      .from('industry_news')
      .insert([newsData])
      .select()
      .single()

    if (error) {
      console.error('插入行业新闻失败:', error)
      return NextResponse.json(
        { error: '插入行业新闻失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '行业新闻添加成功',
      data
    })

  } catch (error: any) {
    console.error('行业新闻API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message },
      { status: 500 }
    )
  }
}