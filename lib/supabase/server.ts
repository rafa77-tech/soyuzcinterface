import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './types'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

export const createRouteHandlerClient = () => {
  return createServerComponentClient<Database>({
    cookies: () => cookies()
  })
}