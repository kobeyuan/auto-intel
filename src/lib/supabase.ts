import { createClient } from '@supabase/supabase-js'

// 强制告诉 TypeScript：这两个变量绝对是字符串，不可能是 undefined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 兼容旧版 API 路由的调用方式
export const getSupabase = () => supabase;
