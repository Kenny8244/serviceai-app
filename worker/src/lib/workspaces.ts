import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'
import { getWorkspaceIdForProfile, resolvePreferredWorkspaceId } from './authAccount'
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

export type WorkspaceMember = {
  id: string
  name: string
  email: string
}

function memberName(row: {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}): string {
  const combined = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
  return combined || row.full_name?.trim() || row.email?.trim() || 'Member'
}

export async function listWorkspaceMembers(
  env: Env,
  profileId: string,
  preferredWorkspaceId?: string | null
): Promise<WorkspaceMember[]> {
  const admin = requireAdmin(env)
  const workspaceId = await resolvePreferredWorkspaceId(admin, profileId, preferredWorkspaceId)
  if (!workspaceId) return []

  const { data: roles, error: rolesError } = await admin
    .from('user_workspace_roles')
    .select('profile_id')
    .eq('workspace_id', workspaceId)

  if (rolesError) {
    console.error('Failed to list workspace members:', rolesError.message)
    throw new WorkspacesHttpError('Could not load workspace members.', 500)
  }

  const ids = [...new Set((roles ?? []).map((row) => String(row.profile_id)).filter(Boolean))]
  if (ids.length === 0) return []

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, first_name, last_name, email')
    .in('id', ids)

  if (error) {
    console.error('Failed to load member profiles:', error.message)
    throw new WorkspacesHttpError('Could not load workspace members.', 500)
  }

  return (profiles ?? [])
    .map((row) => ({
      id: String(row.id),
      name: memberName(row),
      email: typeof row.email === 'string' ? row.email : '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
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

type WorkspaceMetaRow = WorkspaceRow & { metadata?: unknown }

function metadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export type WorkspaceNotificationPreferences = {
  email: boolean
  push: boolean
  sms: boolean
}

export type WorkspacePreferences = {
  timezone: string
  language: string
  notifications: WorkspaceNotificationPreferences
}

export type WorkspacePreferencesRecord = {
  workspaceId: string
  businessName: string
  preferences: WorkspacePreferences
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  timezone: 'America/New_York',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
}

function parseNotifications(value: unknown): WorkspaceNotificationPreferences {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return {
    email:
      typeof source.email === 'boolean'
        ? source.email
        : DEFAULT_WORKSPACE_PREFERENCES.notifications.email,
    push:
      typeof source.push === 'boolean'
        ? source.push
        : DEFAULT_WORKSPACE_PREFERENCES.notifications.push,
    sms:
      typeof source.sms === 'boolean'
        ? source.sms
        : DEFAULT_WORKSPACE_PREFERENCES.notifications.sms,
  }
}

export function parseWorkspacePreferences(value: unknown): WorkspacePreferences {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return {
    timezone:
      typeof source.timezone === 'string' && source.timezone.trim()
        ? source.timezone.trim()
        : DEFAULT_WORKSPACE_PREFERENCES.timezone,
    language:
      typeof source.language === 'string' && source.language.trim()
        ? source.language.trim()
        : DEFAULT_WORKSPACE_PREFERENCES.language,
    notifications: parseNotifications(source.notifications),
  }
}

function preferencesFromMetadata(metadata: unknown): WorkspacePreferences {
  return parseWorkspacePreferences(metadataRecord(metadata).preferences)
}

export async function getWorkspacePreferences(
  env: Env,
  profileId: string,
  workspaceId: string
): Promise<WorkspacePreferencesRecord> {
  const admin = requireAdmin(env)
  await assertWorkspaceMembership(env, profileId, workspaceId)

  const { data, error } = await admin
    .from('workspaces')
    .select('workspace_id, name, metadata')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load workspace preferences:', error.message)
    throw new WorkspacesHttpError('Could not load workspace preferences.', 500)
  }
  if (!data) {
    throw new WorkspacesHttpError('Workspace not found or access denied.', 404)
  }

  return {
    workspaceId: data.workspace_id as string,
    businessName: String(data.name || ''),
    preferences: preferencesFromMetadata(data.metadata),
  }
}

export async function updateWorkspacePreferences(
  env: Env,
  profileId: string,
  workspaceId: string,
  input: {
    businessName?: string
    preferences?: {
      timezone?: string
      language?: string
      notifications?: Partial<WorkspaceNotificationPreferences>
    }
  }
): Promise<WorkspacePreferencesRecord> {
  const admin = requireAdmin(env)
  await assertWorkspaceMembership(env, profileId, workspaceId)

  const { data: existing, error: loadError } = await admin
    .from('workspaces')
    .select('workspace_id, name, metadata')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (loadError) {
    console.error('Failed to load workspace before preferences update:', loadError.message)
    throw new WorkspacesHttpError('Could not update workspace preferences.', 500)
  }
  if (!existing) {
    throw new WorkspacesHttpError('Workspace not found or access denied.', 404)
  }

  const currentPreferences = preferencesFromMetadata(existing.metadata)
  const nextPreferences: WorkspacePreferences = {
    timezone:
      typeof input.preferences?.timezone === 'string' && input.preferences.timezone.trim()
        ? input.preferences.timezone.trim()
        : currentPreferences.timezone,
    language:
      typeof input.preferences?.language === 'string' && input.preferences.language.trim()
        ? input.preferences.language.trim()
        : currentPreferences.language,
    notifications: {
      email:
        typeof input.preferences?.notifications?.email === 'boolean'
          ? input.preferences.notifications.email
          : currentPreferences.notifications.email,
      push:
        typeof input.preferences?.notifications?.push === 'boolean'
          ? input.preferences.notifications.push
          : currentPreferences.notifications.push,
      sms:
        typeof input.preferences?.notifications?.sms === 'boolean'
          ? input.preferences.notifications.sms
          : currentPreferences.notifications.sms,
    },
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    metadata: {
      ...metadataRecord(existing.metadata),
      preferences: nextPreferences,
    },
  }

  if (typeof input.businessName === 'string') {
    const businessName = input.businessName.trim()
    if (!businessName) {
      throw new WorkspacesHttpError('Business name is required.', 400)
    }
    patch.name = businessName
  }

  const { data, error } = await admin
    .from('workspaces')
    .update(patch)
    .eq('workspace_id', workspaceId)
    .select('workspace_id, name, metadata')
    .single()

  if (error || !data) {
    console.error('Failed to update workspace preferences:', error?.message)
    throw new WorkspacesHttpError('Could not update workspace preferences.', 500)
  }

  return {
    workspaceId: data.workspace_id as string,
    businessName: String(data.name || ''),
    preferences: preferencesFromMetadata(data.metadata),
  }
}

/** Find a membership workspace tagged with metadata.verticalId (SCRUM-30 multi-vertical demo). */
export async function findWorkspaceForVertical(
  env: Env,
  profileId: string,
  verticalId: string
): Promise<WorkspaceRecord | null> {
  const admin = requireAdmin(env)
  const { data: roles, error: rolesError } = await admin
    .from('user_workspace_roles')
    .select('workspace_id, role')
    .eq('profile_id', profileId)

  if (rolesError) {
    console.error('Failed to list roles for vertical workspace:', rolesError.message)
    throw new WorkspacesHttpError('Could not resolve workspace for vertical.', 500)
  }

  const memberships = roles ?? []
  if (memberships.length === 0) return null

  const ids = memberships.map((row) => row.workspace_id as string)
  const { data: workspaces, error } = await admin
    .from('workspaces')
    .select('workspace_id, tenant_id, name, description, metadata, created_at, updated_at')
    .in('workspace_id', ids)

  if (error) {
    console.error('Failed to load workspaces for vertical:', error.message)
    throw new WorkspacesHttpError('Could not resolve workspace for vertical.', 500)
  }

  const roleById = new Map(memberships.map((row) => [row.workspace_id as string, String(row.role)]))
  const match = ((workspaces ?? []) as WorkspaceMetaRow[]).find(
    (row) => metadataRecord(row.metadata).verticalId === verticalId
  )
  if (!match) return null
  return mapWorkspace(match, roleById.get(match.workspace_id) || 'member')
}
