export interface Env {
  DEMO_KV: KVNamespace
  FRONTEND_URL: string
  JWT_SECRET?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export interface JwtPayload {
  userId: string
  email: string
  organizationId: string
  workspaceId?: string
}

export interface StoredUser {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  jobTitle?: string
  companySize?: string
  industry?: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export interface UserVertical {
  userId: string
  verticalId: string
  selectedAt: string
}

export interface ServiceRequest {
  id: string
  user_id: string
  workspace_id?: string
  /** @deprecated KV demo seed only; omitted for Supabase-backed rows */
  vertical_id?: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  related_asset_id?: string | null
  related_asset_name?: string | null
  attachments?: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  description?: string | null
  category: string
  object_type_id: string
  object_type_name: string
  sku?: string | null
  quantity: number
  min_quantity: number
  unit_cost?: number | null
  supplier?: string | null
  location?: string | null
  tags?: string[] | null
  avatar?: string | null
  custom_fields?: Record<string, unknown>
  metadata?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type Variables = {
  user: JwtPayload
}
