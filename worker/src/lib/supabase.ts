import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'

export function getSupabase(env: Env): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null
  if (env.SUPABASE_URL.includes('your-supabase')) return null
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

export function getSupabaseAdmin(env: Env): SupabaseClient | null {
  if (!env.SUPABASE_URL) return null
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  if (!key || env.SUPABASE_URL.includes('your-supabase')) return null
  return createClient(env.SUPABASE_URL, key)
}

export function hasSupabase(env: Env): boolean {
  return getSupabase(env) !== null
}
