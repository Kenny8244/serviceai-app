import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createdActivityChange,
  activityEventLabel,
  lifecycleActivityChanges,
  type ServiceRequestActivityChange,
} from '../../../src/lib/serviceRequestActivity'
import type { Env, ServiceRequest } from '../types'
import { resolvePreferredWorkspaceId } from './authAccount'
import { getSupabaseAdmin, SUPABASE_CONFIG_HINT } from './supabase'

const REQUEST_COLUMNS =
  'ticket_id, workspace_id, title, description, category, type, priority, status, related_asset_object_id, assignee, created_by, created_at, updated_at, related_asset:objects!related_asset_object_id(object_id, name)'

export class ServiceRequestsHttpError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 500 | 503
  ) {
    super(message)
  }
}

export type CreateServiceRequestInput = {
  title: string
  description?: string | null
  category: string
  priority?: ServiceRequest['priority']
  status?: ServiceRequest['status']
  relatedAssetId?: string | null
  ownerId?: string | null
  watcherIds?: string[]
}

export type UpdateServiceRequestInput = {
  title?: string
  description?: string | null
  category?: string
  priority?: ServiceRequest['priority']
  status?: ServiceRequest['status']
  relatedAssetId?: string | null
  ownerId?: string | null
  watcherIds?: string[]
}

type AssetRel = { object_id?: string | null; name?: string | null } | { object_id?: string | null; name?: string | null }[] | null

type ServiceRequestRow = {
  ticket_id: string
  workspace_id: string
  title: string
  description: string | null
  category: string
  type?: string | null
  priority: string
  status: string
  related_asset_object_id: string | null
  assignee?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  related_asset?: AssetRel
}

const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent'])
const STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed'])

function requireAdmin(env: Env): SupabaseClient {
  const admin = getSupabaseAdmin(env)
  if (!admin) {
    throw new ServiceRequestsHttpError(`Service requests are not configured. ${SUPABASE_CONFIG_HINT}`, 503)
  }
  return admin
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parsePriority(value: unknown): ServiceRequest['priority'] | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return PRIORITIES.has(raw) ? (raw as ServiceRequest['priority']) : null
}

function parseStatus(value: unknown): ServiceRequest['status'] | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return STATUSES.has(raw) ? (raw as ServiceRequest['status']) : null
}

function normalizePriority(value: unknown, fallback: ServiceRequest['priority'] = 'medium'): ServiceRequest['priority'] {
  return parsePriority(value) ?? fallback
}

function normalizeStatus(value: unknown, fallback: ServiceRequest['status'] = 'open'): ServiceRequest['status'] {
  return parseStatus(value) ?? fallback
}

function requirePriority(value: unknown): ServiceRequest['priority'] {
  const parsed = parsePriority(value)
  if (!parsed) {
    throw new ServiceRequestsHttpError('Priority must be low, medium, high, or urgent.', 400)
  }
  return parsed
}

function requireStatus(value: unknown): ServiceRequest['status'] {
  const parsed = parseStatus(value)
  if (!parsed) {
    throw new ServiceRequestsHttpError('Status must be open, in_progress, resolved, or closed.', 400)
  }
  return parsed
}

function relatedAsset(rel: AssetRel): { id: string | null; name: string | null } {
  const row = Array.isArray(rel) ? rel[0] : rel
  const id = asString(row?.object_id)
  const name = asString(row?.name)
  return { id, name }
}

