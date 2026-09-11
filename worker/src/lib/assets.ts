import type { SupabaseClient } from '@supabase/supabase-js'
import type { Asset, Env } from '../types'
import { resolvePreferredWorkspaceId } from './authAccount'
import {
  defaultObjectTypeId,
  ensureWorkspaceObjectTypes,
  findWorkspaceObjectType,
  listWorkspaceObjectTypes,
  ObjectTypesHttpError,
} from './objectTypes'
import { getSupabaseAdmin, SUPABASE_CONFIG_HINT } from './supabase'

const OBJECT_COLUMNS =
  'object_id, name, status, custom_fields, created_at, updated_at, is_deleted, object_type_id, object_types(name)'

export class AssetsHttpError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 500 | 503
  ) {
    super(message)
  }
}

export type CreateAssetInput = {
  name: string
  objectTypeId?: string | null
  category?: string | null
  sku?: string | null
  quantity?: number
  minQuantity?: number
  unitCost?: number | null
  supplier?: string | null
  location?: string | null
  description?: string | null
  avatar?: string | null
  customFields?: Record<string, unknown> | null
}

type ObjectTypeRel = { name?: string | null } | { name?: string | null }[] | null

type ObjectRow = {
  object_id: string
  name: string
  status: string
  custom_fields: unknown
  created_at: string
  updated_at: string
  is_deleted?: boolean | null
  object_type_id: string
  object_types?: ObjectTypeRel
}

function requireAdmin(env: Env): SupabaseClient {
  const admin = getSupabaseAdmin(env)
  if (!admin) {
    throw new AssetsHttpError(`Assets are not configured. ${SUPABASE_CONFIG_HINT}`, 503)
  }
  return admin
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function objectTypeName(rel: ObjectTypeRel): string {
  if (Array.isArray(rel)) return rel[0]?.name?.trim() || ''
  return rel?.name?.trim() || ''
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const AVATAR_MAX_CHARS = 1_500_000
const AVATAR_DATA_URL = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i

function avatarFromInput(input: CreateAssetInput): string | null {
  if (input.avatar == null || input.avatar === '') return null
  const trimmed = input.avatar.trim()
  if (!trimmed) return null
  if (trimmed.length > AVATAR_MAX_CHARS) {
    throw new AssetsHttpError('Avatar is too large.', 400)
  }
  if (!AVATAR_DATA_URL.test(trimmed)) {
    throw new AssetsHttpError('Avatar must be a JPEG, PNG, WebP, or GIF image.', 400)
  }
  return trimmed
}

function asAvatar(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed && AVATAR_DATA_URL.test(trimmed) ? trimmed : null
}

const CORE_CUSTOM_KEYS = new Set(['description', 'avatar', 'category', 'tags'])

function sanitizeCustomFieldBag(raw: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!key || key === 'avatar' || key === 'tags') continue
    if (typeof value === 'boolean') {
      fields[key] = value
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      fields[key] = value
    } else if (typeof value === 'string') {
      fields[key] = value.trim() || null
    } else if (value == null) {
      fields[key] = null
    }
  }
  return fields
}

function coerceSchemaValue(dataType: string, value: unknown): unknown {
  if (dataType === 'boolean') {
    if (value === true || value === false) return value
    if (value === 'true') return true
    if (value === 'false') return false
    return null
  }
  if (dataType === 'number') return asNumber(value)
  return asString(value)
}

function legacyInputValue(input: CreateAssetInput, name: string): unknown {
  switch (name) {
    case 'sku':
      return input.sku
    case 'quantity':
      return input.quantity
    case 'min_quantity':
      return input.minQuantity
    case 'unit_cost':
      return input.unitCost
    case 'supplier':
      return input.supplier
    case 'location':
      return input.location
    case 'category':
      return input.category
    case 'description':
      return input.description
    default:
      return undefined
  }
}

