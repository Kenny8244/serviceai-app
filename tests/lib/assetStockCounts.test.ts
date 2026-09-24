import { describe, expect, it } from 'vitest'
import { applyLiveAssetStats, formatInventoryValue, getDashboardOverview } from '../../worker/src/lib/mocks'
import {
  objectTypeIdsWithQuantity,
  objectTypeIdsWithUnitCost,
  summarizeAssetStock,
  type AssetStockSample,
} from '../../worker/src/lib/assets'

const product = 'type-product'
const equipment = 'type-equipment'

const quantityTypes = objectTypeIdsWithQuantity([
  { id: product, attributes: [{ name: 'quantity' }, { name: 'min_quantity' }] },
  { id: equipment, attributes: [{ name: 'serial_number' }] },
])

describe('summarizeAssetStock', () => {
  it('counts every asset as total and only in-stock items at or under the reorder threshold as low stock', () => {
    const samples: AssetStockSample[] = [
      { objectTypeId: product, quantity: 5, minQuantity: 2 },
      { objectTypeId: product, quantity: 2, minQuantity: 2 },
      { objectTypeId: product, quantity: 1, minQuantity: 2 },
      { objectTypeId: product, quantity: 0, minQuantity: 2 },
      { objectTypeId: equipment, quantity: 1, minQuantity: 5 },
    ]

    expect(summarizeAssetStock(samples, quantityTypes)).toEqual({ total: 5, lowStock: 2, inventoryValue: 0 })
  })

  it('ignores a zero quantity even when the threshold is zero', () => {
    const samples: AssetStockSample[] = [{ objectTypeId: product, quantity: 0, minQuantity: 0 }]
    expect(summarizeAssetStock(samples, quantityTypes)).toEqual({ total: 1, lowStock: 0, inventoryValue: 0 })
  })

  it('sums quantity times unit cost only for types that define both fields', () => {
    const ingredient = 'type-ingredient'
    const types = [
      { id: product, attributes: [{ name: 'quantity' }, { name: 'unit_cost' }] },
      { id: ingredient, attributes: [{ name: 'quantity' }, { name: 'unit' }] },
      { id: equipment, attributes: [{ name: 'serial_number' }] },
    ]
    const samples: AssetStockSample[] = [
      { objectTypeId: product, quantity: 4, minQuantity: 1, unitCost: 1.89 },
      { objectTypeId: product, quantity: 0, minQuantity: 2, unitCost: 6.4 },
      { objectTypeId: product, quantity: 2, minQuantity: 1, unitCost: null },
      { objectTypeId: product, quantity: -3, minQuantity: 1, unitCost: 10 },
      { objectTypeId: ingredient, quantity: 10, minQuantity: 1, unitCost: 5 },
      { objectTypeId: equipment, quantity: 1, minQuantity: 0, unitCost: 400 },
    ]

    expect(summarizeAssetStock(samples, objectTypeIdsWithQuantity(types), objectTypeIdsWithUnitCost(types))).toEqual({
      total: 6,
      lowStock: 0,
      inventoryValue: 7.56,
    })
  })
})

describe('applyLiveAssetStats', () => {
  it('replaces retail asset cards and leaves the other mocks in place', () => {
    const stats = applyLiveAssetStats(getDashboardOverview('retail').stats, { total: 4, lowStock: 1 })
    expect(stats.find((stat) => stat.label === 'Products / Assets')).toMatchObject({
      value: '4',
      href: '/assets',
    })
    expect(stats.find((stat) => stat.label === 'Low Stock Items')).toMatchObject({
      value: '1',
      href: '/assets?status=LOW',
    })
    expect(stats.find((stat) => stat.label === 'Inventory Value')).toMatchObject({ value: '$12,450' })
    expect(stats.find((stat) => stat.label === 'Inventory Value')?.href).toBeUndefined()
  })

  it('replaces only the retail inventory value card', () => {
    const retail = applyLiveAssetStats(getDashboardOverview('retail').stats, {
      total: 4,
      lowStock: 1,
      inventoryValue: 12450.5,
    })
    expect(retail.find((stat) => stat.label === 'Inventory Value')?.value).toBe('$12,450.50')

    const restaurant = applyLiveAssetStats(getDashboardOverview('restaurant').stats, {
      total: 4,
      lowStock: 1,
      inventoryValue: 99,
    })
    expect(restaurant.map((stat) => stat.label)).not.toContain('Inventory Value')
    expect(restaurant.find((stat) => stat.label === 'Equipment Assets')?.value).toBe('24')

    const business = applyLiveAssetStats(getDashboardOverview('business').stats, {
      total: 4,
      lowStock: 1,
      inventoryValue: 99,
    })
    expect(business.find((stat) => stat.label === 'Efficiency Score')?.value).toBe('94%')
    expect(formatInventoryValue(0)).toBe('$0')
  })

  it('does not add a low-stock card on the enterprise overview', () => {
    const stats = applyLiveAssetStats(getDashboardOverview('business').stats, { total: 9, lowStock: 3 })
    expect(stats.map((stat) => stat.label)).toEqual([
      'Departments',
      'Managed Assets',
      'Open Service Requests',
      'Efficiency Score',
    ])
    expect(stats.find((stat) => stat.label === 'Managed Assets')).toMatchObject({
      value: '9',
      href: '/assets',
    })
  })
})