export function mapRowToServiceRequest(
  row: ServiceRequestRow,
  userId: string,
  people?: {
    owner: { id: string; name: string } | null
    watchers: { id: string; name: string }[]
  }
): ServiceRequest {
  const asset = relatedAsset(row.related_asset ?? null)
  return {
    id: row.ticket_id,
    user_id: asString(row.created_by) || userId,
    workspace_id: row.workspace_id,
    title: row.title?.trim() || 'Service request',
    description: row.description?.trim() || '',
    category: row.category?.trim() || asString(row.type) || 'General',
    priority: normalizePriority(row.priority),
    status: normalizeStatus(row.status),
    related_asset_id: asset.id || asString(row.related_asset_object_id),
    related_asset_name: asset.name,
    owner: people?.owner ?? null,
    watchers: people?.watchers ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function loadWorkspaceContext(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<{ admin: SupabaseClient; workspaceId: string } | null> {
  const admin = requireAdmin(env)
  const workspaceId = await resolvePreferredWorkspaceId(admin, userId, preferredWorkspaceId)
  if (!workspaceId) return null
  return { admin, workspaceId }
}

async function assertRelatedAssetInWorkspace(
  admin: SupabaseClient,
  workspaceId: string,
  relatedAssetId: string | null
): Promise<string | null> {
  if (!relatedAssetId) return null

  const { data, error } = await admin
    .from('objects')
    .select('object_id')
    .eq('workspace_id', workspaceId)
    .eq('object_id', relatedAssetId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    console.error('Failed to validate related asset:', error.message)
    throw new ServiceRequestsHttpError('Could not validate related asset.', 500)
  }
  if (!data) {
    throw new ServiceRequestsHttpError('Related asset was not found in this workspace.', 400)
  }
  return relatedAssetId
}

type ProfileNameRow = {
  id: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

function profileName(row: ProfileNameRow): string {
  const combined = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
  return combined || row.full_name?.trim() || row.email?.trim() || 'Member'
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
}

async function assertWorkspaceMemberIds(
  admin: SupabaseClient,
  workspaceId: string,
  ids: string[],
  label: string
): Promise<string[]> {
  const unique = uniqueIds(ids)
  if (unique.length === 0) return []

  const { data, error } = await admin
    .from('user_workspace_roles')
    .select('profile_id')
    .eq('workspace_id', workspaceId)
    .in('profile_id', unique)

  if (error) {
    console.error(`Failed to validate ${label}:`, error.message)
    throw new ServiceRequestsHttpError(`Could not validate ${label}.`, 500)
  }

  const found = new Set((data ?? []).map((row) => String(row.profile_id)))
  if (unique.some((id) => !found.has(id))) {
    throw new ServiceRequestsHttpError(`${label} must belong to this workspace.`, 400)
  }
  return unique
}

async function loadProfileNames(
  admin: SupabaseClient,
  ids: string[]
): Promise<Map<string, string>> {
  const unique = uniqueIds(ids)
  const names = new Map<string, string>()
  if (unique.length === 0) return names

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, first_name, last_name, email')
    .in('id', unique)

  if (error) {
    console.error('Failed to load profile names:', error.message)
    throw new ServiceRequestsHttpError('Could not load service request people.', 500)
  }

  for (const row of (data ?? []) as ProfileNameRow[]) {
    names.set(String(row.id), profileName(row))
  }
  return names
}

async function replaceWatchers(
  admin: SupabaseClient,
  workspaceId: string,
  ticketId: string,
  watcherIds: string[]
): Promise<void> {
  const { error: deleteError } = await admin
    .from('service_request_watchers')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('ticket_id', ticketId)

  if (deleteError) {
    console.error('Failed to clear watchers:', deleteError.message)
    throw new ServiceRequestsHttpError('Could not update watchers.', 500)
  }

  if (watcherIds.length === 0) return

  const { error: insertError } = await admin.from('service_request_watchers').insert(
    watcherIds.map((profileId) => ({
      ticket_id: ticketId,
      profile_id: profileId,
      workspace_id: workspaceId,
    }))
  )

  if (insertError) {
    console.error('Failed to save watchers:', insertError.message)
    throw new ServiceRequestsHttpError('Could not update watchers.', 500)
  }
}

async function hydrateServiceRequests(
  admin: SupabaseClient,
  workspaceId: string,
  rows: ServiceRequestRow[],
  userId: string
): Promise<ServiceRequest[]> {
  if (rows.length === 0) return []

  const ticketIds = rows.map((row) => row.ticket_id)
  const { data: watcherRows, error } = await admin
    .from('service_request_watchers')
    .select('ticket_id, profile_id')
    .eq('workspace_id', workspaceId)
    .in('ticket_id', ticketIds)

  if (error) {
    console.error('Failed to load watchers:', error.message)
    throw new ServiceRequestsHttpError('Could not load service requests.', 500)
  }

  const watchersByTicket = new Map<string, string[]>()
  for (const row of watcherRows ?? []) {
    const ticketId = String(row.ticket_id)
    const profileId = String(row.profile_id)
    const current = watchersByTicket.get(ticketId) ?? []
    current.push(profileId)
    watchersByTicket.set(ticketId, current)
  }

  const profileIds = [
    ...rows.map((row) => asString(row.assignee) ?? ''),
    ...(watcherRows ?? []).map((row) => String(row.profile_id)),
  ]
  const names = await loadProfileNames(admin, profileIds)

  return rows.map((row) => {
    const ownerId = asString(row.assignee)
    const watcherIds = watchersByTicket.get(row.ticket_id) ?? []
    return mapRowToServiceRequest(row, userId, {
      owner: ownerId ? { id: ownerId, name: names.get(ownerId) || 'Member' } : null,
      watchers: watcherIds.map((id) => ({ id, name: names.get(id) || 'Member' })),
    })
  })
}

export async function countOpenWorkspaceServiceRequests(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<number> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return 0

  const { count, error } = await context.admin
    .from('service_requests')
    .select('ticket_id', { count: 'exact', head: true })
    .eq('workspace_id', context.workspaceId)
    .eq('status', 'open')

  if (error) {
    console.error('Failed to count open service requests:', error.message)
    throw new ServiceRequestsHttpError('Could not count open service requests.', 500)
  }

  return count ?? 0
}

export async function listWorkspaceServiceRequests(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<ServiceRequest[]> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return []

  const { data, error } = await context.admin
    .from('service_requests')
    .select(REQUEST_COLUMNS)
    .eq('workspace_id', context.workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to list service requests:', error.message)
    throw new ServiceRequestsHttpError('Could not load service requests.', 500)
  }

  return hydrateServiceRequests(
    context.admin,
    context.workspaceId,
    (data ?? []) as ServiceRequestRow[],
    userId
  )
}

export async function getWorkspaceServiceRequest(
  env: Env,
  userId: string,
  requestId: string,
  preferredWorkspaceId?: string | null
): Promise<ServiceRequest | null> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return null

  const { data, error } = await context.admin
    .from('service_requests')
    .select(REQUEST_COLUMNS)
    .eq('workspace_id', context.workspaceId)
    .eq('ticket_id', requestId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load service request:', error.message)
    throw new ServiceRequestsHttpError('Could not load service request.', 500)
  }
  if (!data) return null
  const [request] = await hydrateServiceRequests(
    context.admin,
    context.workspaceId,
    [data as ServiceRequestRow],
    userId
  )
  return request ?? null
}

export async function createWorkspaceServiceRequest(
  env: Env,
  userId: string,
  input: CreateServiceRequestInput,
  preferredWorkspaceId?: string | null
): Promise<ServiceRequest> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new ServiceRequestsHttpError('Active workspace is required. Select a workspace first.', 400)
  }

  const title = asString(input.title)
  const category = asString(input.category)
  if (!title) throw new ServiceRequestsHttpError('Title is required.', 400)
  if (!category) throw new ServiceRequestsHttpError('Category is required.', 400)

  const description = asString(input.description) || ''
  const priority = input.priority === undefined ? 'medium' : requirePriority(input.priority)
  const status = input.status === undefined ? 'open' : requireStatus(input.status)
  const relatedAssetId = await assertRelatedAssetInWorkspace(
    context.admin,
    context.workspaceId,
    asString(input.relatedAssetId)
  )
  const ownerId =
    input.ownerId === undefined
      ? userId
      : input.ownerId
        ? (await assertWorkspaceMemberIds(context.admin, context.workspaceId, [input.ownerId], 'Owner'))[0]
        : null
  const watcherIds = await assertWorkspaceMemberIds(
    context.admin,
    context.workspaceId,
    input.watcherIds ?? [],
    'Watchers'
  )

  const { data, error } = await context.admin
    .from('service_requests')
    .insert({
      workspace_id: context.workspaceId,
      title,
      category,
      type: category,
      description,
      priority,
      status,
      related_asset_object_id: relatedAssetId,
      created_by: userId,
      assignee: ownerId,
    })
    .select(REQUEST_COLUMNS)
    .single()

  if (error || !data) {
    console.error('Failed to create service request:', error?.message)
    throw new ServiceRequestsHttpError('Could not create service request.', 500)
  }

  const created = data as ServiceRequestRow
  await replaceWatchers(context.admin, context.workspaceId, created.ticket_id, watcherIds)
  await insertActivityEvents(context.admin, context.workspaceId, created.ticket_id, userId, [
    createdActivityChange(created.status),
  ])
  const [request] = await hydrateServiceRequests(context.admin, context.workspaceId, [created], userId)
  if (!request) {
    throw new ServiceRequestsHttpError('Could not create service request.', 500)
  }
  return request
}

export async function updateWorkspaceServiceRequest(
  env: Env,
  userId: string,
  requestId: string,
  input: UpdateServiceRequestInput,
  preferredWorkspaceId?: string | null
): Promise<ServiceRequest> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new ServiceRequestsHttpError('Active workspace is required. Select a workspace first.', 400)
  }

  const existing = await getWorkspaceServiceRequest(env, userId, requestId, preferredWorkspaceId)
  if (!existing) {
    throw new ServiceRequestsHttpError('Service request not found.', 404)
  }

  const patch: Record<string, unknown> = {}

  if (input.title !== undefined) {
    const title = asString(input.title)
    if (!title) throw new ServiceRequestsHttpError('Title is required.', 400)
    patch.title = title
  }
  if (input.description !== undefined) {
    patch.description = asString(input.description) || ''
  }
  if (input.category !== undefined) {
    const category = asString(input.category)
    if (!category) throw new ServiceRequestsHttpError('Category is required.', 400)
    patch.category = category
    patch.type = category
  }
  if (input.priority !== undefined) {
    patch.priority = requirePriority(input.priority)
  }
  if (input.status !== undefined) {
    patch.status = requireStatus(input.status)
  }
  if (input.relatedAssetId !== undefined) {
    patch.related_asset_object_id = await assertRelatedAssetInWorkspace(
      context.admin,
      context.workspaceId,
      asString(input.relatedAssetId)
    )
  }
  if (input.ownerId !== undefined) {
    patch.assignee = input.ownerId
      ? (await assertWorkspaceMemberIds(context.admin, context.workspaceId, [input.ownerId], 'Owner'))[0]
      : null
  }

  const watcherIds =
    input.watcherIds === undefined
      ? undefined
      : await assertWorkspaceMemberIds(context.admin, context.workspaceId, input.watcherIds, 'Watchers')

  if (Object.keys(patch).length === 0 && watcherIds === undefined) return existing

  patch.updated_at = new Date().toISOString()

  const { data, error } = await context.admin
    .from('service_requests')
    .update(patch)
    .eq('workspace_id', context.workspaceId)
    .eq('ticket_id', requestId)
    .select(REQUEST_COLUMNS)
    .single()

  if (error || !data) {
    console.error('Failed to update service request:', error?.message)
    throw new ServiceRequestsHttpError('Could not update service request.', 500)
  }

  if (watcherIds !== undefined) {
    await replaceWatchers(context.admin, context.workspaceId, requestId, watcherIds)
  }

  const updated = data as ServiceRequestRow
  try {
    await insertActivityEvents(
      context.admin,
      context.workspaceId,
      requestId,
      userId,
      lifecycleActivityChanges(
        { status: existing.status, priority: existing.priority },
        { status: updated.status, priority: updated.priority }
      )
    )
  } catch (activityError) {
    console.error('Service request saved, but activity was not recorded:', activityError)
  }

  const [request] = await hydrateServiceRequests(
    context.admin,
    context.workspaceId,
    [data as ServiceRequestRow],
    userId
  )
  if (!request) {
    throw new ServiceRequestsHttpError('Could not update service request.', 500)
  }
  return request
}

