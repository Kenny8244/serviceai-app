import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FormField, nativeSelectClassName } from '@/components/ui/form-field'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, peekObjectTypesCache, type Asset, type ObjectType, type ObjectTypeAttribute } from '@/services/api'
import {
  defaultAttributeFormValue,
  defaultObjectTypeIdForVertical,
  objectTypeExampleKind,
  requiredAttributeError,
  serializeAttributeValues,
  RESTAURANT_OBJECT_TYPE_NAMES,
  RETAIL_OBJECT_TYPE_NAMES,
} from '@/lib/objectTypeSchema'

const AVATAR_MAX_BYTES = 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function AssetAvatar({ src, size, alt }: { src: string | null; size: 'sm' | 'lg'; alt: string }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-16 w-16'
  if (src) {
    return <img src={src} alt={alt} className={`${dim} rounded-full object-cover shrink-0`} />
  }
  return (
    <div className={`${dim} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`} aria-hidden>
      <Package className={size === 'sm' ? 'h-4 w-4 text-slate-400' : 'h-6 w-6 text-slate-400'} />
    </div>
  )
}

export function AssetFormDialog({
  asset,
  onClose,
  onSaved,
  initialObjectTypes,
}: {
  asset: Asset | null
  onClose: () => void
  onSaved: (saved: Asset) => Promise<void>
  initialObjectTypes?: ObjectType[]
}) {
  const isEdit = Boolean(asset)
  const verticalId = getSelectedVertical()
  const seededTypes =
    initialObjectTypes && initialObjectTypes.length > 0
      ? initialObjectTypes
      : peekObjectTypesCache() ?? []
  const [name, setName] = useState(asset?.name ?? '')
  const [description, setDescription] = useState(asset?.description ?? '')
  const [avatar, setAvatar] = useState(asset?.avatar ?? '')
  const [objectTypeId, setObjectTypeId] = useState(() => {
    if (asset?.objectTypeId) return asset.objectTypeId
    return defaultObjectTypeIdForVertical(seededTypes, verticalId)
  })
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>(seededTypes)
  const [attributeValues, setAttributeValues] = useState<Record<string, string | boolean>>({})
  const [typesLoading, setTypesLoading] = useState(seededTypes.length === 0)
  const [typesError, setTypesError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const loadTypes = async () => {
      const alreadySeeded = seededTypes.length > 0
      try {
        if (!alreadySeeded) {
          setTypesLoading(true)
        }
        setTypesError(null)
        const data = await apiService.getObjectTypes()
        if (cancelled) return
        setObjectTypes(data)
        setObjectTypeId((current) => {
          if (current && data.some((type) => type.id === current)) return current
          return defaultObjectTypeIdForVertical(data, verticalId) || current
        })
      } catch (err) {
        if (!cancelled) {
          setTypesError(toUserMessage(err))
          if (!alreadySeeded) setObjectTypes([])
        }
      } finally {
        if (!cancelled) setTypesLoading(false)
      }
    }
    void loadTypes()
    return () => {
      cancelled = true
    }
    // Seeded snapshot is only for first paint; refresh always runs once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount/vertical refresh
  }, [verticalId])

  const selectedType = objectTypes.find((type) => type.id === objectTypeId)
  const schemaAttributes = selectedType?.attributes ?? []
  const exampleKind = selectedType ? objectTypeExampleKind(selectedType.name) : null
  const selectableTypes = objectTypes.filter((type) => type.isActive || type.id === objectTypeId)
  const retailTypes = selectableTypes.filter((type) =>
    (RETAIL_OBJECT_TYPE_NAMES as readonly string[]).includes(type.name)
  )
  const restaurantTypes = selectableTypes.filter((type) =>
    (RESTAURANT_OBJECT_TYPE_NAMES as readonly string[]).includes(type.name)
  )
  const otherTypes = selectableTypes.filter((type) => objectTypeExampleKind(type.name) == null)

  useEffect(() => {
    const attributes = selectedType?.attributes ?? []
    const reuseAsset = Boolean(asset && selectedType && selectedType.id === asset.objectTypeId)
    setAttributeValues((current) => {
      const next: Record<string, string | boolean> = {}
      let changed = Object.keys(current).length !== attributes.length
      for (const attribute of attributes) {
        const value =
          current[attribute.name] !== undefined
            ? current[attribute.name]
            : defaultAttributeFormValue(attribute, reuseAsset ? asset : null)
        next[attribute.name] = value
        if (current[attribute.name] !== value) changed = true
      }
      return changed ? next : current
    })
  }, [asset, selectedType])

  const setAttributeValue = (name: string, value: string | boolean) => {
    setAttributeValues((current) => ({ ...current, [name]: value }))
  }

  const pickAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      setFormError('Use a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setFormError('Avatar must be 1MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(String(reader.result ?? ''))
      setFormError(null)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setFormError('Name is required.')
      return
    }
    if (!objectTypeId) {
      setFormError('Object type is required.')
      return
    }

    const requiredError = requiredAttributeError(schemaAttributes, attributeValues)
    if (requiredError) {
      setFormError(requiredError)
      return
    }

    const customFields = serializeAttributeValues(schemaAttributes, attributeValues)
    const payload = {
      name: trimmedName,
      objectTypeId,
      sku: typeof customFields.sku === 'string' ? customFields.sku : undefined,
      quantity: typeof customFields.quantity === 'number' ? customFields.quantity : undefined,
      minQuantity: typeof customFields.min_quantity === 'number' ? customFields.min_quantity : undefined,
      unitCost: typeof customFields.unit_cost === 'number' ? customFields.unit_cost : null,
      supplier: typeof customFields.supplier === 'string' ? customFields.supplier : undefined,
      location: typeof customFields.location === 'string' ? customFields.location : undefined,
      description: description.trim() || undefined,
      avatar: avatar.trim() || null,
      customFields,
    }

    try {
      setSaving(true)
      setFormError(null)
      const saved = asset
        ? await apiService.updateAsset(asset.id, payload)
        : await apiService.createAsset(payload)
      await onSaved(saved)
    } catch (err) {
      setFormError(toUserMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Edit Asset' : 'Add Asset'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Card
        role="dialog"
        aria-labelledby="asset-form-title"
        className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="asset-form-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <FormField label="Avatar" htmlFor="asset-avatar">
            <div className="flex items-center gap-3">
              <AssetAvatar src={avatar || null} size="lg" alt="Avatar preview" />
              <input
                ref={avatarInputRef}
                id="asset-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={pickAvatar}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                Choose image
              </Button>
              {avatar ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar('')}>
                  Remove
                </Button>
              ) : null}
            </div>
          </FormField>
          <FormField label="Name" htmlFor="asset-name" required>
            <Input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
          </FormField>
          <FormField label="Object type" htmlFor="asset-object-type" required error={typesError ?? undefined}>
            {typesLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading object types…</p>
            ) : objectTypes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No object types available.</p>
            ) : (
              <>
                <select
                  id="asset-object-type"
                  className={nativeSelectClassName}
                  value={objectTypeId}
                  onChange={(event) => {
                    setObjectTypeId(event.target.value)
                    setAttributeValues({})
                  }}
                  required
                >
                  {retailTypes.length > 0 ? (
                    <optgroup label="Retail">
                      {retailTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {restaurantTypes.length > 0 ? (
                    <optgroup label="Restaurant">
                      {restaurantTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {otherTypes.length > 0 ? (
                    <optgroup label="Other">
                      {otherTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
                {exampleKind ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {exampleKind === 'retail' ? 'Retail example schema' : 'Restaurant example schema'}
                  </p>
                ) : null}
              </>
            )}
          </FormField>
          {typesLoading ? null : schemaAttributes.length > 0 ? (
            schemaAttributes.map((attribute) => (
              <SchemaAttributeField
                key={attribute.id || attribute.name}
                attribute={attribute}
                value={attributeValues[attribute.name]}
                onChange={(value) => setAttributeValue(attribute.name, value)}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No schema fields for this type yet.</p>
          )}
          <FormField label="Description" htmlFor="asset-description">
            <Textarea
              id="asset-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </FormField>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || typesLoading || !objectTypeId || Boolean(typesError)}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function DeleteAssetDialog({
  asset,
  onClose,
  onDeleted,
}: {
  asset: Asset
  onClose: () => void
  onDeleted: (assetId: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      setError(null)
      await apiService.deleteAsset(asset.id)
      onDeleted(asset.id)
    } catch (err) {
      setError(toUserMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !deleting) onClose()
      }}
    >
      <Card role="dialog" aria-labelledby="delete-asset-title" className="w-full max-w-md p-6">
        <h2 id="delete-asset-title" className="text-lg font-semibold">
          Delete asset?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          “{asset.name}” will be removed from your list. This cannot be undone.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function SchemaAttributeField({
  attribute,
  value,
  onChange,
}: {
  attribute: ObjectTypeAttribute
  value: string | boolean | undefined
  onChange: (value: string | boolean) => void
}) {
  const fieldId = `asset-${attribute.name.replace(/_/g, '-')}`
  const numberMin =
    attribute.dataType === 'number' && ['quantity', 'min_quantity', 'unit_cost', 'capacity'].includes(attribute.name)
      ? '0'
      : undefined
  if (attribute.dataType === 'boolean') {
    return (
      <FormField label={attribute.label} htmlFor={fieldId} required={attribute.required}>
        <label className="flex items-center gap-2 text-sm" htmlFor={fieldId}>
          <input
            id={fieldId}
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>Yes</span>
        </label>
      </FormField>
    )
  }

  if (attribute.dataType === 'text') {
    return (
      <FormField label={attribute.label} htmlFor={fieldId} required={attribute.required}>
        <Textarea
          id={fieldId}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          required={attribute.required}
          rows={3}
        />
      </FormField>
    )
  }

  return (
    <FormField label={attribute.label} htmlFor={fieldId} required={attribute.required}>
      <Input
        id={fieldId}
        type={attribute.dataType === 'number' ? 'number' : 'text'}
        min={numberMin}
        step={attribute.name === 'unit_cost' || attribute.name === 'temperature' ? '0.01' : undefined}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        required={attribute.required}
      />
    </FormField>
  )
}
