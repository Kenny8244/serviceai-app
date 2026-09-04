import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { getAssetImportSnapshot, subscribeAssetImport } from '@/lib/assetImportJob'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset } from '@/services/api'

const AVATAR_MAX_BYTES = 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

function AssetAvatar({ src, size, alt }: { src: string | null; size: 'sm' | 'lg'; alt: string }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-16 w-16'
  if (src) {
    return <img src={src} alt={alt} className={`${dim} rounded-full object-cover shrink-0`} />
  }
  return (
    <div className={`${dim} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`} aria-hidden>
      <Package className={size === 'sm' ? 'h-4 w-4 text-slate-400' : 'h-6 w-6 text-slate-400'} />
    </div>
  )
}

function AssetsPage() {
  const vertical = getVerticalContent(getSelectedVertical())
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formTarget, setFormTarget] = useState<'new' | Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)
  const importSnap = useSyncExternalStore(subscribeAssetImport, getAssetImportSnapshot)

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
      setSelectedAssetId((current) => {
        if (current && data.some((asset) => asset.id === current)) return current
        return data[0]?.id ?? current ?? null
      })
    } catch (err) {
      if (!quiet) {
        setError(toUserMessage(err))
        setAssets([])
        setSelectedAssetId(null)
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
    setSelectedAssetId((current) => current ?? incoming.id)
    setLoading(false)
  }, [importSnap.lastAsset])

  useEffect(() => {
    if (importSnap.status !== 'done') return
    void loadAssets({ quiet: true })
  }, [importSnap.status, loadAssets])

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
          <Button type="button" onClick={() => setFormTarget('new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
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
                        <div className="flex items-center gap-3">
                          <AssetAvatar src={asset.avatar} size="sm" alt={asset.name} />
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-medium truncate">{asset.name}</span>
                              <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {asset.category}
                              {asset.quantity != null ? ` · Qty ${asset.quantity}` : ''}
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <AssetAvatar src={selectedAsset.avatar} size="lg" alt={selectedAsset.name} />
                        <div>
                          <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                          <div className="flex items-center mt-2">
                            <Badge variant={getStatusBadgeVariant(getStockStatus(selectedAsset))}>
                              {getStockStatus(selectedAsset)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          aria-label="Edit"
                          onClick={() => setFormTarget(selectedAsset)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <button
                          type="button"
                          aria-label="Delete product"
                          onClick={() => setDeleteTarget(selectedAsset)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
      {formTarget ? (
        <AssetFormDialog
          asset={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={async (assetId) => {
            setFormTarget(null)
            await loadAssets()
            setSelectedAssetId(assetId)
          }}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteAssetDialog
          asset={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(assetId) => {
            setDeleteTarget(null)
            setAssets((current) => {
              const next = current.filter((asset) => asset.id !== assetId)
              setSelectedAssetId((selected) => {
                if (selected !== assetId) return selected
                return next[0]?.id ?? null
              })
              return next
            })
          }}
        />
      ) : null}
    </PageShell>
  )
}

function AssetFormDialog({
  asset,
  onClose,
  onSaved,
}: {
  asset: Asset | null
  onClose: () => void
  onSaved: (assetId: string) => Promise<void>
}) {
  const isEdit = Boolean(asset)
  const [name, setName] = useState(asset?.name ?? '')
  const [category, setCategory] = useState(asset?.category ?? '')
  const [sku, setSku] = useState(asset?.sku ?? '')
  const [quantity, setQuantity] = useState(asset ? String(asset.quantity) : '0')
  const [minQuantity, setMinQuantity] = useState(asset ? String(asset.minQuantity) : '0')
  const [unitCost, setUnitCost] = useState(asset?.unitCost == null ? '' : String(asset.unitCost))
  const [supplier, setSupplier] = useState(asset?.supplier ?? '')
  const [location, setLocation] = useState(asset?.location ?? '')
  const [description, setDescription] = useState(asset?.description ?? '')
  const [avatar, setAvatar] = useState(asset?.avatar ?? '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const pickAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      setFormError('Use a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setFormError('Avatar must be 1MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(String(reader.result ?? ''))
      setFormError(null)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError('Name is required.')
      return
    }

    const payload = {
      name: trimmedName,
      category: category.trim() || undefined,
      sku: sku.trim() || undefined,
      quantity: Number(quantity) || 0,
      minQuantity: Number(minQuantity) || 0,
      unitCost: unitCost.trim() === '' || !Number.isFinite(Number(unitCost)) ? null : Number(unitCost),
      supplier: supplier.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      avatar: avatar.trim() || null,
    }

    try {
      setSaving(true)
      setFormError(null)
      const saved = asset
        ? await apiService.updateAsset(asset.id, payload)
        : await apiService.createAsset(payload)
      await onSaved(saved.id)
    } catch (err) {
      setFormError(toUserMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Edit Asset' : 'Add Asset'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Card
        role="dialog"
        aria-labelledby="asset-form-title"
        className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="asset-form-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <FormField label="Avatar" htmlFor="asset-avatar">
            <div className="flex items-center gap-3">
              <AssetAvatar src={avatar || null} size="lg" alt="Avatar preview" />
              <input
                ref={avatarInputRef}
                id="asset-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={pickAvatar}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                Choose image
              </Button>
              {avatar ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar('')}>
                  Remove
                </Button>
              ) : null}
            </div>
          </FormField>
          <FormField label="Name" htmlFor="asset-name" required>
            <Input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
          </FormField>
          <FormField label="Category" htmlFor="asset-category">
            <Input
              id="asset-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" htmlFor="asset-sku">
              <Input id="asset-sku" value={sku} onChange={(event) => setSku(event.target.value)} />
            </FormField>
            <FormField label="Quantity" htmlFor="asset-quantity">
              <Input
                id="asset-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimum quantity" htmlFor="asset-min-quantity">
              <Input
                id="asset-min-quantity"
                type="number"
                min="0"
                value={minQuantity}
                onChange={(event) => setMinQuantity(event.target.value)}
              />
            </FormField>
            <FormField label="Unit cost" htmlFor="asset-unit-cost">
              <Input
                id="asset-unit-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Supplier" htmlFor="asset-supplier">
            <Input
              id="asset-supplier"
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
            />
          </FormField>
          <FormField label="Location" htmlFor="asset-location">
            <Input
              id="asset-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </FormField>
          <FormField label="Description" htmlFor="asset-description">
            <Textarea
              id="asset-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </FormField>
          {formError ? (
            <p className="text-sm text-red-600">{formError}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function DeleteAssetDialog({
  asset,
  onClose,
  onDeleted,
}: {
  asset: Asset
  onClose: () => void
  onDeleted: (assetId: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      setError(null)
      await apiService.deleteAsset(asset.id)
      onDeleted(asset.id)
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !deleting) onClose()
      }}
    >
      <Card role="dialog" aria-labelledby="delete-asset-title" className="w-full max-w-md p-6">
        <h2 id="delete-asset-title" className="text-lg font-semibold">
          Delete product?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          “{asset.name}” will be removed from your list. This cannot be undone.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Card>
    </div>
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
