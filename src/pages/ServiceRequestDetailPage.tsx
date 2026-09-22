import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { FormField, nativeSelectClassName } from '@/components/ui/form-field'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { ServiceRequestFormDialog } from '@/components/service-requests/ServiceRequestDialogs'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type ServiceRequest } from '@/services/api'

const PRIORITIES: Array<ServiceRequest['priority']> = ['low', 'medium', 'high', 'urgent']
const STATUSES: Array<ServiceRequest['status']> = ['open', 'in_progress', 'resolved', 'closed']

function formatOptionLabel(value: string): string {
  return value.replace(/_/g, ' ')
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="col-span-2 text-sm font-medium">{value || '—'}</div>
    </div>
  )
}

function priorityVariant(priority: ServiceRequest['priority']) {
  switch (priority) {
    case 'urgent':
      return 'destructive' as const
    case 'high':
      return 'warning' as const
    case 'low':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function statusVariant(status: ServiceRequest['status']) {
  switch (status) {
    case 'open':
      return 'default' as const
    case 'in_progress':
      return 'warning' as const
    case 'resolved':
      return 'secondary' as const
    case 'closed':
      return 'outline' as const
    default:
      return 'outline' as const
  }
}

function RelatedAssetValue({
  relatedAssetId,
  relatedAssetName,
}: {
  relatedAssetId: string | null
  relatedAssetName: string | null
}) {
  if (!relatedAssetId) return 'None — can be linked later'

  return (
    <Link
      to={`/assets/${relatedAssetId}`}
      className="text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
    >
      {relatedAssetName || 'Related asset'}
    </Link>
  )
}

function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vertical = getVerticalContent(getSelectedVertical())
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [savingLifecycle, setSavingLifecycle] = useState(false)
  const [lifecycleError, setLifecycleError] = useState<string | null>(null)

  const loadRequest = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      setRequest(null)
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setNotFound(false)
      const { serviceRequest } = await apiService.getServiceRequest(id)
      setRequest(serviceRequest)
    } catch (err) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : undefined
      if (status === 404) {
        setNotFound(true)
        setError(null)
      } else {
        setNotFound(false)
        setError(toUserMessage(err))
      }
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  const updateLifecycle = async (
    field: 'priority' | 'status',
    value: ServiceRequest['priority'] | ServiceRequest['status']
  ) => {
    if (!request || savingLifecycle) return
    if (field === 'priority' && value === request.priority) return
    if (field === 'status' && value === request.status) return

    const previous = request
    setRequest({ ...request, [field]: value })
    setSavingLifecycle(true)
    setLifecycleError(null)
    try {
      const { serviceRequest } = await apiService.updateServiceRequest(previous.id, { [field]: value })
      setRequest(serviceRequest)
    } catch (err) {
      setRequest(previous)
      setLifecycleError(toUserMessage(err))
    } finally {
      setSavingLifecycle(false)
    }
  }

  return (
    <PageShell
      title={vertical.navServiceRequestsLabel}
      subtitle={request?.title}
      actions={
        <Button type="button" variant="outline" onClick={() => navigate('/service-requests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
      }
    >
      {loading ? (
        <LoadingState variant="skeleton" label="Loading service request" className="space-y-4 max-w-3xl">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-40 w-full" />
        </LoadingState>
      ) : notFound ? (
        <ErrorState
          title="Service request not found"
          message="This request may have been removed or the link is invalid."
          onRetry={() => navigate('/service-requests')}
          retryLabel="Back to list"
        />
      ) : error ? (
        <ErrorState title="Couldn't load service request" message={error} onRetry={() => void loadRequest()} />
      ) : request ? (
        <div className="max-w-3xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold">{request.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={priorityVariant(request.priority)}>{request.priority}</Badge>
                <Badge variant={statusVariant(request.status)}>{request.status.replace('_', ' ')}</Badge>
              </div>
              <fieldset
                className="mt-4 grid gap-3 sm:grid-cols-2 max-w-xl"
                disabled={savingLifecycle}
                aria-busy={savingLifecycle}
              >
                <legend className="sr-only">Update status and priority</legend>
                <FormField label="Priority" htmlFor="sr-detail-priority">
                  <select
                    id="sr-detail-priority"
                    className={nativeSelectClassName}
                    value={request.priority}
                    aria-label="Priority"
                    onChange={(event) =>
                      void updateLifecycle('priority', event.target.value as ServiceRequest['priority'])
                    }
                  >
                    {PRIORITIES.map((item) => (
                      <option key={item} value={item}>
                        {formatOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Status" htmlFor="sr-detail-status">
                  <select
                    id="sr-detail-status"
                    className={nativeSelectClassName}
                    value={request.status}
                    aria-label="Status"
                    onChange={(event) =>
                      void updateLifecycle('status', event.target.value as ServiceRequest['status'])
                    }
                  >
                    {STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {formatOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </fieldset>
              {lifecycleError ? (
                <Alert variant="destructive" className="mt-3 max-w-xl">
                  <AlertDescription>{lifecycleError}</AlertDescription>
                </Alert>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 shrink-0"
              aria-label="Edit"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          <Card className="p-6">
            <h3 className="font-medium mb-4">Details</h3>
            <div className="space-y-4">
              <DetailItem label="Category" value={request.category} />
              <DetailItem
                label="Related asset"
                value={
                  <RelatedAssetValue
                    relatedAssetId={request.relatedAssetId}
                    relatedAssetName={request.relatedAssetName}
                  />
                }
              />
              <DetailItem label="Priority" value={request.priority} />
              <DetailItem label="Status" value={request.status.replace('_', ' ')} />
              <DetailItem label="Owner" value={request.owner?.name || 'None'} />
              <DetailItem
                label="Watchers"
                value={
                  (request.watchers ?? []).length > 0
                    ? request.watchers.map((person) => person.name).join(', ')
                    : 'None'
                }
              />
              <DetailItem label="Updated" value={formatDate(request.updatedAt)} />
              <DetailItem label="Created" value={formatDate(request.createdAt)} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-medium mb-2">Description</h3>
            {request.description ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {request.description}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No description yet.</p>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-slate-500" />}
          title="No request selected"
          description="Choose a service request from the list to view details."
          action={
            <Button type="button" variant="outline" onClick={() => navigate('/service-requests')}>
              Back to list
            </Button>
          }
        />
      )}

      {editOpen && request ? (
        <ServiceRequestFormDialog
          initial={request}
          onClose={() => setEditOpen(false)}
          onSaved={(saved) => {
            setRequest(saved)
            setEditOpen(false)
          }}
        />
      ) : null}
    </PageShell>
  )
}

export default ServiceRequestDetailPage
