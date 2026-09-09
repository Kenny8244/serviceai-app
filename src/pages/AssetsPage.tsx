import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Search } from 'lucide-react'
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
import { assetHasQuantityField, searchableAssetValues } from '@/lib/objectTypeSchema'

type StockStatus = 'ACTIVE' | 'LOW' | 'OUT'

function getStockStatus(asset: Asset): StockStatus {
  if (asset.quantity <= 0) return 'OUT'
  if (asset.quantity <= asset.minQuantity) return 'LOW'
  return 'ACTIVE'
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function AssetsPage() {
  const navigate = useNavigate()
  const vertical = getVerticalContent(getSelectedVertical())
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<'new' | null>(null)
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const importSnap = useSyncExternalStore(subscribeAssetImport, getAssetImportSnapshot)

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

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return assets.filter((asset) => {
      const typeId = asset.objectTypeId || 'unknown'
      if (selectedTypeId && typeId !== selectedTypeId) return false
      if (!query) return true
      return searchableAssetValues(asset).some((value) => String(value ?? '').toLowerCase().includes(query))
    })
  }, [assets, searchQuery, selectedTypeId])

  const getStatusBadgeVariant = (status: StockStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default' as const
      case 'LOW':
        return 'secondary' as const
      case 'OUT':
        return 'destructive' as const
    }
  }

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
              placeholder={`Search ${vertical.navAssetsLabel.toLowerCase()}...`}
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
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
            onClick={() => setSelectedTypeId(null)}
            className={`flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
              selectedTypeId === null ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
            }`}
          >
            <span className="flex-1 text-left">All</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{assets.length}</span>
          </button>
          {typeFilters.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedTypeId(type.id)}
              className={`flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedTypeId === type.id ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
              }`}
            >
              <span className="flex-1 text-left">{type.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{type.count}</span>
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
                description="Try a different name, SKU, or object type."
                className="py-10"
              />
            ) : (
              filteredAssets.map((asset) => {
                const showQuantity = assetHasQuantityField(asset, objectTypes)
                const status = showQuantity ? getStockStatus(asset) : null
                return (
                  <button
                    type="button"
                    key={asset.id}
                    className="w-full text-left p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
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
