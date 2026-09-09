import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiService, clearObjectTypesCache, peekObjectTypesCache } from '@/services/api'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  clearObjectTypesCache()
  apiService.clearAuthToken({ notify: false })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('object types client cache', () => {
  it('reuses an in-flight and cached GET /object-types response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        objectTypes: [
          {
            id: 'type-product',
            name: 'Product',
            isActive: true,
            attributes: [],
          },
        ],
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([apiService.getObjectTypes(), apiService.getObjectTypes()])
    expect(first).toHaveLength(1)
    expect(second).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const third = await apiService.getObjectTypes()
    expect(third).toEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(peekObjectTypesCache()?.[0]?.name).toBe('Product')
  })

  it('clears the cache when the auth token is cleared', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          objectTypes: [{ id: 'type-product', name: 'Product', isActive: true, attributes: [] }],
        })
      )
    )
    await apiService.getObjectTypes()
    expect(peekObjectTypesCache()).not.toBeNull()
    apiService.clearAuthToken({ notify: false })
    expect(peekObjectTypesCache()).toBeNull()
  })
})
