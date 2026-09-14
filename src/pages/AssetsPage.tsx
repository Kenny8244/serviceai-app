import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ChevronDown, Package, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { AssetAvatar, AssetFormDialog } from '@/components/assets/AssetDialogs'
import { getAssetImportSnapshot, subscribeAssetImport } from '@/lib/assetImportJob'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset, type ObjectType } from '@/services/api'
import { cn } from '@/lib/utils'
import { assetHasQuantityField, getStockStatus, type StockStatus } from '@/lib/objectTypeSchema'
import {
  ASSET_LIST_SORT_FIELDS,
  ASSET_LIST_STATUSES,
  assetListHasFilters,
  assetListSortDirection,
  assetListSortField,
  defaultDirectionForSortField,
  filterAndSortAssets,
  parseAssetListParams,
  stockStatusForList,
  toAssetListSearchParams,
  toAssetListSort,
  toggleAssetListSortDirection,
  type AssetListQuery,
  type AssetListSortField,
  type AssetListStatusFilter,
} from '@/lib/assetListQuery'

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

const SORT_FIELD_LABELS: Record<AssetListSortField, string> = {
  updated: 'Updated',
  name: 'Name',
}

const STATUS_LABELS: Record<AssetListStatusFilter, string> = {
  all: 'All',
  ACTIVE: 'Active',
  LOW: 'Low stock',
  OUT: 'Out of stock',
  none: 'No status',
}

function AssetsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const vertical = getVerticalContent(getSelectedVertical())
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<'new' | null>(null)
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const importSnap = useSyncExternalStore(subscribeAssetImport, getAssetImportSnapshot)
  const listQuery = useMemo(() => parseAssetListParams(searchParams), [searchParams])

  const updateListQuery = useCallback(
    (patch: Partial<AssetListQuery>) => {
      setSearchParams(
        (previous) => toAssetListSearchParams({ ...parseAssetListParams(previous), ...patch }),
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearListQuery = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    let cancelled = false
    const loadTypes = async () => {
      try {
        const data = await apiService.getObjectTypes()
        if (!cancelled) setObjectTypes(data)
      } catch {
        if (!cancelled) setObjectTypes([])
      }
    }
    void loadTypes()
    return () => {
      cancelled = true
    }
  }, [])

  const loadAssets = useCallback(async (options?: { quiet?: boolean }) => {
    const quiet = Boolean(options?.quiet)
    try {
      if (!quiet) {
        setLoading(true)
        setError(null)
      }
      const data = await apiService.getAssets()
      setAssets((current) => {
        if (getAssetImportSnapshot().status !== 'running') return data
        const ids = new Set(data.map((asset) => asset.id))
        const extras = current.filter((asset) => !ids.has(asset.id))
        return [...extras, ...data]
      })
    } catch (err) {
      if (!quiet) {
        setError(toUserMessage(err))
        setAssets([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  useEffect(() => {
    const incoming = importSnap.lastAsset
    if (!incoming) return
    setAssets((current) => {
      if (current.some((asset) => asset.id === incoming.id)) return current
      return [incoming, ...current]
    })
    setLoading(false)
  }, [importSnap.lastAsset])

  useEffect(() => {
    if (importSnap.status !== 'done') return
    void loadAssets({ quiet: true })
  }, [importSnap.status, loadAssets])

  const typeFilters = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()
    for (const asset of assets) {
      const id = asset.objectTypeId || 'unknown'
      const name = asset.objectTypeName || 'Unknown'
      const current = counts.get(id)
      if (current) current.count += 1
      else counts.set(id, { name, count: 1 })
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([id, { name, count }]) => ({ id, name, count }))
  }, [assets])

  const statusCounts = useMemo(() => {
    const counts: Record<AssetListStatusFilter, number> = { all: assets.length, ACTIVE: 0, LOW: 0, OUT: 0, none: 0 }
    for (const asset of assets) {
      const status = stockStatusForList(asset, objectTypes)
      if (status) counts[status] += 1
      else counts.none += 1
    }
    return counts
  }, [assets, objectTypes])

  const filteredAssets = useMemo(
    () => filterAndSortAssets(assets, listQuery, objectTypes),
    [assets, listQuery, objectTypes]
  )

  const getStatusBadgeVariant = (status: StockStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default' as const
      case 'LOW':
        return 'warning' as const
      case 'OUT':

      return 'destructive' as const
    }
  }

  const sidebarButtonClass = (active: boolean) =>
    `flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
      active ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
    }`

  return (
    <PageShell
      flush
      title={vertical.navAssetsLabel}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search by name or SKU..."
              className="pl-8 w-[240px]"
              value={listQuery.q}
              onChange={(event) => updateListQuery({ q: event.target.value })}
            />
          </div>
          <div
            className={cn(
              'inline-flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background',
              'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
            )}
          >
            <div className="relative">
              <select
                aria-label="Sort assets"
                className="h-full w-[6.75rem] cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-sm text-foreground outline-none [&::-ms-expand]:hidden"
                value={assetListSortField(listQuery.sort)}
                onChange={(event) => {
                  const field = event.target.value as AssetListSortField
                  updateListQuery({ sort: toAssetListSort(field, defaultDirectionForSortField(field)) })
                }}
              >
                {ASSET_LIST_SORT_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {SORT_FIELD_LABELS[field]}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
            </div>
            <span className="my-1.5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden />
            <button
              type="button"
              className="grid w-9 shrink-0 place-items-center text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={
                assetListSortDirection(listQuery.sort) === 'asc' ? 'Sort ascending' : 'Sort descending'
              }
              title={
                assetListSortField(listQuery.sort) === 'name'
                  ? assetListSortDirection(listQuery.sort) === 'asc'
                    ? 'A to Z'
                    : 'Z to A'
                  : assetListSortDirection(listQuery.sort) === 'asc'
                    ? 'Oldest first'
                    : 'Newest first'
              }
              onClick={() => updateListQuery({ sort: toggleAssetListSortDirection(listQuery.sort) })}
            >
              {assetListSortDirection(listQuery.sort) === 'asc' ? (
                <ArrowUpNarrowWide className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownNarrowWide className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <Button type="button" onClick={() => setFormTarget('new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </>
      }
    >
      <div className="flex flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
          <h2 className="font-semibold text-lg mb-4">Object types</h2>
          <button
            type="button"
            onClick={() => updateListQuery({ typeId: null })}
            className={sidebarButtonClass(listQuery.typeId === null)}
          >
            <span className="flex-1 text-left">All</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{assets.length}</span>
          </button>
          {typeFilters.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => updateListQuery({ typeId: type.id })}
              className={sidebarButtonClass(listQuery.typeId === type.id)}
            >
              <span className="flex-1 text-left">{type.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{type.count}</span>
            </button>
          ))}

          <h2 className="font-semibold text-lg mt-6 mb-4">Status</h2>
          {ASSET_LIST_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-label={`Filter by status: ${STATUS_LABELS[status]}`}
              onClick={() => updateListQuery({ status })}
              className={sidebarButtonClass(listQuery.status === status)}
            >
              <span className="flex-1 text-left">{STATUS_LABELS[status]}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
          <div className="p-2 space-y-1">
            {loading ? (
              <LoadingState variant="skeleton" label="Loading assets" className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-3 space-y-2">
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-3 w-1/2" />
                  </div>
                ))}
              </LoadingState>
            ) : error ? (
              <ErrorState
                title="Couldn't load assets"
                message={error}
                onRetry={loadAssets}
                className="py-10"
              />
            ) : assets.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6 text-slate-500" />}
                title="No assets yet"
                description="Imported or created items will show up here."
                className="py-10"
                action={
                  <Button type="button" onClick={() => setFormTarget('new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </Button>
                }
              />
            ) : filteredAssets.length === 0 ? (
              <EmptyState
                title="No assets match this search"
                description="Try a different name, SKU, object type, or status."
                className="py-10"
                action={
                  assetListHasFilters(listQuery) ? (
                    <Button type="button" variant="outline" onClick={clearListQuery}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              filteredAssets.map((asset) => {
                const showQuantity = assetHasQuantityField(asset, objectTypes)
                const status = showQuantity ? getStockStatus(asset) : null
                return (
                  <button
                    type="button"
                    key={asset.id}
                    className={cn(
                      'w-full text-left p-3 rounded border border-transparent',
                      status === 'LOW' &&
                        'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-950/70',
                      status === 'OUT' &&
                        'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:hover:bg-red-950/60',
                      status !== 'LOW' &&
                        status !== 'OUT' &&
                        'hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <AssetAvatar src={asset.avatar} size="sm" alt={asset.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium truncate">{asset.name}</span>
                          {status ? <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge> : null}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {asset.objectTypeName || 'Unknown'}
                          {showQuantity ? ` · Qty ${asset.quantity}` : ''}
                          {asset.sku ? ` · ${asset.sku}` : ''}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Updated {formatDate(asset.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
      {formTarget === 'new' ? (
        <AssetFormDialog
          asset={null}
          initialObjectTypes={objectTypes}
          onClose={() => setFormTarget(null)}
          onSaved={async (saved) => {
            setFormTarget(null)
            setAssets((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
            await loadAssets({ quiet: true })
            navigate(`/assets/${saved.id}`)
          }}
        />
      ) : null}
    </PageShell>
  )
}

export default AssetsPage
