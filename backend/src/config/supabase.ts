import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Check if Supabase credentials are properly configured
const hasValidSupabaseConfig = supabaseUrl &&
                              supabaseAnonKey &&
                              !supabaseUrl.includes('your-supabase-project-url') &&
                              !supabaseAnonKey.includes('your-supabase-anon-key')

let supabase: SupabaseClient | null = null
let supabaseAdmin: SupabaseClient | null = null

if (hasValidSupabaseConfig) {
  console.log('🔗 Supabase connected successfully')

  // Public client (for general operations)
  supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Admin client (for server-side operations that need elevated permissions)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey)
} else {
  console.warn('⚠️  Supabase credentials not configured. Running in demo mode with in-memory storage.')
  console.log('📝 To enable database persistence, please add your Supabase credentials to .env file')
}

// Fallback in-memory storage for demo mode
const fallbackUsers: any[] = []
const fallbackUserVerticals: any[] = []
const fallbackServiceRequests: any[] = []
const fallbackAssets: DatabaseAsset[] = []
const fallbackInventoryTransactions: DatabaseInventoryTransaction[] = []

// Database schema interfaces
export interface DatabaseUser {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name: string
  phone_number: string
  job_title?: string
  company_size?: string
  industry?: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface DatabaseVertical {
  id: string
  name: string
  description: string
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseUserVertical {
  id: string
  user_id: string
  vertical_id: string
  selected_at: string
}

export interface DatabaseServiceRequest {
  id: string
  user_id: string
  vertical_id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  attachments?: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface DatabaseAsset {
  id: string
  user_id: string
  name: string
  description?: string
  category: string
  sku?: string
  quantity: number
  min_quantity: number
  unit_cost?: number
  supplier?: string
  location?: string
  tags?: string[]
  metadata?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseInventoryTransaction {
  id: string
  asset_id: string
  user_id: string
  transaction_type: 'in' | 'out' | 'adjustment' | 'return' | 'transfer'
  quantity_change: number
  reason?: string
  reference_id?: string
  notes?: string
  created_at: string
}

// Export clients (will be null in demo mode)
export { supabase, supabaseAdmin }

// Export fallback storage for demo mode
export { fallbackUsers, fallbackUserVerticals, fallbackServiceRequests, fallbackAssets, fallbackInventoryTransactions }

// Helper to check if we're in demo mode
export const isDemoMode = () => !hasValidSupabaseConfig
