import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}
