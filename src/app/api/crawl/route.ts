import { NextRequest, NextResponse } from 'next/server'
import { crawlSentiments } from '@/lib/crawler'

export async function POST(request: NextRequest) {
  try {
    const result = await crawlSentiments()

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Crawl error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '数据采集失败'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '使用 POST 请求触发数据采集'
  })
}
