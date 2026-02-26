import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

export const getSupabase = () => {
  if (supabaseInstance) {
    console.log('[Supabase] 返回缓存的实例')
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  console.log('[Supabase] 创建新实例')
  console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : '未设置')
  console.log('[Supabase] Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '未设置')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] 环境变量未配置')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}
