import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiService } from '@/services/api'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  apiService.clearAuthToken({ notify: false })
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('object type attributes', () => {
  it('normalizes schema fields from GET /object-types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          objectTypes: [
            {
              id: 'type-product',
              name: 'Product',
              isActive: true,
              attributes: [
                {
                  attribute_id: 'a-sku',
                  name: 'sku',
                  label: 'SKU',
                  data_type: 'string',
                  is_required: false,
                  sort_order: 2,
                },
                {
                  id: 'a-qty',
                  name: 'quantity',
                  label: 'Quantity',
                  dataType: 'number',
                  required: true,
                  order: 1,
                },
              ],
            },
          ],
        })
      )
    )

    const types = await apiService.getObjectTypes()
    expect(types).toHaveLength(1)
    expect(types[0].attributes.map((attribute) => attribute.name)).toEqual(['quantity', 'sku'])
    expect(types[0].attributes[0]).toMatchObject({
      id: 'a-qty',
      label: 'Quantity',
      dataType: 'number',
      required: true,
      order: 1,
    })
    expect(types[0].attributes[1]).toMatchObject({
      id: 'a-sku',
      dataType: 'string',
      required: false,
      order: 2,
    })
  })

  it('returns an empty schema when attributes are omitted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { objectTypes: [{ id: 't1', name: 'Custom' }] }))
    )

    const types = await apiService.getObjectTypes()
    expect(types[0].attributes).toEqual([])
  })
})
