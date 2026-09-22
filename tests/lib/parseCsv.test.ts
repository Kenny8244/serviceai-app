import { describe, expect, it } from 'vitest'
import { mapCsvRowsToAssets, parseCsv } from '@/lib/parseCsv'

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
    const { ready, skipped, ignoredHeaders } = mapCsvRowsToAssets(table)
    expect(skipped).toBe(1)
    expect(ignoredHeaders).toEqual([])
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

  it('maps product_name and item_name, and prefers category over type', () => {
    const byProduct = parseCsv(
      'asset_id,product_name,type,location,status,category\nRET-1001,Widget A,Widget,Aisle 1,active,Footwear\n'
    )
    const product = mapCsvRowsToAssets(byProduct)
    expect(product.ready[0]).toMatchObject({
      name: 'Widget A',
      sku: 'RET-1001',
      category: 'Footwear',
      location: 'Aisle 1',
    })
    expect(product.ignoredHeaders).toEqual(['type', 'status'])

    const byItem = parseCsv('item_name,asset_id\nBolt,B-1\n')
    expect(mapCsvRowsToAssets(byItem).ready[0]).toMatchObject({ name: 'Bolt', sku: 'B-1' })

    const spaced = parseCsv('Product Name\nCrate\n')
    expect(mapCsvRowsToAssets(spaced).ready[0].name).toBe('Crate')
  })

  it('uses type as category only when category is absent', () => {
    const table = parseCsv('name,type\nWidget,Spare\n')
    expect(mapCsvRowsToAssets(table).ready[0].category).toBe('Spare')
  })

  it('errors when there is no name column and lists the headers it found', () => {
    const table = parseCsv('sku,quantity\nSKU-1,2\n')
    expect(() => mapCsvRowsToAssets(table)).toThrow(
      'No name column found. This file has: sku, quantity. Add a column named name, product_name, item_name, asset_name, title, product, or item.'
    )
  })
})
