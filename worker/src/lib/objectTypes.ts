import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../types'
import { resolvePreferredWorkspaceId } from './authAccount'
import { getSupabaseAdmin, SUPABASE_CONFIG_HINT } from './supabase'

export class ObjectTypesHttpError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 409 | 500 | 503
  ) {
    super(message)
  }
}

export const ATTRIBUTE_DATA_TYPES = ['string', 'number', 'boolean', 'text'] as const
export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number]

export type ObjectTypeAttributeRecord = {
  id: string
  name: string
  label: string
  dataType: AttributeDataType
  required: boolean
  order: number
}

export type ObjectTypeRecord = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  attributes: ObjectTypeAttributeRecord[]
}

export const DEFAULT_OBJECT_TYPES = [
  { name: 'Freezer', description: 'Cold storage equipment and freezer units.' },
  { name: 'Product', description: 'Sellable or stocked products.' },
  { name: 'Equipment', description: 'Tools, appliances, and operational equipment.' },
  { name: 'Ingredient', description: 'Raw ingredients and consumable supplies.' },
] as const

type DefaultAttributeDef = {
  name: string
  label: string
  dataType: AttributeDataType
  required: boolean
  order: number
}

export const DEFAULT_OBJECT_TYPE_ATTRIBUTES: Record<string, readonly DefaultAttributeDef[]> = {
  Product: [
    { name: 'sku', label: 'SKU', dataType: 'string', required: false, order: 1 },
    { name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 2 },
    { name: 'min_quantity', label: 'Reorder threshold', dataType: 'number', required: false, order: 3 },
    { name: 'unit_cost', label: 'Unit cost', dataType: 'number', required: false, order: 4 },
    { name: 'supplier', label: 'Supplier', dataType: 'string', required: false, order: 5 },
    { name: 'location', label: 'Location', dataType: 'string', required: false, order: 6 },
  ],
  Ingredient: [
    { name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 1 },
    { name: 'unit', label: 'Unit', dataType: 'string', required: true, order: 2 },
    { name: 'min_quantity', label: 'Reorder threshold', dataType: 'number', required: false, order: 3 },
    { name: 'location', label: 'Location', dataType: 'string', required: false, order: 4 },
    { name: 'perishable', label: 'Perishable', dataType: 'boolean', required: false, order: 5 },
  ],
  Equipment: [
    { name: 'location', label: 'Location', dataType: 'string', required: false, order: 1 },
    { name: 'supplier', label: 'Supplier', dataType: 'string', required: false, order: 2 },
    { name: 'serial_number', label: 'Serial number', dataType: 'string', required: false, order: 3 },
  ],
  Freezer: [
    { name: 'location', label: 'Location', dataType: 'string', required: true, order: 1 },
    { name: 'temperature', label: 'Temperature', dataType: 'number', required: false, order: 2 },
    { name: 'capacity', label: 'Capacity', dataType: 'number', required: false, order: 3 },
  ],
}

type ObjectTypeRow = {
  object_type_id: string
  schema_id?: string
  name: string
  description: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

type WorkspaceContext = { admin: SupabaseClient; workspaceId: string }

function requireAdmin(env: Env): SupabaseClient {
  const admin = getSupabaseAdmin(env)
  if (!admin) {
    throw new ObjectTypesHttpError(
      `Object types are not configured. ${SUPABASE_CONFIG_HINT}`,
      503
    )
  }
  return admin
}

function mapObjectType(row: ObjectTypeRow, attributes: ObjectTypeAttributeRecord[] = []): ObjectTypeRecord {
  return {
    id: row.object_type_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attributes,
  }
}

function isMissingAttributesTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (message.includes('object_type_attributes') &&
      (message.includes('does not exist') || message.includes('could not find') || message.includes('schema cache')))
  )
}

function asAttributeDataType(value: unknown): AttributeDataType {
  const raw = String(value ?? 'string')
  return (ATTRIBUTE_DATA_TYPES as readonly string[]).includes(raw) ? (raw as AttributeDataType) : 'string'
}

type AttributeRow = {
  attribute_id: string
  object_type_id: string
  name: string
  label: string
  data_type: string
  is_required: boolean | null
  sort_order: number | null
}