function customFieldsFromInput(
  input: CreateAssetInput,
  attributes: { name: string; dataType: string }[] = [],
  existing?: Record<string, unknown> | null
): Record<string, unknown> {
  const extras = sanitizeCustomFieldBag(asRecord(input.customFields))
  const previous = asRecord(existing)
  const fields: Record<string, unknown> = {}
  const tags = asTags(previous.tags)
  if (tags) fields.tags = tags

  fields.description = asString(input.description) ?? asString(extras.description) ?? asString(previous.description)
  fields.avatar = input.avatar === undefined ? asAvatar(previous.avatar) : avatarFromInput(input)
  fields.category = asString(input.category) ?? asString(extras.category) ?? asString(previous.category)

  if (attributes.length > 0) {
    for (const attribute of attributes) {
      if (CORE_CUSTOM_KEYS.has(attribute.name)) continue
      const fromExtras = Object.prototype.hasOwnProperty.call(extras, attribute.name)
      const raw = fromExtras ? extras[attribute.name] : legacyInputValue(input, attribute.name)
      fields[attribute.name] = coerceSchemaValue(attribute.dataType, raw)
    }
    return fields
  }

  for (const [key, value] of Object.entries(extras)) {
    fields[key] = value
  }
  return fields
}

function assertRequiredAttributes(
  attributes: { name: string; label: string; dataType: string; required: boolean }[],
  fields: Record<string, unknown>
): void {
  for (const attribute of attributes) {
    if (!attribute.required) continue
    const value = fields[attribute.name]
    if (attribute.dataType === 'boolean') {
      if (value !== true && value !== false) {
        throw new AssetsHttpError(`${attribute.label} is required.`, 400)
      }
      continue
    }
    if (attribute.dataType === 'number') {
      if (asNumber(value) == null) {
        throw new AssetsHttpError(`${attribute.label} is required.`, 400)
      }
      continue
    }
    if (asString(value) == null) {
      throw new AssetsHttpError(`${attribute.label} is required.`, 400)
    }
  }
}

function asTags(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const tags = value.filter((item): item is string => typeof item === 'string')
  return tags.length > 0 ? tags : null
}

