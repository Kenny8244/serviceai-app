import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAssetImportSnapshot, resetAssetImport, startAssetImport, subscribeAssetImport } from '@/lib/assetImportJob'
import { apiService } from '@/services/api'

afterEach(() => {
  resetAssetImport()
  vi.restoreAllMocks()
})

describe('assetImportJob', () => {
  it('creates rows sequentially and counts failures without stopping', async () => {
    const createAsset = vi
      .spyOn(apiService, 'createAsset')
      .mockResolvedValueOnce({
        id: 'a1',
        name: 'One',
        description: null,
        category: 'general',
        sku: null,
        quantity: 1,
        minQuantity: 0,
        unitCost: null,
        supplier: null,
        location: null,
        tags: null,
        avatar: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      })
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce({
        id: 'a3',
        name: 'Three',
        description: null,
        category: 'general',
        sku: null,
        quantity: 1,
        minQuantity: 0,
        unitCost: null,
        supplier: null,
        location: null,
        tags: null,
        avatar: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      })

    const done = new Promise<void>((resolve) => {
      const unsubscribe = subscribeAssetImport(() => {
        if (getAssetImportSnapshot().status === 'done') {
          unsubscribe()
          resolve()
        }
      })
    })

    startAssetImport(
      [
        { name: 'One' },
        { name: 'Two' },
        { name: 'Three' },
      ],
      1
    )

    await done

    expect(createAsset).toHaveBeenCalledTimes(3)
    expect(getAssetImportSnapshot()).toMatchObject({
      status: 'done',
      imported: 2,
      failed: 1,
      skipped: 1,
      total: 3,
    })
  })
})
