import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Link2, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField, nativeSelectClassName } from '@/components/ui/form-field'
import { getSelectedVertical } from '@/lib/verticalStorage'
import { getVerticalContent } from '@/lib/verticalContent'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset, type ServiceRequest } from '@/services/api'

const CATEGORIES = ['General', 'Equipment', 'Facility', 'Supplier'] as const
const PRIORITIES: Array<ServiceRequest['priority']> = ['low', 'medium', 'high', 'urgent']
const STATUSES: Array<ServiceRequest['status']> = ['open', 'in_progress', 'resolved', 'closed']

function formatOptionLabel(value: string): string {
  return value.replace(/_/g, ' ')
}

function categoryValue(raw: string | undefined | null): string {
  return raw?.trim() || 'General'
}

export function ServiceRequestFormDialog({
  initial,
  defaultRelatedAssetId,
  defaultRelatedAssetName,
  onClose,
  onSaved,
}: {
  /** When set, dialog edits this request instead of creating a new one. */
  initial?: ServiceRequest | null
  /** Prefill related asset on create (e.g. opened from Asset Detail). Editable unless locked elsewhere. */
  defaultRelatedAssetId?: string | null
  defaultRelatedAssetName?: string | null
  onClose: () => void
  onSaved: (saved: ServiceRequest) => Promise<void> | void
}) {
  const isEdit = Boolean(initial?.id)
  const assetsLabel = getVerticalContent(getSelectedVertical()).navAssetsLabel
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<string>(categoryValue(initial?.category))
  const [priority, setPriority] = useState<ServiceRequest['priority']>(initial?.priority ?? 'medium')
  const [status, setStatus] = useState<ServiceRequest['status']>(initial?.status ?? 'open')
  const [relatedAssetId, setRelatedAssetId] = useState(
    () => initial?.relatedAssetId ?? defaultRelatedAssetId ?? ''
  )
  const [ownerId, setOwnerId] = useState(initial?.owner?.id ?? '')
  const [watcherIds, setWatcherIds] = useState<string[]>(() => initial?.watchers.map((person) => person.id) ?? [])
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadAssets = async () => {
      try {
        setAssetsLoading(true)
        setAssetsError(null)
        const data = await apiService.getAssets()
        if (!cancelled) {
          setAssets(data)
          setAssetsError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setAssets([])
          setAssetsError(toUserMessage(err))
        }
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    }
    void loadAssets()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadMembers = async () => {
      try {
        setMembersLoading(true)
        setMembersError(null)
        const data = await apiService.getWorkspaceMembers()
        if (!cancelled) setMembers(data)
      } catch (err) {
        if (!cancelled) {
          setMembers([])
          setMembersError(toUserMessage(err))
        }
      } finally {
        if (!cancelled) setMembersLoading(false)
      }
    }
    void loadMembers()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError('Title is required.')
      return
    }
    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      category: category.trim() || 'General',
      priority,
      status,
      ...(assetsError && isEdit ? {} : { relatedAssetId: relatedAssetId || null }),
      ...(membersError ? {} : { ownerId: ownerId || null, watcherIds }),
    }
    try {
      setSaving(true)
      setFormError(null)
      const { serviceRequest } = isEdit && initial
        ? await apiService.updateServiceRequest(initial.id, payload)
        : await apiService.createServiceRequest(payload)
      await onSaved(serviceRequest)
    } catch (err) {
      setFormError(toUserMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const titleId = isEdit ? 'service-request-edit-title' : 'service-request-form-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {isEdit ? 'Edit Request' : 'Create Request'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEdit
                ? 'Update details, owner, watchers, status, priority, or related asset.'
                : 'Report an operational issue for this workspace.'}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close" disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form className="space-y-4 mt-4" onSubmit={(event) => void submit(event)}>
          <FormField label="Title" htmlFor="sr-title" required>
            <Input
              id="sr-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary of the issue"
              autoFocus
              required
              disabled={saving}
            />
          </FormField>

          <FormField label="Description" htmlFor="sr-description">
            <Textarea
              id="sr-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What happened, where, and any context that helps"
              rows={4}
              disabled={saving}
            />
          </FormField>

          <FormField label="Category" htmlFor="sr-category" required>
            <select
              id="sr-category"
              className={nativeSelectClassName}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              disabled={saving}
            >
              {!(CATEGORIES as readonly string[]).includes(category) && category ? (
                <option value={category}>{category}</option>
              ) : null}
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Priority" htmlFor="sr-priority">
              <select
                id="sr-priority"
                className={nativeSelectClassName}
                value={priority}
                onChange={(event) => setPriority(event.target.value as ServiceRequest['priority'])}
                disabled={saving}
              >
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {formatOptionLabel(value)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status" htmlFor="sr-status">
              <select
                id="sr-status"
                className={nativeSelectClassName}
                value={status}
                onChange={(event) => setStatus(event.target.value as ServiceRequest['status'])}
                disabled={saving}
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {formatOptionLabel(value)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Owner" htmlFor="sr-owner">
            {membersLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading people…</p>
            ) : membersError ? (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Couldn’t load workspace members. Owner and watchers stay unchanged.
              </p>
            ) : (
              <select
                id="sr-owner"
                className={nativeSelectClassName}
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                disabled={saving}
              >
                <option value="">None</option>
                {ownerId && !members.some((member) => member.id === ownerId) ? (
                  <option value={ownerId}>{initial?.owner?.name || 'Current owner'}</option>
                ) : null}
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Watchers</legend>
            {membersLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading people…</p>
            ) : membersError ? null : members.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No other people in this workspace yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const checked = watcherIds.includes(member.id)
                  return (
                    <label key={member.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving}
                        onChange={() => {
                          setWatcherIds((current) =>
                            checked ? current.filter((id) => id !== member.id) : [...current, member.id]
                          )
                        }}
                      />
                      <span>{member.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </fieldset>

          <FormField label={`Related ${assetsLabel.toLowerCase()}`} htmlFor="sr-related-asset">
            {assetsLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading {assetsLabel.toLowerCase()}…</p>
            ) : assetsError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                <div className="flex gap-2">
                  <Link2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium">Couldn’t load {assetsLabel.toLowerCase()}</p>
                    <p className="text-amber-800/90 dark:text-amber-200/90">{assetsError}</p>
                    <p>
                      {isEdit
                        ? 'Other fields can still be saved; related asset stays unchanged if the list fails to load.'
                        : 'You can still create this request and link an asset later.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : assets.length === 0 && !relatedAssetId ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                <div className="flex gap-2">
                  <Package className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      No {assetsLabel.toLowerCase()} in this workspace yet
                    </p>
                    <p>
                      {isEdit
                        ? `Save without a link for now — attach related ${assetsLabel.toLowerCase()} later.`
                        : `Create the request without a link for now — you can attach related ${assetsLabel.toLowerCase()} later.`}
                    </p>
                    <p>
                      <Link
                        to="/assets"
                        className="font-medium text-slate-900 underline underline-offset-2 dark:text-slate-100"
                        onClick={onClose}
                      >
                        Go to {assetsLabel}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  id="sr-related-asset"
                  className={nativeSelectClassName}
                  value={relatedAssetId}
                  onChange={(event) => setRelatedAssetId(event.target.value)}
                  disabled={saving}
                >
                  <option value="">None — link later</option>
                  {relatedAssetId && !assets.some((asset) => asset.id === relatedAssetId) ? (
                    <option value={relatedAssetId}>
                      {initial?.relatedAssetName || defaultRelatedAssetName || 'Current asset'}{' '}
                      (current)
                    </option>
                  ) : null}
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                      {asset.sku ? ` (${asset.sku})` : ''}
                    </option>
                  ))}
                </select>
                {!relatedAssetId ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optional. Leave unlinked if you’re not sure which {assetsLabel.toLowerCase()} is involved —
                    you can attach it later.
                  </p>
                ) : null}
              </div>
            )}
          </FormField>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
