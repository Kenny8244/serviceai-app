import { describe, expect, it } from 'vitest'
import {
  assetHasQuantityField,
  defaultAttributeFormValue,
  defaultObjectTypeIdForVertical,
  getStockStatus,
  objectTypeExampleKind,
  requiredAttributeError,
  serializeAttributeValues,
} from '@/lib/objectTypeSchema'
import type { Asset, ObjectType } from '@/services/api'

const types: ObjectType[] = [
  {
    id: 'p',
    name: 'Product',
    description: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    attributes: [],
  },
  {
    id: 'i',
    name: 'Ingredient',
    description: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    attributes: [],
  },
]

describe('objectTypeSchema', () => {
  it('defaults retail to Product and restaurant to Ingredient', () => {
    expect(defaultObjectTypeIdForVertical(types, 'retail')).toBe('p')
    expect(defaultObjectTypeIdForVertical(types, 'restaurant')).toBe('i')
    expect(objectTypeExampleKind('Product')).toBe('retail')
    expect(objectTypeExampleKind('Freezer')).toBe('restaurant')
  })

  it('serializes and validates schema values', () => {
    const attributes = [
      { id: '1', name: 'unit', label: 'Unit', dataType: 'string' as const, required: true, order: 1 },
      { id: '2', name: 'quantity', label: 'Quantity', dataType: 'number' as const, required: true, order: 2 },
      { id: '3', name: 'perishable', label: 'Perishable', dataType: 'boolean' as const, required: false, order: 3 },
      { id: '4', name: 'notes', label: 'Notes', dataType: 'text' as const, required: true, order: 4 },
    ]
    expect(requiredAttributeError(attributes, { unit: '', quantity: '1', perishable: false, notes: 'ok' })).toBe(
      'Unit is required.'
    )
    expect(requiredAttributeError(attributes, { unit: 'kg', quantity: '1', perishable: false, notes: '  ' })).toBe(
      'Notes is required.'
    )
    expect(requiredAttributeError([{ ...attributes[2], required: true }], {})).toBe('Perishable is required.')
    expect(requiredAttributeError([{ ...attributes[2], required: true }], { perishable: false })).toBeNull()
    expect(serializeAttributeValues(attributes, { unit: 'kg', quantity: '3', perishable: true, notes: '  keep dry  ' })).toEqual({
      unit: 'kg',
      quantity: 3,
      perishable: true,
      notes: 'keep dry',
    })
  })

  it('defaults optional numbers to empty and required numbers to 0', () => {
    expect(
      defaultAttributeFormValue(
        { id: 't', name: 'temperature', label: 'Temperature', dataType: 'number', required: false, order: 1 },
        null
      )
    ).toBe('')
    expect(
      defaultAttributeFormValue(
        { id: 'q', name: 'quantity', label: 'Quantity', dataType: 'number', required: true, order: 1 },
        null
      )
    ).toBe('0')
  })

  it('tracks quantity only when the schema or custom fields include it', () => {
    const asset = {
      id: 'a',
      name: 'Unit',
      description: null,
      category: 'Freezer',
      objectTypeId: 'type-freezer',
      objectTypeName: 'Freezer',
      sku: null,
      quantity: 0,
      minQuantity: 0,
      unitCost: null,
      supplier: null,
      location: 'Back',
      tags: null,
      avatar: null,
      customFields: { location: 'Back' },
      isActive: true,
      createdAt: '',
      updatedAt: '',
    } as Asset
    expect(assetHasQuantityField(asset, [])).toBe(false)
    expect(
      assetHasQuantityField(asset, [
        {
          id: 'type-freezer',
          name: 'Freezer',
          description: null,
          isActive: true,
          createdAt: '',
          updatedAt: '',
          attributes: [{ id: 'loc', name: 'location', label: 'Location', dataType: 'string', required: true, order: 1 }],
        },
      ])
    ).toBe(false)
  })

  it('flags low stock at or below the reorder threshold and out of stock at zero', () => {
    expect(getStockStatus({ quantity: 5, minQuantity: 2 })).toBe('ACTIVE')
    expect(getStockStatus({ quantity: 2, minQuantity: 2 })).toBe('LOW')
    expect(getStockStatus({ quantity: 1, minQuantity: 2 })).toBe('LOW')
    expect(getStockStatus({ quantity: 0, minQuantity: 2 })).toBe('OUT')
    expect(getStockStatus({ quantity: 0, minQuantity: 0 })).toBe('OUT')
  })
})
