import { describe, expect, it } from 'vitest'
import { findSheetAssetMatch } from '@/lib/sheetMatch'

const assets = [
  { id: '1', name: 'Coffee Beans', sku: 'SKU-1' },
  { id: '2', name: 'Oat Milk', sku: null },
]

describe('findSheetAssetMatch', () => {
  it('matches SKU before a different name', () => {
    const match = findSheetAssetMatch(assets, { name: 'Renamed', sku: 'sku-1' })
    expect(match?.id).toBe('1')
  })

  it('falls back to name when the SKU is new', () => {
    const match = findSheetAssetMatch(assets, { name: 'oat milk', sku: 'NEW' })
    expect(match?.id).toBe('2')
  })

  it('falls back to name when the row has no SKU', () => {
    const match = findSheetAssetMatch(assets, { name: ' Coffee Beans ' })
    expect(match?.id).toBe('1')
  })

  it('returns null when nothing matches', () => {
    expect(findSheetAssetMatch(assets, { name: 'Sugar', sku: 'NOPE' })).toBeNull()
  })
})
