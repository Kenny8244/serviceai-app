import type { Asset, ObjectType } from '@/services/api'
import { assetHasQuantityField, getStockStatus, type StockStatus } from '@/lib/objectTypeSchema'

export const ASSET_LIST_SORTS = ['updated-desc', 'updated-asc', 'name-asc', 'name-desc'] as const
export type AssetListSort = (typeof ASSET_LIST_SORTS)[number]

export const ASSET_LIST_SORT_FIELDS = ['updated', 'name'] as const
export type AssetListSortField = (typeof ASSET_LIST_SORT_FIELDS)[number]
export type AssetListSortDirection = 'asc' | 'desc'

export function assetListSortField(sort: AssetListSort): AssetListSortField {
  return sort.startsWith('name') ? 'name' : 'updated'
}

export function assetListSortDirection(sort: AssetListSort): AssetListSortDirection {
  return sort.endsWith('asc') ? 'asc' : 'desc'
}

export function toAssetListSort(field: AssetListSortField, direction: AssetListSortDirection): AssetListSort {
  return `${field}-${direction}`
}

export function toggleAssetListSortDirection(sort: AssetListSort): AssetListSort {
  const next = assetListSortDirection(sort) === 'asc' ? 'desc' : 'asc'
  return toAssetListSort(assetListSortField(sort), next)
}

export function defaultDirectionForSortField(field: AssetListSortField): AssetListSortDirection {
  return field === 'name' ? 'asc' : 'desc'
}

export const ASSET_LIST_STATUSES = ['all', 'ACTIVE', 'LOW', 'OUT', 'none'] as const
export type AssetListStatusFilter = (typeof ASSET_LIST_STATUSES)[number]

export type AssetListQuery = {
  q: string
  typeId: string | null
  status: AssetListStatusFilter
  sort: AssetListSort
}

export const DEFAULT_ASSET_LIST_QUERY: AssetListQuery = {
  q: '',
  typeId: null,
  status: 'all',
  sort: 'updated-desc',
}

function isSort(value: string | null): value is AssetListSort {
  return ASSET_LIST_SORTS.includes(value as AssetListSort)
}

function isStatus(value: string | null): value is AssetListStatusFilter {
  return ASSET_LIST_STATUSES.includes(value as AssetListStatusFilter)
}

export function parseAssetListParams(params: URLSearchParams): AssetListQuery {
  const type = params.get('type')?.trim() || null
  const statusRaw = params.get('status')
  const sortRaw = params.get('sort')
  return {
    q: params.get('q')?.trim() ?? '',
    typeId: type,
    status: isStatus(statusRaw) ? statusRaw : 'all',
    sort: isSort(sortRaw) ? sortRaw : 'updated-desc',
  }
}

export function toAssetListSearchParams(query: AssetListQuery): URLSearchParams {
  const params = new URLSearchParams()
  const q = query.q.trim()
  if (q) params.set('q', q)
  if (query.typeId) params.set('type', query.typeId)
  if (query.status !== 'all') params.set('status', query.status)
  if (query.sort !== 'updated-desc') params.set('sort', query.sort)
  return params
}

export function assetListHasFilters(query: AssetListQuery): boolean {
  return (
    Boolean(query.q.trim()) ||
    Boolean(query.typeId) ||
    query.status !== 'all' ||
    query.sort !== DEFAULT_ASSET_LIST_QUERY.sort
  )
}

export function assetMatchesSearch(asset: Pick<Asset, 'name' | 'sku'>, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (asset.name.toLowerCase().includes(needle)) return true
  return Boolean(asset.sku?.toLowerCase().includes(needle))
}

export function stockStatusForList(asset: Asset, types: ObjectType[]): StockStatus | null {
  if (!assetHasQuantityField(asset, types)) return null
  return getStockStatus(asset)
}

export function filterAndSortAssets(
  assets: Asset[],
  query: AssetListQuery,
  types: ObjectType[]
): Asset[] {
  const filtered = assets.filter((asset) => {
    if (query.typeId && (asset.objectTypeId || 'unknown') !== query.typeId) return false
    if (query.status === 'none') {
      if (stockStatusForList(asset, types) !== null) return false
    } else if (query.status !== 'all' && stockStatusForList(asset, types) !== query.status) {
      return false
    }
    return assetMatchesSearch(asset, query.q)
  })

  const sorted = [...filtered]
  switch (query.sort) {
    case 'updated-asc':
      sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.name.localeCompare(b.name))
      break
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name) || b.updatedAt.localeCompare(a.updatedAt))
      break
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name) || b.updatedAt.localeCompare(a.updatedAt))
      break
    case 'updated-desc':
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name))
      break
  }
  return sorted
}
