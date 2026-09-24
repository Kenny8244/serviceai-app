import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronDown,
  ClipboardList,
  Plus,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'
import { PageShell } from '@/components/layout/PageShell'
import { ServiceRequestFormDialog } from '@/components/service-requests/ServiceRequestDialogs'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, peekServiceRequests, type ServiceRequest } from '@/services/api'
import { cn } from '@/lib/utils'
import {
  SERVICE_REQUEST_LIST_PRIORITIES,
  SERVICE_REQUEST_LIST_SORT_FIELDS,
  SERVICE_REQUEST_LIST_STATUSES,
  defaultDirectionForServiceRequestSortField,
  filterAndSortServiceRequests,
  parseServiceRequestListParams,
  serviceRequestListHasFilters,
  serviceRequestListSortDirection,
  serviceRequestListSortField,
  toServiceRequestListSearchParams,
  toServiceRequestListSort,
  toggleServiceRequestListSortDirection,
  type ServiceRequestListPriorityFilter,
  type ServiceRequestListQuery,
  type ServiceRequestListSortField,
  type ServiceRequestListStatusFilter,
} from '@/lib/serviceRequestListQuery'

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

const SORT_FIELD_LABELS: Record<ServiceRequestListSortField, string> = {
  updated: 'Updated',
  title: 'Title',
}

