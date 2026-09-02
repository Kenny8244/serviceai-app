import type { Env, UserVertical } from '../types'
import { getSupabaseAdmin } from './supabase'
import { getUserVertical } from './store'

export const VALID_VERTICAL_IDS = ['retail', 'restaurant', 'store-market', 'business'] as const

export function isValidVerticalId(id: string): boolean {
  return (VALID_VERTICAL_IDS as readonly string[]).includes(id)
}

function isTenantId(value?: string): boolean {
  return Boolean(value && value !== 'default-org-id' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
}

function metadataObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export async function saveTenantVertical(env: Env, tenantId: string | undefined, verticalId: string): Promise<void> {
  if (!isTenantId(tenantId)) return
  const admin = getSupabaseAdmin(env)
  if (!admin) return

  const { data } = await admin.from('tenants').select('metadata').eq('tenant_id', tenantId).maybeSingle()
  const metadata = metadataObject(data?.metadata)

  const { error } = await admin
    .from('tenants')
    .update({
      metadata: {
        ...metadata,
        verticalId,
        verticalSelectedAt: new Date().toISOString(),
      },
    })
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Failed to persist tenant vertical:', error.message)
  }
}

export async function getTenantVertical(
  env: Env,
  tenantId: string | undefined,
  userId: string
): Promise<UserVertical | null> {
  if (!isTenantId(tenantId)) return null
  const admin = getSupabaseAdmin(env)
  if (!admin) return null

  const { data, error } = await admin.from('tenants').select('metadata').eq('tenant_id', tenantId).maybeSingle()
  if (error || !data) return null

  const metadata = metadataObject(data.metadata)
  const verticalId = metadata.verticalId
  if (typeof verticalId !== 'string' || !isValidVerticalId(verticalId)) return null

  const selectedAt =
    typeof metadata.verticalSelectedAt === 'string' ? metadata.verticalSelectedAt : new Date().toISOString()

  return { userId, verticalId, selectedAt }
}

export async function resolveUserVertical(
  env: Env,
  kv: KVNamespace,
  userId: string,
  tenantId?: string
): Promise<UserVertical | null> {
  const fromTenant = await getTenantVertical(env, tenantId, userId)
  if (fromTenant) return fromTenant
  return getUserVertical(kv, userId)
}