export type ServiceRequestActivity = {
  id: string
  eventType: ServiceRequestActivityChange['eventType']
  fromValue: string | null
  toValue: string | null
  actorUserId: string | null
  actorName: string | null
  createdAt: string
}

type ActivityRow = {
  id: string
  event_type: ServiceRequestActivityChange['eventType']
  from_value: string | null
  to_value: string | null
  actor_user_id: string | null
  created_at: string
}

async function insertActivityEvents(
  admin: SupabaseClient,
  workspaceId: string,
  ticketId: string,
  actorUserId: string,
  changes: ServiceRequestActivityChange[]
): Promise<void> {
  if (changes.length === 0) return

  const { error } = await admin.from('service_request_activity').insert(
    changes.map((change) => ({
      workspace_id: workspaceId,
      ticket_id: ticketId,
      actor_user_id: actorUserId,
      event_type: change.eventType,
      from_value: change.fromValue,
      to_value: change.toValue,
    }))
  )

  if (error) {
    console.error('Failed to record service request activity:', error.message)
    throw new ServiceRequestsHttpError('Could not record service request activity.', 500)
  }
}

export async function listWorkspaceServiceRequestActivity(
  env: Env,
  userId: string,
  requestId: string,
  preferredWorkspaceId?: string | null
): Promise<ServiceRequestActivity[] | null> {
  const existing = await getWorkspaceServiceRequest(env, userId, requestId, preferredWorkspaceId)
  if (!existing) return null

  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new ServiceRequestsHttpError('Active workspace is required. Select a workspace first.', 400)
  }

  const { data, error } = await context.admin
    .from('service_request_activity')
    .select('id, event_type, from_value, to_value, actor_user_id, created_at')
    .eq('workspace_id', context.workspaceId)
    .eq('ticket_id', requestId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error('Failed to load service request activity:', error.message)
    throw new ServiceRequestsHttpError('Could not load service request activity.', 500)
  }

  const rows = (data ?? []) as ActivityRow[]
  const names = await loadProfileNames(
    context.admin,
    rows.flatMap((row) => (row.actor_user_id ? [row.actor_user_id] : []))
  )

  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    fromValue: row.from_value,
    toValue: row.to_value,
    actorUserId: row.actor_user_id,
    actorName: row.actor_user_id ? (names.get(row.actor_user_id) ?? null) : null,
    createdAt: row.created_at,
  }))
}

