import type { ServiceRequest } from '@/services/api'

export const SERVICE_REQUEST_LIST_SORTS = [
  'updated-desc',
  'updated-asc',
  'title-asc',
  'title-desc',
] as const
export type ServiceRequestListSort = (typeof SERVICE_REQUEST_LIST_SORTS)[number]

export const SERVICE_REQUEST_LIST_SORT_FIELDS = ['updated', 'title'] as const
export type ServiceRequestListSortField = (typeof SERVICE_REQUEST_LIST_SORT_FIELDS)[number]
export type ServiceRequestListSortDirection = 'asc' | 'desc'

export function serviceRequestListSortField(sort: ServiceRequestListSort): ServiceRequestListSortField {
  return sort.startsWith('title') ? 'title' : 'updated'
}

export function serviceRequestListSortDirection(sort: ServiceRequestListSort): ServiceRequestListSortDirection {
  return sort.endsWith('asc') ? 'asc' : 'desc'
}

export function toServiceRequestListSort(
  field: ServiceRequestListSortField,
  direction: ServiceRequestListSortDirection
): ServiceRequestListSort {
  return `${field}-${direction}`
}

export function toggleServiceRequestListSortDirection(sort: ServiceRequestListSort): ServiceRequestListSort {
  const next = serviceRequestListSortDirection(sort) === 'asc' ? 'desc' : 'asc'
  return toServiceRequestListSort(serviceRequestListSortField(sort), next)
}

export function defaultDirectionForServiceRequestSortField(
  field: ServiceRequestListSortField
): ServiceRequestListSortDirection {
  return field === 'title' ? 'asc' : 'desc'
}

export const SERVICE_REQUEST_LIST_STATUSES = [
  'all',
  'open',
  'in_progress',
  'resolved',
  'closed',
] as const
export type ServiceRequestListStatusFilter = (typeof SERVICE_REQUEST_LIST_STATUSES)[number]

export type ServiceRequestListQuery = {
  q: string
  category: string | null
  status: ServiceRequestListStatusFilter
  sort: ServiceRequestListSort
}

export const DEFAULT_SERVICE_REQUEST_LIST_QUERY: ServiceRequestListQuery = {
  q: '',
  category: null,
  status: 'all',
  sort: 'updated-desc',
}

function isSort(value: string | null): value is ServiceRequestListSort {
  return SERVICE_REQUEST_LIST_SORTS.includes(value as ServiceRequestListSort)
}

function isStatus(value: string | null): value is ServiceRequestListStatusFilter {
  return SERVICE_REQUEST_LIST_STATUSES.includes(value as ServiceRequestListStatusFilter)
}

export function parseServiceRequestListParams(params: URLSearchParams): ServiceRequestListQuery {
  const category = params.get('category')?.trim() || null
  const statusRaw = params.get('status')
  const sortRaw = params.get('sort')
  return {
    q: params.get('q')?.trim() ?? '',
    category,
    status: isStatus(statusRaw) ? statusRaw : 'all',
    sort: isSort(sortRaw) ? sortRaw : 'updated-desc',
  }
}

export function toServiceRequestListSearchParams(query: ServiceRequestListQuery): URLSearchParams {
  const params = new URLSearchParams()
  const q = query.q.trim()
  if (q) params.set('q', q)
  if (query.category) params.set('category', query.category)
  if (query.status !== 'all') params.set('status', query.status)
  if (query.sort !== 'updated-desc') params.set('sort', query.sort)
  return params
}

export function serviceRequestListHasFilters(query: ServiceRequestListQuery): boolean {
  return (
    Boolean(query.q.trim()) ||
    Boolean(query.category) ||
    query.status !== 'all' ||
    query.sort !== DEFAULT_SERVICE_REQUEST_LIST_QUERY.sort
  )
}

export function serviceRequestMatchesSearch(
  request: Pick<ServiceRequest, 'title' | 'category' | 'priority' | 'status' | 'relatedAssetName'>,
  query: string
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    request.title,
    request.category,
    request.priority,
    request.status,
    request.relatedAssetName ?? '',
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

function updatedAtKey(value: Date | string): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function filterAndSortServiceRequests(
  requests: ServiceRequest[],
  query: ServiceRequestListQuery
): ServiceRequest[] {
  const filtered = requests.filter((request) => {
    if (query.category && (request.category || 'General') !== query.category) return false
    if (query.status !== 'all' && request.status !== query.status) return false
    return serviceRequestMatchesSearch(request, query.q)
  })

  const sorted = [...filtered]
  switch (query.sort) {
    case 'updated-asc':
      sorted.sort(
        (a, b) =>
          updatedAtKey(a.updatedAt).localeCompare(updatedAtKey(b.updatedAt)) ||
          a.title.localeCompare(b.title)
      )
      break
    case 'title-asc':
      sorted.sort(
        (a, b) =>
          a.title.localeCompare(b.title) ||
          updatedAtKey(b.updatedAt).localeCompare(updatedAtKey(a.updatedAt))
      )
      break
    case 'title-desc':
      sorted.sort(
        (a, b) =>
          b.title.localeCompare(a.title) ||
          updatedAtKey(b.updatedAt).localeCompare(updatedAtKey(a.updatedAt))
      )
      break
    case 'updated-desc':
    default:
      sorted.sort(
        (a, b) =>
          updatedAtKey(b.updatedAt).localeCompare(updatedAtKey(a.updatedAt)) ||
          a.title.localeCompare(b.title)
      )
      break
  }
  return sorted
}
