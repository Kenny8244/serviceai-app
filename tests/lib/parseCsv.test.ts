import { describe, expect, it } from 'vitest'
import { CSV_NAME_HINT, mapCsvRowsToAssets, parseCsv } from '@/lib/parseCsv'

describe('parseCsv', () => {
  it('reads headers and rows, trimming quotes', () => {
    const table = parseCsv('name,sku\n"Widget",SKU-1\n')
    expect(table.headers).toEqual(['name', 'sku'])
    expect(table.rows).toEqual([['Widget', 'SKU-1']])
  })

  it('rejects an empty file', () => {
    expect(() => parseCsv('   \n')).toThrow('CSV file is empty')
  })
})

describe('mapCsvRowsToAssets', () => {
  it('maps alias columns and skips rows without a name', () => {
    const table = parseCsv(
      'title,qty,location\nCooler,12,Kitchen\n,3,Back\nFreezer,4,Kitchen\n'
    )
    const { ready, skipped } = mapCsvRowsToAssets(table)
    expect(skipped).toBe(1)
    expect(ready).toEqual([
      {
        name: 'Cooler',
        sku: undefined,
        category: undefined,
        quantity: 12,
        minQuantity: 0,
        unitCost: null,
        supplier: undefined,
        location: 'Kitchen',
        description: undefined,
      },
      {
        name: 'Freezer',
        sku: undefined,
        category: undefined,
        quantity: 4,
        minQuantity: 0,
        unitCost: null,
        supplier: undefined,
        location: 'Kitchen',
        description: undefined,
      },
    ])
  })

  it('errors when there is no name column', () => {
    const table = parseCsv('sku,quantity\nSKU-1,2\n')
    expect(() => mapCsvRowsToAssets(table)).toThrow(CSV_NAME_HINT)
  })
})
