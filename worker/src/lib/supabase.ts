import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'

export function getSupabase(env: Env): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null
  if (env.SUPABASE_URL.includes('your-supabase')) return null
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

export function getSupabaseAdmin(env: Env): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null
  if (env.SUPABASE_URL.includes('your-supabase') || env.SUPABASE_URL.includes('your-project-ref')) return null
  if (env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase') || env.SUPABASE_SERVICE_ROLE_KEY.includes('replace-with')) {
    return null
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasSupabase(env: Env): boolean {
  return getSupabase(env) !== null
}
