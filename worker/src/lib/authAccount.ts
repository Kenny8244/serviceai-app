import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'
import { getSupabase, getSupabaseAdmin, isSupabasePlaceholder, SUPABASE_CONFIG_HINT } from './supabase'

export class AuthHttpError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 409 | 500 | 503
  ) {
    super(message)
  }
}

export type RegisterInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  jobTitle?: string
  companySize?: string
  industry?: string
}

export type AuthAccount = {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  jobTitle?: string
  companySize?: string
  industry?: string
  tenantId?: string
  workspaceId?: string
  createdAt: string
  updatedAt: string
}

export function hasSupabaseLogin(env: Env): boolean {
  return Boolean(
    env.SUPABASE_URL &&
      env.SUPABASE_ANON_KEY &&
      !isSupabasePlaceholder(env.SUPABASE_URL) &&
      !isSupabasePlaceholder(env.SUPABASE_ANON_KEY)
  )
}

export function hasSupabaseAdminAccess(env: Env): boolean {
  return (
    hasSupabaseLogin(env) &&
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY && !isSupabasePlaceholder(env.SUPABASE_SERVICE_ROLE_KEY))
  )
}

function requireAdmin(env: Env): SupabaseClient {
  const admin = getSupabaseAdmin(env)
  if (!admin) {
    throw new AuthHttpError(`Sign-up is not configured. ${SUPABASE_CONFIG_HINT}`, 503)
  }
  return admin
}

function requireAnon(env: Env): SupabaseClient {
  const client = getSupabase(env)
  if (!client) {
    throw new AuthHttpError(`Authentication service is not configured. ${SUPABASE_CONFIG_HINT}`, 503)
  }
  return client
}

function dbClient(env: Env): SupabaseClient {
  return getSupabaseAdmin(env) || requireAnon(env)
}

function fullName(first: string, last: string) {
  return `${first} ${last}`.trim()
}

function splitName(full?: string | null): { firstName: string; lastName: string } {
  const parts = (full || '').trim().split(/\s+/)
  if (!parts[0]) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  job_title: string | null
  created_at: string
  updated_at: string
}

type TenantRow = {
  tenant_id: string
  name: string
  company_size: string | null
  industry: string | null
}

function mapAccount(profile: ProfileRow, tenant: TenantRow | null): AuthAccount {
  const split = splitName(profile.full_name)
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name || split.firstName,
    lastName: profile.last_name || split.lastName,
    companyName: tenant?.name || '',
    phoneNumber: profile.phone_number || '',
    jobTitle: profile.job_title || undefined,
    companySize: tenant?.company_size || undefined,
    industry: tenant?.industry || undefined,
    tenantId: tenant?.tenant_id,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

function throwIfWorkspaceLookupFailed(error: { message: string } | null): void {
  if (!error) return
  throw new Error(error.message)
}

export async function getWorkspaceIdForProfile(
  client: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data: role, error } = await client
    .from('user_workspace_roles')
    .select('workspace_id')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle()
  throwIfWorkspaceLookupFailed(error)
  return role?.workspace_id ?? null
}

/** Prefer JWT/active workspace when the user is a member; otherwise first membership.
 * Never trusts a preferred id without a matching user_workspace_roles row.
 */
export async function resolvePreferredWorkspaceId(
  client: SupabaseClient,
  profileId: string,
  preferredWorkspaceId?: string | null
): Promise<string | null> {
  const preferred =
    typeof preferredWorkspaceId === 'string' ? preferredWorkspaceId.trim() : ''
  if (preferred) {
    const { data: role, error } = await client
      .from('user_workspace_roles')
      .select('workspace_id')
      .eq('profile_id', profileId)
      .eq('workspace_id', preferred)
      .maybeSingle()
    throwIfWorkspaceLookupFailed(error)
    if (role?.workspace_id) return role.workspace_id as string
    // Spoofed or stale JWT workspaceId: fall through to first membership only.
  }
  return getWorkspaceIdForProfile(client, profileId)
}

async function loadTenantAndWorkspaceForProfile(
  client: SupabaseClient,
  profileId: string
): Promise<{ tenant: TenantRow | null; workspaceId: string | null }> {
  const workspaceId = await getWorkspaceIdForProfile(client, profileId)
  if (!workspaceId) return { tenant: null, workspaceId: null }

  const { data: workspace } = await client
    .from('workspaces')
    .select('tenant_id')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (!workspace?.tenant_id) return { tenant: null, workspaceId }

  const { data: tenant } = await client
    .from('tenants')
    .select('tenant_id, name, company_size, industry')
    .eq('tenant_id', workspace.tenant_id)
    .maybeSingle()
  return { tenant: (tenant as TenantRow | null) ?? null, workspaceId }
}

