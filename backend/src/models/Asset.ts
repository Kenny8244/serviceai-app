// API Models for Asset Management

export interface Asset {
  id: string
  name: string
  description?: string
  category: string
  sku?: string
  quantity: number
  minQuantity: number
  unitCost?: number
  supplier?: string
  location?: string
  tags?: string[]
  metadata?: Record<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InventoryTransaction {
  id: string
  assetId: string
  transactionType: 'in' | 'out' | 'adjustment' | 'return' | 'transfer'
  quantityChange: number
  reason?: string
  referenceId?: string
  notes?: string
  createdAt: Date
  // Populated fields
  asset?: Asset
}

export interface CreateAssetRequest {
  name: string
  description?: string
  category: string
  sku?: string
  quantity?: number
  minQuantity?: number
  unitCost?: number
  supplier?: string
  location?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateAssetRequest {
  name?: string
  description?: string
  category?: string
  sku?: string
  quantity?: number
  minQuantity?: number
  unitCost?: number
  supplier?: string
  location?: string
  tags?: string[]
  metadata?: Record<string, any>
  isActive?: boolean
}

export interface AssetFilters {
  category?: string
  supplier?: string
  location?: string
  isActive?: boolean
  lowStock?: boolean
  search?: string
}

export interface AssetListResponse {
  assets: Asset[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface InventoryTransactionRequest {
  assetId: string
  transactionType: 'in' | 'out' | 'adjustment' | 'return' | 'transfer'
  quantityChange: number
  reason?: string
  referenceId?: string
  notes?: string
}

export interface AssetAnalytics {
  totalAssets: number
  totalValue: number
  lowStockItems: number
  categoriesCount: Record<string, number>
  recentTransactions: number
  averageTransactionValue: number
}
