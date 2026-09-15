import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, ClipboardList, Package, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { AssetAvatar, AssetFormDialog, ArchiveAssetDialog } from '@/components/assets/AssetDialogs'
import { ServiceRequestFormDialog } from '@/components/service-requests/ServiceRequestDialogs'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset, type ObjectType, type ServiceRequest } from '@/services/api'
import {
  attributeValueFromAsset,
  assetHasQuantityField,
  formatAttributeValue,
  getStockStatus,
  type StockStatus,
} from '@/lib/objectTypeSchema'

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function getStatusBadgeVariant(status: StockStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'default' as const
      case 'LOW':
        return 'warning' as const
    case 'OUT':
      return 'destructive' as const
  }
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="col-span-2 text-sm font-medium">{value || '—'}</div>
    </div>
  )
}

function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vertical = getVerticalContent(getSelectedVertical())
  const [asset, setAsset] = useState<Asset | null>(null)
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [requestFormOpen, setRequestFormOpen] = useState(false)
  const [relatedRequests, setRelatedRequests] = useState<ServiceRequest[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [relatedError, setRelatedError] = useState<string | null>(null)

  const loadAsset = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      setAsset(null)
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setNotFound(false)
      const [loaded, types] = await Promise.all([
        apiService.getAssetById(id),
        apiService.getObjectTypes().catch(() => [] as ObjectType[]),
      ])
      setAsset(loaded)
      setObjectTypes(types)
    } catch (err) {
      const status = typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status)
        : undefined
      if (status === 404) {
        setNotFound(true)
        setError(null)
      } else {
        setNotFound(false)
        setError(toUserMessage(err))
      }
      setAsset(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadRelatedRequests = useCallback(async (assetId: string) => {
    try {
      setRelatedLoading(true)
      setRelatedError(null)
      const { serviceRequests } = await apiService.getServiceRequests()
      setRelatedRequests(
        serviceRequests.filter((request) => request.relatedAssetId === assetId)
      )
    } catch (err) {
      setRelatedError(toUserMessage(err))
      setRelatedRequests([])
    } finally {
      setRelatedLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAsset()
  }, [loadAsset])

  useEffect(() => {
    if (!asset?.id) {
      setRelatedRequests([])
      setRelatedError(null)
      return
    }
    void loadRelatedRequests(asset.id)
  }, [asset?.id, loadRelatedRequests])

  const selectedType = objectTypes.find((type) => type.id === asset?.objectTypeId)
  const selectedSchema = selectedType?.attributes ?? []
  const hasQuantityField = asset ? assetHasQuantityField(asset, objectTypes) : false
  const stockStatus = asset && hasQuantityField ? getStockStatus(asset) : null

  return (
    <PageShell
      title={vertical.navAssetsLabel}
      subtitle={asset?.name}
      actions={
        <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
      }
    >
      {loading ? (
        <LoadingState variant="skeleton" label="Loading asset details" className="space-y-4 max-w-3xl">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-40 w-full" />
        </LoadingState>
      ) : notFound ? (
        <ErrorState
          title="Asset not found"
          message="This asset may have been removed or the link is invalid."
        />
      ) : error ? (
        <ErrorState title="Couldn't load asset" message={error} onRetry={() => void loadAsset()} />
      ) : asset ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <AssetAvatar src={asset.avatar} size="lg" alt={asset.name} />
                <div>
                  <h2 className="text-2xl font-bold">{asset.name}</h2>
                  <div className="flex items-center mt-2">
                    {stockStatus ? (
                      <Badge variant={getStatusBadgeVariant(stockStatus)}>{stockStatus}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRequestFormOpen(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label="Edit"
                  onClick={() => setFormOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  aria-label="Archive asset"
                  onClick={() => setArchiveOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900/60"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Card className="p-6">
              <h3 className="font-medium mb-4">Details</h3>
              <div className="space-y-4">
                <DetailItem label="Object type" value={asset.objectTypeName} />
                {selectedSchema.length > 0 ? (
                  selectedSchema.map((attribute) => (
                    <DetailItem
                      key={attribute.id || attribute.name}
                      label={attribute.label}
                      value={formatAttributeValue(attribute, attributeValueFromAsset(asset, attribute.name))}
                    />
                  ))
                ) : (
                  <>
                    <DetailItem label="SKU" value={asset.sku} />
                    <DetailItem label="Quantity" value={String(asset.quantity)} />
                    <DetailItem label="Location" value={asset.location} />
                  </>
                )}
                <DetailItem label="Updated" value={formatDate(asset.updatedAt)} />
              </div>
            </Card>

            {asset.description ? (
              <Card className="p-6">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{asset.description}</p>
              </Card>
            ) : null}

            <Card className="p-6">
              <h3 className="font-medium mb-4">Related service requests</h3>
              {relatedLoading ? (
                <LoadingState variant="skeleton" label="Loading related requests" className="space-y-2">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </LoadingState>
              ) : relatedError ? (
                <ErrorState
                  title="Couldn't load related requests"
                  message={relatedError}
                  onRetry={() => {
                    if (asset?.id) void loadRelatedRequests(asset.id)
                  }}
                  className="py-6"
                />
              ) : relatedRequests.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6 text-slate-500" />}
                  title="No service requests yet"
                  description="Service requests linked to this asset will appear here."
                  className="py-8"
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={() => setRequestFormOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create request
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {relatedRequests.map((request) => (
                    <li key={request.id}>
                      <Link
                        to={`/service-requests/${request.id}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-transparent px-2 py-2 text-sm hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900/40"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100">
                          {request.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline">{request.priority}</Badge>
                          <Badge variant="secondary">{request.status.replace('_', ' ')}</Badge>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {hasQuantityField || selectedSchema.length === 0 ? (
              <Card className="p-6">
                <h3 className="font-medium mb-4">Stock</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{asset.quantity}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Reorder when at or below {asset.minQuantity}
                </p>
              </Card>
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6 text-slate-500" />}
          title="No asset selected"
          description="Choose an asset from the list to view details."
          action={
            <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
              Back to list
            </Button>
          }
        />
      )}

      {formOpen && asset ? (
        <AssetFormDialog
          asset={asset}
          initialObjectTypes={objectTypes}
          onClose={() => setFormOpen(false)}
          onSaved={async (saved) => {
            setFormOpen(false)
            setAsset(saved)
          }}
        />
      ) : null}
      {archiveOpen && asset ? (
        <ArchiveAssetDialog
          asset={asset}
          onClose={() => setArchiveOpen(false)}
          onArchived={() => {
            setArchiveOpen(false)
            navigate('/assets')
          }}
        />
      ) : null}
      {requestFormOpen && asset ? (
        <ServiceRequestFormDialog
          defaultRelatedAssetId={asset.id}
          defaultRelatedAssetName={asset.name}
          onClose={() => setRequestFormOpen(false)}
          onSaved={(saved) => {
            setRequestFormOpen(false)
            navigate(`/service-requests/${saved.id}`)
          }}
        />
      ) : null}
    </PageShell>
  )
}

export default AssetDetailPage
