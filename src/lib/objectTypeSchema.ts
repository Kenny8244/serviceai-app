import type { Asset, ObjectType, ObjectTypeAttribute } from '@/services/api'

export const RETAIL_OBJECT_TYPE_NAMES = ['Product'] as const
export const RESTAURANT_OBJECT_TYPE_NAMES = ['Ingredient', 'Equipment', 'Freezer'] as const

export function objectTypeExampleKind(name: string): 'retail' | 'restaurant' | null {
  if ((RETAIL_OBJECT_TYPE_NAMES as readonly string[]).includes(name)) return 'retail'
  if ((RESTAURANT_OBJECT_TYPE_NAMES as readonly string[]).includes(name)) return 'restaurant'
  return null
}

export function defaultObjectTypeIdForVertical(types: ObjectType[], verticalId: string): string {
  const active = types.filter((type) => type.isActive)
  const pick = (name: string) => active.find((type) => type.name === name)?.id
  if (verticalId === 'restaurant') {
    return pick('Ingredient') ?? pick('Equipment') ?? pick('Freezer') ?? active[0]?.id ?? ''
  }
  return pick('Product') ?? active[0]?.id ?? ''
}

export function attributeValueFromAsset(asset: Asset | null, name: string): unknown {
  if (!asset) return undefined
  const fields = asset.customFields
  if (fields && Object.prototype.hasOwnProperty.call(fields, name)) return fields[name]
  switch (name) {
    case 'sku':
      return asset.sku
    case 'quantity':
      return asset.quantity
    case 'min_quantity':
      return asset.minQuantity
    case 'unit_cost':
      return asset.unitCost
    case 'supplier':
      return asset.supplier
    case 'location':
      return asset.location
    case 'category':
      return asset.category
    case 'description':
      return asset.description
    default:
      return undefined
  }
}

export function defaultAttributeFormValue(attribute: ObjectTypeAttribute, asset: Asset | null): string | boolean {
  const existing = attributeValueFromAsset(asset, attribute.name)
  if (attribute.dataType === 'boolean') return existing === true
  if (existing == null || existing === '') {
    return attribute.dataType === 'number' && attribute.required ? '0' : ''
  }
  return String(existing)
}

export function formatAttributeValue(attribute: ObjectTypeAttribute, value: unknown): string {
  if (value == null || value === '') return '—'
  if (attribute.dataType === 'boolean') return value === true ? 'Yes' : 'No'
  if (attribute.dataType === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? String(parsed) : '—'
  }
  return String(value)
}

export function serializeAttributeValues(
  attributes: ObjectTypeAttribute[],
  values: Record<string, string | boolean>
): Record<string, unknown> {
  const customFields: Record<string, unknown> = {}
  for (const attribute of attributes) {
    const raw = values[attribute.name]
    if (attribute.dataType === 'boolean') {
      customFields[attribute.name] = raw === true
      continue
    }
    if (attribute.dataType === 'number') {
      if (raw === '' || raw == null) {
        customFields[attribute.name] = null
        continue
      }
      const parsed = Number(raw)
      customFields[attribute.name] = Number.isFinite(parsed) ? parsed : null
      continue
    }
    const text = String(raw ?? '').trim()
    customFields[attribute.name] = text || null
  }
  return customFields
}

export function requiredAttributeError(
  attributes: ObjectTypeAttribute[],
  values: Record<string, string | boolean>
): string | null {
  for (const attribute of attributes) {
    if (!attribute.required) continue
    const raw = values[attribute.name]
    if (attribute.dataType === 'boolean') {
      if (raw !== true && raw !== false) {
        return `${attribute.label} is required.`
      }
      continue
    }
    if (attribute.dataType === 'number') {
      if (raw === '' || raw == null || !Number.isFinite(Number(raw))) {
        return `${attribute.label} is required.`
      }
      continue
    }
    if (!String(raw ?? '').trim()) {
      return `${attribute.label} is required.`
    }
  }
  return null
}

export function schemaHasAttribute(attributes: ObjectTypeAttribute[], name: string): boolean {
  return attributes.some((attribute) => attribute.name === name)
}

export function assetHasQuantityField(asset: Asset, types: ObjectType[]): boolean {
  const type = types.find((item) => item.id === asset.objectTypeId)
  if (type) return schemaHasAttribute(type.attributes, 'quantity')
  return Object.prototype.hasOwnProperty.call(asset.customFields ?? {}, 'quantity')
}

export type StockStatus = 'ACTIVE' | 'LOW' | 'OUT'

export function getStockStatus(asset: Pick<Asset, 'quantity' | 'minQuantity'>): StockStatus {
  if (asset.quantity <= 0) return 'OUT'
  if (asset.quantity <= asset.minQuantity) return 'LOW'
  return 'ACTIVE'
}
