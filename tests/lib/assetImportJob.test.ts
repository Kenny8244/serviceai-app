import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAssetImportSnapshot,
  resetAssetImport,
  rowToAssetCreateInput,
  startAssetImport,
  startBackgroundImport,
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
      lastError: 'nope',
    })
  })

  it('shows a running panel immediately and finishes with a summary', async () => {
    let release: (value: { summary: string }) => void = () => {}
    const pending = new Promise<{ summary: string }>((resolve) => {
      release = resolve
    })

    const started = startBackgroundImport({
      label: 'Importing from Google Sheet…',
      run: () => pending,
    })

    expect(started).toBe(true)
    expect(getAssetImportSnapshot()).toMatchObject({
      status: 'running',
      total: 0,
      label: 'Importing from Google Sheet…',
    })
    expect(startBackgroundImport({ label: 'again', run: async () => ({ summary: 'no' }) })).toBe(false)

    release({ summary: 'Added 1, updated 0, skipped 0.' })
    await pending
    await vi.waitFor(() => {
      expect(getAssetImportSnapshot().status).toBe('done')
    })
    expect(getAssetImportSnapshot()).toMatchObject({
      summary: 'Added 1, updated 0, skipped 0.',
      lastError: null,
    })
  })

  it('hides the finished panel after 10 seconds', async () => {
    vi.useFakeTimers()
    try {
      let finish: (value: { summary: string }) => void = () => {}
      const pending = new Promise<{ summary: string }>((resolve) => {
        finish = resolve
      })
      startBackgroundImport({
        label: 'Importing from Google Sheet…',
        run: () => pending,
      })
      finish({ summary: 'Added 0, updated 17, skipped 2.' })
      await vi.advanceTimersByTimeAsync(0)
      expect(getAssetImportSnapshot().status).toBe('done')

      await vi.advanceTimersByTimeAsync(9_999)
      expect(getAssetImportSnapshot().status).toBe('done')

      await vi.advanceTimersByTimeAsync(1)
      expect(getAssetImportSnapshot().status).toBe('idle')
    } finally {
      vi.useRealTimers()
    }
  })
})