export async function findAccountById(env: Env, userId: string): Promise<AuthAccount | null> {
  const client = dbClient(env)
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return null
  const { tenant, workspaceId } = await loadTenantAndWorkspaceForProfile(client, userId)
  return { ...mapAccount(data as ProfileRow, tenant), workspaceId: workspaceId ?? undefined }
}

export async function findAccountByEmail(env: Env, email: string): Promise<AuthAccount | null> {
  const client = dbClient(env)
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error || !data) return null
  const { tenant, workspaceId } = await loadTenantAndWorkspaceForProfile(client, data.id)
  return { ...mapAccount(data as ProfileRow, tenant), workspaceId: workspaceId ?? undefined }
}

function isDuplicateEmail(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('already') || m.includes('registered') || m.includes('duplicate') || m.includes('exists')
}

export async function registerAccount(env: Env, input: RegisterInput): Promise<AuthAccount> {
  const admin = requireAdmin(env)
  const email = input.email.trim().toLowerCase()
  const existing = await findAccountByEmail(env, email)
  if (existing) throw new AuthHttpError('User with this email already exists', 409)

  const full_name = fullName(input.firstName, input.lastName)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name,
      phone_number: input.phoneNumber,
      job_title: input.jobTitle || null,
    },
  })
  if (error || !data.user) {
    if (error && isDuplicateEmail(error.message)) {
      throw new AuthHttpError('User with this email already exists', 409)
    }
    throw new AuthHttpError(error?.message || 'Failed to create user', 500)
  }

  const userId = data.user.id
  try {
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name,
        first_name: input.firstName,
        last_name: input.lastName,
        phone_number: input.phoneNumber,
        job_title: input.jobTitle || null,
      },
      { onConflict: 'id' }
    )
    if (profileError) throw profileError

    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .insert({
        name: input.companyName,
        company_size: input.companySize || null,
        industry: input.industry || null,
        status: 'active',
        metadata: { source: 'signup' },
      })
      .select('tenant_id, name, company_size, industry')
      .single()
    if (tenantError || !tenant) throw tenantError || new Error('Failed to create tenant')

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert({
        tenant_id: tenant.tenant_id,
        name: 'Default Workspace',
        description: 'Workspace created at sign-up',
      })
      .select('workspace_id')
      .single()
    if (workspaceError || !workspace) throw workspaceError || new Error('Failed to create workspace')

    const { error: roleError } = await admin.from('user_workspace_roles').insert({
      profile_id: userId,
      workspace_id: workspace.workspace_id,
      role: 'owner',
    })
    if (roleError) throw roleError

    const { ensureWorkspaceObjectTypes } = await import('./objectTypes')
    await ensureWorkspaceObjectTypes(admin, workspace.workspace_id)

    return {
      ...mapAccount(
        {
          id: userId,
          email,
          full_name,
          first_name: input.firstName,
          last_name: input.lastName,
          phone_number: input.phoneNumber,
          job_title: input.jobTitle || null,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        },
        tenant as TenantRow
      ),
      workspaceId: workspace.workspace_id,
    }
  } catch (err) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined)
    const message = err instanceof Error ? err.message : 'Failed to create account'
    throw new AuthHttpError(message, 500)
  }
}

export async function loginAccount(env: Env, email: string, password: string): Promise<AuthAccount> {
  const anon = requireAnon(env)
  const { data, error } = await anon.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error || !data.user) {
    throw new AuthHttpError('Invalid email or password', 401)
  }
  const account = await findAccountById(env, data.user.id)
  if (!account) {
    throw new AuthHttpError('Invalid email or password', 401)
  }
  return account
}

const DEMO: RegisterInput = {
  email: 'demo@simpleserviceai.com',
  password: 'demo123',
  firstName: 'Demo',
  lastName: 'User',
  companyName: 'Demo Company',
  phoneNumber: '+1 (555) 123-4567',
  jobTitle: 'Demo Manager',
  companySize: '11-50',
  industry: 'multi',
}

export async function ensureDemoAccount(env: Env): Promise<AuthAccount> {
  const existing = await findAccountByEmail(env, DEMO.email)
  if (existing) return existing
  return registerAccount(env, DEMO)
}
