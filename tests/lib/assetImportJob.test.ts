import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAssetImportSnapshot,
  resetAssetImport,
  rowToAssetCreateInput,
  startAssetImport,
  subscribeAssetImport,
} from '@/lib/assetImportJob'
import { apiService } from '@/services/api'

afterEach(() => {
  resetAssetImport()
  vi.restoreAllMocks()
})

describe('assetImportJob', () => {
  it('maps CSV rows onto Product create payloads with required quantity', () => {
    expect(
      rowToAssetCreateInput(
        {
          name: 'Crate',
          sku: 'CSV-1',
          quantity: 7,
          minQuantity: 2,
          unitCost: 3.5,
          supplier: 'Acme',
          location: 'Dock',
          description: 'Bulk crate',
        },
        'type-product'
      )
    ).toMatchObject({
      name: 'Crate',
      objectTypeId: 'type-product',
      sku: 'CSV-1',
      quantity: 7,
      minQuantity: 2,
      customFields: {
        sku: 'CSV-1',
        quantity: 7,
        min_quantity: 2,
        unit_cost: 3.5,
        supplier: 'Acme',
        location: 'Dock',
        description: 'Bulk crate',
      },
    })
    expect(rowToAssetCreateInput({ name: 'Bare' }, 'type-product').quantity).toBe(0)
  })

  it('creates rows sequentially and counts failures without stopping', async () => {
    vi.spyOn(apiService, 'getObjectTypes').mockResolvedValue([
      {
        id: 'type-product',
        name: 'Product',
        description: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
        attributes: [],
      },
    ])
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
        customFields: {},
        objectTypeId: 'type-product',
        objectTypeName: 'Product',
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
        customFields: {},
        objectTypeId: 'type-product',
        objectTypeName: 'Product',
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
    expect(createAsset).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'One',
        objectTypeId: 'type-product',
        quantity: 0,
        customFields: expect.objectContaining({ quantity: 0 }),
      })
    )
    expect(getAssetImportSnapshot()).toMatchObject({
      status: 'done',
      imported: 2,
      failed: 1,
      skipped: 1,
      total: 3,
    })
  })
})
