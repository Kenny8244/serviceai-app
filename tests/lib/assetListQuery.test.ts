import { describe, expect, it } from 'vitest'
import {
  assetListHasFilters,
  assetMatchesSearch,
  DEFAULT_ASSET_LIST_QUERY,
  defaultDirectionForSortField,
  filterAndSortAssets,
  parseAssetListParams,
  toAssetListSearchParams,
  toAssetListSort,
  toggleAssetListSortDirection,
} from '@/lib/assetListQuery'
import type { Asset, ObjectType } from '@/services/api'

const types: ObjectType[] = [
  {
    id: 'type-product',
    name: 'Product',
    description: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    attributes: [{ id: 'q', name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 1 }],
  },
  {
    id: 'type-freezer',
    name: 'Freezer',
    description: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    attributes: [{ id: 'loc', name: 'location', label: 'Location', dataType: 'string', required: true, order: 1 }],
  },
]

function asset(overrides: Partial<Asset> & Pick<Asset, 'id' | 'name'>): Asset {
  return {
    description: null,
    category: 'inventory_item',
    objectTypeId: 'type-product',
    objectTypeName: 'Product',
    sku: null,
    quantity: 10,
    minQuantity: 2,
    unitCost: null,
    supplier: null,
    location: 'Kitchen',
    tags: null,
    avatar: null,
    customFields: {},
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    ...overrides,
  }
}

describe('assetListQuery', () => {
  it('parses and serializes URL params, dropping defaults', () => {
    expect(parseAssetListParams(new URLSearchParams('q=sku-9&type=type-product&status=LOW&sort=name-asc'))).toEqual({
      q: 'sku-9',
      typeId: 'type-product',
      status: 'LOW',
      sort: 'name-asc',
    })
    expect(parseAssetListParams(new URLSearchParams('status=NOPE&sort=foo'))).toEqual(DEFAULT_ASSET_LIST_QUERY)
    expect(toAssetListSearchParams(DEFAULT_ASSET_LIST_QUERY).toString()).toBe('')
    expect(
      toAssetListSearchParams({ q: ' cooler ', typeId: 'type-product', status: 'OUT', sort: 'updated-asc' }).toString()
    ).toBe('q=cooler&type=type-product&status=OUT&sort=updated-asc')
  })

  it('matches name and SKU only', () => {
    const row = asset({ id: '1', name: 'Walk-in cooler', sku: 'SKU-9', location: 'Kitchen' })
    expect(assetMatchesSearch(row, 'cooler')).toBe(true)
    expect(assetMatchesSearch(row, 'sku-9')).toBe(true)
    expect(assetMatchesSearch(row, 'Kitchen')).toBe(false)
  })

  it('filters by type and stock status, hiding types without quantity from stock filters', () => {
    const active = asset({ id: 'a', name: 'Active', quantity: 12, minQuantity: 2, updatedAt: '2026-09-05T00:00:00.000Z' })
    const low = asset({ id: 'b', name: 'Low', quantity: 2, minQuantity: 2, updatedAt: '2026-09-06T00:00:00.000Z' })
    const freezer = asset({
      id: 'c',
      name: 'Freezer unit',
      objectTypeId: 'type-freezer',
      objectTypeName: 'Freezer',
      quantity: 0,
      customFields: { location: 'Dock' },
    })

    expect(
      filterAndSortAssets([active, low, freezer], { ...DEFAULT_ASSET_LIST_QUERY, status: 'LOW' }, types).map((item) => item.id)
    ).toEqual(['b'])
    expect(
      filterAndSortAssets([active, low, freezer], { ...DEFAULT_ASSET_LIST_QUERY, typeId: 'type-freezer' }, types).map(
        (item) => item.id
      )
    ).toEqual(['c'])
    expect(
      filterAndSortAssets([active, low, freezer], { ...DEFAULT_ASSET_LIST_QUERY, status: 'none' }, types).map((item) => item.id)
    ).toEqual(['c'])
  })

  it('sorts by updated date and name', () => {
    const older = asset({ id: 'old', name: 'Zebra', updatedAt: '2026-09-01T00:00:00.000Z' })
    const newer = asset({ id: 'new', name: 'Apple', updatedAt: '2026-09-08T00:00:00.000Z' })

    expect(filterAndSortAssets([older, newer], DEFAULT_ASSET_LIST_QUERY, types).map((item) => item.id)).toEqual([
      'new',
      'old',
    ])
    expect(
      filterAndSortAssets([older, newer], { ...DEFAULT_ASSET_LIST_QUERY, sort: 'name-asc' }, types).map((item) => item.id)
    ).toEqual(['new', 'old'])
    expect(assetListHasFilters({ ...DEFAULT_ASSET_LIST_QUERY, q: 'x' })).toBe(true)
    expect(assetListHasFilters(DEFAULT_ASSET_LIST_QUERY)).toBe(false)
    expect(toggleAssetListSortDirection('updated-desc')).toBe('updated-asc')
    expect(toAssetListSort('name', defaultDirectionForSortField('name'))).toBe('name-asc')
  })
})
