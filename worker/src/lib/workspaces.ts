import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'
import { getWorkspaceIdForProfile } from './authAccount'
import { ensureWorkspaceObjectTypes } from './objectTypes'
import { getSupabaseAdmin, SUPABASE_CONFIG_HINT } from './supabase'

export class WorkspacesHttpError extends Error {
  constructor(
    message: string,
    public status: 400 | 403 | 404 | 500 | 503
  ) {
    super(message)
  }
}

export type WorkspaceRecord = {
  id: string
  name: string
  description: string | null
  tenantId: string
  role: string
  createdAt: string
  updatedAt: string
}

type WorkspaceRow = {
  workspace_id: string
  tenant_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

function requireAdmin(env: Env): SupabaseClient {
  const admin = getSupabaseAdmin(env)
  if (!admin) {
    throw new WorkspacesHttpError(`Workspace API requires Supabase. ${SUPABASE_CONFIG_HINT}`, 503)
  }
  return admin
}

function mapWorkspace(row: WorkspaceRow, role: string): WorkspaceRecord {
  return {
    id: row.workspace_id,
    name: row.name,
    description: row.description,
    tenantId: row.tenant_id,
    role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listWorkspacesForUser(env: Env, profileId: string): Promise<WorkspaceRecord[]> {
  const admin = requireAdmin(env)
  const { data: roles, error: rolesError } = await admin
    .from('user_workspace_roles')
    .select('workspace_id, role')
    .eq('profile_id', profileId)

  if (rolesError) {
    console.error('Failed to list workspace roles:', rolesError.message)
    throw new WorkspacesHttpError('Could not load workspaces.', 500)
  }

  const memberships = roles ?? []
  if (memberships.length === 0) return []

  const ids = memberships.map((row) => row.workspace_id as string)
  const { data: workspaces, error } = await admin
    .from('workspaces')
    .select('workspace_id, tenant_id, name, description, created_at, updated_at')
    .in('workspace_id', ids)

  if (error) {
    console.error('Failed to list workspaces:', error.message)
    throw new WorkspacesHttpError('Could not load workspaces.', 500)
  }

  const roleById = new Map(memberships.map((row) => [row.workspace_id as string, String(row.role)]))
  return ((workspaces ?? []) as WorkspaceRow[]).map((row) =>
    mapWorkspace(row, roleById.get(row.workspace_id) || 'member')
  )
}

export async function getWorkspaceForUser(
  env: Env,
  profileId: string,
  workspaceId: string
): Promise<WorkspaceRecord | null> {
  const admin = requireAdmin(env)
  const { data: role } = await admin
    .from('user_workspace_roles')
    .select('role')
    .eq('profile_id', profileId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!role) return null

  const { data: workspace, error } = await admin
    .from('workspaces')
    .select('workspace_id, tenant_id, name, description, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load workspace:', error.message)
    throw new WorkspacesHttpError('Could not load workspace.', 500)
  }
  if (!workspace) return null
  return mapWorkspace(workspace as WorkspaceRow, String(role.role))
}

export async function completeOnboardingWorkspace(
  env: Env,
  profileId: string,
  input: { name: string; description?: string | null }
): Promise<WorkspaceRecord> {
  const admin = requireAdmin(env)
  const name = input.name.trim()
  if (!name) {
    throw new WorkspacesHttpError('Workspace name is required.', 400)
  }
  const description =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : null

  const existingId = await getWorkspaceIdForProfile(admin, profileId)
  if (existingId) {
    const patch: Record<string, unknown> = {
      name,
      updated_at: new Date().toISOString(),
    }
    if (typeof input.description === 'string') {
      patch.description = description ?? 'Workspace configured during onboarding'
    }

    const { data, error } = await admin
      .from('workspaces')
      .update(patch)
      .eq('workspace_id', existingId)
      .select('workspace_id, tenant_id, name, description, created_at, updated_at')
      .single()

    if (error || !data) {
      console.error('Failed to update workspace:', error?.message)
      throw new WorkspacesHttpError('Could not update workspace.', 500)
    }

    const { data: role } = await admin
      .from('user_workspace_roles')
      .select('role')
      .eq('profile_id', profileId)
      .eq('workspace_id', existingId)
      .maybeSingle()

    return mapWorkspace(data as WorkspaceRow, String(role?.role || 'owner'))
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, first_name, last_name')
    .eq('id', profileId)
    .maybeSingle()

  if (profileError || !profile) {
    throw new WorkspacesHttpError('User profile not found.', 404)
  }

  const companyName =
    name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    profile.full_name ||
    'My Business'

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name: companyName,
      status: 'active',
      metadata: { source: 'onboarding' },
    })
    .select('tenant_id')
    .single()

  if (tenantError || !tenant) {
    console.error('Failed to create tenant during onboarding:', tenantError?.message)
    throw new WorkspacesHttpError('Could not create workspace.', 500)
  }

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .insert({
      tenant_id: tenant.tenant_id,
      name,
      description: description ?? 'Workspace created during onboarding',
    })
    .select('workspace_id, tenant_id, name, description, created_at, updated_at')
    .single()

  if (workspaceError || !workspace) {
    console.error('Failed to create workspace during onboarding:', workspaceError?.message)
    throw new WorkspacesHttpError('Could not create workspace.', 500)
  }

  const { error: roleError } = await admin.from('user_workspace_roles').insert({
    profile_id: profileId,
    workspace_id: workspace.workspace_id,
    role: 'owner',
  })
  if (roleError) {
    console.error('Failed to create workspace role:', roleError.message)
    throw new WorkspacesHttpError('Could not associate user with workspace.', 500)
  }

  await ensureWorkspaceObjectTypes(admin, workspace.workspace_id)
  return mapWorkspace(workspace as WorkspaceRow, 'owner')
}

export async function assertWorkspaceMembership(
  env: Env,
  profileId: string,
  workspaceId: string
): Promise<WorkspaceRecord> {
  const workspace = await getWorkspaceForUser(env, profileId, workspaceId)
  if (!workspace) {
    throw new WorkspacesHttpError('Workspace not found or access denied.', 404)
  }
  return workspace
}
