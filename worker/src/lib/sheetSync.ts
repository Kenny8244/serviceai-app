import { mapCsvRowsToAssets, type MappedAssetRow } from '../../../src/lib/parseCsv'
import { findSheetAssetMatch, type SheetAssetRef } from '../../../src/lib/sheetMatch'
import type { Env } from '../types'
import { listWorkspaceAssets, withSheetWriteContext, type CreateAssetInput } from './assets'
import { GoogleSheetsError, readSheetTable, refreshAccessToken } from './googleSheetsApi'
import {
  getSheetLink,
  listLinkedWorkspaceIds,
  saveSheetLink,
  type SheetLink,
  type SheetSyncCounts,
  type SheetSyncCursor,
} from './googleSheetStore'

export const SHEET_SYNC_BATCH_SIZE = 8

type PoolAsset = SheetAssetRef & {
  objectTypeId: string
  customFields: Record<string, unknown>
}

function toAssetInput(row: MappedAssetRow): CreateAssetInput {
  return {
    name: row.name,
    sku: row.sku ?? null,
    category: row.category ?? null,
    quantity: row.quantity,
    minQuantity: row.minQuantity,
    unitCost: row.unitCost,
    supplier: row.supplier ?? null,
    location: row.location ?? null,
    description: row.description ?? null,
  }
}

export function sheetBatchEnd(total: number, offset: number, batchSize = SHEET_SYNC_BATCH_SIZE): number {
  return Math.min(total, offset + batchSize)
}

export async function applyMappedBatch(
  pool: PoolAsset[],
  rows: MappedAssetRow[],
  write: (row: MappedAssetRow, match: PoolAsset | null) => Promise<{ id: string; name: string; sku: string | null }>
): Promise<SheetSyncCounts> {
  let created = 0
  let updated = 0
  for (const row of rows) {
    const match = findSheetAssetMatch(pool, row)
    const written = await write(row, match)
    if (match) {
      match.name = written.name
      match.sku = written.sku ?? match.sku
      updated += 1
    } else {
      pool.push({
        id: written.id,
        name: written.name,
        sku: written.sku,
        objectTypeId: '',
        customFields: {},
      })
      created += 1
    }
  }
  return { created, updated, skipped: 0 }
}

export async function syncSheetLink(
  env: Env,
  link: SheetLink,
  mode: 'reset' | 'continue' = 'reset'
): Promise<SheetLink> {
  if (!link.spreadsheetId || !link.sheetName) {
    return link
  }
  if (mode === 'continue' && !link.syncCursor) {
    return link
  }

  const next: SheetLink = { ...link, syncCursor: link.syncCursor ?? null }
  try {
    const accessToken = await refreshAccessToken(env, link.refreshToken)
    const table = await readSheetTable(accessToken, link.spreadsheetId, link.sheetName)
    if (table.headers.length === 0) {
      next.lastSyncAt = new Date().toISOString()
      next.lastError = 'The sheet is empty.'
      next.lastResult = { created: 0, updated: 0, skipped: 0 }
      next.syncCursor = null
      await saveSheetLink(env.DEMO_KV, next)
      return next
    }

    const mapped = mapCsvRowsToAssets(table)
    const cursor = mode === 'continue' && next.syncCursor ? next.syncCursor : emptyCursor(mapped.ready.length, mapped.skipped)
    const end = sheetBatchEnd(mapped.ready.length, cursor.offset)
    const slice = mapped.ready.slice(cursor.offset, end)
    const existing = await listWorkspaceAssets(env, link.userId, link.workspaceId)
    const pool: PoolAsset[] = existing.map((asset) => ({
      id: asset.id,
      name: asset.name,
      sku: asset.sku,
      objectTypeId: asset.object_type_id,
      customFields: asset.custom_fields ?? {},
    }))

    let counts: SheetSyncCounts = { created: 0, updated: 0, skipped: 0 }
    await withSheetWriteContext(env, link.userId, link.workspaceId, async (write) => {
      counts = await applyMappedBatch(pool, slice, (row, match) =>
        write(
          toAssetInput(row),
          match ? { id: match.id, objectTypeId: match.objectTypeId, customFields: match.customFields } : null
        )
      )
    })

    const created = cursor.created + counts.created
    const updated = cursor.updated + counts.updated
    const finished = end >= mapped.ready.length
    const result: SheetSyncCounts = { created, updated, skipped: cursor.skipped }
    next.lastSyncAt = new Date().toISOString()
    next.lastError = null
    next.lastResult = result
    next.syncCursor = finished
      ? null
      : { offset: end, total: mapped.ready.length, created, updated, skipped: cursor.skipped }
  } catch (error) {
    next.lastSyncAt = new Date().toISOString()
    next.lastError =
      error instanceof GoogleSheetsError || error instanceof Error
        ? error.message
        : 'Could not sync the sheet.'
  }

  await saveSheetLink(env.DEMO_KV, next)
  return next
}

function emptyCursor(total: number, skipped: number): SheetSyncCursor {
  return { offset: 0, total, created: 0, updated: 0, skipped }
}

export async function syncAllLinkedSheets(env: Env): Promise<void> {
  const ids = await listLinkedWorkspaceIds(env.DEMO_KV)
  for (const workspaceId of ids) {
    const link = await getSheetLink(env.DEMO_KV, workspaceId)
    if (!link?.spreadsheetId || !link.sheetName) continue
    try {
      await syncSheetLink(env, link, link.syncCursor ? 'continue' : 'reset')
    } catch (error) {
      console.error('Google Sheets sync failed:', workspaceId, error)
    }
  }
}
