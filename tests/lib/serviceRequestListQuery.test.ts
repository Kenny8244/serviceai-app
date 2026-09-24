import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SERVICE_REQUEST_LIST_QUERY,
  filterAndSortServiceRequests,
  parseServiceRequestListParams,
  serviceRequestListHasFilters,
  serviceRequestMatchesSearch,
  toServiceRequestListSearchParams,
} from '@/lib/serviceRequestListQuery'
import type { ServiceRequest } from '@/services/api'

function request(overrides: Partial<ServiceRequest> & Pick<ServiceRequest, 'id' | 'title'>): ServiceRequest {
  return {
    userId: 'user-1',
    workspaceId: 'ws-1',
    description: '',
    category: 'General',
    priority: 'medium',
    status: 'open',
    relatedAssetId: null,
    relatedAssetName: null,
    owner: null,
    watchers: [],
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-04T00:00:00.000Z'),
    ...overrides,
  }
}

describe('serviceRequestListQuery', () => {
  it('parses and serializes URL params, dropping defaults and invalid values', () => {
    expect(
      parseServiceRequestListParams(
        new URLSearchParams('q=frost&category=Equipment&status=open&priority=high&asset=obj-1&sort=title-asc')
      )
    ).toEqual({
      q: 'frost',
      category: 'Equipment',
      status: 'open',
      priority: 'high',
      asset: 'obj-1',
      sort: 'title-asc',
    })
    expect(parseServiceRequestListParams(new URLSearchParams('status=NOPE&priority=nope&sort=foo'))).toEqual(
      DEFAULT_SERVICE_REQUEST_LIST_QUERY
    )
    expect(toServiceRequestListSearchParams(DEFAULT_SERVICE_REQUEST_LIST_QUERY).toString()).toBe('')
    expect(
      toServiceRequestListSearchParams({
        q: ' frost ',
        category: 'Equipment',
        status: 'open',
        priority: 'urgent',
        asset: 'obj-9',
        sort: 'updated-asc',
      }).toString()
    ).toBe('q=frost&category=Equipment&status=open&priority=urgent&asset=obj-9&sort=updated-asc')
  })

  it('matches title and description, and still matches category, priority, status, and asset name', () => {
    const row = request({
      id: '1',
      title: 'Cooler alarm',
      description: 'Beeping overnight near the drain',
      category: 'Equipment',
      priority: 'high',
      status: 'open',
      relatedAssetName: 'Walk-in cooler',
    })
    expect(serviceRequestMatchesSearch(row, 'cooler')).toBe(true)
    expect(serviceRequestMatchesSearch(row, 'beeping')).toBe(true)
    expect(serviceRequestMatchesSearch(row, 'equipment')).toBe(true)
    expect(serviceRequestMatchesSearch(row, 'walk-in')).toBe(true)
    expect(serviceRequestMatchesSearch(row, 'missing')).toBe(false)
  })

  it('filters by priority and related asset, and reports no matches', () => {
    const cooler = request({
      id: '1',
      title: 'Cooler alarm',
      description: 'Beeping overnight',
      priority: 'high',
      relatedAssetId: 'obj-1',
      relatedAssetName: 'Walk-in cooler',
      updatedAt: new Date('2026-09-05T00:00:00.000Z'),
    })
    const drain = request({
      id: '2',
      title: 'Drain backup',
      description: 'Water on the floor',
      priority: 'urgent',
      status: 'in_progress',
      relatedAssetId: 'obj-2',
      relatedAssetName: 'Floor drain',
    })
    const rows = [drain, cooler]

    expect(filterAndSortServiceRequests(rows, { ...DEFAULT_SERVICE_REQUEST_LIST_QUERY, priority: 'high' })).toEqual([
      cooler,
    ])
    expect(filterAndSortServiceRequests(rows, { ...DEFAULT_SERVICE_REQUEST_LIST_QUERY, asset: 'obj-2' })).toEqual([
      drain,
    ])
    expect(
      filterAndSortServiceRequests(rows, { ...DEFAULT_SERVICE_REQUEST_LIST_QUERY, q: 'not in any request' })
    ).toEqual([])
    expect(serviceRequestListHasFilters({ ...DEFAULT_SERVICE_REQUEST_LIST_QUERY, priority: 'urgent' })).toBe(true)
    expect(serviceRequestListHasFilters({ ...DEFAULT_SERVICE_REQUEST_LIST_QUERY, asset: 'obj-1' })).toBe(true)
    expect(serviceRequestListHasFilters(DEFAULT_SERVICE_REQUEST_LIST_QUERY)).toBe(false)
  })
})