const STATUS_LABELS: Record<ServiceRequestListStatusFilter, string> = {
  all: 'All',
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITY_LABELS: Record<ServiceRequestListPriorityFilter, string> = {
  all: 'All',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
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

function isCreateOpen(params: URLSearchParams): boolean {
  const value = params.get('create')
  return value === '1' || value === 'true'
}

function withCreateParam(params: URLSearchParams, create: boolean): URLSearchParams {
  if (create) params.set('create', '1')
  else params.delete('create')
  return params
}

function ServiceRequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const vertical = getVerticalContent(getSelectedVertical())
  const [requests, setRequests] = useState<ServiceRequest[]>(() => peekServiceRequests() ?? [])
  const [loading, setLoading] = useState(() => peekServiceRequests() == null)
  const [error, setError] = useState<string | null>(null)
  const createOpen = isCreateOpen(searchParams)
  const [formOpen, setFormOpen] = useState(createOpen)
  const listQuery = useMemo(() => parseServiceRequestListParams(searchParams), [searchParams])

  useEffect(() => {
    setFormOpen(createOpen)
  }, [createOpen])

  const updateListQuery = useCallback(
    (patch: Partial<ServiceRequestListQuery>) => {
      setSearchParams(
        (previous) =>
          withCreateParam(
            toServiceRequestListSearchParams({ ...parseServiceRequestListParams(previous), ...patch }),
            isCreateOpen(previous)
          ),
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const clearListQuery = useCallback(() => {
    setSearchParams(
      (previous) => withCreateParam(new URLSearchParams(), isCreateOpen(previous)),
      { replace: true }
    )
  }, [setSearchParams])

  const openCreate = useCallback(() => {
    setFormOpen(true)
    setSearchParams(
      (previous) => withCreateParam(toServiceRequestListSearchParams(parseServiceRequestListParams(previous)), true),
      { replace: true }
    )
  }, [setSearchParams])

  const closeCreate = useCallback(() => {
    setFormOpen(false)
    setSearchParams(
      (previous) => withCreateParam(toServiceRequestListSearchParams(parseServiceRequestListParams(previous)), false),
      { replace: true }
    )
  }, [setSearchParams])

  const loadRequests = useCallback(async () => {
    const cached = peekServiceRequests()
    try {
      if (!cached) {
        setLoading(true)
        setError(null)
      }
      const { serviceRequests } = await apiService.getServiceRequests()
      setRequests(serviceRequests)
    } catch (err) {
      if (!cached) {
        setError(toUserMessage(err))
        setRequests([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const request of requests) {
      const category = request.category?.trim() || 'General'
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }))
  }, [requests])

  const statusCounts = useMemo(() => {
    const counts: Record<ServiceRequestListStatusFilter, number> = {
      all: requests.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    for (const request of requests) {
      counts[request.status] += 1
    }
    return counts
  }, [requests])

  const priorityCounts = useMemo(() => {
    const counts: Record<ServiceRequestListPriorityFilter, number> = {
      all: requests.length,
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }
    for (const request of requests) {
      counts[request.priority] += 1
    }
    return counts
  }, [requests])

  const assetFilters = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>()
    for (const request of requests) {
      if (!request.relatedAssetId) continue
      const existing = counts.get(request.relatedAssetId)
      if (existing) {
        existing.count += 1
        continue
      }
      counts.set(request.relatedAssetId, {
        id: request.relatedAssetId,
        name: request.relatedAssetName?.trim() || 'Unnamed asset',
        count: 1,
      })
    }
    return Array.from(counts.values()).sort(
      (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
    )
  }, [requests])

  const filtered = useMemo(
    () => filterAndSortServiceRequests(requests, listQuery),
    [requests, listQuery]
  )

  const sidebarButtonClass = (active: boolean) =>
    `flex w-full items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
      active ? 'bg-slate-100 dark:bg-slate-700 font-medium' : ''
    }`

  return (
    <PageShell
      flush
      title={vertical.navServiceRequestsLabel}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search title or description..."
              aria-label="Search service requests by title or description"
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
                aria-label="Sort service requests"
                className="h-full w-[6.75rem] cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-sm text-foreground outline-none [&::-ms-expand]:hidden"
                value={serviceRequestListSortField(listQuery.sort)}
                onChange={(event) => {
                  const field = event.target.value as ServiceRequestListSortField
                  updateListQuery({
                    sort: toServiceRequestListSort(field, defaultDirectionForServiceRequestSortField(field)),
                  })
                }}
              >
                {SERVICE_REQUEST_LIST_SORT_FIELDS.map((field) => (
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
                serviceRequestListSortDirection(listQuery.sort) === 'asc'
                  ? 'Sort ascending'
                  : 'Sort descending'
              }
              title={
                serviceRequestListSortField(listQuery.sort) === 'title'
                  ? serviceRequestListSortDirection(listQuery.sort) === 'asc'
                    ? 'A to Z'
                    : 'Z to A'
                  : serviceRequestListSortDirection(listQuery.sort) === 'asc'
                    ? 'Oldest first'
                    : 'Newest first'
              }
              onClick={() =>
                updateListQuery({ sort: toggleServiceRequestListSortDirection(listQuery.sort) })
              }
            >
              {serviceRequestListSortDirection(listQuery.sort) === 'asc' ? (
                <ArrowUpNarrowWide className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownNarrowWide className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </>
      }
    >
      <div className="flex flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
          <h2 className="font-semibold text-lg mb-4">Categories</h2>
          <button
            type="button"
            onClick={() => updateListQuery({ category: null })}
            className={sidebarButtonClass(listQuery.category === null)}
          >
            <span className="flex-1 text-left">All</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{requests.length}</span>
          </button>
          {categoryFilters.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => updateListQuery({ category: category.name })}
              className={sidebarButtonClass(listQuery.category === category.name)}
            >
              <span className="flex-1 text-left">{category.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{category.count}</span>
            </button>
          ))}

          <h2 className="font-semibold text-lg mt-6 mb-4">Status</h2>
          {SERVICE_REQUEST_LIST_STATUSES.map((status) => (
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

          <h2 className="font-semibold text-lg mt-6 mb-4">Priority</h2>
          {SERVICE_REQUEST_LIST_PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              aria-label={`Filter by priority: ${PRIORITY_LABELS[priority]}`}
              onClick={() => updateListQuery({ priority })}
              className={sidebarButtonClass(listQuery.priority === priority)}
            >
              <span className="flex-1 text-left">{PRIORITY_LABELS[priority]}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{priorityCounts[priority]}</span>
            </button>
          ))}

          <h2 className="font-semibold text-lg mt-6 mb-4">Related asset</h2>
          <button
            type="button"
            aria-label="Filter by related asset: All"
            onClick={() => updateListQuery({ asset: null })}
            className={sidebarButtonClass(listQuery.asset === null)}
          >
            <span className="flex-1 text-left">All</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{requests.length}</span>
          </button>
          {assetFilters.map((asset) => (
            <button
              key={asset.id}
              type="button"
              aria-label={`Filter by related asset: ${asset.name}`}
              onClick={() => updateListQuery({ asset: asset.id })}
              className={sidebarButtonClass(listQuery.asset === asset.id)}
            >
              <span className="flex-1 text-left truncate">{asset.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{asset.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
          <div className="p-2 space-y-1">
            {loading ? (
              <LoadingState variant="skeleton" label="Loading service requests" className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-3 space-y-2">
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-3 w-1/2" />
                  </div>
                ))}
              </LoadingState>
            ) : error ? (
              <ErrorState
                title="Couldn't load service requests"
                message={error}
                onRetry={() => void loadRequests()}
                className="py-10"
              />
            ) : requests.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6 text-slate-500" />}
                title="No service requests yet"
                description="Report an operational issue with a title, details, and optional related asset."
                className="py-10"
                action={
                  <Button type="button" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No requests match this search"
                description="Try a different title, description, category, asset, priority, or status."
                className="py-10"
                action={
                  serviceRequestListHasFilters(listQuery) ? (
                    <Button type="button" variant="outline" onClick={clearListQuery}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              filtered.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  className={cn(
                    'w-full text-left p-3 rounded border border-transparent',
                    'hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  onClick={() => navigate(`/service-requests/${request.id}`)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{request.title}</span>
                        <Badge variant={priorityVariant(request.priority)}>{request.priority}</Badge>
                        <Badge variant={statusVariant(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {request.relatedAssetName || 'No related asset'}
                        {request.category ? ` · ${request.category}` : ''}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Updated {formatDate(request.updatedAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {formOpen ? (
        <ServiceRequestFormDialog
          onClose={closeCreate}
          onSaved={async (saved) => {
            closeCreate()
            setRequests((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
            void loadRequests()
            navigate(`/service-requests/${saved.id}`)
          }}
        />
      ) : null}
    </PageShell>
  )
}

export default ServiceRequestsPage
