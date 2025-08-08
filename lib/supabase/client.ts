import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Durante o build, use valores fake para evitar erros
  if (!supabaseUrl || !supabaseAnonKey) {
    return createSupabaseClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    )
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()