export function mapObjectToAsset(row: ObjectRow, userId: string): Asset {
  const fields = asRecord(row.custom_fields)
  const typeName = objectTypeName(row.object_types ?? null)
  const category = asString(fields.category) || typeName || 'general'

  return {
    id: row.object_id,
    user_id: userId,
    name: row.name || 'Untitled',
    description: asString(fields.description),
    category,
    object_type_id: row.object_type_id,
    object_type_name: typeName,
    sku: asString(fields.sku),
    quantity: asNumber(fields.quantity) ?? 0,
    min_quantity: asNumber(fields.min_quantity) ?? asNumber(fields.minQuantity) ?? 0,
    unit_cost: asNumber(fields.unit_cost) ?? asNumber(fields.unitCost),
    supplier: asString(fields.supplier),
    location: asString(fields.location),
    tags: asTags(fields.tags),
    avatar: asAvatar(fields.avatar),
    custom_fields: fields,
    is_active: row.status === 'active',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function asCatalogError(error: unknown): never {
  if (error instanceof ObjectTypesHttpError) {
    const status = error.status === 409 ? 400 : error.status
    throw new AssetsHttpError(error.message, status)
  }
  throw error
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

export async function listWorkspaceAssets(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<Asset[]> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return []

  const { data, error } = await context.admin
    .from('objects')
    .select(OBJECT_COLUMNS)
    .eq('workspace_id', context.workspaceId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to list assets:', error.message)
    throw new AssetsHttpError('Could not load assets.', 500)
  }

  return ((data ?? []) as ObjectRow[]).map((row) => mapObjectToAsset(row, userId))
}

export async function getWorkspaceAsset(
  env: Env,
  userId: string,
  assetId: string,
  preferredWorkspaceId?: string | null
): Promise<Asset | null> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return null

  const { data, error } = await context.admin
    .from('objects')
    .select(OBJECT_COLUMNS)
    .eq('workspace_id', context.workspaceId)
    .eq('object_id', assetId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    console.error('Failed to load asset:', error.message)
    throw new AssetsHttpError('Could not load assets.', 500)
  }

  if (!data) return null
  return mapObjectToAsset(data as ObjectRow, userId)
}

async function resolveObjectTypeId(
  env: Env,
  userId: string,
  admin: SupabaseClient,
  workspaceId: string,
  requestedId?: string | null,
  allowInactiveId?: string | null,
  preferredWorkspaceId?: string | null
): Promise<string> {
  try {
    await ensureWorkspaceObjectTypes(admin, workspaceId)
  } catch (error) {
    asCatalogError(error)
  }

  if (requestedId) {
    let type
    try {
      type = await findWorkspaceObjectType(admin, workspaceId, requestedId)
    } catch (error) {
      asCatalogError(error)
    }
    if (!type) throw new AssetsHttpError('Object type not found.', 400)
    if (!type.isActive && type.id !== allowInactiveId) {
      throw new AssetsHttpError('Object type is not active.', 400)
    }
    return type.id
  }

  let types
  try {
    types = await listWorkspaceObjectTypes(env, userId, preferredWorkspaceId)
  } catch (error) {
    asCatalogError(error)
  }
  const fallbackId = defaultObjectTypeId(types)
  if (!fallbackId) throw new AssetsHttpError('No object types available.', 400)
  return fallbackId
}

export async function createWorkspaceAsset(
  env: Env,
  userId: string,
  input: CreateAssetInput,
  preferredWorkspaceId?: string | null
): Promise<Asset> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const name = input.name.trim()
  if (!name) {
    throw new AssetsHttpError('Name is required.', 400)
  }

  const typeId = await resolveObjectTypeId(
    env,
    userId,
    context.admin,
    context.workspaceId,
    input.objectTypeId,
    null,
    preferredWorkspaceId
  )
  const type = await findWorkspaceObjectType(context.admin, context.workspaceId, typeId)
  const fields = customFieldsFromInput(input, type?.attributes ?? [])
  if (type) assertRequiredAttributes(type.attributes, fields)
  const { data, error } = await context.admin
    .from('objects')
    .insert({
      object_type_id: typeId,
      workspace_id: context.workspaceId,
      name,
      status: 'active',
      custom_fields: fields,
      is_deleted: false,
      created_by: userId,
      updated_by: userId,
    })
    .select(OBJECT_COLUMNS)
    .single()

  if (error || !data) {
    console.error('Failed to create asset:', error?.message)
    throw new AssetsHttpError('Could not create asset.', 500)
  }

  return mapObjectToAsset(data as ObjectRow, userId)
}

export async function updateWorkspaceAsset(
  env: Env,
  userId: string,
  assetId: string,
  input: CreateAssetInput,
  preferredWorkspaceId?: string | null
): Promise<Asset> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const existing = await getWorkspaceAsset(env, userId, assetId, preferredWorkspaceId)
  if (!existing) {
    throw new AssetsHttpError('Asset not found', 404)
  }

  const name = input.name.trim()
  if (!name) {
    throw new AssetsHttpError('Name is required.', 400)
  }

  const nextTypeId = input.objectTypeId
    ? await resolveObjectTypeId(
        env,
        userId,
        context.admin,
        context.workspaceId,
        input.objectTypeId,
        existing.object_type_id,
        preferredWorkspaceId
      )
    : existing.object_type_id
  const type = await findWorkspaceObjectType(context.admin, context.workspaceId, nextTypeId)
  const fields = customFieldsFromInput(input, type?.attributes ?? [], existing.custom_fields)
  if (type) assertRequiredAttributes(type.attributes, fields)

  const { data, error } = await context.admin
    .from('objects')
    .update({
      name,
      object_type_id: nextTypeId,
      custom_fields: fields,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('object_id', assetId)
    .eq('workspace_id', context.workspaceId)
    .eq('is_deleted', false)
    .select(OBJECT_COLUMNS)
    .single()

  if (error || !data) {
    console.error('Failed to update asset:', error?.message)
    throw new AssetsHttpError('Could not update asset.', 500)
  }

  return mapObjectToAsset(data as ObjectRow, userId)
}

export async function deleteWorkspaceAsset(
  env: Env,
  userId: string,
  assetId: string,
  preferredWorkspaceId?: string | null
): Promise<void> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const existing = await getWorkspaceAsset(env, userId, assetId, preferredWorkspaceId)
  if (!existing) {
    throw new AssetsHttpError('Asset not found', 404)
  }

  const now = new Date().toISOString()
  const { data, error } = await context.admin
    .from('objects')
    .update({
      is_deleted: true,
      deleted_at: now,
      status: 'inactive',
      updated_by: userId,
      updated_at: now,
    })
    .eq('object_id', assetId)
    .eq('workspace_id', context.workspaceId)
    .eq('is_deleted', false)
    .select('object_id')
    .single()

  if (error || !data) {
    console.error('Failed to delete asset:', error?.message)
    throw new AssetsHttpError('Could not delete asset.', 500)
  }
}
