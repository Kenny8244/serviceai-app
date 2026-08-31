import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Package, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset } from '@/services/api'

type StockStatus = 'ACTIVE' | 'LOW' | 'OUT'

function getStockStatus(asset: Asset): StockStatus {
  if (asset.quantity <= 0) return 'OUT'
  if (asset.quantity <= asset.minQuantity) return 'LOW'
  return 'ACTIVE'
}

function formatCurrency(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function AssetsPage() {
  const vertical = getVerticalContent(getSelectedVertical())
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getAssets()
      setAssets(data)
      setSelectedAssetId((current) => {
        if (current && data.some((asset) => asset.id === current)) return current
        return data[0]?.id ?? null
      })
    } catch (err) {
      setError(toUserMessage(err))
      setAssets([])
      setSelectedAssetId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const asset of assets) {
      const key = asset.category || 'Uncategorized'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ id: name, name, count }))
  }, [assets])

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return assets.filter((asset) => {
      if (selectedCategory && asset.category !== selectedCategory) return false
      if (!query) return true
      return [asset.name, asset.sku, asset.category, asset.supplier, asset.location]
        .some((value) => (value ?? '').toLowerCase().includes(query))
    })
  }, [assets, searchQuery, selectedCategory])

  const selectedAsset = filteredAssets.find((asset) => asset.id === selectedAssetId)
    ?? assets.find((asset) => asset.id === selectedAssetId)
    ?? null

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
          <Button disabled title="Coming soon">
            <Plus className="mr-2 h-4 w-4" />
            Create Object
          </Button>
        </>
      }
    >
      <div className="flex flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
          <h2 className="font-semibold text-lg mb-4">Categories</h2>
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
              selectedCategory === null ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
            }`}
          >
            <span className="flex-1 text-left">All</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{assets.length}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedCategory === category.id ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
              }`}
            >
              <span className="flex-1 text-left">{category.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{category.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">
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
                  />
                ) : filteredAssets.length === 0 ? (
                  <EmptyState
                    title="No assets match this search"
                    description="Try a different name, SKU, or category."
                    className="py-10"
                  />
                ) : (
                  filteredAssets.map((asset) => {
                    const status = getStockStatus(asset)
                    return (
                      <button
                        type="button"
                        key={asset.id}
                        className={`w-full text-left p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          selectedAsset?.id === asset.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                        }`}
                        onClick={() => setSelectedAssetId(asset.id)}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium truncate">{asset.name}</span>
                          <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Qty {asset.quantity}
                          {asset.sku ? ` · ${asset.sku}` : ''}
                        </p>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
              {loading ? (
                <LoadingState variant="skeleton" label="Loading asset details" className="space-y-4 max-w-xl">
                  <SkeletonBlock className="h-8 w-48" />
                  <SkeletonBlock className="h-40 w-full" />
                </LoadingState>
              ) : error ? (
                <EmptyState
                  icon={<Package className="h-6 w-6 text-slate-500" />}
                  title="Asset details unavailable"
                  description="Fix the list error to see item details."
                />
              ) : selectedAsset ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                      <div className="flex items-center mt-2">
                        <Badge variant={getStatusBadgeVariant(getStockStatus(selectedAsset))}>
                          {getStockStatus(selectedAsset)}
                        </Badge>
                      </div>
                    </div>

                    <Card className="p-6">
                      <h3 className="font-medium mb-4">Details</h3>
                      <div className="space-y-4">
                        <DetailItem label="SKU" value={selectedAsset.sku} />
                        <DetailItem label="Category" value={selectedAsset.category} />
                        <DetailItem label="Quantity" value={String(selectedAsset.quantity)} />
                        <DetailItem label="Minimum quantity" value={String(selectedAsset.minQuantity)} />
                        <DetailItem label="Unit cost" value={formatCurrency(selectedAsset.unitCost)} />
                        <DetailItem label="Supplier" value={selectedAsset.supplier} />
                        <DetailItem label="Location" value={selectedAsset.location} />
                        <DetailItem label="Updated" value={formatDate(selectedAsset.updatedAt)} />
                      </div>
                    </Card>

                    {selectedAsset.description ? (
                      <Card className="p-6">
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{selectedAsset.description}</p>
                      </Card>
                    ) : null}
                  </div>

                  <div className="space-y-6">
                    <Card className="p-6">
                      <h3 className="font-medium mb-4">Stock</h3>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {selectedAsset.quantity}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Reorder when at or below {selectedAsset.minQuantity}
                      </p>
                    </Card>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="h-6 w-6 text-slate-500" />}
                  title="No asset selected"
                  description="Select an asset from the list to view details"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="col-span-2 text-sm font-medium">{value || '—'}</div>
    </div>
  )
}

export default AssetsPage
