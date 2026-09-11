import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'

/** Clear copy for developers when Worker env is incomplete. */
export const SUPABASE_CONFIG_HINT =
  'Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in worker/.dev.vars (see worker/.dev.vars.example).'

export function isSupabasePlaceholder(value?: string): boolean {
  return !value || /your-supabase|your-project-ref|replace-with/i.test(value)
}

export type SupabaseConfigStatus = {
  supabaseConfigured: boolean
  supabaseAdminConfigured: boolean
  usingDemoFallback: boolean
  hint?: string
}

export function getSupabaseConfigStatus(env: Env): SupabaseConfigStatus {
  const supabaseConfigured =
    Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY) &&
    !isSupabasePlaceholder(env.SUPABASE_URL) &&
    !isSupabasePlaceholder(env.SUPABASE_ANON_KEY)

  const supabaseAdminConfigured =
    supabaseConfigured &&
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY) &&
    !isSupabasePlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)

  return {
    supabaseConfigured,
    supabaseAdminConfigured,
    usingDemoFallback: !supabaseConfigured,
    hint: supabaseAdminConfigured ? undefined : SUPABASE_CONFIG_HINT,
  }
}

export function getSupabase(env: Env): SupabaseClient | null {
  if (
    !env.SUPABASE_URL ||
    !env.SUPABASE_ANON_KEY ||
    isSupabasePlaceholder(env.SUPABASE_URL) ||
    isSupabasePlaceholder(env.SUPABASE_ANON_KEY)
  ) {
    return null
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

export function getSupabaseAdmin(env: Env): SupabaseClient | null {
  if (
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    isSupabasePlaceholder(env.SUPABASE_URL) ||
    isSupabasePlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    return null
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export function hasSupabase(env: Env): boolean {
  return getSupabase(env) !== null
}
