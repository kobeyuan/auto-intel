import { createClient } from '@supabase/supabase-js'

// 前端只能使用公开的 ANON KEY，千万不要把 Service Role Key 放到这里！
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
