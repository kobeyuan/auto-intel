import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data: sentiments, error } = await supabase
      .from('sentiments')
      .select('*')

    if (error) {
      console.error('舆情查询错误:', error)
      return NextResponse.json(
        { error: '查询失败', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ sentiments })
  } catch (error: any) {
    console.error('服务器错误:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    )
  }
}
