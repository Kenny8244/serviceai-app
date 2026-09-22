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
}

let snapshot: AssetImportSnapshot = idleSnapshot
let runId = 0
const listeners = new Set<() => void>()

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
  snapshot = idleSnapshot
  emit()
}

export function resetAssetImport() {
  runId += 1
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
  })()
}
