import type { MappedAssetRow } from '@/lib/parseCsv'
import { toUserMessage } from '@/lib/userFacingError'
import { apiService, type Asset } from '@/services/api'

export function rowToAssetCreateInput(row: MappedAssetRow, objectTypeId?: string) {
  const quantity = row.quantity ?? 0
  const minQuantity = row.minQuantity ?? 0
  const customFields: Record<string, unknown> = {
    quantity,
    min_quantity: minQuantity,
  }
  if (row.sku) customFields.sku = row.sku
  if (row.category) customFields.category = row.category
  if (row.unitCost !== undefined) customFields.unit_cost = row.unitCost
  if (row.supplier) customFields.supplier = row.supplier
  if (row.location) customFields.location = row.location
  if (row.description) customFields.description = row.description

  return {
    name: row.name,
    objectTypeId,
    sku: row.sku,
    quantity,
    minQuantity,
    unitCost: row.unitCost,
    supplier: row.supplier,
    location: row.location,
    description: row.description,
    customFields,
  }
}

export type AssetImportStatus = 'idle' | 'running' | 'done'

export type AssetImportSnapshot = {
  status: AssetImportStatus
  current: number
  total: number
  imported: number
  failed: number
  skipped: number
  lastAsset: Asset | null
  lastError: string | null
  label: string | null
  summary: string | null
}

const idleSnapshot: AssetImportSnapshot = {
  status: 'idle',
  current: 0,
  total: 0,
  imported: 0,
  failed: 0,
  skipped: 0,
  lastAsset: null,
  lastError: null,
  label: null,
  summary: null,
}

const DISMISS_AFTER_MS = 10_000

let snapshot: AssetImportSnapshot = idleSnapshot
let runId = 0
let dismissTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function clearDismissTimer() {
  if (dismissTimer == null) return
  clearTimeout(dismissTimer)
  dismissTimer = null
}

function scheduleDismiss(thisRun: number) {
  clearDismissTimer()
  dismissTimer = setTimeout(() => {
    dismissTimer = null
    if (thisRun !== runId || snapshot.status !== 'done') return
    snapshot = idleSnapshot
    emit()
  }, DISMISS_AFTER_MS)
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function getAssetImportSnapshot(): AssetImportSnapshot {
  return snapshot
}

export function subscribeAssetImport(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissAssetImport() {
  if (snapshot.status === 'running') return
  clearDismissTimer()
  snapshot = idleSnapshot
  emit()
}

export function resetAssetImport() {
  runId += 1
  clearDismissTimer()
  snapshot = idleSnapshot
  emit()
}

export function startAssetImport(rows: MappedAssetRow[], skipped = 0) {
  if (snapshot.status === 'running' || rows.length === 0) return

  const thisRun = ++runId
  snapshot = {
    status: 'running',
    current: 0,
    total: rows.length,
    imported: 0,
    failed: 0,
    skipped,
    lastAsset: null,
    lastError: null,
    label: null,
    summary: null,
  }
  emit()

  void (async () => {
    let objectTypeId: string | undefined
    try {
      const types = await apiService.getObjectTypes()
      const active = types.filter((type) => type.isActive)
      objectTypeId = active.find((type) => type.name === 'Product')?.id ?? active[0]?.id
    } catch {
      objectTypeId = undefined
    }

    for (let index = 0; index < rows.length; index += 1) {
      if (thisRun !== runId) return
      snapshot = { ...snapshot, current: index + 1 }
      emit()
      try {
        const lastAsset = await apiService.createAsset(rowToAssetCreateInput(rows[index], objectTypeId))
        snapshot = { ...snapshot, imported: snapshot.imported + 1, lastAsset }
      } catch (err) {
        snapshot = {
          ...snapshot,
          failed: snapshot.failed + 1,
          lastError: snapshot.lastError ?? toUserMessage(err),
        }
      }
      emit()
    }

    if (thisRun !== runId) return
    snapshot = { ...snapshot, status: 'done' }
    emit()
    scheduleDismiss(thisRun)
  })()
}

export function reportImportProgress(current: number, total: number) {
  if (snapshot.status !== 'running') return
  snapshot = { ...snapshot, current, total }
  emit()
}

export function startBackgroundImport(input: {
  label: string
  run: () => Promise<{ summary: string; error?: string | null }>
}): boolean {
  if (snapshot.status === 'running') return false

  const thisRun = ++runId
  snapshot = {
    status: 'running',
    current: 0,
    total: 0,
    imported: 0,
    failed: 0,
    skipped: 0,
    lastAsset: null,
    lastError: null,
    label: input.label,
    summary: null,
  }
  emit()

  void (async () => {
    try {
      const result = await input.run()
      if (thisRun !== runId) return
      snapshot = {
        ...snapshot,
        status: 'done',
        summary: result.summary,
        lastError: result.error ?? null,
        failed: result.error ? 1 : 0,
      }
    } catch (err) {
      if (thisRun !== runId) return
      snapshot = {
        ...snapshot,
        status: 'done',
        failed: 1,
        lastError: toUserMessage(err),
      }
    }
    emit()
    scheduleDismiss(thisRun)
  })()

  return true
}
