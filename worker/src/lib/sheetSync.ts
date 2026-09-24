import { mapCsvRowsToAssets } from '../../../src/lib/parseCsv'
import { findSheetAssetMatch, type SheetAssetRef } from '../../../src/lib/sheetMatch'
import type { Env } from '../types'
import { createWorkspaceAsset, listWorkspaceAssets, updateWorkspaceAsset, type CreateAssetInput } from './assets'
import { GoogleSheetsError, readSheetTable, refreshAccessToken } from './googleSheetsApi'
import {
  getSheetLink,
  listLinkedWorkspaceIds,
  saveSheetLink,
  type SheetLink,
  type SheetSyncCounts,
} from './googleSheetStore'

function toAssetInput(row: {
  name: string
  sku?: string
  category?: string
  quantity?: number
  minQuantity?: number
  unitCost?: number | null
  supplier?: string
  location?: string
  description?: string
}): CreateAssetInput {
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

export async function upsertMappedRows(
  env: Env,
  userId: string,
  workspaceId: string,
  rows: ReturnType<typeof mapCsvRowsToAssets>['ready'],
  skipped: number
): Promise<SheetSyncCounts> {
  const existing = await listWorkspaceAssets(env, userId, workspaceId)
  const pool: SheetAssetRef[] = existing.map((asset) => ({
    id: asset.id,
    name: asset.name,
    sku: asset.sku,
  }))

  let created = 0
  let updated = 0

  for (const row of rows) {
    const match = findSheetAssetMatch(pool, row)
    const input = toAssetInput(row)
    if (match) {
      await updateWorkspaceAsset(env, userId, match.id, input, workspaceId)
      match.name = row.name
      match.sku = row.sku ?? match.sku
      updated += 1
    } else {
      const createdAsset = await createWorkspaceAsset(env, userId, input, workspaceId)
      pool.push({ id: createdAsset.id, name: createdAsset.name, sku: createdAsset.sku })
      created += 1
    }
  }

  return { created, updated, skipped }
}

export async function syncSheetLink(env: Env, link: SheetLink): Promise<SheetLink> {
  if (!link.spreadsheetId || !link.sheetName) {
    return link
  }

  const next: SheetLink = { ...link }
  try {
    const accessToken = await refreshAccessToken(env, link.refreshToken)
    const table = await readSheetTable(accessToken, link.spreadsheetId, link.sheetName)
    if (table.headers.length === 0) {
      next.lastSyncAt = new Date().toISOString()
      next.lastError = 'The sheet is empty.'
      next.lastResult = { created: 0, updated: 0, skipped: 0 }
      await saveSheetLink(env.DEMO_KV, next)
      return next
    }

    const mapped = mapCsvRowsToAssets(table)
    const result = await upsertMappedRows(env, link.userId, link.workspaceId, mapped.ready, mapped.skipped)
    next.lastSyncAt = new Date().toISOString()
    next.lastError = null
    next.lastResult = result
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

export async function syncAllLinkedSheets(env: Env): Promise<void> {
  const ids = await listLinkedWorkspaceIds(env.DEMO_KV)
  for (const workspaceId of ids) {
    const link = await getSheetLink(env.DEMO_KV, workspaceId)
    if (!link?.spreadsheetId || !link.sheetName) continue
    try {
      await syncSheetLink(env, link)
    } catch (error) {
      console.error('Google Sheets sync failed:', workspaceId, error)
    }
  }
}
