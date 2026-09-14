import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, Package, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { AssetAvatar, PermanentDeleteAssetDialog } from '@/components/assets/AssetDialogs'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset } from '@/services/api'

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function AssetsManagePage() {
  const vertical = getVerticalContent(getSelectedVertical())
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)

  const loadArchived = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getArchivedAssets()
      setAssets(data)
    } catch (err) {
      setError(toUserMessage(err))
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadArchived()
  }, [loadArchived])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assets
    return assets.filter((asset) => {
      const haystack = [asset.name, asset.objectTypeName, asset.sku, asset.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [assets, search])

  return (
    <PageShell
      title="Manage Items"
      subtitle={`Archived ${vertical.navAssetsLabel.toLowerCase()}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search archive…"
            className="pl-9"
            aria-label="Search archived items"
          />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} archived {filtered.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {loading ? (
        <LoadingState variant="skeleton" label="Loading archive" className="space-y-3">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </LoadingState>
      ) : error ? (
        <ErrorState title="Couldn't load archive" message={error} onRetry={() => void loadArchived()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-6 w-6 text-slate-500" />}
          title={assets.length === 0 ? 'Archive is empty' : 'No matching archived items'}
          description={
            assets.length === 0
              ? 'Archived items appear here. You can permanently delete them from this list.'
              : 'Try a different search.'
          }
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {filtered.map((asset) => (
            <li
              key={asset.id}
              className="flex items-center gap-4 bg-white px-4 py-3 dark:bg-slate-950"
            >
              <AssetAvatar src={asset.avatar} size="sm" alt={asset.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{asset.name}</p>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                  {asset.objectTypeName || 'Item'}
                  {' · '}
                  Archived {formatDate(asset.deletedAt ?? asset.updatedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                aria-label={`Delete ${asset.name} forever`}
                onClick={() => setDeleteTarget(asset)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget ? (
        <PermanentDeleteAssetDialog
          asset={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(assetId) => {
            setDeleteTarget(null)
            setAssets((current) => current.filter((asset) => asset.id !== assetId))
          }}
        />
      ) : null}
    </PageShell>
  )
}

export default AssetsManagePage
