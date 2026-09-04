import type { SupabaseClient } from '@supabase/supabase-js'
import type { Asset, Env } from '../types'
import { getWorkspaceIdForProfile } from './authAccount'
import { getSupabaseAdmin } from './supabase'

const ASSET_OBJECT_TYPES = ['asset', 'inventory_item'] as const

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
  category?: string | null
  sku?: string | null
  quantity?: number
  minQuantity?: number
  unitCost?: number | null
  supplier?: string | null
  location?: string | null
  description?: string | null
  avatar?: string | null
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
    throw new AssetsHttpError('Assets are not configured. Set SUPABASE_SERVICE_ROLE_KEY on the API.', 503)
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

function customFieldsFromInput(input: CreateAssetInput): Record<string, unknown> {
  return {
    category: input.category?.trim() || null,
    sku: input.sku?.trim() || null,
    quantity: Number.isFinite(input.quantity) ? Number(input.quantity) : 0,
    min_quantity: Number.isFinite(input.minQuantity) ? Number(input.minQuantity) : 0,
    unit_cost: Number.isFinite(input.unitCost) ? Number(input.unitCost) : null,
    supplier: input.supplier?.trim() || null,
    location: input.location?.trim() || null,
    description: input.description?.trim() || null,
    avatar: avatarFromInput(input),
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
    sku: asString(fields.sku),
    quantity: asNumber(fields.quantity) ?? 0,
    min_quantity: asNumber(fields.min_quantity) ?? asNumber(fields.minQuantity) ?? 0,
    unit_cost: asNumber(fields.unit_cost) ?? asNumber(fields.unitCost),
    supplier: asString(fields.supplier),
    location: asString(fields.location),
    tags: asTags(fields.tags),
    avatar: asAvatar(fields.avatar),
    is_active: row.status === 'active',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function assetTypeIdsForWorkspace(admin: SupabaseClient, workspaceId: string): Promise<string[]> {
  const { data: schemas, error: schemaError } = await admin
    .from('schemas')
    .select('schema_id')
    .eq('workspace_id', workspaceId)

  if (schemaError) {
    console.error('Failed to load workspace schemas:', schemaError.message)
    throw new AssetsHttpError('Could not load assets.', 500)
  }

  const schemaIds = (schemas ?? []).map((schema) => schema.schema_id as string).filter(Boolean)
  if (schemaIds.length === 0) return []

  const { data: types, error: typeError } = await admin
    .from('object_types')
    .select('object_type_id')
    .in('schema_id', schemaIds)
    .in('name', [...ASSET_OBJECT_TYPES])

  if (typeError) {
    console.error('Failed to load asset object types:', typeError.message)
    throw new AssetsHttpError('Could not load assets.', 500)
  }

  return (types ?? []).map((type) => type.object_type_id as string).filter(Boolean)
}

async function loadWorkspaceContext(
  env: Env,
  userId: string
): Promise<{ admin: SupabaseClient; workspaceId: string } | null> {
  const admin = requireAdmin(env)
  const workspaceId = await getWorkspaceIdForProfile(admin, userId)
  if (!workspaceId) return null
  return { admin, workspaceId }
}

export async function listWorkspaceAssets(env: Env, userId: string): Promise<Asset[]> {
  const context = await loadWorkspaceContext(env, userId)
  if (!context) return []

  const typeIds = await assetTypeIdsForWorkspace(context.admin, context.workspaceId)
  if (typeIds.length === 0) return []

  const { data, error } = await context.admin
    .from('objects')
    .select(OBJECT_COLUMNS)
    .eq('workspace_id', context.workspaceId)
    .eq('is_deleted', false)
    .in('object_type_id', typeIds)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to list assets:', error.message)
    throw new AssetsHttpError('Could not load assets.', 500)
  }

  return ((data ?? []) as ObjectRow[]).map((row) => mapObjectToAsset(row, userId))
}

export async function getWorkspaceAsset(env: Env, userId: string, assetId: string): Promise<Asset | null> {
  const context = await loadWorkspaceContext(env, userId)
  if (!context) return null

  const typeIds = await assetTypeIdsForWorkspace(context.admin, context.workspaceId)
  if (typeIds.length === 0) return null

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
  const row = data as ObjectRow
  if (!typeIds.includes(row.object_type_id)) return null
  return mapObjectToAsset(row, userId)
}

async function ensureInventoryTypeId(admin: SupabaseClient, workspaceId: string): Promise<string> {
  const { data: schemas, error: schemaError } = await admin
    .from('schemas')
    .select('schema_id')
    .eq('workspace_id', workspaceId)

  if (schemaError) {
    console.error('Failed to load workspace schemas:', schemaError.message)
    throw new AssetsHttpError('Could not create asset.', 500)
  }

  let schemaId = (schemas ?? [])[0]?.schema_id as string | undefined
  if (!schemaId) {
    const inserted = await admin
      .from('schemas')
      .insert({
        workspace_id: workspaceId,
        name: 'default',
        description: 'Default schema for asset management',
      })
      .select('schema_id')
      .single()
    if (inserted.error || !inserted.data) {
      console.error('Failed to create workspace schema:', inserted.error?.message)
      throw new AssetsHttpError('Could not create asset.', 500)
    }
    schemaId = inserted.data.schema_id as string
  }

  const { data: types, error: typeError } = await admin
    .from('object_types')
    .select('object_type_id, name')
    .eq('schema_id', schemaId)
    .in('name', [...ASSET_OBJECT_TYPES])

  if (typeError) {
    console.error('Failed to load asset object types:', typeError.message)
    throw new AssetsHttpError('Could not create asset.', 500)
  }

  const inventory = types?.find((row) => row.name === 'inventory_item')
  const existingId = (inventory?.object_type_id || types?.[0]?.object_type_id) as string | undefined
  if (existingId) return existingId

  const inserted = await admin
    .from('object_types')
    .insert({
      schema_id: schemaId,
      name: 'inventory_item',
      description: 'System type for inventory_item',
      is_system: true,
      schema_definition: {},
    })
    .select('object_type_id')
    .single()
  if (inserted.error || !inserted.data) {
    console.error('Failed to create object type:', inserted.error?.message)
    throw new AssetsHttpError('Could not create asset.', 500)
  }
  return inserted.data.object_type_id as string
}

export async function createWorkspaceAsset(env: Env, userId: string, input: CreateAssetInput): Promise<Asset> {
  const context = await loadWorkspaceContext(env, userId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const name = input.name.trim()
  if (!name) {
    throw new AssetsHttpError('Name is required.', 400)
  }

  const typeId = await ensureInventoryTypeId(context.admin, context.workspaceId)
  const { data, error } = await context.admin
    .from('objects')
    .insert({
      object_type_id: typeId,
      workspace_id: context.workspaceId,
      name,
      status: 'active',
      custom_fields: customFieldsFromInput(input),
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
  input: CreateAssetInput
): Promise<Asset> {
  const context = await loadWorkspaceContext(env, userId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const existing = await getWorkspaceAsset(env, userId, assetId)
  if (!existing) {
    throw new AssetsHttpError('Asset not found', 404)
  }

  const name = input.name.trim()
  if (!name) {
    throw new AssetsHttpError('Name is required.', 400)
  }

  const { data, error } = await context.admin
    .from('objects')
    .update({
      name,
      custom_fields: customFieldsFromInput(input),
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

export async function deleteWorkspaceAsset(env: Env, userId: string, assetId: string): Promise<void> {
  const context = await loadWorkspaceContext(env, userId)
  if (!context) {
    throw new AssetsHttpError('No workspace found for this account.', 400)
  }

  const existing = await getWorkspaceAsset(env, userId, assetId)
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
