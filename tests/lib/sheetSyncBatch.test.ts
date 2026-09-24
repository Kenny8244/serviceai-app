import { describe, expect, it } from 'vitest'
import { applyMappedBatch, sheetBatchEnd } from '../../worker/src/lib/sheetSync'

describe('sheet sync batches', () => {
  it('advances a cursor and does not create the same row twice', async () => {
    const rows = [
      { name: 'Espresso Cups', sku: 'SKU-CUP-01' },
      { name: 'Paper Napkins' },
      { name: 'Espresso Cups', sku: 'SKU-CUP-01' },
    ]
    const pool: Array<{
      id: string
      name: string
      sku?: string | null
      objectTypeId: string
      customFields: Record<string, unknown>
    }> = []
    const writes: string[] = []

    const firstEnd = sheetBatchEnd(rows.length, 0, 2)
    expect(firstEnd).toBe(2)
    const first = await applyMappedBatch(pool, rows.slice(0, firstEnd), async (row, match) => {
      expect(match).toBeNull()
      const id = `id-${writes.length + 1}`
      writes.push(`create:${row.name}`)
      return { id, name: row.name, sku: row.sku ?? null }
    })
    expect(first).toMatchObject({ created: 2, updated: 0 })

    const secondEnd = sheetBatchEnd(rows.length, firstEnd, 2)
    expect(secondEnd).toBe(3)
    const second = await applyMappedBatch(pool, rows.slice(firstEnd, secondEnd), async (row, match) => {
      expect(match?.name).toBe('Espresso Cups')
      writes.push(`update:${match?.id}`)
      return { id: match!.id, name: row.name, sku: row.sku ?? null }
    })
    expect(second).toMatchObject({ created: 0, updated: 1 })
    expect(writes).toEqual(['create:Espresso Cups', 'create:Paper Napkins', 'update:id-1'])
  })
})