export type RecentWorkspaceActivity = {
  id: string
  title: string
  detail: string
  createdAt: string
  requestId: string
  eventType: 'created' | 'status_changed' | 'priority_changed'
  fromValue: string | null
  toValue: string | null
}

export async function listRecentWorkspaceActivity(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null,
  limit = 8
): Promise<RecentWorkspaceActivity[]> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return []

  const { data, error } = await context.admin
    .from('service_request_activity')
    .select('id, ticket_id, event_type, from_value, to_value, created_at')
    .eq('workspace_id', context.workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to load recent service request activity:', error.message)
    throw new ServiceRequestsHttpError('Could not load recent activity.', 500)
  }

  const rows = (data ?? []) as Array<ActivityRow & { ticket_id: string }>
  if (rows.length === 0) return []

  const ticketIds = [...new Set(rows.map((row) => row.ticket_id))]
  const { data: tickets, error: ticketError } = await context.admin
    .from('service_requests')
    .select('ticket_id, title')
    .eq('workspace_id', context.workspaceId)
    .in('ticket_id', ticketIds)

  if (ticketError) {
    console.error('Failed to load activity request titles:', ticketError.message)
    throw new ServiceRequestsHttpError('Could not load recent activity.', 500)
  }

  const titles = new Map(
    ((tickets ?? []) as Array<{ ticket_id: string; title: string | null }>).map((ticket) => [
      ticket.ticket_id,
      ticket.title?.trim() || 'Service request',
    ])
  )

  return rows.map((row) => ({
    id: row.id,
    requestId: row.ticket_id,
    title: titles.get(row.ticket_id) || 'Service request',
    detail: activityEventLabel({
      eventType: row.event_type,
      fromValue: row.from_value,
      toValue: row.to_value,
    }),
    eventType: row.event_type,
    fromValue: row.from_value,
    toValue: row.to_value,
    createdAt: row.created_at,
  }))
}
