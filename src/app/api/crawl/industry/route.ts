import { NextRequest, NextResponse } from 'next/server'
import { crawlIndustryNewsImproved } from '@/lib/improved-crawler'

export async function POST(request: NextRequest) {
  try {
    const { maxResults = 5, timeRange = 'week', trustedOnly = true, debug = false } = await request.json()
    
    console.log(`📰 开始采集行业新闻...`)
    console.log(`📊 配置: maxResults=${maxResults}, timeRange=${timeRange}, trustedOnly=${trustedOnly}`)
    
    const result = await crawlIndustryNewsImproved({
      maxResults,
      timeRange: timeRange as any,
      trustedOnly,
      debug
    })
    
    return NextResponse.json({
      success: true,
      message: '行业新闻采集完成',
      timestamp: new Date().toISOString(),
      ...result
    })
    
  } catch (error) {
    console.error('❌ 行业新闻采集失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '行业新闻采集失败',
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
    message: '使用 POST 请求采集行业新闻',
    parameters: {
      maxResults: 'number (默认: 5)',
      timeRange: 'day | week | month | year (默认: week)',
      trustedOnly: 'boolean (默认: true)',
      debug: 'boolean (可选)'
    },
    example: {
      method: 'POST',
      body: {
        maxResults: 5,
        timeRange: 'week',
        trustedOnly: true,
        debug: true
      }
    }
  })
}
