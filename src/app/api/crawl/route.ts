import { NextRequest, NextResponse } from 'next/server'
import { crawlIndustryNewsImproved, crawlProductSentimentsImproved } from '@/lib/improved-crawler'
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { type = 'all', debug = false } = await request.json()
    
    console.log(`🚀 开始数据采集 (类型: ${type}, 调试: ${debug})`)
    
    let industryResult = null
    let sentimentResult = null
    
    // 采集行业新闻
    if (type === 'all' || type === 'industry') {
      console.log('📰 采集行业新闻...')
      industryResult = await crawlIndustryNewsImproved({
        maxResults: 5,
        timeRange: 'week',
        trustedOnly: true,
        debug: debug
      })
    }
    
    // 采集产品舆情
    if (type === 'all' || type === 'sentiment') {
      console.log('📊 采集产品舆情...')
      sentimentResult = await crawlProductSentimentsImproved({
        maxResults: 3,
        timeRange: 'week',
        trustedOnly: true,
        debug: debug
      })
    }
    
    const result = {
      success: true,
      message: '数据采集完成',
      timestamp: new Date().toISOString(),
      industry: industryResult,
      sentiment: sentimentResult
    }
    
    console.log('✅ 数据采集完成')
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ 数据采集失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '数据采集失败',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '使用 POST 请求触发数据采集',
    endpoints: {
      'POST /api/crawl': '触发数据采集',
      'POST /api/crawl/industry': '采集行业新闻',
      'POST /api/crawl/sentiment': '采集产品舆情'
    },
    parameters: {
      type: 'all | industry | sentiment',
      debug: 'boolean (可选)'
    },
    example: {
      method: 'POST',
      body: {
        type: 'all',
        debug: true
      }
    }
  })
}