function mapAttribute(row: AttributeRow): ObjectTypeAttributeRecord {
  return {
    id: row.attribute_id,
    name: row.name,
    label: row.label,
    dataType: asAttributeDataType(row.data_type),
    required: row.is_required === true,
    order: Number(row.sort_order ?? 0) || 0,
  }
}

async function withAttributes(admin: SupabaseClient, types: ObjectTypeRecord[]): Promise<ObjectTypeRecord[]> {
  if (types.length === 0) return types

  const { data, error } = await admin
    .from('object_type_attributes')
    .select('attribute_id, object_type_id, name, label, data_type, is_required, sort_order')
    .in(
      'object_type_id',
      types.map((type) => type.id)
    )
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    if (isMissingAttributesTable(error)) {
      console.error('Object type attributes table is missing. Apply the SCRUM-34 migration.')
      return types.map((type) => ({ ...type, attributes: [] }))
    }
    console.error('Failed to load object type attributes:', error.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  const byType = new Map<string, ObjectTypeAttributeRecord[]>()
  for (const row of (data ?? []) as AttributeRow[]) {
    const list = byType.get(row.object_type_id) ?? []
    list.push(mapAttribute(row))
    byType.set(row.object_type_id, list)
  }

  return types.map((type) => ({
    ...type,
    attributes: byType.get(type.id) ?? [],
  }))
}

const TYPE_COLUMNS = 'object_type_id, schema_id, name, description, is_active, created_at, updated_at'

async function loadWorkspaceContext(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<WorkspaceContext | null> {
  const admin = requireAdmin(env)
  const workspaceId = await resolvePreferredWorkspaceId(admin, userId, preferredWorkspaceId)
  if (!workspaceId) return null
  return { admin, workspaceId }
}

export async function ensureDefaultSchemaId(admin: SupabaseClient, workspaceId: string): Promise<string> {
  const { data: defaultSchema, error: defaultError } = await admin
    .from('schemas')
    .select('schema_id')
    .eq('workspace_id', workspaceId)
    .eq('name', 'default')
    .maybeSingle()

  if (defaultError) {
    console.error('Failed to load workspace schema:', defaultError.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  if (defaultSchema?.schema_id) return defaultSchema.schema_id as string

  const { data: anySchema, error: anyError } = await admin
    .from('schemas')
    .select('schema_id')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .maybeSingle()

  if (anyError) {
    console.error('Failed to load workspace schemas:', anyError.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  if (anySchema?.schema_id) return anySchema.schema_id as string

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
    throw new ObjectTypesHttpError('Could not create object types.', 500)
  }

  return inserted.data.schema_id as string
}

export async function seedDefaultObjectTypes(admin: SupabaseClient, schemaId: string): Promise<void> {
  const { data: existing, error } = await admin.from('object_types').select('name').eq('schema_id', schemaId)

  if (error) {
    console.error('Failed to load object types:', error.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  const names = new Set((existing ?? []).map((row) => String(row.name)))
  const missing = DEFAULT_OBJECT_TYPES.filter((type) => !names.has(type.name))
  if (missing.length === 0) return

  const inserted = await admin.from('object_types').insert(
    missing.map((type) => ({
      schema_id: schemaId,
      name: type.name,
      description: type.description,
      is_system: false,
      is_active: true,
      schema_definition: {},
    }))
  )

  if (inserted.error) {
    if (inserted.error.code === '23505') return
    console.error('Failed to seed object types:', inserted.error.message)
    throw new ObjectTypesHttpError('Could not create object types.', 500)
  }
}

export async function seedDefaultObjectTypeAttributes(admin: SupabaseClient, schemaId: string): Promise<void> {
  const { data: types, error: typesError } = await admin
    .from('object_types')
    .select('object_type_id, name')
    .eq('schema_id', schemaId)

  if (typesError) {
    console.error('Failed to load object types for attributes:', typesError.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  const catalogTypes = (types ?? []).filter((row) => DEFAULT_OBJECT_TYPE_ATTRIBUTES[String(row.name)])
  if (catalogTypes.length === 0) return

  const typeIds = catalogTypes.map((row) => row.object_type_id as string)
  const { data: existing, error: existingError } = await admin
    .from('object_type_attributes')
    .select('object_type_id, name')
    .in('object_type_id', typeIds)

  if (existingError) {
    if (isMissingAttributesTable(existingError)) {
      console.error('Object type attributes table is missing. Apply the SCRUM-34 migration.')
      return
    }
    console.error('Failed to load object type attributes:', existingError.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  const present = new Set((existing ?? []).map((row) => `${row.object_type_id}:${row.name}`))
  const missing = catalogTypes.flatMap((type) => {
    const defs = DEFAULT_OBJECT_TYPE_ATTRIBUTES[String(type.name)] ?? []
    return defs
      .filter((def) => !present.has(`${type.object_type_id}:${def.name}`))
      .map((def) => ({
        object_type_id: type.object_type_id,
        name: def.name,
        label: def.label,
        data_type: def.dataType,
        is_required: def.required,
        sort_order: def.order,
      }))
  })

  if (missing.length > 0) {
    const inserted = await admin.from('object_type_attributes').insert(missing)
    if (inserted.error) {
      if (inserted.error.code === '23505') {
        await refreshDefaultAttributeLabels(admin, typeIds)
        return
      }
      if (isMissingAttributesTable(inserted.error)) {
        console.error('Object type attributes table is missing. Apply the SCRUM-34 migration.')
        return
      }
      console.error('Failed to seed object type attributes:', inserted.error.message)
      throw new ObjectTypesHttpError('Could not create object types.', 500)
    }
  }

  await refreshDefaultAttributeLabels(admin, typeIds)
}

async function refreshDefaultAttributeLabels(admin: SupabaseClient, typeIds: string[]): Promise<void> {
  if (typeIds.length === 0) return

  const { error } = await admin
    .from('object_type_attributes')
    .update({ label: 'Reorder threshold' })
    .eq('name', 'min_quantity')
    .eq('label', 'Minimum quantity')
    .in('object_type_id', typeIds)

  if (error && !isMissingAttributesTable(error)) {
    console.error('Failed to update reorder threshold labels:', error.message)
  }
}

export async function ensureWorkspaceObjectTypes(admin: SupabaseClient, workspaceId: string): Promise<string> {
  const schemaId = await ensureDefaultSchemaId(admin, workspaceId)
  await seedDefaultObjectTypes(admin, schemaId)
  await seedDefaultObjectTypeAttributes(admin, schemaId)
  return schemaId
}

async function schemaIdsForWorkspace(admin: SupabaseClient, workspaceId: string): Promise<string[]> {
  const { data, error } = await admin.from('schemas').select('schema_id').eq('workspace_id', workspaceId)
  if (error) {
    console.error('Failed to load workspace schemas:', error.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }
  return (data ?? []).map((row) => row.schema_id as string).filter(Boolean)
}

async function loadTypesForWorkspace(admin: SupabaseClient, workspaceId: string): Promise<ObjectTypeRecord[]> {
  const schemaIds = await schemaIdsForWorkspace(admin, workspaceId)
  if (schemaIds.length === 0) return []

  const { data, error } = await admin
    .from('object_types')
    .select(TYPE_COLUMNS)
    .in('schema_id', schemaIds)
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to list object types:', error.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  return withAttributes(admin, ((data ?? []) as ObjectTypeRow[]).map((row) => mapObjectType(row)))
}

export async function findWorkspaceObjectType(
  admin: SupabaseClient,
  workspaceId: string,
  typeId: string
): Promise<ObjectTypeRecord | null> {
  const schemaIds = await schemaIdsForWorkspace(admin, workspaceId)
  if (schemaIds.length === 0) return null

  const { data, error } = await admin
    .from('object_types')
    .select(TYPE_COLUMNS)
    .eq('object_type_id', typeId)
    .in('schema_id', schemaIds)
    .maybeSingle()

  if (error) {
    console.error('Failed to load object type:', error.message)
    throw new ObjectTypesHttpError('Could not load object types.', 500)
  }

  if (!data) return null
  const [hydrated] = await withAttributes(admin, [mapObjectType(data as ObjectTypeRow)])
  return hydrated ?? null
}

export function defaultObjectTypeId(types: ObjectTypeRecord[]): string | null {
  const active = types.filter((type) => type.isActive)
  const product = active.find((type) => type.name === 'Product')
  return product?.id ?? active[0]?.id ?? null
}

function hasStaleReorderThresholdLabel(types: ObjectTypeRecord[]): boolean {
  return types.some((type) =>
    type.attributes.some((attribute) => attribute.name === 'min_quantity' && attribute.label === 'Minimum quantity')
  )
}

export async function listWorkspaceObjectTypes(
  env: Env,
  userId: string,
  preferredWorkspaceId?: string | null
): Promise<ObjectTypeRecord[]> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) return []
  const existing = await loadTypesForWorkspace(context.admin, context.workspaceId)
  if (existing.length > 0 && !hasStaleReorderThresholdLabel(existing)) return existing
  await ensureWorkspaceObjectTypes(context.admin, context.workspaceId)
  return loadTypesForWorkspace(context.admin, context.workspaceId)
}

export type CreateObjectTypeInput = {
  name: string
  description?: string | null
  isActive?: boolean
}

export async function createWorkspaceObjectType(
  env: Env,
  userId: string,
  input: CreateObjectTypeInput,
  preferredWorkspaceId?: string | null
): Promise<ObjectTypeRecord> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new ObjectTypesHttpError('No workspace found for this account.', 400)
  }

  const name = input.name.trim()
  if (!name) {
    throw new ObjectTypesHttpError('Name is required.', 400)
  }

  const schemaId = await ensureWorkspaceObjectTypes(context.admin, context.workspaceId)
  const existing = await loadTypesForWorkspace(context.admin, context.workspaceId)
  if (existing.some((type) => type.name.toLowerCase() === name.toLowerCase())) {
    throw new ObjectTypesHttpError('An object type with this name already exists.', 409)
  }

  const inserted = await context.admin
    .from('object_types')
    .insert({
      schema_id: schemaId,
      name,
      description: input.description?.trim() || null,
      is_system: false,
      is_active: input.isActive !== false,
      schema_definition: {},
    })
    .select(TYPE_COLUMNS)
    .single()

  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === '23505') {
      throw new ObjectTypesHttpError('An object type with this name already exists.', 409)
    }
    console.error('Failed to create object type:', inserted.error?.message)
    throw new ObjectTypesHttpError('Could not create object type.', 500)
  }

  const mapped = mapObjectType(inserted.data as ObjectTypeRow)
  const [hydrated] = await withAttributes(context.admin, [mapped])
  return hydrated ?? mapped
}

export type UpdateObjectTypeInput = {
  name?: string
  description?: string | null
  isActive?: boolean
}

export async function updateWorkspaceObjectType(
  env: Env,
  userId: string,
  typeId: string,
  input: UpdateObjectTypeInput,
  preferredWorkspaceId?: string | null
): Promise<ObjectTypeRecord> {
  const context = await loadWorkspaceContext(env, userId, preferredWorkspaceId)
  if (!context) {
    throw new ObjectTypesHttpError('No workspace found for this account.', 400)
  }

  await ensureWorkspaceObjectTypes(context.admin, context.workspaceId)
  const existing = await findWorkspaceObjectType(context.admin, context.workspaceId, typeId)
  if (!existing) {
    throw new ObjectTypesHttpError('Object type not found.', 404)
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) {
      throw new ObjectTypesHttpError('Name is required.', 400)
    }
    patch.name = name
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null
  }
  if (input.isActive !== undefined) {
    patch.is_active = input.isActive
  }

  const schemaIds = await schemaIdsForWorkspace(context.admin, context.workspaceId)
  if (schemaIds.length === 0) {
    throw new ObjectTypesHttpError('Object type not found.', 404)
  }

  const updated = await context.admin
    .from('object_types')
    .update(patch)
    .eq('object_type_id', typeId)
    .in('schema_id', schemaIds)
    .select(TYPE_COLUMNS)
    .maybeSingle()

  if (updated.error) {
    if (updated.error.code === '23505') {
      throw new ObjectTypesHttpError('An object type with this name already exists.', 409)
    }
    console.error('Failed to update object type:', updated.error.message)
    throw new ObjectTypesHttpError('Could not update object type.', 500)
  }
  if (!updated.data) {
    throw new ObjectTypesHttpError('Object type not found.', 404)
  }

  const mapped = mapObjectType(updated.data as ObjectTypeRow)
  const [hydrated] = await withAttributes(context.admin, [mapped])
  return hydrated ?? mapped
}
