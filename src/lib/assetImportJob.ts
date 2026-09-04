import type { MappedAssetRow } from '@/lib/parseCsv'
import { apiService, type Asset } from '@/services/api'

export type AssetImportStatus = 'idle' | 'running' | 'done'

export type AssetImportSnapshot = {
  status: AssetImportStatus
  current: number
  total: number
  imported: number
  failed: number
  skipped: number
  lastAsset: Asset | null
}

const idleSnapshot: AssetImportSnapshot = {
  status: 'idle',
  current: 0,
  total: 0,
  imported: 0,
  failed: 0,
  skipped: 0,
  lastAsset: null,
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
  }
  emit()

  void (async () => {
    for (let index = 0; index < rows.length; index += 1) {
      if (thisRun !== runId) return
      snapshot = { ...snapshot, current: index + 1 }
      emit()
      try {
        const lastAsset = await apiService.createAsset(rows[index])
        snapshot = { ...snapshot, imported: snapshot.imported + 1, lastAsset }
      } catch {
        snapshot = { ...snapshot, failed: snapshot.failed + 1 }
      }
      emit()
    }

    if (thisRun !== runId) return
    snapshot = { ...snapshot, status: 'done' }
    emit()
  })()
}
