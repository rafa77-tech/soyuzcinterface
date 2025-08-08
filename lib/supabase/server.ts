import { createClient } from '@supabase/supabase-js'
// import { cookies } from 'next/headers' // Removido: não usado atualmente
import type { Database } from './types'

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Durante o build, use valores fake para evitar erros
  if (!supabaseUrl || !supabaseKey) {
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-service-role-key'
    )
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey)
}

export const createRouteHandlerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Durante o build, use valores fake para evitar erros
  if (!supabaseUrl || !supabaseKey) {
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-service-role-key'
    )
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey)
}